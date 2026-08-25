import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { AddBlacklistDto } from "../dto/admin.dto";
import { BlacklistStatus } from "../../../common/enums";

@Injectable()
export class AdminBlacklistService {
  constructor(private readonly prisma: PrismaService) {}

  async getBlacklist() {
    const list = await this.prisma.globalBlacklistEntry.findMany({
      orderBy: { createdAt: "desc" },
    });

    return list.map((b) => ({
      id: b.id,
      phone: b.phone,
      customerName: b.customerName,
      riskScore: b.riskScore,
      reportedByCount: b.reportedByCount,
      totalReturns: b.totalReturns,
      reason: b.reason,
      status: b.status,
      addedDate: b.createdAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      addedBy: b.addedBy,
    }));
  }

  async addBlacklistEntry(dto: AddBlacklistDto) {
    const cleanPhone = dto.phone.replace(/\D/g, "");

    return this.prisma.globalBlacklistEntry.upsert({
      where: { phone: cleanPhone },
      update: {
        customerName: dto.customerName,
        reason: dto.reason,
        status: dto.status || BlacklistStatus.CONFIRMED_FRAUD,
        riskScore: dto.riskScore || 90,
      },
      create: {
        phone: cleanPhone,
        customerName: dto.customerName,
        reason: dto.reason,
        status: dto.status || BlacklistStatus.CONFIRMED_FRAUD,
        riskScore: dto.riskScore || 90,
        addedBy: "Super Admin",
      },
    });
  }

  async removeBlacklistEntry(id: string) {
    return this.prisma.globalBlacklistEntry.delete({
      where: { id },
    });
  }
}
