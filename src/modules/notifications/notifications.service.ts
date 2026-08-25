import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getMerchantId(userId: string): Promise<string> {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { userId },
    });
    if (!merchant) throw new NotFoundException("Merchant not found");
    return merchant.id;
  }

  async listNotifications(userId: string) {
    const merchantId = await this.getMerchantId(userId);

    const list = await this.prisma.appNotification.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
    });

    return list.map(n => ({
      id: n.numericId || n.id,
      dbId: n.id,
      type: n.category.toLowerCase().replace(" ", ""),
      category: n.category,
      title: n.title,
      body: n.body,
      time: n.createdAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      read: n.isRead,
    }));
  }

  async markAsRead(userId: string, id: string) {
    const merchantId = await this.getMerchantId(userId);

    const notif = await this.prisma.appNotification.findFirst({
      where: {
        merchantId,
        OR: [
          { id },
          !isNaN(Number(id)) ? { numericId: Number(id) } : {},
        ],
      },
    });

    if (!notif) return { success: true };

    return this.prisma.appNotification.update({
      where: { id: notif.id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    const merchantId = await this.getMerchantId(userId);

    return this.prisma.appNotification.updateMany({
      where: { merchantId, isRead: false },
      data: { isRead: true },
    });
  }
}
