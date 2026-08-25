import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { ValidationPipe, BadRequestException } from "@nestjs/common";
import { AllExceptionsFilter } from "../src/common/filters/all-exceptions.filter";
import { PrismaClientExceptionFilter } from "../src/common/filters/prisma-client-exception.filter";
import { ContextService } from "../src/common/context/context.service";
import { ExpressAdapter } from "@nestjs/platform-express";
import express from "express";

const server = express();
let cachedApp: any;

async function bootstrap() {
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ extended: true, limit: "50mb" }));

    const allowedOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
      : true;

    app.enableCors({
      origin: allowedOrigins,
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-request-id",
        "ngrok-skip-browser-warning",
      ],
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    const httpAdapterHost = app.get(HttpAdapterHost);
    const contextService = app.get(ContextService);
    app.useGlobalFilters(
      new AllExceptionsFilter(httpAdapterHost, contextService),
      new PrismaClientExceptionFilter(contextService),
    );

    await app.init();
    cachedApp = app;
  }
  return cachedApp;
}

export default async function handler(req: any, res: any) {
  await bootstrap();
  server(req, res);
}
