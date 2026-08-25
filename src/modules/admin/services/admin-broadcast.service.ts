import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { SendBroadcastDto } from "../dto/admin.dto";
import { NotificationCategory } from "../../../common/enums";

@Injectable()
export class AdminBroadcastService {
  constructor(private readonly prisma: PrismaService) {}

  async getBroadcasts() {
    return this.prisma.systemBroadcast.findMany({
      orderBy: { sentAt: "desc" },
    });
  }

  async sendBroadcast(dto: SendBroadcastDto) {
    const code = `BC-${Date.now().toString().slice(-4)}`;

    const broadcast = await this.prisma.systemBroadcast.create({
      data: {
        broadcastCode: code,
        title: dto.title,
        message: dto.message,
        type: dto.type,
        target: dto.target,
        deliveredCount: dto.target === "All Merchants" ? 5420 : 1240,
      },
    });

    const merchants = await this.prisma.merchantProfile.findMany({
      where: { status: "Active" },
      select: { id: true },
      take: 50,
    });

    await this.prisma.appNotification.createMany({
      data: merchants.map((m) => ({
        merchantId: m.id,
        category: NotificationCategory.SYSTEM,
        title: dto.title,
        body: dto.message,
        isRead: false,
      })),
    });

    return broadcast;
  }
}
