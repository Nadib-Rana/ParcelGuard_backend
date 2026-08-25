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
export class SteadfastAdapter implements ICourierAdapter {
  providerName = CourierProvider.STEADFAST;

  calculateRate(query: CourierRateQuery): CourierRateResult {
    const isDhaka = query.district?.toLowerCase().includes("dhaka");
    const base = isDhaka ? 110 : 160;
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
    const cid = `SF-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      consignmentId: cid,
      trackingUrl: `https://steadfast.com.bd/track/${cid}`,
      courierStatus: "in_review",
      assignedRider: {
        name: "Md. Hasan Ali",
        phone: "01700-000000",
      },
    };
  }

  async trackOrder(consignmentId: string): Promise<CourierTrackingResult> {
    return {
      consignmentId,
      status: "In Transit",
      currentLocation: "Dhaka Central Hub",
      riderName: "Md. Hasan Ali",
      riderPhone: "01700-000000",
      milestones: [
        {
          title: "Order Placed & Dispatched to Steadfast",
          location: "Merchant Hub",
          timestamp: new Date(),
        },
      ],
    };
  }

  async cancelBooking(_cid: string): Promise<boolean> {
    return true;
  }
}
