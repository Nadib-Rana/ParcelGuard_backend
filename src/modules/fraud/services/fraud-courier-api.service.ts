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
  private readonly DEFAULT_COURIERS = ["Steadfast", "Pathao", "RedX", "Paperfly", "ParcelDex", "CarryBee"];

  constructor(private readonly prisma: PrismaService) {}

  async fetchCourierLiveStats(phone: string, merchantId?: string): Promise<{ combined: CourierFraudStats; breakdown: CourierBreakdown[] }> {
    const dbCouriers = await this.prisma.courierHealthMetric.findMany({
      where: { isActive: true },
      select: { provider: true },
      orderBy: { provider: "asc" },
    });
    const courierList = dbCouriers.length > 0 ? dbCouriers.map((c) => c.provider) : this.DEFAULT_COURIERS;

    const results = await Promise.allSettled(courierList.map((c) => this.fetchProviderStats(c, phone, merchantId)));
    const breakdown: CourierBreakdown[] = [];
    let totalParcels = 0;
    let totalDelivered = 0;
    let totalCancelled = 0;

    results.forEach((res, i) => {
      const stats = res.status === "fulfilled" ? res.value : null;
      const provider = courierList[i];
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

  private readonly liveStatsCache = new Map<string, { stats: CourierBreakdown; cachedAt: number }>();

  private async fetchProviderStats(provider: string, phone: string, merchantId?: string): Promise<CourierBreakdown | null> {
    try {
      const cacheKey = `${provider.toLowerCase()}_${phone}`;
      const cached = this.liveStatsCache.get(cacheKey);
      const TWO_HOURS = 2 * 60 * 60 * 1000;

      if (cached && Date.now() - cached.cachedAt < TWO_HOURS) {
        this.logger.log(`[Courier Cache] ⚡ Reusing cached live stats for ${provider} - ${phone}`);
        return cached.stats;
      }

      const local = await this.prisma.parcel.findMany({
        where: { recipientPhone: { in: [phone, phone.replace(/^0/, ""), `88${phone}`, `+88${phone}`] }, courier: provider },
        select: { status: true },
      });

      const localDelivered = local.filter((p) => p.status === "Delivered").length;
      const localCancelled = local.filter((p) => p.status === "Returned" || p.status === "Cancelled").length;

      let liveTotal = 0;
      let liveDelivered = 0;
      let liveCancelled = 0;
      let hasLive = false;

      if (provider.toLowerCase() === "steadfast") {
        const keys = await this.getCredentials(merchantId, "Steadfast");
        if (keys.apiKey && keys.secretKey) {
          this.logger.log(`[Steadfast Live API] 🚀 Querying live fraud check endpoint for phone: ${phone}`);
          const res = await fetch(`https://portal.packzy.com/api/v1/fraud_check/${phone}`, {
            headers: { "Api-Key": keys.apiKey, "Secret-Key": keys.secretKey, "Content-Type": "application/json" },
          });

          if (res.ok) {
            const data = await res.json();
            this.logger.log(`[Steadfast Live API] 📦 Live Response (HTTP ${res.status}): ${JSON.stringify(data)}`);
            if (data && (data.total_parcels !== undefined || data.status === 200)) {
              liveTotal = Number(data.total_parcels) || 0;
              liveDelivered = Number(data.total_delivered) || 0;
              liveCancelled = Number(data.total_cancelled) || 0;
              hasLive = true;
              const liveRatio = liveTotal > 0 ? Math.round((liveDelivered / liveTotal) * 1000) / 10 : 100;
              this.logger.log(`[Steadfast Live API] ✅ Parsed Live Stats: Total: ${liveTotal}, Delivered: ${liveDelivered}, Cancelled: ${liveCancelled}, Ratio: ${liveRatio}%`);
            }
          } else if (res.status === 429) {
            const data = await res.json().catch(() => null);
            this.logger.warn(`[Steadfast Live API] ⚠️ Steadfast daily search limit reached (Limit: ${data?.limit || 10}). Please contact Steadfast Support to increase search quota.`);
          } else {
            const errText = await res.text().catch(() => "");
            this.logger.warn(`[Steadfast Live API] ⚠️ Live check failed (HTTP ${res.status}): ${errText}`);
          }
        } else {
          this.logger.warn(`[Steadfast Live API] ⚠️ Steadfast API keys not configured. Skipping live network check.`);
        }
      }

      const total = hasLive ? Math.max(liveTotal, local.length) : local.length;
      const delivered = hasLive ? Math.max(liveDelivered, localDelivered) : localDelivered;
      const cancelled = hasLive ? Math.max(liveCancelled, localCancelled) : localCancelled;
      const ratio = total > 0 ? Math.round((delivered / total) * 1000) / 10 : 100;

      const breakdown: CourierBreakdown = { provider, totalParcels: total, delivered, cancelled, deliveryRatio: ratio };
      if (hasLive) {
        this.liveStatsCache.set(cacheKey, { stats: breakdown, cachedAt: Date.now() });
      }

      return breakdown;
    } catch (e) {
      this.logger.error(`[Courier API] ❌ Error checking ${provider} for phone ${phone}: ${e instanceof Error ? e.message : e}`);
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
        `কুরিয়ার নেটওয়ার্ক স্ক্যান: সর্বমোট ${stats.totalParcels}টি পার্সেল ট্র্যাক করা হয়েছে`,
        `কুরিয়ার ডেলিভারি রেট: ${ratio.toFixed(1)}% (${stats.delivered} ডেলিভারি / ${stats.cancelled} বাতিল)`,
        risk === RiskLevel.HIGH_RISK ? "কুরিয়ার হাবে ঘনঘন পার্সেল রিজেকশনের রেকর্ড রয়েছে" : "ভেরিফাইড ও নির্ভরযোগ্য কাস্টমার রেকর্ড",
      ],
      recommendation: rec,
      courierBreakdown: breakdown,
    };
  }
}