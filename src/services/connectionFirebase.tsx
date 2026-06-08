import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getMessaging, type Messaging } from "firebase/messaging";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBaT4jX6K8685IlEWSIHxEKo6JEYMuaNLg",
  authDomain: "techstore-cdb08.firebaseapp.com",
  projectId: "techstore-cdb08",
  storageBucket: "techstore-cdb08.firebasestorage.app",
  messagingSenderId: "161481639972",
  appId: "1:161481639972:web:b73171d65fdb05cc2470b1",
  databaseURL: "https://techstore-cdb08-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);
export const messaging = createMessaging();

export default app;

function createMessaging(): Messaging | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return getMessaging(app);
  } catch (error) {
    console.warn("Firebase Messaging indisponivel neste ambiente.", error);
    return null;
  }
}
