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
export class PathaoAdapter implements ICourierAdapter {
  providerName = CourierProvider.PATHAO;

  calculateRate(query: CourierRateQuery): CourierRateResult {
    const isDhaka = query.district?.toLowerCase().includes("dhaka");
    const base = isDhaka ? 120 : 170;
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
      estimatedDays: isDhaka ? "Same Day / 24 Hours" : "48 Hours",
      available: true,
    };
  }

  async createBooking(params: CourierBookingParams): Promise<CourierBookingResult> {
    const cid = `PT-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      consignmentId: cid,
      trackingUrl: `https://merchant.pathao.com/tracking?consignment_id=${cid}`,
      courierStatus: "Pickup_Requested",
      assignedRider: {
        name: "Tanvir Rahman",
        phone: "01800-111222",
      },
    };
  }

  async trackOrder(consignmentId: string): Promise<CourierTrackingResult> {
    return {
      consignmentId,
      status: "In Transit",
      currentLocation: "Pathao Sorting Center, Tejgaon",
      riderName: "Tanvir Rahman",
      riderPhone: "01800-111222",
      milestones: [
        {
          title: "Pickup Requested via Pathao API",
          location: "Tejgaon Hub",
          timestamp: new Date(),
        },
      ],
    };
  }

  async cancelBooking(_cid: string): Promise<boolean> {
    return true;
  }
}
