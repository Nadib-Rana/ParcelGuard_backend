import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { UpdateMerchantDto } from "./dto/update-merchant.dto";
import * as crypto from "crypto";

@Injectable()
export class MerchantsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfileByUserId(userId: string) {
    let merchant = await this.prisma.merchantProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (!merchant) {
      // Auto-create initial profile for user if missing
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException("User not found");
      }

      merchant = await this.prisma.merchantProfile.create({
        data: {
          userId: user.id,
          businessName: `${user.firstName || "Merchant"} Store`,
          ownerName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Owner",
          phone: user.phoneNumber || "+880 1700-000000",
          email: user.email,
          apiKey: `pg_live_${crypto.randomBytes(16).toString("hex")}`,
          webhookSecret: `whsec_live_${crypto.randomBytes(12).toString("hex")}`,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              status: true,
            },
          },
        },
      });
    }

    return merchant;
  }

  async updateProfile(userId: string, dto: UpdateMerchantDto) {
    const merchant = await this.getProfileByUserId(userId);

    return this.prisma.merchantProfile.update({
      where: { id: merchant.id },
      data: dto,
    });
  }

  async regenerateApiKey(userId: string) {
    const merchant = await this.getProfileByUserId(userId);
    const newApiKey = `pg_live_${crypto.randomBytes(16).toString("hex")}`;

    return this.prisma.merchantProfile.update({
      where: { id: merchant.id },
      data: { apiKey: newApiKey },
      select: {
        id: true,
        apiKey: true,
        businessName: true,
        updatedAt: true,
      },
    });
  }
}
