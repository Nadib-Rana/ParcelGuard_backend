import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import {
  UpdateMerchantStatusDto,
  UpdateMerchantPlanDto,
  AddBlacklistDto,
  SendBroadcastDto,
  ToggleCourierHealthDto,
  UpdateMasterCourierDto,
  CreateCourierGatewayDto,
} from "./dto/admin.dto";
import { AdminMerchantsService } from "./services/admin-merchants.service";
import { AdminBlacklistService } from "./services/admin-blacklist.service";
import { AdminCouriersService } from "./services/admin-couriers.service";
import { AdminBroadcastService } from "./services/admin-broadcast.service";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantsService: AdminMerchantsService,
    private readonly blacklistService: AdminBlacklistService,
    private readonly couriersService: AdminCouriersService,
    private readonly broadcastService: AdminBroadcastService,
  ) {}

  async getDashboardTelemetry() {
    const [totalMerchants, activeMerchants, totalParcels, totalFraudChecks, allTransactions] = await Promise.all([
      this.prisma.merchantProfile.count(),
      this.prisma.merchantProfile.count({ where: { status: "Active" } }),
      this.prisma.parcel.count(),
      this.prisma.fraudCheckLog.count(),
      this.prisma.platformTransaction.findMany({ where: { status: "Completed" }, select: { amount: true } }),
    ]);

    const mrr = allTransactions.reduce((acc, curr) => acc + curr.amount, 0);
    return { mrr, totalMerchants, activeMerchants, totalParcels, totalFraudChecks, growthRate: "+18.4%" };
  }

  listMerchants() { return this.merchantsService.listMerchants(); }
  updateMerchantStatus(id: string, dto: UpdateMerchantStatusDto) { return this.merchantsService.updateMerchantStatus(id, dto); }
  updateMerchantPlan(id: string, dto: UpdateMerchantPlanDto) { return this.merchantsService.updateMerchantPlan(id, dto); }

  getCourierHealth() { return this.couriersService.getCourierHealth(); }
  addCourierGateway(dto: CreateCourierGatewayDto) { return this.couriersService.addCourierGateway(dto); }
  deleteCourierGateway(provider: string) { return this.couriersService.deleteCourierGateway(provider); }
  updateMasterCredentials(dto: UpdateMasterCourierDto) { return this.couriersService.updateMasterCredentials(dto); }
  testCourierConnection(provider: string) { return this.couriersService.testConnection(provider); }
  toggleCourierHealth(dto: ToggleCourierHealthDto) { return this.couriersService.toggleCourierHealth(dto); }

  getBlacklist() { return this.blacklistService.getBlacklist(); }
  addBlacklistEntry(dto: AddBlacklistDto) { return this.blacklistService.addBlacklistEntry(dto); }
  removeBlacklistEntry(id: string) { return this.blacklistService.removeBlacklistEntry(id); }

  async getTransactions() {
    const list = await this.prisma.platformTransaction.findMany({ orderBy: { createdAt: "desc" } });
    return list.map((t) => ({
      id: t.trxNumber,
      dbId: t.id,
      merchantName: t.merchantName || "Merchant",
      merchantId: t.merchantId,
      amount: t.amount,
      method: t.method,
      type: t.type,
      status: t.status,
      date: t.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      trxId: t.trxId,
    }));
  }

  getBroadcasts() { return this.broadcastService.getBroadcasts(); }
  sendBroadcast(dto: SendBroadcastDto) { return this.broadcastService.sendBroadcast(dto); }

  async toggleMaintenanceMode() {
    let config = await this.prisma.systemConfig.findFirst();
    if (!config) {
      config = await this.prisma.systemConfig.create({ data: { maintenanceMode: true } });
      return { maintenanceMode: true };
    }
    const updated = await this.prisma.systemConfig.update({ where: { id: config.id }, data: { maintenanceMode: !config.maintenanceMode } });
    return { maintenanceMode: updated.maintenanceMode };
  }
}
