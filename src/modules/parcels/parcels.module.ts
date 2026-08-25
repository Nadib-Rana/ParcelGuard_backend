import { Module } from "@nestjs/common";
import { ParcelsService } from "./parcels.service";
import { ParcelsController } from "./parcels.controller";
import { ParcelsCreationService } from "./services/parcels-creation.service";
import { ParcelsQueryService } from "./services/parcels-query.service";
import { ParcelsStatusService } from "./services/parcels-status.service";
import { FraudModule } from "../fraud/fraud.module";
import { CouriersModule } from "../couriers/couriers.module";

@Module({
  imports: [FraudModule, CouriersModule],
  controllers: [ParcelsController],
  providers: [
    ParcelsService,
    ParcelsCreationService,
    ParcelsQueryService,
    ParcelsStatusService,
  ],
  exports: [
    ParcelsService,
    ParcelsCreationService,
    ParcelsQueryService,
    ParcelsStatusService,
  ],
})
export class ParcelsModule {}
