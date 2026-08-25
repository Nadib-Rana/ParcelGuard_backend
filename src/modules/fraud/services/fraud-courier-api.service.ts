import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { RiskLevel } from "../../../common/enums";
import { FraudEvaluationResult, CourierBreakdown } from "../interfaces/fraud-evaluation.interface";

export interface CourierFraudStats {
  provider: string;
  totalParcels: number;
  delivered: number;
  cancelled: number;
  deliveryRatio: number;
}

@Injectable()
export class FraudCourierApiService {
  private readonly logger = new Logger(FraudCourierApiService.name);
  private readonly COURIERS = ["Steadfast", "Pathao", "RedX", "Paperfly", "ParcelDex", "CarryBee"];

  constructor(private readonly prisma: PrismaService) {}

  async fetchCourierLiveStats(phone: string, merchantId?: string): Promise<{ combined: CourierFraudStats; breakdown: CourierBreakdown[] }> {
    const results = await Promise.allSettled(this.COURIERS.map((c) => this.fetchProviderStats(c, phone, merchantId)));
    const breakdown: CourierBreakdown[] = [];
    let totalParcels = 0;
    let totalDelivered = 0;
    let totalCancelled = 0;

    results.forEach((res, i) => {
      const stats = res.status === "fulfilled" ? res.value : null;
      const provider = this.COURIERS[i];
      const entry: CourierBreakdown = stats || { provider, totalParcels: 0, delivered: 0, cancelled: 0, deliveryRatio: 0 };
      breakdown.push(entry);
      totalParcels += entry.totalParcels;
      totalDelivered += entry.delivered;
      totalCancelled += entry.cancelled;
    });

    const deliveryRatio = totalParcels > 0 ? Math.round((totalDelivered / totalParcels) * 1000) / 10 : 100;
    return {
      combined: { provider: "Multi-Courier", totalParcels, delivered: totalDelivered, cancelled: totalCancelled, deliveryRatio },
      breakdown,
    };
  }

  private async fetchProviderStats(provider: string, phone: string, merchantId?: string): Promise<CourierBreakdown | null> {
    try {
      const local = await this.prisma.parcel.findMany({
        where: { recipientPhone: { in: [phone, phone.replace(/^0/, ""), `88${phone}`, `+88${phone}`] }, courier: provider },
        select: { status: true },
      });

      if (local.length > 0) {
        const delivered = local.filter((p) => p.status === "Delivered").length;
        const cancelled = local.filter((p) => p.status === "Returned" || p.status === "Cancelled").length;
        const ratio = local.length > 0 ? Math.round((delivered / local.length) * 1000) / 10 : 100;
        return { provider, totalParcels: local.length, delivered, cancelled, deliveryRatio: ratio };
      }

      if (provider === "Steadfast") {
        const keys = await this.getCredentials(merchantId, "Steadfast");
        if (keys.apiKey && keys.secretKey) {
          const res = await fetch(`https://portal.packzy.com/api/v1/fraud_check/${phone}`, {
            headers: { "Api-Key": keys.apiKey, "Secret-Key": keys.secretKey, "Content-Type": "application/json" },
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.status === 200 && data.total_parcels !== undefined) {
              const total = Number(data.total_parcels) || 0;
              const delivered = Number(data.total_delivered) || 0;
              const cancelled = Number(data.total_cancelled) || 0;
              const ratio = total > 0 ? Math.round((delivered / total) * 1000) / 10 : 0;
              return { provider, totalParcels: total, delivered, cancelled, deliveryRatio: ratio };
            }
          }
        }
      }
    } catch (e) {
      this.logger.debug(`Stats check skipped for ${provider}: ${e instanceof Error ? e.message : e}`);
    }
    return { provider, totalParcels: 0, delivered: 0, cancelled: 0, deliveryRatio: 0 };
  }

  private async getCredentials(merchantId: string | undefined, provider: string) {
    let apiKey: string | null | undefined = undefined;
    let secretKey: string | null | undefined = undefined;

    if (merchantId) {
      const acc = await this.prisma.courierAccount.findUnique({ where: { merchantId_provider: { merchantId, provider } } });
      if (acc?.apiKey && acc?.isConnected) {
        apiKey = acc.apiKey;
        secretKey = acc.secretKey;
      }
    }

    if (!apiKey) {
      const master = await this.prisma.courierHealthMetric.findUnique({ where: { provider } });
      if (master?.apiKey && master?.isActive) {
        apiKey = master.apiKey;
        secretKey = master.secretKey;
      }
    }

    if (!apiKey && provider === "Steadfast") {
      apiKey = process.env.STEADFAST_API_KEY;
      secretKey = process.env.STEADFAST_SECRET_KEY;
    }

    return { apiKey, secretKey };
  }

  buildCourierResult(rawPhone: string, customerName: string, stats: CourierFraudStats, breakdown: CourierBreakdown[]): FraudEvaluationResult {
    const ratio = stats.deliveryRatio;
    let risk: RiskLevel = RiskLevel.SAFE;
    let score = 10;
    let rec = "ঝুঁকি মুক্ত: এই কাস্টমারকে নিশ্চিন্তে পার্সেল দিতে পারেন।";

    if (stats.totalParcels === 0) {
      score = 15;
      rec = "নতুন গ্রাহক: কোনো পূর্ববর্তী কুরিয়ার অভিযোগ নেই। ক্যাশ অন ডেলিভারি নিরাপদ।";
    } else if (ratio < 45 || (stats.cancelled >= 3 && ratio < 60)) {
      risk = RiskLevel.HIGH_RISK;
      score = Math.min(95, Math.round(98 - ratio * 0.8));
      rec = `উচ্চ বাতিল ঝুঁকি (${ratio}% ডেলিভারি হার)। পার্সেল পাঠানোর আগে ডেলিভারি চার্জ (১৫০-২০০ টাকা) অগ্রিম নিন।`;
    } else if (ratio < 75) {
      risk = RiskLevel.MODERATE;
      score = Math.round(75 - (ratio - 45) * 0.7);
      rec = `মাঝারি ডেলিভারি হার (${ratio}%)। পার্সেল পাঠানোর আগে কাস্টমারকে ফোন করে কনফার্ম করুন।`;
    } else {
      risk = RiskLevel.SAFE;
      score = Math.max(5, Math.round(25 - (ratio - 75) * 0.8));
      rec = `চমৎকার ডেলিভারি হিস্ট্রি (${ratio}% ডেলিভারি সফল)। নিশ্চিন্তে ক্যাশ অন ডেলিভারিতে পার্সেল পাঠান।`;
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
        `৬টি কুরিয়ার নেটওয়ার্ক স্ক্যান: সর্বমোট ${stats.totalParcels}টি পার্সেল ট্র্যাক করা হয়েছে`,
        `কুরিয়ার ডেলিভারি রেট: ${ratio.toFixed(1)}% (${stats.delivered} ডেলিভারি / ${stats.cancelled} বাতিল)`,
        risk === RiskLevel.HIGH_RISK ? "কুরিয়ার হাবে ঘনঘন পার্সেল রিজেকশনের রেকর্ড রয়েছে" : "ভেরিফাইড ও নির্ভরযোগ্য কাস্টমার রেকর্ড",
      ],
      recommendation: rec,
      courierBreakdown: breakdown,
    };
  }
}
