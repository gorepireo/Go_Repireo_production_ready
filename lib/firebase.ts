import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase, ref, set, get, child, push, update, onValue, off, remove } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCvnJ9obd4IFc934dzaYTOQbMUXozH95sk",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "gorepireo-a20c6.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gorepireo-a20c6",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "gorepireo-a20c6.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "352326359504",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:352326359504:web:51db43b610f084437d41d5",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-PD5XCNS61E",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://gorepireo-a20c6-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase App singleton safely for SSR & Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const db = firestore; // Alias for backward compatibility
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

  // Push new node item in RTDB list
  async pushToList(path: string, data: any) {
    try {
      const newRef = push(ref(rtdb, path));
      await set(newRef, data);
      return newRef.key;
    } catch (err) {
      console.warn(`RTDB push error on ${path}:`, err);
      return null;
    }
  },

  // Update existing node in RTDB
  async updateNode(path: string, data: any) {
    try {
      await update(ref(rtdb, path), data);
      return true;
    } catch (err) {
      console.warn(`RTDB update error on ${path}:`, err);
      return false;
    }
  },

  // Delete node from RTDB
  async deleteNode(path: string) {
    try {
      await remove(ref(rtdb, path));
      return true;
    } catch (err) {
      console.warn(`RTDB delete error on ${path}:`, err);
      return false;
    }
  }
};
