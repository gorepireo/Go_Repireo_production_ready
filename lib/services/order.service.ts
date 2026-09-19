import { db, functions } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, onSnapshot, orderBy } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { Order } from "@/lib/types/order";

export const OrderService = {
  /**
   * Listen to a specific order's changes in real-time.
   */
  subscribeToOrder(orderId: string, callback: (order: Order | null) => void) {
    const { doc, onSnapshot } = require('firebase/firestore');
    const docRef = doc(db, "orders", orderId);
    return onSnapshot(docRef, (docSnap: any) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as Order);
      } else {
        callback(null);
      }
    });
  },

  /**
   * Listen to a user's most recent active order
   */
  subscribeToUserActiveOrder(customerId: string, callback: (order: Order | null) => void) {
    const { collection, query, where, onSnapshot, orderBy, limit } = require('firebase/firestore');
    const q = query(
      collection(db, "orders"),
      where("customerId", "==", customerId),
      where("status", "in", ["pending", "searching_worker", "worker_assigned", "worker_arriving", "arrived", "in_progress"]),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    return onSnapshot(q, (snap: any) => {
      if (!snap.empty) {
        callback({ id: snap.docs[0].id, ...snap.docs[0].data() } as Order);
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
  },

  /**
   * Update the status of an order
   */
  async updateOrderStatus(orderId: string, updates: Partial<Order>): Promise<void> {
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    await updateDoc(doc(db, "orders", orderId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  /**
   * Fetch the currently active order for a worker (assigned/in progress)
   */
  async getWorkerActiveOrder(workerId: string): Promise<Order | null> {
    const { collection, query, where, getDocs, orderBy, limit } = await import('firebase/firestore');
    const q = query(
      collection(db, "orders"),
      where("workerId", "==", workerId),
      where("status", "in", ["worker_assigned", "worker_arriving", "arrived", "in_progress"]),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as Order;
    }
    return null;
  },

  /**
   * Fetch available pending orders (for worker matching)
   */
  async getAvailableOrders(serviceCategory: string): Promise<Order[]> {
    const { collection, query, where, getDocs, orderBy, limit } = await import('firebase/firestore');
    const q = query(
      collection(db, "orders"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Order))
      .filter(order => order.serviceId === serviceCategory || serviceCategory === 'all' || !order.serviceId);
  },

  /**
   * Fetch all completed jobs for a worker
   */
  async getCompletedOrders(workerId: string): Promise<Order[]> {
    const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
    const q = query(
      collection(db, "orders"),
      where("workerId", "==", workerId),
      where("status", "==", "completed"),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
  }
};
