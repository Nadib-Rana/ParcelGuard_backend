import { registerAs } from "@nestjs/config";

export default registerAs("swagger", () => ({
  enabled: process.env.SWAGGER_ENABLED !== "false",
  path: process.env.SWAGGER_PATH || "docs",
  title: process.env.SWAGGER_TITLE || "Nest Starter Template API",
  description:
    process.env.SWAGGER_DESCRIPTION ||
    "Enterprise-grade NestJS RESTful API Starter Template with Prisma, JWT Auth, RBAC, Storage, Mail, and Docker",
  version: process.env.SWAGGER_VERSION || "1.0.0",
}));
