import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getAppInfo() {
    const appName = this.configService.get<string>("app.name", "Nest Starter Template");
    const environment = this.configService.get<string>("app.nodeEnv", "development");
    const apiPrefix = this.configService.get<string>("app.apiPrefix", "api/v1");
    const swaggerPath = this.configService.get<string>("swagger.path", "docs");

    return {
      name: appName,
      version: "1.0.0",
      environment,
      status: "running",
      documentationUrl: `/${swaggerPath}`,
      healthCheckUrl: `/${apiPrefix}/health`,
      timestamp: new Date().toISOString(),
    };
  }
}
