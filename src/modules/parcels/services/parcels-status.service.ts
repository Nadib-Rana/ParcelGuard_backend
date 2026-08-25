import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { UpdateParcelStatusDto } from "../dto/parcel.dto";
import { ParcelStatus } from "../../../common/enums";
import { ParcelsMapperUtil } from "../utils/parcels-mapper.util";

@Injectable()
export class ParcelsStatusService {
  constructor(private readonly prisma: PrismaService) {}

  async updateParcelStatus(merchantId: string, id: string, dto: UpdateParcelStatusDto) {
    const parcel = await this.prisma.parcel.findFirst({
      where: { id, merchantId },
    });

    if (!parcel) throw new NotFoundException("Parcel not found");

    const updated = await this.prisma.parcel.update({
      where: { id },
      data: {
        status: dto.status,
        timeline: {
          create: {
            status: dto.status,
            title: `Status updated to ${dto.status}`,
            location: dto.location || "Logistics Hub",
            notes: dto.notes,
          },
        },
      },
      include: { timeline: true },
    });

    if (dto.status === ParcelStatus.DELIVERED) {
      await this.prisma.customer.updateMany({
        where: { merchantId, phone: parcel.recipientPhone },
        data: { deliveredCount: { increment: 1 } },
      });
    } else if (dto.status === ParcelStatus.RETURNED) {
      await this.prisma.customer.updateMany({
        where: { merchantId, phone: parcel.recipientPhone },
        data: { returnedCount: { increment: 1 } },
      });
    }

    return ParcelsMapperUtil.mapParcelResponse(updated);
  }
}
