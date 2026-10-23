import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { getMessaging, isSupported } from "firebase/messaging";

// Firebase's web configuration identifies the public client application; it
// is not an Admin credential. Environment values can override these defaults.
const configuredFirebase = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyA91bP6QxfxDKSMiVK3aOB0F5taGSUlaXg',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'gorepireo-8c017.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gorepireo-8c017',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'gorepireo-8c017.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '792651382902',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:792651382902:web:4ba484ae9113556b9b1f57',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-ES1B0HQ951'
};

export const firebaseConfigured = Boolean(
  configuredFirebase.apiKey &&
  configuredFirebase.authDomain &&
  configuredFirebase.projectId &&
  configuredFirebase.appId
);

const firebaseConfig = configuredFirebase;

// Initialize Firebase App safely for SSR
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Messaging is client-side only
export const messaging = typeof window !== "undefined" ? async () => {
  const supported = await isSupported();
  if (supported) return getMessaging(app);
  return null;
} : null;

export { app };
