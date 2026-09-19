import { UserRole } from "./user";

export interface WorkerProfile {
  uid: string;
  name: string;
  phone: string;
  email: string;
  photoUrl?: string | null;
  role: UserRole; // Typically 'worker'
  services: string[];
  verification: {
    status: 'pending' | 'under_review' | 'approved' | 'rejected';
    verifiedAt?: any;
  };
  availability: {
    online: boolean;
    busy: boolean;
  };
  location?: {
    latitude: number;
    longitude: number;
    updatedAt: any;
  };
  rating: number;
  reviewCount: number;
  completedOrders: number;
  earnings: {
    total: number;
    pending: number;
  };
  createdAt: any;
  updatedAt: any;
}
