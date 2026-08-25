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
export class PaperflyAdapter implements ICourierAdapter {
  providerName = CourierProvider.PAPERFLY;

  calculateRate(query: CourierRateQuery): CourierRateResult {
    const isDhaka = query.district?.toLowerCase().includes("dhaka");
    const base = isDhaka ? 115 : 165;
    const weight = Math.max(1, query.weightKg || 1);
    const extraWeight = weight > 1 ? (weight - 1) * 20 : 0;
    const cod = query.codAmount || 0;
    const codFee = Math.round(cod * 0.01);
    const charge = base + extraWeight;

    return {
      courier: this.providerName,
      charge,
      codFee,
      total: charge + codFee,
      estimatedDays: isDhaka ? "24-48 Hours" : "48-72 Hours",
      available: true,
    };
  }

  async createBooking(params: CourierBookingParams): Promise<CourierBookingResult> {
    const cid = `PF-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      consignmentId: cid,
      trackingUrl: `https://paperfly.com.bd/tracking?id=${cid}`,
      courierStatus: "Order Placed",
    };
  }

  async trackOrder(consignmentId: string): Promise<CourierTrackingResult> {
    return {
      consignmentId,
      status: "In Transit",
      milestones: [
        {
          title: "Paperfly Wings Dispatched",
          timestamp: new Date(),
        },
      ],
    };
  }

  async cancelBooking(_cid: string): Promise<boolean> {
    return true;
  }
}
