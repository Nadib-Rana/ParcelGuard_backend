import { Module } from "@nestjs/common";
import { CouriersService } from "./couriers.service";
import { CouriersController } from "./couriers.controller";
import {
  SteadfastAdapter,
  PathaoAdapter,
  RedXAdapter,
  PaperflyAdapter,
} from "./adapters/couriers.adapters";

@Module({
  controllers: [CouriersController],
  providers: [
    CouriersService,
    SteadfastAdapter,
    PathaoAdapter,
    RedXAdapter,
    PaperflyAdapter,
  ],
  exports: [
    CouriersService,
    SteadfastAdapter,
    PathaoAdapter,
    RedXAdapter,
    PaperflyAdapter,
  ],
})
export class CouriersModule {}
