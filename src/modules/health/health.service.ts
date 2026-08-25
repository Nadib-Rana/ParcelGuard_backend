import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { StorageService } from "../storage/storage.service";

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async check() {
    const startTime = Date.now();
    let dbStatus = "up";
    let storageStatus = "up";

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = "down";
    }

    if (!this.storageService.isConfigured()) {
      storageStatus = "not_configured";
    }

    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    return {
      status: dbStatus === "up" ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startTime,
      uptimeSeconds: Math.floor(uptime),
      services: {
        database: dbStatus,
        storage: storageStatus,
      },
      memory: {
        heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMb: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
        rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
      },
    };
  }
}
