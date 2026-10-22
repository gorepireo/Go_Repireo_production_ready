/** Shared website view of the verified Android/Firebase contract. */
export const collections = {
  customers: 'customers',
  customerPreferences: 'customerPreferences',
  addresses: 'addresses',
  workers: 'workers',
  workerPrivate: 'workerPrivate',
  services: 'services',
  bookings: 'bookings',
  workerLocations: 'workerLocations',
  customerDevices: 'customerDevices',
  workerDevices: 'workerDevices',
  notifications: 'notifications',
  reviews: 'reviews',
  workerEarnings: 'workerEarnings',
  workerPayouts: 'workerPayouts',
  supportTickets: 'supportTickets',
  media: 'media',
} as const;

export type BookingStatus =
  | 'requested'
  | 'assigned'
  | 'enRoute'
  | 'arrived'
  | 'inService'
  | 'awaitingCompletion'
  | 'completed'
  | 'cancelled';

export type WorkerStatus =
  | 'draft'
  | 'pendingVerification'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded';

export interface Customer {
  uid: string;
  name: string;
  phone: string;
  email?: string | null;
  avatarUrl?: string | null;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface Worker {
  uid: string;
  phone: string;
  fullName: string;
  email?: string | null;
  avatarUrl?: string | null;
  status: WorkerStatus;
  online: boolean;
  acceptingJobs: boolean;
  serviceIds: string[];
  experienceYears: number;
  ratingAverage: number;
  ratingCount: number;
  completedJobs: number;
  currentBookingId?: string | null;
  documentsDeferred?: boolean;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface Service {
  id: string;
  name: string;
  active: boolean;
  sortOrder?: number;
  description?: string;
  slug?: string;
}

export interface Booking {
  id: string;
  customerId: string;
  workerId?: string | null;
  serviceId: string;
  status: BookingStatus;
  paymentStatus?: PaymentStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Address {
  id: string;
  customerId: string;
  label: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  landmark: string;
  isDefault: boolean;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface BookingEvent {
  id: string;
  type: string;
  createdAt: unknown;
}

export interface BookingMessage {
  id: string;
  senderId: string;
  senderRole: 'customer' | 'worker' | 'admin';
  type: 'text' | 'image';
  text?: string;
  imageUrl?: string;
  createdAt: unknown;
  readAt?: unknown;
}

export interface Notification {
  id: string;
  ownerId: string;
  title: string;
  message: string;
  bookingId?: string;
  createdAt: unknown;
  readAt?: unknown;
}

export interface SupportTicket {
  id: string;
  ownerId: string;
  ownerRole: 'customer' | 'worker';
  category: string;
  subject: string;
  description: string;
  status: 'open' | string;
  bookingId?: string;
  mediaIds?: string[];
  createdAt: unknown;
  updatedAt: unknown;
}
