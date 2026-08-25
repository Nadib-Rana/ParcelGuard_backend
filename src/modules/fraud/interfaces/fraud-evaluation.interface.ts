export interface CourierBreakdown {
  provider: string;
  totalParcels: number;
  delivered: number;
  cancelled: number;
  deliveryRatio: number;
}

export interface VelocityStats {
  recentOrders24h: number;
  recentOrders48h: number;
  distinctMerchantsCount: number;
  isHighVelocity: boolean;
}

export interface FraudEvaluationResult {
  phone: string;
  name: string;
  risk: string;
  score: number;
  date: string;
  totalOrders: number;
  delivered: number;
  returned: number;
  cancelled: number;
  successRate: string;
  factors: string[];
  recommendation: string;
  courierBreakdown?: CourierBreakdown[];
  velocityStats?: VelocityStats;
}
