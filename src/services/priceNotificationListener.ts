import * as Notifications from "expo-notifications";
import {
  get,
  limitToLast,
  onChildAdded,
  push,
  query,
  ref,
} from "firebase/database";
import { Platform } from "react-native";
import type { Product } from "../types/Product";
import { database } from "./connectionFirebase";
import { productService } from "./products_service";

type ProductPriceSnapshot = {
  name: string;
  price: number;
};

type NotificationPermissionState = {
  granted?: boolean;
  status?: string;
};

type BrowserNotificationPermission = "default" | "denied" | "granted";

type BrowserNotificationConstructor = {
  permission: BrowserNotificationPermission;
  requestPermission: () => Promise<BrowserNotificationPermission>;
  new (
    title: string,
    options?: {
      body?: string;
      data?: unknown;
    },
  ): unknown;
};

type ProductWebNotificationType = "created" | "discount" | "updated";

type ProductWebNotificationEvent = {
  type: ProductWebNotificationType;
  productId: string;
  productName: string;
  price: number;
  previousPrice: number | null;
  createdAt: number;
};

const PRODUCT_NOTIFICATION_PATH = "productWebNotifications";
const PRICE_NOTIFICATION_CHANNEL_ID = "product-price-drops";

let unsubscribeFromProducts: (() => void) | null = null;
let unsubscribeFromWebNotifications: (() => void) | null = null;
let listenerStartPromise: Promise<void> | null = null;
let webListenerStartPromise: Promise<void> | null = null;
let previousProducts = new Map<string, ProductPriceSnapshot>();
let hasLoadedInitialProducts = false;

export function initPriceNotificationListener() {
  if (Platform.OS === "web") {
    return initWebDiscountNotificationListener();
  }

  if (unsubscribeFromProducts) {
    return Promise.resolve();
  }

  if (listenerStartPromise) {
    return listenerStartPromise;
  }

  listenerStartPromise = startPriceNotificationListener().finally(() => {
    listenerStartPromise = null;
  });

  return listenerStartPromise;
}

export function stopPriceNotificationListener() {
  unsubscribeFromProducts?.();
  unsubscribeFromWebNotifications?.();
  unsubscribeFromProducts = null;
  unsubscribeFromWebNotifications = null;
  previousProducts = new Map();
  hasLoadedInitialProducts = false;
}

export async function publishProductCreatedNotification(product: Product) {
  await publishProductWebNotification("created", product);
}

export async function publishProductDiscountNotification(product: Product) {
  await publishProductWebNotification("discount", product);
}

export async function publishProductUpdatedNotification(product: Product) {
  await publishProductWebNotification("updated", product);
}

async function publishProductWebNotification(
  type: ProductWebNotificationType,
  product: Product,
) {
  const notificationsRef = ref(database, PRODUCT_NOTIFICATION_PATH);

  await push(notificationsRef, {
    type,
    productId: product.id ?? createProductFallbackId(product),
    productName: product.nome,
    price: product.preco,
    previousPrice: product.preco_anterior ?? null,
    createdAt: Date.now(),
  });
}

export async function notifyProductPriceDrop(product: Product) {
  if (Platform.OS === "web") {
    await showWebPriceDropNotification(product);
    return;
  }

  const canNotify = await prepareNativeNotifications();

  if (!canNotify) {
    console.log("Notificacao de desconto ignorada: permissao negada.");
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Produto em promocao",
      body: `${product.nome} baixou para ${formatCurrency(product.preco)}.`,
      data: createNotificationData(product),
      sound: true,
    },
    trigger: null,
  });
}

function initWebDiscountNotificationListener() {
  if (unsubscribeFromWebNotifications) {
    return Promise.resolve();
  }

  if (webListenerStartPromise) {
    return webListenerStartPromise;
  }

  webListenerStartPromise = startWebDiscountNotificationListener().finally(
    () => {
      webListenerStartPromise = null;
    },
  );

  return webListenerStartPromise;
}

async function startWebDiscountNotificationListener() {
  const notificationsQuery = query(
    ref(database, PRODUCT_NOTIFICATION_PATH),
    limitToLast(50),
  );
  const existingEventIds =
    await getExistingWebNotificationIds(notificationsQuery);

  unsubscribeFromWebNotifications = onChildAdded(
    notificationsQuery,
    (snapshot) => {
      if (snapshot.key && existingEventIds.has(snapshot.key)) {
        existingEventIds.delete(snapshot.key);
        return;
      }

      const event = parseWebNotificationEvent(snapshot.val());

      if (!event) {
        return;
      }

      void showWebProductNotification(event.type, {
        id: event.productId,
        nome: event.productName,
        preco: event.price,
        preco_anterior: event.previousPrice ?? undefined,
        descricao: "",
        tipo: "",
      });
    },
    (error) => {
      console.error("Erro ao ouvir notificacoes de produto:", error);
    },
  );
}

