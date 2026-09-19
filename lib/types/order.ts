export type OrderStatus = 
  | 'pending'
  | 'searching_worker'
  | 'worker_assigned'
  | 'worker_arriving'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface OrderProblem {
  description: string;
  voiceUrl?: string | null;
  images: string[];
}

export interface OrderPricing {
  inspectionFee: number;
  travelFee: number;
  serviceCharge: number;
  discount: number;
  tax: number;
  total: number;
}

export interface Order {
  id?: string;
  orderNumber: string;
  customerId: string;
  workerId: string | null;
  serviceId: string;
  problem: OrderProblem;
  address: {
    label: string;
    fullAddress: string;
    latitude: number;
    longitude: number;
  };
  schedule: {
    type: 'scheduled' | 'immediate';
    scheduledAt: any;
  };
  pricing: OrderPricing;
  payment: {
    method: 'upi' | 'cash' | 'card' | 'pending';
    status: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';
  };
  status: OrderStatus;
  otpState?: {
    startVerified: boolean;
    completionVerified: boolean;
  };
  createdAt: any;
  acceptedAt?: any | null;
  startedAt?: any | null;
  completedAt?: any | null;
  cancelledAt?: any | null;
  updatedAt: any;
}
