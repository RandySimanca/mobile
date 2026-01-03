import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// import { getAuth } from 'firebase/auth';

// TODO: Reemplazar con la configuración real de Firebase Console -> Project Settings -> General -> Your apps -> Web app
const firebaseConfig = {
  apiKey: "AIzaSyDV7-6pkYOdEu9K01_gFAqs8ytCe3YBFbM",
  authDomain: "gestion-avicola-c2eea.firebaseapp.com",
  projectId: "gestion-avicola-c2eea",
  storageBucket: "gestion-avicola-c2eea.firebasestorage.app",
  messagingSenderId: "537805329564",
  appId: "1:537805329564:web:029bfde4b07b4c416d4959",
  measurementId: "G-KLS793WKWT"
};

import { initializeAuth } from 'firebase/auth';
// @ts-ignore
import { getReactNativePersistence } from '@firebase/auth/dist/rn/index.js';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);

// Configurar persistencia de Auth
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Configurar persistencia de Firestore
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
});
