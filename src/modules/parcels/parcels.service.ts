import { Injectable } from "@nestjs/common";
import {
  CreateParcelDto,
  BulkCreateParcelsDto,
  FilterParcelsDto,
  UpdateParcelStatusDto,
} from "./dto/parcel.dto";
import { ParcelsCreationService } from "./services/parcels-creation.service";
import { ParcelsQueryService } from "./services/parcels-query.service";
import { ParcelsStatusService } from "./services/parcels-status.service";

@Injectable()
export class ParcelsService {
  constructor(
    private readonly creationService: ParcelsCreationService,
    private readonly queryService: ParcelsQueryService,
    private readonly statusService: ParcelsStatusService,
  ) {}

  async createParcel(userId: string, dto: CreateParcelDto) {
    return this.creationService.createParcel(userId, dto);
  }

  async bulkCreateParcels(userId: string, dto: BulkCreateParcelsDto) {
    return this.creationService.bulkCreateParcels(userId, dto);
  }

  async listParcels(userId: string, filter: FilterParcelsDto) {
    const merchantId = await this.creationService.getMerchantId(userId);
    return this.queryService.listParcels(merchantId, filter);
  }

  async getParcelById(userId: string, idOrTracking: string) {
    const merchantId = await this.creationService.getMerchantId(userId);
    return this.queryService.getParcelById(merchantId, idOrTracking);
  }

  async trackParcelPublic(trackingId: string) {
    return this.queryService.trackParcelPublic(trackingId);
  }

  async updateParcelStatus(userId: string, id: string, dto: UpdateParcelStatusDto) {
    const merchantId = await this.creationService.getMerchantId(userId);
    return this.statusService.updateParcelStatus(merchantId, id, dto);
  }
}
