importScripts("https://www.gstatic.com/firebasejs/12.10.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.10.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBaT4jX6K8685IlEWSIHxEKo6JEYMuaNLg",
  authDomain: "techstore-cdb08.firebaseapp.com",
  projectId: "techstore-cdb08",
  storageBucket: "techstore-cdb08.firebasestorage.app",
  messagingSenderId: "161481639972",
  appId: "1:161481639972:web:b73171d65fdb05cc2470b1",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title =
    payload.notification?.title ??
    payload.data?.title ??
    "Atualizacao de produto";
  const body = payload.notification?.body ?? payload.data?.body ?? "";

  self.registration.showNotification(title, {
    body,
    data: payload.data,
  });
});
