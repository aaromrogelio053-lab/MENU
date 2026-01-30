import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyB4AhAuoqbWjkSLFtz1pINlbwPkpL2urmM",
  authDomain: "menu-delivery-arequipa.firebaseapp.com",
  projectId: "menu-delivery-arequipa",
  storageBucket: "menu-delivery-arequipa.firebasestorage.app",
  messagingSenderId: "879680167790",
  appId: "1:879680167790:web:b3c007019f35b305516b7f",
  measurementId: "G-9CV2R7J8W2"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;