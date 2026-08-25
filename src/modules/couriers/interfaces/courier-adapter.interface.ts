export interface CourierRateQuery {
  district: string;
  weightKg?: number;
  codAmount?: number;
}

export interface CourierRateResult {
  courier: string;
  charge: number;
  estimatedDays: string;
  codFee: number;
  total: number;
  available: boolean;
}

export interface CourierBookingParams {
  trackingId: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  district: string;
  codAmount: number;
  productTitle: string;
  notes?: string;
  apiKey?: string;
  secretKey?: string;
}

export interface CourierBookingResult {
  consignmentId: string;
  trackingUrl?: string;
  courierStatus: string;
  assignedRider?: {
    name: string;
    phone: string;
  };
}

export interface CourierTrackingResult {
  consignmentId: string;
  status: string;
  currentLocation?: string;
  riderName?: string;
  riderPhone?: string;
  milestones: Array<{
    title: string;
    location?: string;
    timestamp: Date;
    notes?: string;
  }>;
}

export interface ICourierAdapter {
  providerName: string;
  calculateRate(query: CourierRateQuery): CourierRateResult;
  createBooking(params: CourierBookingParams): Promise<CourierBookingResult>;
  trackOrder(consignmentId: string, apiKey?: string): Promise<CourierTrackingResult>;
  cancelBooking(consignmentId: string, apiKey?: string): Promise<boolean>;
}
