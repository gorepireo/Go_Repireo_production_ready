import type { Booking, BookingStatus } from '@/lib/types/firebase-contract';

export type BookingRecord = Booking & Record<string, any>;

const adapt = (item: Record<string, any>): BookingRecord => ({
  id: String(item.id || item.orderId || item.bookingId || ''),
  orderId: String(item.id || item.orderId || item.bookingId || ''),
  bookingId: String(item.id || item.orderId || item.bookingId || ''),
  service_name: item.service_name || item.serviceName || 'Service',
  serviceName: item.serviceName || item.service_name || 'Service',
  serviceId: item.serviceId || 'general',
  customerId: item.customerId || item.customer_id || '',
  workerId: item.workerId || item.worker_id || null,
  lat: Number(item.lat ?? item.latitude ?? 0),
  lng: Number(item.lng ?? item.longitude ?? 0),
  latitude: Number(item.latitude ?? item.lat ?? 0),
  longitude: Number(item.longitude ?? item.lng ?? 0),
  address: item.address || item.formattedAddress || '',
  formattedAddress: item.formattedAddress || item.address || '',
  problem_description: item.problem_description || item.problemDescription || item.description || '',
  problemDescription: item.problemDescription || item.problem_description || item.description || '',
  total_price: Number(item.total_price ?? (item.quotedAmountPaise ? item.quotedAmountPaise / 100 : 0)),
  quotedAmountPaise: Number(item.quotedAmountPaise ?? (item.total_price ? item.total_price * 100 : 0)),
  payment_status: item.payment_status || item.paymentStatus || 'pending',
  paymentStatus: item.paymentStatus || item.payment_status || 'pending',
  payment_method: item.payment_method || item.paymentMethod || 'cash',
  status: (item.status || 'requested') as BookingStatus,
  worker_name: item.worker_name || item.workerName || null,
  worker_avatar: item.worker_avatar || item.workerAvatarUrl || null,
  createdAt: item.createdAt || item.created_at || new Date().toISOString(),
  created_at: item.created_at || item.createdAt || new Date().toISOString(),
} as unknown as BookingRecord);

export const OrderService = {
  subscribeToOrder(bookingId: string, callback: (value: BookingRecord | null) => void) {
    let isMounted = true;
    const fetchCurrent = async () => {
      try {
        const res = await fetch('/api/orders', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const found = (data.orders || []).find((b: any) => b.id === bookingId);
          if (isMounted) callback(found ? adapt(found) : null);
        }
      } catch {
        if (isMounted) callback(null);
      }
    };
    void fetchCurrent();
    const interval = setInterval(fetchCurrent, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  },

  subscribeToUserActiveOrder(customerId: string, callback: (value: BookingRecord | null) => void) {
    let isMounted = true;
    const fetchActive = async () => {
      try {
        const res = await fetch('/api/orders', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const active = (data.orders || []).find((b: any) =>
            ['requested', 'assigned', 'enRoute', 'arrived', 'inService', 'awaitingCompletion'].includes(b.status)
          );
          if (isMounted) callback(active ? adapt(active) : null);
        }
      } catch {
        if (isMounted) callback(null);
      }
    };
    void fetchActive();
    const interval = setInterval(fetchActive, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  },

  async getUserOrders(uid: string, role: 'customer' | 'worker'): Promise<BookingRecord[]> {
    try {
      const res = await fetch(`/api/orders?scope=${role}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        return (data.orders || []).map(adapt);
      }
    } catch (err) {
      console.warn('Error fetching user orders from Turso:', err);
    }
    return [];
  },

  async createOrder(payload: Record<string, unknown>): Promise<{ orderId: string; bookingId: string }> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create booking.');
    }
    const data = await res.json();
    return { bookingId: data.bookingId, orderId: data.orderId };
  },

  async assignWorker(bookingId: string): Promise<void> {
    console.info('Worker claimed booking:', bookingId);
  },

  async updateOrderStatus(bookingId: string, updates: Record<string, unknown>): Promise<void> {
    console.info('Order status updated:', bookingId, updates);
  },

  async verifyOtp(bookingId: string, phase: 'start' | 'completion', otp: string): Promise<void> {
    console.info('Verify OTP:', bookingId, phase, otp);
  },

  async getWorkerActiveOrder(workerId: string): Promise<BookingRecord | null> {
    try {
      const res = await fetch('/api/orders?scope=active', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        return data.order ? adapt(data.order) : null;
      }
    } catch (err) {
      console.warn('Error fetching worker active order:', err);
    }
    return null;
  },

  async getAvailableOrders(): Promise<BookingRecord[]> {
    try {
      const res = await fetch('/api/orders?scope=available', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        return (data.orders || []).map(adapt);
      }
    } catch (err) {
      console.warn('Error fetching available orders:', err);
    }
    return [];
  },

  async getCompletedOrders(workerId: string): Promise<BookingRecord[]> {
    const all = await this.getUserOrders(workerId, 'worker');
    return all.filter((o) => o.status === 'completed');
  },
};
