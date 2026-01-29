// firebaseConfig.js - Configuración de Firebase para App de Clientes

import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración de Firebase para tu proyecto
const firebaseConfig = {
  apiKey: "AIzaSyB4AhAuoqbWjkSLFtz1pINlbwPkpL2urmM",
  authDomain: "menu-delivery-arequipa.firebaseapp.com",
  projectId: "menu-delivery-arequipa",
  storageBucket: "menu-delivery-arequipa.firebasestorage.app",
  messagingSenderId: "879680167790",
  appId: "1:879680167790:web:b3c007019f35b305516b7f",
  measurementId: "G-9CV2R7J8W2"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Auth con persistencia para React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Inicializar servicios
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;