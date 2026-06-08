const admin = require("firebase-admin");
const functions = require("firebase-functions/v1");

admin.initializeApp();

const NOTIFICATION_TOKENS_PATH = "notificationTokens";
const PRODUCT_NOTIFICATIONS_PATH = "productWebNotifications";
const MAX_TOKENS_PER_SEND = 500;

exports.sendProductNotification = functions.database
  .ref(`/${PRODUCT_NOTIFICATIONS_PATH}/{notificationId}`)
  .onCreate(async (snapshot) => {
    const event = snapshot.val();
    const notification = createNotificationContent(event);

    if (!notification) {
      functions.logger.warn("Evento de notificacao invalido.", { event });
      return null;
    }

    const tokenEntries = await getNotificationTokenEntries();

    if (tokenEntries.length === 0) {
      functions.logger.info("Nenhum token FCM cadastrado para notificar.");
      return null;
    }

    const chunks = chunkTokenEntries(tokenEntries);

    await Promise.all(
      chunks.map((chunk) => sendNotificationChunk(chunk, notification, event)),
    );

    return null;
  });

async function getNotificationTokenEntries() {
  const snapshot = await admin.database().ref(NOTIFICATION_TOKENS_PATH).once("value");
  const tokenEntries = [];
  const seenTokens = new Set();

  snapshot.forEach((childSnapshot) => {
    const value = childSnapshot.val();
    const token = value && value.token;

    if (
      childSnapshot.key &&
      typeof token === "string" &&
      token.length > 0 &&
      !seenTokens.has(token)
    ) {
      seenTokens.add(token);
      tokenEntries.push({
        key: childSnapshot.key,
        token,
      });
    }
  });

  return tokenEntries;
}

async function sendNotificationChunk(tokenEntries, notification, event) {
  const response = await admin.messaging().sendEachForMulticast({
    tokens: tokenEntries.map((entry) => entry.token),
    notification,
    data: {
      type: String(event.type),
      productId: String(event.productId),
      price: String(event.price),
      title: notification.title,
      body: notification.body,
    },
  });

  const invalidTokenRemovals = response.responses
    .map((sendResponse, index) => {
      if (sendResponse.success || !isInvalidTokenError(sendResponse.error)) {
        return null;
      }

      return admin
        .database()
        .ref(`${NOTIFICATION_TOKENS_PATH}/${tokenEntries[index].key}`)
        .remove();
    })
    .filter(Boolean);

  await Promise.all(invalidTokenRemovals);

  functions.logger.info("Notificacao de produto enviada.", {
    successCount: response.successCount,
    failureCount: response.failureCount,
  });
}

function createNotificationContent(event) {
  if (!event || typeof event !== "object") {
    return null;
  }

  if (
    event.type !== "created" &&
    event.type !== "discount" &&
    event.type !== "updated"
  ) {
    return null;
  }

  if (typeof event.productName !== "string" || typeof event.price !== "number") {
    return null;
  }

  if (event.type === "created") {
    return {
      title: "Novo produto cadastrado",
      body: `${event.productName} esta disponivel por ${formatCurrency(
        event.price,
      )}.`,
    };
  }

  if (event.type === "updated") {
    return {
      title: "Produto atualizado",
      body: `${event.productName} recebeu uma atualizacao.`,
    };
  }

  return {
    title: "Produto em promocao",
    body: `${event.productName} baixou para ${formatCurrency(
      event.price,
    )}${formatDiscountPercentageSuffix(event)}.`,
  };
}

function chunkTokenEntries(tokenEntries) {
  const chunks = [];

  for (let index = 0; index < tokenEntries.length; index += MAX_TOKENS_PER_SEND) {
    chunks.push(tokenEntries.slice(index, index + MAX_TOKENS_PER_SEND));
  }

  return chunks;
}

function isInvalidTokenError(error) {
  const code = error && error.code;

  return (
    code === "messaging/invalid-registration-token" ||
    code === "messaging/registration-token-not-registered"
  );
}

function formatCurrency(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDiscountPercentageSuffix(event) {
  const percentage = getDiscountPercentage(event);

  return percentage ? ` com ${formatPercentage(percentage)} de desconto` : "";
}

function getDiscountPercentage(event) {
  if (typeof event.discountPercentage === "number") {
    return event.discountPercentage;
  }

  if (
    typeof event.previousPrice !== "number" ||
    event.previousPrice <= 0 ||
    event.price >= event.previousPrice
  ) {
    return null;
  }

  return ((event.previousPrice - event.price) / event.previousPrice) * 100;
}

function formatPercentage(value) {
  return `${Number(value.toFixed(2)).toLocaleString("pt-BR")}%`;
}
