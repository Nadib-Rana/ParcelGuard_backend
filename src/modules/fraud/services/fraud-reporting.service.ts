import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { ReportFraudDto } from "../dto/fraud.dto";
import { BlacklistStatus } from "../../../common/enums";

@Injectable()
export class FraudReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async reportFraud(dto: ReportFraudDto, cleanPhone: string, merchantId?: string) {
    const existing = await this.prisma.globalBlacklistEntry.findFirst({
      where: { phone: cleanPhone },
    });

    if (existing) {
      return this.prisma.globalBlacklistEntry.update({
        where: { id: existing.id },
        data: {
          reportedByCount: existing.reportedByCount + 1,
          totalReturns: existing.totalReturns + 1,
          reason: `${existing.reason} | ${dto.reason}`,
        },
      });
    }

    return this.prisma.globalBlacklistEntry.create({
      data: {
        phone: cleanPhone,
        customerName: dto.customerName,
        reason: dto.reason,
        reportedByMerchantId: merchantId,
        reportedByCount: 1,
        totalReturns: 1,
        riskScore: 85,
        status: BlacklistStatus.UNDER_REVIEW,
        addedBy: "Merchant Report",
      },
    });
  }

  async getRecentChecks(merchantId?: string) {
    return this.prisma.fraudCheckLog.findMany({
      where: merchantId ? { merchantId } : {},
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }
}