async function getExistingWebNotificationIds(
  notificationsQuery: ReturnType<typeof query>,
) {
  const eventIds = new Set<string>();

  try {
    const snapshot = await get(notificationsQuery);

    snapshot.forEach((childSnapshot) => {
      if (childSnapshot.key) {
        eventIds.add(childSnapshot.key);
      }
    });
  } catch (error) {
    console.error("Erro ao carregar notificacoes de produto:", error);
  }

  return eventIds;
}

async function startPriceNotificationListener() {
  const canNotify = await prepareNativeNotifications();

  if (!canNotify) {
    console.log("Listener de descontos nao iniciado: permissao negada.");
    return;
  }

  if (unsubscribeFromProducts) {
    return;
  }

  unsubscribeFromProducts = productService.subscribeToProductChanges(
    (products) => {
      void handleProductChanges(products);
    },
  );
}

async function handleProductChanges(products: Product[]) {
  const currentProducts = createProductSnapshot(products);

  if (!hasLoadedInitialProducts) {
    previousProducts = currentProducts;
    hasLoadedInitialProducts = true;
    return;
  }

  const productsWithLowerPrice = products.filter((product) =>
    hasPriceDropped(product, previousProducts),
  );

  previousProducts = currentProducts;

  await Promise.all(
    productsWithLowerPrice.map((product) => notifyProductPriceDrop(product)),
  );
}

function createProductSnapshot(products: Product[]) {
  return new Map(
    products
      .filter((product): product is Product & { id: string } =>
        Boolean(product.id),
      )
      .map((product) => [
        product.id,
        {
          name: product.nome,
          price: product.preco,
        },
      ]),
  );
}

function hasPriceDropped(
  product: Product,
  snapshot: Map<string, ProductPriceSnapshot>,
) {
  if (!product.id) {
    return false;
  }

  const previousProduct = snapshot.get(product.id);

  return Boolean(previousProduct && product.preco < previousProduct.price);
}

async function prepareNativeNotifications() {
  if (Platform.OS === "web") {
    return false;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(
      PRICE_NOTIFICATION_CHANNEL_ID,
      {
        name: "Promocoes de produtos",
        importance: Notifications.AndroidImportance.MAX,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
      },
    );
  }

  const currentPermission = await Notifications.getPermissionsAsync();

  if (hasNotificationPermission(currentPermission)) {
    return true;
  }

  const requestedPermission = await Notifications.requestPermissionsAsync();

  return hasNotificationPermission(requestedPermission);
}

async function showWebPriceDropNotification(product: Product) {
  await showWebProductNotification("discount", product);
}

async function showWebProductNotification(
  type: ProductWebNotificationType,
  product: Product,
) {
  const notification = createWebNotificationContent(type, product);
  const BrowserNotification = getBrowserNotification();

  if (!BrowserNotification) {
    globalThis.alert?.(`${notification.title}\n${notification.body}`);
    return;
  }

  let permission = BrowserNotification.permission;

  if (permission === "default") {
    permission = await BrowserNotification.requestPermission();
  }

  if (permission === "granted") {
    new BrowserNotification(notification.title, {
      body: notification.body,
      data: createNotificationData(product),
    });
    return;
  }

  globalThis.alert?.(`${notification.title}\n${notification.body}`);
}

function parseWebNotificationEvent(
  value: unknown,
): ProductWebNotificationEvent | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Partial<ProductWebNotificationEvent>;

  if (
    (data.type !== "created" &&
      data.type !== "discount" &&
      data.type !== "updated") ||
    typeof data.productId !== "string" ||
    typeof data.productName !== "string" ||
    typeof data.price !== "number" ||
    typeof data.createdAt !== "number"
  ) {
    return null;
  }

  return {
    type: data.type,
    productId: data.productId,
    productName: data.productName,
    price: data.price,
    previousPrice:
      typeof data.previousPrice === "number" ? data.previousPrice : null,
    createdAt: data.createdAt,
  };
}

function createWebNotificationContent(
  type: ProductWebNotificationType,
  product: Product,
) {
  if (type === "created") {
    return {
      title: "Novo produto cadastrado",
      body: `${product.nome} esta disponivel por ${formatCurrency(product.preco)}.`,
    };
  }

  if (type === "updated") {
    return {
      title: "Produto atualizado",
      body: `${product.nome} recebeu uma atualizacao.`,
    };
  }

  return {
    title: "Produto em promocao",
    body: `${product.nome} baixou para ${formatCurrency(product.preco)}.`,
  };
}

function getBrowserNotification() {
  return (globalThis as typeof globalThis & {
    Notification?: BrowserNotificationConstructor;
  }).Notification;
}

function hasNotificationPermission(permission: unknown) {
  const state = permission as NotificationPermissionState;

  return state.granted === true || state.status === "granted";
}

function createNotificationData(product: Product) {
  return {
    productId: product.id ?? "",
    screen: "ProductDetail",
  };
}

function createProductFallbackId(product: Product) {
  return `${product.nome}-${product.tipo}-${product.preco}`;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
