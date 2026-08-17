import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase, ref, set, get, child, push, update, onValue, off, remove } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBjX7u7VciLY0KdqjONmw0byKvORzF-dAM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "gorepireo-b2969.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gorepireo-b2969",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "gorepireo-b2969.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "832687653476",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:832687653476:web:0b9bcf8d27e3a3b7489571",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-Q570ZNWBSL",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://gorepireo-b2969-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase App singleton safely for SSR & Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);

/**
 * Standard Firebase Realtime Database Utility Helpers
 */
export const firebaseService = {
  // Read data node from RTDB
  async readNode(path: string) {
    try {
      const snapshot = await get(child(ref(rtdb), path));
      return snapshot.exists() ? snapshot.val() : null;
    } catch (err) {
      console.warn(`RTDB read error on ${path}:`, err);
      return null;
    }
  },

  // Write/Set node data in RTDB
  async writeNode(path: string, data: any) {
    try {
      await set(ref(rtdb, path), data);
      return true;
    } catch (err) {
      console.warn(`RTDB write error on ${path}:`, err);
      return false;
    }
  },

  // Push new item into node collection
  async pushNode(path: string, data: any) {
    try {
      const newRef = push(ref(rtdb, path));
      const payload = { ...data, id: newRef.key };
      await set(newRef, payload);
      return payload;
    } catch (err) {
      console.warn(`RTDB push error on ${path}:`, err);
      return null;
    }
  },

  // Realtime subscription listener
  listenNode(path: string, callback: (data: any) => void) {
    const nodeRef = ref(rtdb, path);
    onValue(nodeRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    });
    return () => off(nodeRef);
  }
};

export default app;
