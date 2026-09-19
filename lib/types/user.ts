export type UserRole = 'customer' | 'worker' | 'admin' | 'shopkeeper';

export interface UserAddress {
  id: string;
  label: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  profilePhoto?: string | null;
  addresses?: UserAddress[];
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}
