import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { CheckPhoneRiskDto } from "../dto/fraud.dto";
import { RiskLevel } from "../../../common/enums";
import { FraudEvaluationResult, VelocityStats } from "../interfaces/fraud-evaluation.interface";
import { FraudScoringUtil } from "../utils/fraud-scoring.util";
import { FraudCourierApiService } from "./fraud-courier-api.service";

@Injectable()
export class FraudEvaluatorService {
  private readonly logger = new Logger(FraudEvaluatorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly courierApi: FraudCourierApiService,
  ) {}

  normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("880")) return digits.slice(2);
    if (digits.startsWith("0")) return digits;
    return `0${digits}`;
  }

  async evaluate(dto: CheckPhoneRiskDto, merchantId?: string): Promise<FraudEvaluationResult> {
    const rawPhone = dto.phone.trim();
    const cleanPhone = this.normalizePhone(rawPhone);
    const customerName = dto.name?.trim() || "Customer";
    const velocity = await this.calculateVelocity(rawPhone, cleanPhone);

    // 1. Global Blacklist Check
    const blacklistHit = await this.prisma.globalBlacklistEntry.findFirst({
      where: { OR: [{ phone: cleanPhone }, { phone: rawPhone }] },
    });

    if (blacklistHit) {
      const result = this.buildBlacklistResult(rawPhone, customerName, blacklistHit, velocity);
      await this.saveCheckLog(merchantId, result);
      return result;
    }

    // 2. Merchant Local Directory Check
    if (merchantId) {
      const localCustomer = await this.prisma.customer.findFirst({
        where: { merchantId, OR: [{ phone: rawPhone }, { phone: cleanPhone }] },
      });
      if (localCustomer) {
        const result = this.applyVelocity(FraudScoringUtil.evaluateLocalCustomer(rawPhone, customerName, localCustomer), velocity);
        await this.saveCheckLog(merchantId, result);
        return result;
      }
    }

    // 3. Cross-Merchant Network History
    const crossParcels = await this.prisma.parcel.findMany({
      where: { OR: [{ recipientPhone: rawPhone }, { recipientPhone: cleanPhone }] },
    });
    if (crossParcels.length > 0) {
      const result = this.applyVelocity(FraudScoringUtil.evaluateCrossMerchant(rawPhone, customerName, crossParcels), velocity);
      await this.saveCheckLog(merchantId, result);
      return result;
    }

    // 4. Live Multi-Courier API Aggregator
    const courierData = await this.courierApi.fetchCourierLiveStats(cleanPhone, merchantId);
    if (courierData) {
      const result = this.applyVelocity(this.courierApi.buildCourierResult(rawPhone, customerName, courierData.combined, courierData.breakdown), velocity);
      await this.saveCheckLog(merchantId, result);
      return result;
    }

    // 5. Dynamic Heuristic for Brand New Numbers
    const result = this.applyVelocity(FraudScoringUtil.evaluateHeuristic(rawPhone, cleanPhone, customerName), velocity);
    await this.saveCheckLog(merchantId, result);
    return result;
  }

  private async calculateVelocity(phone: string, cleanPhone: string): Promise<VelocityStats> {
    const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await this.prisma.parcel.findMany({
      where: { OR: [{ recipientPhone: phone }, { recipientPhone: cleanPhone }], createdAt: { gte: since48h } },
      select: { merchantId: true, createdAt: true },
    });
    const recentOrders48h = recent.length;
    const recentOrders24h = recent.filter((p) => p.createdAt >= since24h).length;
    const distinctMerchantsCount = new Set(recent.map((p) => p.merchantId)).size;
    return { recentOrders24h, recentOrders48h, distinctMerchantsCount, isHighVelocity: recentOrders48h >= 3 || distinctMerchantsCount >= 2 };
  }

  private applyVelocity(res: FraudEvaluationResult, velocity: VelocityStats): FraudEvaluationResult {
    res.velocityStats = velocity;
    if (velocity.isHighVelocity) {
      res.factors.unshift(`🚨 Velocity Alert: ${velocity.recentOrders48h} active COD orders across ${velocity.distinctMerchantsCount} stores in last 48h`);
      res.score = Math.min(95, res.score + 35);
      if (res.score >= 70) res.risk = RiskLevel.HIGH_RISK;
      else if (res.score >= 40) res.risk = RiskLevel.MODERATE;
      res.recommendation = "CRITICAL: Multiple duplicate orders across stores. High cancellation risk. Require advance delivery payment.";
    }
    return res;
  }

  private buildBlacklistResult(rawPhone: string, name: string, b: any, velocity: VelocityStats): FraudEvaluationResult {
    return {
      phone: rawPhone,
      name: b.customerName || name,
      risk: RiskLevel.HIGH_RISK,
      score: b.riskScore || 92,
      date: "Just now",
      totalOrders: b.totalReturns + 10,
      delivered: 3,
      returned: b.totalReturns || 15,
      cancelled: 4,
      successRate: "16.7%",
      factors: [`Nationwide Blacklist: ${b.reason}`, `Reported by ${b.reportedByCount} merchants`],
      recommendation: "HIGH RISK: Reject Cash on Delivery or request full advance payment.",
      velocityStats: velocity,
    };
  }

  private async saveCheckLog(merchantId: string | undefined, res: FraudEvaluationResult) {
    try {
      if (merchantId) await this.prisma.merchantProfile.update({ where: { id: merchantId }, data: { fraudChecksUsed: { increment: 1 } } });
      await this.prisma.fraudCheckLog.create({
        data: {
          merchantId: merchantId || null,
          phone: res.phone,
          name: res.name,
          riskScore: res.score,
          riskCategory: res.risk,
          successRate: res.successRate,
          totalOrdersFound: res.totalOrders,
          deliveredFound: res.delivered,
          returnedFound: res.returned,
          cancelledFound: res.cancelled,
          factors: res.factors,
          recommendation: res.recommendation,
        },
      });
    } catch (e) {
      this.logger.warn(`Save log failed: ${e instanceof Error ? e.message : e}`);
    }
  }
}
