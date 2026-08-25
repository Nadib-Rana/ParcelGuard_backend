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
}
