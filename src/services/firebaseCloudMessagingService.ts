import { getToken, isSupported, onMessage } from "firebase/messaging";
import { ref, serverTimestamp, set } from "firebase/database";
import { Platform } from "react-native";

import { FIREBASE_WEB_PUSH_VAPID_KEY } from "../constants/config";
import { database, messaging } from "./connectionFirebase";

const TOKEN_PATH = "notificationTokens";
const SERVICE_WORKER_PATH = "/firebase-messaging-sw.js";

let initPromise: Promise<void> | null = null;

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

export function initFirebaseCloudMessaging() {
  if (Platform.OS !== "web") {
    return Promise.resolve();
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = setupFirebaseCloudMessaging().finally(() => {
    initPromise = null;
  });

  return initPromise;
}

async function setupFirebaseCloudMessaging() {
  if (!messaging) {
    console.warn("Firebase Messaging nao foi inicializado neste ambiente.");
    return;
  }

  if (!FIREBASE_WEB_PUSH_VAPID_KEY) {
    console.warn(
      "Configure FIREBASE_WEB_PUSH_VAPID_KEY para ativar notificacoes FCM web.",
    );
    return;
  }

  if (!isValidVapidPublicKey(FIREBASE_WEB_PUSH_VAPID_KEY)) {
    console.warn(
      "FIREBASE_WEB_PUSH_VAPID_KEY invalida. Copie a chave publica completa em Firebase > Cloud Messaging > Configuracao da Web > Certificados push da Web.",
    );
    return;
  }

  const supported = await isSupported();

  if (!supported || !("serviceWorker" in navigator)) {
    console.warn("Firebase Cloud Messaging nao e suportado neste navegador.");
    return;
  }

  const permission = await requestBrowserNotificationPermission();

  if (permission !== "granted") {
    console.warn("Permissao de notificacao negada pelo usuario.");
    return;
  }

  const serviceWorkerRegistration =
    await navigator.serviceWorker.register(SERVICE_WORKER_PATH);
  let token = "";

  try {
    token = await getToken(messaging, {
      vapidKey: FIREBASE_WEB_PUSH_VAPID_KEY,
      serviceWorkerRegistration,
    });
  } catch (error) {
    console.error("Erro ao obter token FCM:", error);
    return;
  }

  if (!token) {
    console.warn("Nao foi possivel obter token FCM do navegador.");
    return;
  }

  await saveNotificationToken(token);

  onMessage(messaging, (payload) => {
    showForegroundNotification({
      title:
        payload.notification?.title ??
        payload.data?.title ??
        "Atualizacao de produto",
      body: payload.notification?.body ?? payload.data?.body ?? "",
      data: payload.data,
    });
  });
}

async function requestBrowserNotificationPermission() {
  const BrowserNotification = getBrowserNotification();

  if (!BrowserNotification) {
    return "denied";
  }

  if (BrowserNotification.permission !== "default") {
    return BrowserNotification.permission;
  }

  return BrowserNotification.requestPermission();
}

async function saveNotificationToken(token: string) {
  await set(ref(database, `${TOKEN_PATH}/${createTokenKey(token)}`), {
    token,
    platform: "web",
    updatedAt: serverTimestamp(),
  });
}

function showForegroundNotification({
  title,
  body,
  data,
}: {
  title: string;
  body: string;
  data?: unknown;
}) {
  const BrowserNotification = getBrowserNotification();

  if (!BrowserNotification || BrowserNotification.permission !== "granted") {
    return;
  }

  new BrowserNotification(title, {
    body,
    data,
  });
}

function getBrowserNotification() {
  return (globalThis as typeof globalThis & {
    Notification?: BrowserNotificationConstructor;
  }).Notification;
}

function createTokenKey(token: string) {
  return token.replace(/[.#$\/\[\]]/g, "_");
}

function isValidVapidPublicKey(value: string) {
  try {
    const normalizedValue = value.trim();
    const padding = "=".repeat((4 - (normalizedValue.length % 4)) % 4);
    const base64 = `${normalizedValue}${padding}`
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const decoded = atob(base64);

    return decoded.length === 65 && decoded.charCodeAt(0) === 4;
  } catch {
    return false;
  }
}
