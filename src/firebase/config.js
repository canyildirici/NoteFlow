import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyDh5v9BHmVnEuFARmGiaMFdEDOsPEqnmVc",
  authDomain: "noteflow-8ce6f.firebaseapp.com",
  projectId: "noteflow-8ce6f",
  storageBucket: "noteflow-8ce6f.firebasestorage.app",
  messagingSenderId: "943842767453",
  appId: "1:943842767453:web:16f0c77cb2e809fa8fd3b4"
};

const app = initializeApp(firebaseConfig);

let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  const { initializeAuth, getReactNativePersistence } = require('firebase/auth');
  const ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
}

export { auth };
export const db = getFirestore(app);