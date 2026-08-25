import { Injectable } from "@nestjs/common";
import {
  ICourierAdapter,
  CourierRateQuery,
  CourierRateResult,
  CourierBookingParams,
  CourierBookingResult,
  CourierTrackingResult,
} from "../interfaces/courier-adapter.interface";
import { CourierProvider } from "../../../common/enums";

@Injectable()
export class RedXAdapter implements ICourierAdapter {
  providerName = CourierProvider.REDX;

  calculateRate(query: CourierRateQuery): CourierRateResult {
    const isDhaka = query.district?.toLowerCase().includes("dhaka");
    const base = isDhaka ? 130 : 180;
    const weight = Math.max(1, query.weightKg || 1);
    const extraWeight = weight > 1 ? (weight - 1) * 25 : 0;
    const cod = query.codAmount || 0;
    const codFee = Math.round(cod * 0.01);
    const charge = base + extraWeight;

    return {
      courier: this.providerName,
      charge,
      codFee,
      total: charge + codFee,
      estimatedDays: isDhaka ? "24-48 Hours" : "72 Hours",
      available: true,
    };
  }

  async createBooking(params: CourierBookingParams): Promise<CourierBookingResult> {
    const cid = `RX-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      consignmentId: cid,
      trackingUrl: `https://redx.com.bd/track-order/${cid}`,
      courierStatus: "pickup-pending",
    };
  }

  async trackOrder(consignmentId: string): Promise<CourierTrackingResult> {
    return {
      consignmentId,
      status: "Pickup Pending",
      currentLocation: "RedX Hub",
      milestones: [
        {
          title: "Booked with RedX",
          timestamp: new Date(),
        },
      ],
    };
  }

  async cancelBooking(_cid: string): Promise<boolean> {
    return true;
  }
}
