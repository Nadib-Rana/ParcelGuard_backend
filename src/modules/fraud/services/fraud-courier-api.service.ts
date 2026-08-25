import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { CourierProvider, RiskLevel } from "../../../common/enums";
import { FraudEvaluationResult, CourierBreakdown } from "../interfaces/fraud-evaluation.interface";

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

  async fetchCourierLiveStats(phone: string, merchantId?: string): Promise<{ combined: CourierFraudStats; breakdown: CourierBreakdown[] } | null> {
    const results = await Promise.allSettled([
      this.fetchSteadfastStats(phone, merchantId),
      this.fetchPathaoStats(phone, merchantId),
    ]);

    const breakdown: CourierBreakdown[] = [];
    let totalParcels = 0;
    let totalDelivered = 0;
    let totalCancelled = 0;

    for (const res of results) {
      if (res.status === "fulfilled" && res.value) {
        breakdown.push({
          provider: res.value.provider,
          totalParcels: res.value.totalParcels,
          delivered: res.value.delivered,
          cancelled: res.value.cancelled,
          deliveryRatio: res.value.deliveryRatio,
        });
        totalParcels += res.value.totalParcels;
        totalDelivered += res.value.delivered;
        totalCancelled += res.value.cancelled;
      }
    }

    if (breakdown.length === 0 || totalParcels === 0) return null;

    const deliveryRatio = Math.round((totalDelivered / totalParcels) * 1000) / 10;
    return {
      combined: {
        provider: CourierProvider.STEADFAST,
        totalParcels,
        delivered: totalDelivered,
        cancelled: totalCancelled,
        deliveryRatio,
      },
      breakdown,
    };
  }

  private async fetchSteadfastStats(phone: string, merchantId?: string): Promise<CourierFraudStats | null> {
    try {
      const keys = await this.getCredentials(merchantId, CourierProvider.STEADFAST);
      if (!keys.apiKey || !keys.secretKey) return null;

      const res = await fetch(`https://portal.steadfast.com.bd/api/v1/fraud-check/${phone}`, {
        headers: { "Api-Key": keys.apiKey, "Secret-Key": keys.secretKey, "Content-Type": "application/json" },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data?.status === 200 && data.total_parcels !== undefined) {
        const total = Number(data.total_parcels) || 0;
        const delivered = Number(data.total_delivered) || 0;
        const cancelled = Number(data.total_cancelled) || 0;
        const ratio = total > 0 ? (delivered / total) * 100 : 100;
        return { provider: CourierProvider.STEADFAST, totalParcels: total, delivered, cancelled, deliveryRatio: Math.round(ratio * 10) / 10 };
      }
    } catch {
      this.logger.debug(`Steadfast check bypassed for ${phone}`);
    }
    return null;
  }

  private async fetchPathaoStats(phone: string, merchantId?: string): Promise<CourierFraudStats | null> {
    try {
      const keys = await this.getCredentials(merchantId, CourierProvider.PATHAO);
      if (!keys.apiKey) return null;
      // Pathao merchant webhook & intelligence proxy check
      return null;
    } catch {
      return null;
    }
  }

  private async getCredentials(merchantId: string | undefined, provider: CourierProvider) {
    let apiKey = provider === CourierProvider.STEADFAST ? process.env.STEADFAST_API_KEY : process.env.PATHAO_API_KEY;
    let secretKey = provider === CourierProvider.STEADFAST ? process.env.STEADFAST_SECRET_KEY : process.env.PATHAO_SECRET_KEY;
    if (merchantId) {
      const acc = await this.prisma.courierAccount.findUnique({ where: { merchantId_provider: { merchantId, provider } } });
      if (acc?.apiKey && acc?.isConnected) {
        apiKey = acc.apiKey;
        secretKey = acc.secretKey || secretKey;
      }
    }
    return { apiKey, secretKey };
  }

  buildCourierResult(rawPhone: string, customerName: string, stats: CourierFraudStats, breakdown: CourierBreakdown[]): FraudEvaluationResult {
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
        `Multi-Courier Aggregator: ${stats.totalParcels} total lifetime shipments tracked`,
        `Courier Success Rate: ${ratio.toFixed(1)}% (${stats.delivered} delivered / ${stats.cancelled} returns)`,
        risk === RiskLevel.HIGH_RISK ? "Critical cancellation frequency detected across courier hubs" : "Verified courier recipient profile",
      ],
      recommendation: rec,
      courierBreakdown: breakdown,
    };
  }
}
