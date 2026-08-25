import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { ToggleCourierHealthDto } from "../dto/admin.dto";
import { CourierHealthStatus } from "../../../common/enums";

@Injectable()
export class AdminCouriersService {
  constructor(private readonly prisma: PrismaService) {}

  async getCourierHealth() {
    return this.prisma.courierHealthMetric.findMany({
      orderBy: { checkedAt: "desc" },
    });
  }

  async toggleCourierHealth(dto: ToggleCourierHealthDto) {
    const metric = await this.prisma.courierHealthMetric.findUnique({
      where: { provider: dto.provider },
    });

    if (!metric) throw new NotFoundException("Courier health metric not found");

    const nextStatus =
      metric.status === CourierHealthStatus.OPERATIONAL
        ? CourierHealthStatus.DEGRADED
        : metric.status === CourierHealthStatus.DEGRADED
        ? CourierHealthStatus.OUTAGE
        : CourierHealthStatus.OPERATIONAL;

    return this.prisma.courierHealthMetric.update({
      where: { id: metric.id },
      data: {
        status: nextStatus,
        lastIncident:
          nextStatus !== CourierHealthStatus.OPERATIONAL
            ? `Status changed to ${nextStatus} by Super Admin`
            : metric.lastIncident,
      },
    });
  }
}
