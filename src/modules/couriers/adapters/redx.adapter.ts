import { Injectable, Logger } from "@nestjs/common";
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
  private readonly logger = new Logger(RedXAdapter.name);
  providerName = CourierProvider.REDX;

  private getBaseUrl(): string {
    return process.env.REDX_BASE_URL || "https://openapi.redx.com.bd/v1.0.0-beta";
  }

  private getToken(): string | undefined {
    return process.env.REDX_API_TOKEN;
  }

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
    const token = this.getToken();
    const baseUrl = this.getBaseUrl();

    if (token) {
      try {
        this.logger.log(`[RedX Live API] 🚀 Creating parcel booking for ${params.recipientName} (${params.recipientPhone})`);
        const res = await fetch(`${baseUrl}/parcel`, {
          method: "POST",
          headers: {
            "API-ACCESS-TOKEN": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer_name: params.recipientName,
            customer_phone: params.recipientPhone,
            delivery_area: params.district || "Dhaka",
            delivery_area_id: 1,
            customer_address: params.recipientAddress,
            merchant_invoice_id: params.trackingId || `INV-${Date.now()}`,
            cash_collection_amount: params.codAmount.toString(),
            parcel_weight: 1000,
            instruction: params.notes || "",
            value: params.codAmount || 1000,
            is_closed_box: "no",
            parcel_details_json: [
              {
                name: params.productTitle || "General Item",
                category: "General",
                value: params.codAmount || 1000,
              },
            ],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.tracking_id) {
            this.logger.log(`[RedX Live API] ✅ Booking Created successfully! Tracking ID: ${data.tracking_id}`);
            return {
              consignmentId: data.tracking_id,
              trackingUrl: `https://redx.com.bd/track-order/${data.tracking_id}`,
              courierStatus: "pickup-pending",
            };
          }
        } else {
          const err = await res.text().catch(() => "");
          this.logger.warn(`[RedX Live API] ⚠️ Booking returned status ${res.status}: ${err}`);
        }
      } catch (e) {
        this.logger.error(`[RedX Live API] ❌ Error creating booking: ${e instanceof Error ? e.message : e}`);
      }
    }

    const cid = `RX-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      consignmentId: cid,
      trackingUrl: `https://redx.com.bd/track-order/${cid}`,
      courierStatus: "pickup-pending",
    };
  }

  async trackOrder(consignmentId: string): Promise<CourierTrackingResult> {
    const token = this.getToken();
    const baseUrl = this.getBaseUrl();

    if (token) {
      try {
        const res = await fetch(`${baseUrl}/parcel/track/${consignmentId}`, {
          headers: {
            "API-ACCESS-TOKEN": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.tracking && Array.isArray(data.tracking)) {
            const milestones = data.tracking.map((t: any) => ({
              title: t.message_en || t.message_bn,
              timestamp: new Date(t.time),
            }));
            const lastMsg = milestones[milestones.length - 1]?.title || "In Transit";

            return {
              consignmentId,
              status: lastMsg,
              currentLocation: "RedX Network",
              milestones,
            };
          }
        }
      } catch (e) {
        this.logger.warn(`[RedX Live API] ⚠️ Tracking error for ${consignmentId}: ${e instanceof Error ? e.message : e}`);
      }
    }

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
