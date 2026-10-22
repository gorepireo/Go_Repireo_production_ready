import { db, functions } from '@/lib/firebase';
import { collections, type Booking, type BookingStatus } from '@/lib/types/firebase-contract';
import { collection, doc, getDocs, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

export type BookingRecord = Booking & Record<string, any>;
const ACTIVE: BookingStatus[] = ['requested', 'assigned', 'enRoute', 'arrived', 'inService', 'awaitingCompletion'];
const adapt = (id: string, value: Record<string, any>): BookingRecord => ({
  id,
  ...value,
  service_name: value.serviceName,
  lat: value.latitude,
  lng: value.longitude,
  address: value.formattedAddress,
  total_price: Number(value.quotedAmountPaise || 0) / 100,
  payment_status: value.paymentStatus,
  worker_name: value.workerName,
  worker_avatar: value.workerAvatarUrl,
} as unknown as BookingRecord);
export const OrderService = {
  subscribeToOrder(bookingId: string, callback: (value: BookingRecord | null) => void) {
    return onSnapshot(doc(db, collections.bookings, bookingId), (snapshot) =>
      callback(snapshot.exists() ? adapt(snapshot.id, snapshot.data()) : null));
  },
  subscribeToUserActiveOrder(customerId: string, callback: (value: BookingRecord | null) => void) {
    const q = query(collection(db, collections.bookings), where('customerId', '==', customerId),
      where('status', 'in', ACTIVE), orderBy('createdAt', 'desc'), limit(1));
    return onSnapshot(q, (snapshot) => callback(snapshot.empty ? null :
      adapt(snapshot.docs[0].id, snapshot.docs[0].data())));
  },
  async getUserOrders(uid: string, role: 'customer' | 'worker'): Promise<BookingRecord[]> {
    const q = query(collection(db, collections.bookings),
      where(role === 'worker' ? 'workerId' : 'customerId', '==', uid), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((item) => adapt(item.id, item.data()));
  },
  async createOrder(payload: Record<string, unknown>): Promise<{ orderId: string; bookingId: string }> {
    const result = await httpsCallable<Record<string, unknown>, { bookingId: string }>(functions, 'createBooking')(payload);
    return { bookingId: result.data.bookingId, orderId: result.data.bookingId };
  },
  async assignWorker(bookingId: string): Promise<void> {
    await httpsCallable(functions, 'claimBooking')({ bookingId });
  },
  async updateOrderStatus(bookingId: string, updates: Record<string, unknown>): Promise<void> {
    await httpsCallable(functions, 'transitionBooking')({ bookingId, updates });
  },
  async verifyOtp(bookingId: string, phase: 'start' | 'completion', otp: string): Promise<void> {
    await httpsCallable(functions, 'verifyBookingOtp')({ bookingId, phase, otp });
  },
  async getWorkerActiveOrder(workerId: string): Promise<BookingRecord | null> {
    const q = query(collection(db, collections.bookings), where('workerId', '==', workerId),
      where('status', 'in', ['assigned', 'enRoute', 'arrived', 'inService', 'awaitingCompletion']),
      orderBy('createdAt', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : adapt(snapshot.docs[0].id, snapshot.docs[0].data());
  },
  async getAvailableOrders(): Promise<BookingRecord[]> {
    const result = await httpsCallable<Record<string, never>, { bookings: BookingRecord[] }>(
      functions, 'listEligibleBookings')({});
    return (result.data.bookings || []).map((item) => adapt(item.id, item));
  },
  async getCompletedOrders(workerId: string): Promise<BookingRecord[]> {
    const q = query(collection(db, collections.bookings), where('workerId', '==', workerId),
      where('status', '==', 'completed'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((item) => adapt(item.id, item.data()));
  },
};
