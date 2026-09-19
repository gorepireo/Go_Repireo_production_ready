import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from "firebase/firestore";

export const TrackingService = {
  async addTrackingEvent(orderId: string, payload: any): Promise<void> {
    const trackingRef = collection(db, "orders", orderId, "tracking");
    await addDoc(trackingRef, {
      ...payload,
      timestamp: serverTimestamp()
    });
  },

  async getTrackingHistory(orderId: string): Promise<any[]> {
    const trackingRef = collection(db, "orders", orderId, "tracking");
    const q = query(trackingRef, orderBy("timestamp", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  subscribeToTrackingHistory(orderId: string, callback: (events: any[]) => void) {
    const { onSnapshot } = require('firebase/firestore');
    const trackingRef = collection(db, "orders", orderId, "tracking");
    const q = query(trackingRef, orderBy("timestamp", "asc"));
    return onSnapshot(q, (snap: any) => {
      const events = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      callback(events);
    });
  }
};
