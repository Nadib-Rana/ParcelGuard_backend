import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { InitiateCheckoutDto } from "./dto/billing.dto";
import { PlanTier, TransactionStatus, TransactionType } from "../../common/enums";

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  private async getMerchantId(userId: string) {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { userId },
    });
    if (!merchant) throw new NotFoundException("Merchant not found");
    return merchant;
  }

  async getSubscriptionDetails(userId: string) {
    const merchant = await this.getMerchantId(userId);

    return {
      plan: merchant.plan,
      status: merchant.status,
      balance: merchant.balance,
      fraudChecksUsed: merchant.fraudChecksUsed,
      fraudChecksLimit: merchant.fraudChecksLimit,
      monthlyOrders: merchant.monthlyOrders,
      totalParcels: merchant.totalParcels,
      plans: [
        {
          tier: PlanTier.STARTER,
          price: "৳999/mo",
          priceNum: 999,
          limit: 500,
          features: ["500 Free Fraud Checks / mo", "All Courier Integrations", "Standard COD Settlement", "Email Support"],
        },
        {
          tier: PlanTier.GROWTH,
          price: "৳2,499/mo",
          priceNum: 2499,
          popular: true,
          limit: 2000,
          features: ["2,000 Fraud Checks / mo", "Bulk Thermal 4x6 Labels", "Priority COD Dispute Desk", "Real-time Webhook Ingress", "24/7 Phone Support"],
        },
        {
          tier: PlanTier.ENTERPRISE,
          price: "৳5,999/mo",
          priceNum: 5999,
          limit: 10000,
          features: ["10,000 Fraud Checks / mo", "Custom API Rate Limits", "Dedicated Account Manager", "Custom Courier Contract Rates", "Direct PostgreSQL Sync"],
        },
      ],
    };
  }

  async initiateCheckout(userId: string, dto: InitiateCheckoutDto) {
    const merchant = await this.getMerchantId(userId);

    const trxNumber = `TRX-${Math.floor(1000 + Math.random() * 9000)}`;
    const trxId = dto.trxId || `BK${Math.floor(10000000 + Math.random() * 90000000)}`;

    const isSubscription = [PlanTier.STARTER, PlanTier.GROWTH, PlanTier.ENTERPRISE].includes(
      dto.planOrType as any,
    );

    const transaction = await this.prisma.platformTransaction.create({
      data: {
        trxNumber,
        merchantId: merchant.id,
        merchantName: merchant.businessName,
        amount: dto.amount,
        method: dto.method,
        type: isSubscription ? TransactionType.SUBSCRIPTION : TransactionType.CREDIT_TOPUP,
        status: TransactionStatus.COMPLETED,
        trxId,
      },
    });

    if (isSubscription) {
      const limit = dto.planOrType === PlanTier.ENTERPRISE ? 10000 : dto.planOrType === PlanTier.GROWTH ? 2000 : 500;
      await this.prisma.merchantProfile.update({
        where: { id: merchant.id },
        data: {
          plan: dto.planOrType,
          fraudChecksLimit: limit,
        },
      });
    } else {
      // Top-up balance
      await this.prisma.merchantProfile.update({
        where: { id: merchant.id },
        data: { balance: { increment: dto.amount } },
      });
    }

    return {
      success: true,
      transaction,
      message: `Payment of ৳${dto.amount} confirmed via ${dto.method}. Plan updated successfully!`,
    };
  }

  async getTransactions(userId: string) {
    const merchant = await this.getMerchantId(userId);

    const list = await this.prisma.platformTransaction.findMany({
      where: { merchantId: merchant.id },
      orderBy: { createdAt: "desc" },
    });

    return list.map(t => ({
      id: t.trxNumber,
      dbId: t.id,
      merchantName: t.merchantName || merchant.businessName,
      amount: t.amount,
      method: t.method,
      type: t.type,
      status: t.status,
      date: t.createdAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      trxId: t.trxId,
    }));
  }
}
