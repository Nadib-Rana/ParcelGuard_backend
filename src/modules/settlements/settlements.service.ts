import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { RaiseDisputeDto } from "./dto/settlement.dto";
import { SettlementStatus, DisputeStatus } from "../../common/enums";

@Injectable()
export class SettlementsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getMerchantId(userId: string): Promise<string> {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { userId },
    });
    if (!merchant) throw new NotFoundException("Merchant not found");
    return merchant.id;
  }

  async listSettlements(userId: string) {
    const merchantId = await this.getMerchantId(userId);

    const items = await this.prisma.settlement.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
      include: { disputes: true },
    });

    return items.map(s => ({
      id: s.settlementCode,
      dbId: s.id,
      courier: s.courierProvider,
      period: s.period,
      expected: s.expectedCod,
      received: s.receivedPayout,
      diff: s.discrepancyAmount,
      status: s.status,
      parcelsCount: s.parcelsCount,
      disputeReason: s.disputeReason,
    }));
  }

  async raiseDispute(userId: string, dto: RaiseDisputeDto) {
    const merchantId = await this.getMerchantId(userId);

    const settlement = await this.prisma.settlement.findFirst({
      where: {
        merchantId,
        OR: [{ id: dto.settlementId }, { settlementCode: dto.settlementId }],
      },
    });

    if (!settlement) throw new NotFoundException("Settlement statement not found");

    const amount = dto.disputedAmount || Math.abs(settlement.discrepancyAmount) || 0;

    await this.prisma.disputeTicket.create({
      data: {
        settlementId: settlement.id,
        merchantId,
        reason: dto.reason,
        disputedAmount: amount,
        status: DisputeStatus.OPEN,
      },
    });

    return this.prisma.settlement.update({
      where: { id: settlement.id },
      data: {
        status: SettlementStatus.DISPUTED,
        disputeReason: dto.reason,
      },
    });
  }
}
