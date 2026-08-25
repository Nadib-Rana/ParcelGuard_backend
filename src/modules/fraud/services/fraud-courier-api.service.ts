import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { CourierProvider, RiskLevel } from "../../../common/enums";
import { FraudEvaluationResult } from "../interfaces/fraud-evaluation.interface";

export interface CourierFraudStats {
  provider: CourierProvider;
  totalParcels: number;
  delivered: number;
  cancelled: number;
  deliveryRatio: number;
}

@Injectable()
export class FraudCourierApiService {
  private readonly logger = new Logger(FraudCourierApiService.name);

  constructor(private readonly prisma: PrismaService) {}

  async fetchCourierLiveStats(phone: string, merchantId?: string): Promise<CourierFraudStats | null> {
    try {
      let apiKey = process.env.STEADFAST_API_KEY;
      let secretKey = process.env.STEADFAST_SECRET_KEY;

      if (merchantId) {
        const account = await this.prisma.courierAccount.findUnique({
          where: {
            merchantId_provider: {
              merchantId,
              provider: CourierProvider.STEADFAST,
            },
          },
        });
        if (account?.apiKey && account?.secretKey && account?.isConnected) {
          apiKey = account.apiKey;
          secretKey = account.secretKey;
        }
      }

      if (!apiKey || !secretKey) {
        return null;
      }

      const response = await fetch(`https://portal.steadfast.com.bd/api/v1/fraud-check/${phone}`, {
        method: "GET",
        headers: {
          "Api-Key": apiKey,
          "Secret-Key": secretKey,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (data && data.status === 200 && data.total_parcels !== undefined) {
        const total = Number(data.total_parcels) || 0;
        const delivered = Number(data.total_delivered) || 0;
        const cancelled = Number(data.total_cancelled) || 0;
        const ratio = total > 0 ? (delivered / total) * 100 : 100;

        return {
          provider: CourierProvider.STEADFAST,
          totalParcels: total,
          delivered,
          cancelled,
          deliveryRatio: Math.round(ratio * 10) / 10,
        };
      }
    } catch (e) {
      this.logger.debug(`Courier live check failed for ${phone}: ${e instanceof Error ? e.message : e}`);
    }
    return null;
  }

  buildCourierResult(
    rawPhone: string,
    customerName: string,
    stats: CourierFraudStats,
  ): FraudEvaluationResult {
    const ratio = stats.deliveryRatio;
    let risk: RiskLevel = RiskLevel.SAFE;
    let score = 15;
    let rec = "Courier verified delivery record. Safe for standard COD.";

    if (stats.totalParcels === 0) {
      score = 20;
      rec = "No prior courier records. Standard Cash on Delivery recommended.";
    } else if (ratio < 45 || (stats.cancelled >= 3 && ratio < 60)) {
      risk = RiskLevel.HIGH_RISK;
      score = Math.min(95, Math.round(98 - ratio * 0.8));
      rec = `HIGH RETURN RISK (${ratio}% success rate). Strongly recommend taking delivery fee (BDT 150-200) in advance.`;
    } else if (ratio < 75) {
      risk = RiskLevel.MODERATE;
      score = Math.round(75 - (ratio - 45) * 0.7);
      rec = `Moderate delivery completion rate (${ratio}%). Call customer to confirm before shipping.`;
    } else {
      risk = RiskLevel.SAFE;
      score = Math.max(8, Math.round(30 - (ratio - 75) * 0.8));
      rec = `Excellent courier track record (${ratio}% delivered). Safe to ship via Cash on Delivery.`;
    }

    return {
      phone: rawPhone,
      name: customerName,
      risk,
      score,
      date: "Just now",
      totalOrders: stats.totalParcels,
      delivered: stats.delivered,
      returned: stats.cancelled,
      cancelled: stats.cancelled,
      successRate: `${ratio.toFixed(1)}%`,
      factors: [
        `Live Steadfast Network: ${stats.totalParcels} lifetime parcels tracked`,
        `Courier Success Rate: ${ratio.toFixed(1)}% (${stats.delivered} delivered / ${stats.cancelled} returns)`,
        risk === RiskLevel.HIGH_RISK
          ? "Critical cancellation frequency detected across courier hubs"
          : "Verified courier recipient address profile",
      ],
      recommendation: rec,
    };
  }
}
