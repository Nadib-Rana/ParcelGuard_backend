import { Module } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";
import { AdminMerchantsService } from "./services/admin-merchants.service";
import { AdminBlacklistService } from "./services/admin-blacklist.service";
import { AdminCouriersService } from "./services/admin-couriers.service";
import { AdminBroadcastService } from "./services/admin-broadcast.service";

@Module({
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminMerchantsService,
    AdminBlacklistService,
    AdminCouriersService,
    AdminBroadcastService,
  ],
  exports: [
    AdminService,
    AdminMerchantsService,
    AdminBlacklistService,
    AdminCouriersService,
    AdminBroadcastService,
  ],
})
export class AdminModule {}
