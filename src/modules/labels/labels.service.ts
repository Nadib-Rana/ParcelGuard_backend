import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { GenerateLabelsDto } from "./dto/label.dto";

@Injectable()
export class LabelsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateThermalLabels(userId: string, dto: GenerateLabelsDto) {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { userId },
    });
    if (!merchant) throw new NotFoundException("Merchant not found");

    const parcels = await this.prisma.parcel.findMany({
      where: {
        merchantId: merchant.id,
        trackingId: { in: dto.parcelIds },
      },
    });

    return parcels.map(p => ({
      trackingId: p.trackingId,
      consignmentId: p.consignmentId || p.trackingId,
      courier: p.courier,
      merchantName: merchant.businessName,
      merchantPhone: merchant.phone,
      merchantAddress: merchant.businessAddress || `${merchant.district}, Bangladesh`,
      recipientName: p.recipientName,
      recipientPhone: p.recipientPhone,
      recipientAddress: p.recipientAddress,
      district: p.district,
      area: p.area,
      product: p.productTitle,
      codAmount: p.codAmount,
      weight: `${p.weightKg} kg`,
      date: p.dateStr || new Date().toLocaleDateString("en-GB"),
      routingCode: `${p.district.substring(0, 3).toUpperCase()}-${p.courier.substring(0, 2).toUpperCase()}`,
      barcodeValue: p.trackingId,
    }));
  }
}
