import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppController } from "../src/app.controller";
import { AppService } from "../src/app.service";
import { HealthController } from "../src/modules/health/health.controller";
import { HealthService } from "../src/modules/health/health.service";
import { ConfigService } from "@nestjs/config";
import { ResponseStandardizationInterceptor } from "../src/common/interceptors/response-standardization.interceptor";
import { ContextService } from "../src/common/context/context.service";
import { Reflector } from "@nestjs/core";

describe("Starter Template E2E (Route Wiring)", () => {
  let app: INestApplication;

  const appServiceMock = {
    getAppInfo: jest.fn().mockReturnValue({
      name: "Nest Starter Template",
      version: "1.0.0",
      environment: "test",
      status: "running",
      documentationUrl: "/docs",
      healthCheckUrl: "/api/v1/health",
      timestamp: new Date().toISOString(),
    }),
  };

  const healthServiceMock = {
    check: jest.fn().mockResolvedValue({
      status: "ok",
      timestamp: new Date().toISOString(),
      responseTimeMs: 2,
      uptimeSeconds: 10,
      services: {
        database: "up",
        storage: "up",
      },
      memory: {
        heapUsedMb: 25,
        heapTotalMb: 50,
        rssMb: 60,
      },
    }),
  };

  const contextServiceMock = {
    getRequestId: jest.fn().mockReturnValue("test-req-id-123"),
  };

  const configServiceMock = {
    get: jest.fn((key: string, defaultValue: any) => defaultValue),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController, HealthController],
      providers: [
        { provide: AppService, useValue: appServiceMock },
        { provide: HealthService, useValue: healthServiceMock },
        { provide: ContextService, useValue: contextServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    const reflector = app.get(Reflector);
    const contextService = app.get(ContextService);

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(
      new ResponseStandardizationInterceptor(contextService, reflector),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET / (Root Application Info)", async () => {
    const res = await request(app.getHttpServer()).get("/");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.statusCode).toBe(200);
    expect(res.body.data.name).toBe("Nest Starter Template");
    expect(res.body.data.status).toBe("running");
  });

  it("GET /health (Health Check Probe)", async () => {
    const res = await request(app.getHttpServer()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
    expect(res.body.data.services.database).toBe("up");
  });
});
