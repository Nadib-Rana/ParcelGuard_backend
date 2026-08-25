import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import {
  SteadfastAdapter,
  PathaoAdapter,
  RedXAdapter,
  PaperflyAdapter,
} from "./adapters/couriers.adapters";
import { CourierRatesQueryDto, ConnectCourierDto } from "./dto/courier.dto";
import { ICourierAdapter } from "./interfaces/courier-adapter.interface";
import { CourierProvider } from "../../common/enums";
import { CourierSyncService } from "./services/courier-sync.service";

@Injectable()
export class CouriersService {
  private readonly adapters: Map<string, ICourierAdapter> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly steadfast: SteadfastAdapter,
    private readonly pathao: PathaoAdapter,
    private readonly redx: RedXAdapter,
    private readonly paperfly: PaperflyAdapter,
    private readonly syncService: CourierSyncService,
  ) {
    this.adapters.set(CourierProvider.STEADFAST, this.steadfast);
    this.adapters.set(CourierProvider.PATHAO, this.pathao);
    this.adapters.set(CourierProvider.REDX, this.redx);
    this.adapters.set(CourierProvider.PAPERFLY, this.paperfly);
  }

  getAdapter(provider: string): ICourierAdapter {
    return this.adapters.get(provider) || this.steadfast;
  }

  calculateLiveRates(query: CourierRatesQueryDto) {
    const results = [];
    for (const [, adapter] of this.adapters) {
      results.push(
        adapter.calculateRate({
          district: query.district,
          weightKg: query.weightKg || 1,
          codAmount: query.codAmount || 0,
        }),
      );
    }
    return results.sort((a, b) => a.total - b.total);
  }

  async getMerchantCouriers(userId: string) {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { userId },
      include: { courierAccounts: true },
    });
    if (!merchant) throw new NotFoundException("Merchant not found");

    const defaultCouriers = [
      { name: "Steadfast Courier", provider: CourierProvider.STEADFAST, logo: "SC", color: "bg-emerald-600" },
      { name: "Pathao Courier", provider: CourierProvider.PATHAO, logo: "PC", color: "bg-indigo-600" },
      { name: "RedX", provider: CourierProvider.REDX, logo: "RX", color: "bg-red-600" },
      { name: "Paperfly", provider: CourierProvider.PAPERFLY, logo: "PF", color: "bg-amber-600" },
    ];

    return defaultCouriers.map(d => {
      const existing = merchant.courierAccounts.find(a => a.provider === d.provider);
      return {
        name: d.name,
        provider: d.provider,
        logo: d.logo,
        color: d.color,
        connected: existing ? existing.isConnected : false,
        balance: existing ? existing.currentBalance : 0,
        apiKey: existing?.apiKey || "",
        webhookEnabled: existing ? existing.webhookEnabled : false,
        sync: existing?.lastSyncedAt ? "Just now" : "--",
      };
    });
  }

  async connectCourier(userId: string, dto: ConnectCourierDto) {
    const merchant = await this.prisma.merchantProfile.findUnique({ where: { userId } });
    if (!merchant) throw new NotFoundException("Merchant not found");

    const account = await this.prisma.courierAccount.upsert({
      where: { merchantId_provider: { merchantId: merchant.id, provider: dto.provider } },
      update: { apiKey: dto.apiKey, secretKey: dto.secretKey, merchantCourierId: dto.merchantCourierId, isConnected: true, lastSyncedAt: new Date() },
      create: { merchantId: merchant.id, provider: dto.provider, apiKey: dto.apiKey, secretKey: dto.secretKey, merchantCourierId: dto.merchantCourierId, isConnected: true, lastSyncedAt: new Date() },
    });

    // Auto-sync courier on connection
    void this.syncService.syncMerchantCourier(merchant.id, dto.provider as CourierProvider, dto.apiKey, dto.secretKey);
    return account;
  }

  async syncCourier(userId: string, provider: string) {
    const merchant = await this.prisma.merchantProfile.findUnique({ where: { userId } });
    if (!merchant) throw new NotFoundException("Merchant not found");

    const account = await this.prisma.courierAccount.findUnique({
      where: { merchantId_provider: { merchantId: merchant.id, provider } },
    });
    if (!account) throw new NotFoundException("Courier account not found");

    return this.syncService.syncMerchantCourier(merchant.id, provider as CourierProvider, account.apiKey || undefined, account.secretKey || undefined);
  }

  async toggleCourier(userId: string, provider: string) {
    const merchant = await this.prisma.merchantProfile.findUnique({ where: { userId } });
    if (!merchant) throw new NotFoundException("Merchant not found");

    const existing = await this.prisma.courierAccount.findUnique({
      where: { merchantId_provider: { merchantId: merchant.id, provider } },
    });

    if (!existing) {
      return this.prisma.courierAccount.create({
        data: { merchantId: merchant.id, provider, isConnected: true, lastSyncedAt: new Date() },
      });
    }

    return this.prisma.courierAccount.update({
      where: { id: existing.id },
      data: { isConnected: !existing.isConnected },
    });
  }
}
