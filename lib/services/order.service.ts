import { db, functions } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, onSnapshot, orderBy } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { Order } from "@/lib/types/order";

export const OrderService = {
  /**
   * Listen to a specific order's changes in real-time.
   */
  subscribeToOrder(orderId: string, callback: (order: Order | null) => void) {
    const docRef = doc(db, "orders", orderId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as Order);
      } else {
        callback(null);
      }
    });
  },

  /**
   * Fetch all orders for a specific user (customer or worker).
   */
  async getUserOrders(uid: string, role: 'customer' | 'worker'): Promise<Order[]> {
    const field = role === 'worker' ? 'workerId' : 'customerId';
    const q = query(
      collection(db, "orders"),
      where(field, "==", uid),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
  },

  /**
   * Create an order (Direct Firestore write allowed by rules for pending orders)
   */
  async createOrder(payload: any): Promise<{ orderId: string }> {
    const orderData = {
      ...payload,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const { addDoc, collection } = await import('firebase/firestore');
    const docRef = await addDoc(collection(db, "orders"), orderData);
    return { orderId: docRef.id };
  },

  /**
   * Assign a worker to an order
   */
  async assignWorker(orderId: string, workerId: string): Promise<void> {
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    await updateDoc(doc(db, "orders", orderId), {
      workerId,
      status: 'worker_assigned',
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
};
