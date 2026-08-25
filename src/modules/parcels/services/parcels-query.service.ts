import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { FilterParcelsDto } from "../dto/parcel.dto";
import { ParcelsMapperUtil } from "../utils/parcels-mapper.util";

@Injectable()
export class ParcelsQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async listParcels(merchantId: string, filter: FilterParcelsDto) {
    const { search, status, courier, risk, page = 1, limit = 50 } = filter;
    const where: any = { merchantId };

    if (status && status !== "All") where.status = status;
    if (courier && courier !== "All") where.courier = courier;
    if (risk && risk !== "All") where.riskLevel = risk;

    if (search) {
      where.OR = [
        { trackingId: { contains: search, mode: "insensitive" } },
        { recipientName: { contains: search, mode: "insensitive" } },
        { recipientPhone: { contains: search, mode: "insensitive" } },
        { district: { contains: search, mode: "insensitive" } },
        { productTitle: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.parcel.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { timeline: true },
      }),
      this.prisma.parcel.count({ where }),
    ]);

    return {
      items: items.map((p) => ParcelsMapperUtil.mapParcelResponse(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getParcelById(merchantId: string, idOrTracking: string) {
    const parcel = await this.prisma.parcel.findFirst({
      where: {
        merchantId,
        OR: [{ id: idOrTracking }, { trackingId: idOrTracking }],
      },
      include: {
        timeline: { orderBy: { timestamp: "asc" } },
      },
    });

    if (!parcel) throw new NotFoundException("Parcel not found");
    return ParcelsMapperUtil.mapParcelResponse(parcel);
  }

  async trackParcelPublic(trackingId: string) {
    const parcel = await this.prisma.parcel.findUnique({
      where: { trackingId },
      include: {
        timeline: { orderBy: { timestamp: "asc" } },
      },
    });

    if (!parcel) throw new NotFoundException("Tracking ID not found");
    return ParcelsMapperUtil.mapParcelResponse(parcel);
  }
}
