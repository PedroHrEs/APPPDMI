import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; //exemplo para autenticação
import { getDatabase } from 'firebase/database'; //exemplo para o real
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBaT4jX6K8685IlEWSIHxEKo6JEYMuaNLg",
  authDomain: "techstore-cdb08.firebaseapp.com",
  projectId: "techstore-cdb08",
  storageBucket: "techstore-cdb08.firebasestorage.app",
  messagingSenderId: "161481639972",
  appId: "1:161481639972:web:b73171d65fdb05cc2470b1",
  baseURL: "https://techstore-cdb08-default-rtdb.firebaseio.com/"
};

// Inicializa o firebase
const app = initializeApp(firebaseConfig);

//inicializa e exporta serviços
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

//se precisar exportar o app
export default app;
