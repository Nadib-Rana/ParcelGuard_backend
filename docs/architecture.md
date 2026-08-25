# Architecture & System Design

This document details the software architecture, design principles, and directory structure of the **NestJS Starter Template**.

---

## 1. Architectural Overview

The application follows a **Modular Monolith** architecture with clear separation of concerns, strict dependency boundaries, and reusable shared infrastructure.

```
Client (Web / Mobile / Third-Party)
  │
  ▼
[ Global Middleware ] (Request ID Correlation, Body Parser, Helmet)
  │
  ▼
[ Global Interceptors & Filters ] (Logging, Timing, Error Standardization)
  │
  ▼
[ Route Guards ] (JWT Authentication, Roles / RBAC, Rate Limiter)
  │
  ▼
[ Controllers ] (HTTP Layer, Request Validation via DTOs, Swagger Docs)
  │
  ▼
[ Services ] (Business Logic Layer)
  │
  ├──► [ Prisma ORM ] ──► [ PostgreSQL ]
  ├──► [ Storage Service ] ──► [ MinIO / AWS S3 ]
  └──► [ Mailer Service ] ──► [ SMTP / Mailpit ]
```

---

## 2. Directory Structure

```
src/
├── app.controller.ts        # Root application status endpoint
├── app.module.ts            # Root application module aggregating core & feature modules
├── app.service.ts           # Root application metadata provider
├── main.ts                  # Application bootstrap entry point
│
├── common/                  # Shared framework infrastructure
│   ├── context/             # AsyncLocalStorage request context (Request ID tracking)
│   ├── decorators/          # Custom decorators (@CurrentUser, @Public, @Roles, @ResponseMessage)
│   ├── dto/                 # Generic DTOs (ApiResponse, ApiErrorResponse, PaginationQuery)
│   ├── enums/               # Shared Enums (Role, UserStatus, OtpType)
│   ├── exceptions/          # Base and specialized exception classes
│   ├── filters/             # Global error filters (AllExceptionsFilter, PrismaClientExceptionFilter)
│   ├── guards/              # Route guards (JwtAuthGuard, RolesGuard)
│   ├── interceptors/        # Interceptors (ResponseStandardization, Logging, Timeout)
│   ├── middleware/          # HTTP Middlewares (RequestIdMiddleware, LoggerMiddleware)
│   ├── pipes/               # Custom validation and transformation pipes
│   └── utils/               # Helper utilities (HashUtil, OtpUtil, PaginationUtil)
│
├── config/                  # Type-safe configuration loaders
│   ├── app.config.ts        # Server port, env, prefix, CORS
│   ├── database.config.ts   # Database connection strings
│   ├── jwt.config.ts        # JWT secrets, token expiry, salt rounds
│   ├── mail.config.ts       # SMTP host, port, credentials
│   ├── storage.config.ts    # MinIO / AWS S3 storage configuration
│   ├── swagger.config.ts    # OpenAPI documentation metadata
│   └── throttler.config.ts  # Rate limiting parameters
│
├── database/                # Database integration layer
│   ├── prisma.service.ts    # Prisma client lifecycle and connection logging
│   └── prisma.module.ts     # Global database module
│
├── modules/                 # Modular domain features
│   ├── auth/                # Authentication & session lifecycle
│   │   ├── dto/             # Login, Register, OTP, Password Reset DTOs
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   └── jwt.strategy.ts
│   │
│   ├── users/               # User management & profile administration
│   │   ├── dto/             # Create, Update, Query DTOs
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   │
│   ├── mail/                # Email notification service
│   │   ├── mail.service.ts
│   │   └── mail.module.ts
│   │
│   ├── storage/             # Object storage (MinIO / S3) service
│   │   ├── dto/             # Presigned upload/download DTOs
│   │   ├── storage.controller.ts
│   │   ├── storage.service.ts
│   │   └── storage.module.ts
│   │
│   ├── health/              # Service health & readiness probes
│   │   ├── health.controller.ts
│   │   ├── health.service.ts
│   │   └── health.module.ts
│   │
│   └── posts/               # Reference CRUD module (Posts / Items)
│       ├── dto/             # Create, Update, Query DTOs
│       ├── posts.controller.ts
│       ├── posts.service.ts
│       └── posts.module.ts
│
└── templates/               # Handlebars email templates (welcome, otp, reset)
```

---

## 3. Standard API Response Contract

Every successful response is automatically wrapped into the following standardized JSON format:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "path": "/api/v1/posts",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-08-25T10:00:00.000Z",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

And every error response returns a consistent schema:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Request validation failed",
  "errorCode": "VALIDATION_FAILED",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-08-25T10:00:00.000Z",
  "path": "/api/v1/auth/register",
  "errors": [
    {
      "field": "email",
      "errors": ["Please enter a valid email address"]
    }
  ]
}
```
