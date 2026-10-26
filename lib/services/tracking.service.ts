import { db } from '@/lib/firebase';
import { collections } from '@/lib/types/firebase-contract';
import { collection, getDocs, onSnapshot, orderBy, query } from 'firebase/firestore';
const events = (bookingId: string) => collection(db, collections.bookings, bookingId, 'events');
export const TrackingService = {
  async addTrackingEvent(_bookingId: string, _event: Record<string, unknown>): Promise<void> {
    // Booking events are written by trusted callable functions.
  },
  async getTrackingHistory(bookingId: string): Promise<any[]> {
    try {
      const snapshot = await getDocs(query(events(bookingId), orderBy('createdAt', 'asc')));
      return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    } catch {
      return [];
    }
  },
  subscribeToTrackingHistory(bookingId: string, callback: (items: any[]) => void) {
    try {
      return onSnapshot(
        query(events(bookingId), orderBy('createdAt', 'asc')),
        (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
        () => callback([])
      );
    } catch {
      callback([]);
      return () => undefined;
    }
  },
};
