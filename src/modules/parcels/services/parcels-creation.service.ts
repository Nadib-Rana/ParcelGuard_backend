import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { FraudService } from "../../fraud/fraud.service";
import { CouriersService } from "../../couriers/couriers.service";
import { CreateParcelDto, BulkCreateParcelsDto } from "../dto/parcel.dto";
import { ParcelStatus, RiskLevel } from "../../../common/enums";
import { ParcelsMapperUtil } from "../utils/parcels-mapper.util";

@Injectable()
export class ParcelsCreationService {
  private readonly logger = new Logger(ParcelsCreationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fraudService: FraudService,
    private readonly couriersService: CouriersService,
  ) {}

  async getMerchantId(userId: string): Promise<string> {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) {
      throw new NotFoundException("Merchant profile not found for current user");
    }
    return profile.id;
  }

  async createParcel(userId: string, dto: CreateParcelDto) {
    const merchantId = await this.getMerchantId(userId);
    const trackingId = `PG-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const dateStr = ParcelsMapperUtil.formatDate(new Date());

    let riskLevel: string = RiskLevel.SAFE;
    let riskScore = 15;
    try {
      const fraudRes = await this.fraudService.evaluatePhoneRisk(
        { phone: dto.phone, name: dto.customer },
        merchantId,
      );
      riskLevel = fraudRes.risk;
      riskScore = fraudRes.score;
    } catch {
      // Continue with default
    }

    const courierAdapter = this.couriersService.getAdapter(dto.courier);
    let consignmentId = `CID-${Date.now().toString().slice(-6)}`;
    let riderName: string | undefined;
    let riderPhone: string | undefined;

    try {
      const bookRes = await courierAdapter.createBooking({
        trackingId,
        recipientName: dto.customer,
        recipientPhone: dto.phone,
        recipientAddress: dto.address,
        district: dto.district,
        codAmount: dto.cod,
        productTitle: dto.product,
        notes: dto.notes,
      });
      consignmentId = bookRes.consignmentId;
      if (bookRes.assignedRider) {
        riderName = bookRes.assignedRider.name;
        riderPhone = bookRes.assignedRider.phone;
      }
    } catch (e) {
      this.logger.warn(`Courier booking fallback: ${e instanceof Error ? e.message : e}`);
    }

    let charge = dto.charge;
    if (charge === undefined || charge === null) {
      const rateRes = courierAdapter.calculateRate({
        district: dto.district,
        weightKg: dto.weight || 1,
        codAmount: dto.cod,
      });
      charge = rateRes.charge;
    }

    const parcel = await this.prisma.parcel.create({
      data: {
        trackingId,
        consignmentId,
        merchantId,
        recipientName: dto.customer,
        recipientPhone: dto.phone,
        recipientAddress: dto.address,
        district: dto.district,
        area: dto.area,
        productTitle: dto.product,
        category: dto.category || "General",
        weightKg: dto.weight || 1.0,
        courier: dto.courier,
        codAmount: dto.cod,
        deliveryCharge: charge || 110,
        advancePaid: dto.advance || 0,
        riskLevel,
        riskScore,
        status: dto.status || ParcelStatus.PENDING_PICKUP,
        dateStr,
        riderName,
        riderPhone,
        notes: dto.notes,
        timeline: {
          create: [
            {
              status: ParcelStatus.PENDING_PICKUP,
              title: "Order Booked & Tracking Generated",
              location: "Merchant Hub",
              notes: `Assigned Consignment ID: ${consignmentId}`,
            },
          ],
        },
      },
      include: { timeline: true },
    });

    try {
      await this.prisma.customer.upsert({
        where: { merchantId_phone: { merchantId, phone: dto.phone } },
        update: { name: dto.customer, ordersCount: { increment: 1 }, lastOrderAt: new Date() },
        create: {
          merchantId,
          phone: dto.phone,
          name: dto.customer,
          ordersCount: 1,
          deliveredCount: 0,
          returnedCount: 0,
          riskLevel,
          successRate: "100%",
          lastOrderAt: new Date(),
        },
      });

      await this.prisma.merchantProfile.update({
        where: { id: merchantId },
        data: { totalParcels: { increment: 1 }, monthlyOrders: { increment: 1 } },
      });
    } catch (e) {
      this.logger.warn(`Failed to update customer record: ${e}`);
    }

    return ParcelsMapperUtil.mapParcelResponse(parcel);
  }

  async bulkCreateParcels(userId: string, dto: BulkCreateParcelsDto) {
    const results = [];
    for (const item of dto.parcels) {
      const p = await this.createParcel(userId, item);
      results.push(p);
    }
    return results;
  }
}
