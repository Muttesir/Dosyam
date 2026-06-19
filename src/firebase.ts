import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, collection } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAymfHToRpq-nRaBi_G8r6HILMnD2H5T6U",
  authDomain: "istakip-2d221.firebaseapp.com",
  projectId: "istakip-2d221",
  storageBucket: "istakip-2d221.firebasestorage.app",
  messagingSenderId: "1035140533909",
  appId: "1:1035140533909:ios:383d12f1e60161baa9159c",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
export const db = getFirestore(app);

export function uid(): string {
  const user = auth.currentUser;
  if (!user) throw new Error('Giriş yapılmamış');
  return user.uid;
}

export function basvurularCol() {
  return collection(db, 'users', uid(), 'basvurular');
}

export function sonuclarCol() {
  return collection(db, 'users', uid(), 'sonuclar');
}
