import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { UpdateMerchantStatusDto, UpdateMerchantPlanDto } from "../dto/admin.dto";
import { PlanTier } from "../../../common/enums";

@Injectable()
export class AdminMerchantsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMerchants() {
    const merchants = await this.prisma.merchantProfile.findMany({
      include: {
        courierAccounts: {
          select: { provider: true, isConnected: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return merchants.map((m) => ({
      id: m.id,
      name: m.businessName,
      ownerName: m.ownerName || "Merchant",
      phone: m.phone,
      email: m.email,
      plan: m.plan,
      status: m.status,
      joinedDate: m.createdAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      monthlyOrders: m.monthlyOrders,
      totalParcels: m.totalParcels,
      fraudChecksUsed: m.fraudChecksUsed,
      fraudChecksLimit: m.fraudChecksLimit,
      balance: m.balance,
      connectedCouriers: m.courierAccounts
        .filter((c) => c.isConnected)
        .map((c) => c.provider),
    }));
  }

  async updateMerchantStatus(id: string, dto: UpdateMerchantStatusDto) {
    const merchant = await this.prisma.merchantProfile.findUnique({ where: { id } });
    if (!merchant) throw new NotFoundException("Merchant not found");

    return this.prisma.merchantProfile.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async updateMerchantPlan(id: string, dto: UpdateMerchantPlanDto) {
    const merchant = await this.prisma.merchantProfile.findUnique({ where: { id } });
    if (!merchant) throw new NotFoundException("Merchant not found");

    const limit =
      dto.plan === PlanTier.ENTERPRISE ? 10000 : dto.plan === PlanTier.GROWTH ? 2000 : 500;

    return this.prisma.merchantProfile.update({
      where: { id },
      data: {
        plan: dto.plan,
        fraudChecksLimit: limit,
      },
    });
  }
}
