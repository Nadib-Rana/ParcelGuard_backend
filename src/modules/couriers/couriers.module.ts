import { Module } from "@nestjs/common";
import { CouriersService } from "./couriers.service";
import { CouriersController } from "./couriers.controller";
import {
  SteadfastAdapter,
  PathaoAdapter,
  RedXAdapter,
  PaperflyAdapter,
} from "./adapters/couriers.adapters";
import { CourierSyncService } from "./services/courier-sync.service";

@Module({
  controllers: [CouriersController],
  providers: [
    CouriersService,
    SteadfastAdapter,
    PathaoAdapter,
    RedXAdapter,
    PaperflyAdapter,
    CourierSyncService,
  ],
  exports: [
    CouriersService,
    SteadfastAdapter,
    PathaoAdapter,
    RedXAdapter,
    PaperflyAdapter,
    CourierSyncService,
  ],
})
export class CouriersModule {}
