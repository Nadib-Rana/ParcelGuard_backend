import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { json, urlencoded } from "express";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>("app.port", 3000);
  const apiPrefix = configService.get<string>("app.apiPrefix", "api/v1");
  const appName = configService.get<string>("app.name", "Nest Starter Template");
  const isProd = configService.get<string>("app.nodeEnv") === "production";

  // 1. Security Headers via Helmet
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: isProd ? undefined : false,
    }),
  );

  // 2. Body Parser Limit
  app.use(json({ limit: "50mb" }));
  app.use(urlencoded({ extended: true, limit: "50mb" }));

  // 3. CORS Setup
  const corsOrigins = configService.get<string | string[]>("app.corsOrigins", "*");
  app.enableCors({
    origin: corsOrigins === "*" ? true : corsOrigins,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-request-id",
      "ngrok-skip-browser-warning",
    ],
  });

  // 4. Global API Prefix
  app.setGlobalPrefix(apiPrefix, {
    exclude: ["/", "docs", "docs-json"],
  });

  // 5. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const formatErrors = (errs: typeof errors) => {
          return errs.map((err) => {
            if (err.constraints) {
              return {
                field: err.property,
                errors: Object.values(err.constraints),
              };
            }
            if (err.children && err.children.length > 0) {
              return {
                field: err.property,
                children: formatErrors(err.children),
              };
            }
            return {
              field: err.property,
              errors: [`Validation failed for ${err.property}`],
            };
          });
        };

        return new BadRequestException({
          statusCode: 400,
          message: "Request validation failed",
          errorCode: "VALIDATION_FAILED",
          errors: formatErrors(errors),
        });
      },
    }),
  );

  // 6. Swagger OpenAPI Setup
  const swaggerEnabled = configService.get<boolean>("swagger.enabled", true);
  if (swaggerEnabled) {
    const swaggerPath = configService.get<string>("swagger.path", "docs");
    const swaggerTitle = configService.get<string>("swagger.title", appName);
    const swaggerDescription = configService.get<string>(
      "swagger.description",
      "Production-ready NestJS RESTful API Starter Template",
    );
    const swaggerVersion = configService.get<string>("swagger.version", "1.0.0");

    const swaggerConfig = new DocumentBuilder()
      .setTitle(swaggerTitle)
      .setDescription(
        `${swaggerDescription}\n\n` +
          `### Features Included:\n` +
          `- **JWT Authentication & Refresh Tokens** with rotation\n` +
          `- **Role-Based Access Control (RBAC)** (\`SUPER_ADMIN\`, \`ADMIN\`, \`USER\`, \`MODERATOR\`)\n` +
          `- **Prisma ORM & PostgreSQL** persistence\n` +
          `- **Object Storage Integration** (MinIO / S3)\n` +
          `- **Email Dispatcher** with Handlebars templates\n` +
          `- **Standardized Response Envelope** & Custom Exception Filters\n` +
          `- **Health & Readiness Probes**\n`,
      )
      .setVersion(swaggerVersion)
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          name: "Authorization",
          description: "Enter your JWT Bearer token",
          in: "header",
        },
        "bearer",
      )
      .addTag("Authentication", "User registration, login, refresh token, OTP, and password reset")
      .addTag("Users", "User profile and account administration")
      .addTag("Posts", "Reference CRUD module with search, tags, pagination, and RBAC")
      .addTag("Storage", "MinIO/S3 object storage, presigned upload/download URLs")
      .addTag("Health", "System health and service connectivity probes")
      .addTag("General", "Core application metadata")
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: "list",
        filter: true,
      },
    });

    logger.log(`📚 Swagger documentation available at: http://localhost:${port}/${swaggerPath}`);
  }

  // 7. Enable Graceful Shutdown Hooks
  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(`🚀 ${appName} server running at: http://localhost:${port}/${apiPrefix}`);
}

void bootstrap();
