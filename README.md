<p align="center">
  <a href="https://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<h1 align="center">NestJS Enterprise Starter Template</h1>

<p align="center">
  A production-ready, scalable, and modular <b>NestJS + Prisma + PostgreSQL</b> starter template featuring JWT Authentication, Refresh Token Rotation, RBAC, MinIO/S3 Storage, Handlebars Mailer, Swagger OpenAPI, Docker Compose, and automated testing.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11.x-E0234E?style=flat&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Prisma-7.x-2D3748?style=flat&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-17.x-336791?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Swagger-OpenAPI-85EA2D?style=flat&logo=swagger&logoColor=black" alt="Swagger" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" />
</p>

---

## 🚀 Key Features

- **🧱 Clean Modular Architecture**: Feature-based domain modules with strict separation of concerns.
- **🔐 Complete Authentication & Authorization**:
  - Email/Username + Password login with bcrypt hashing.
  - JWT Access Token + Secure Refresh Token rotation.
  - Email verification with 6-digit OTP codes.
  - Password reset with OTP via email.
  - Role-Based Access Control (RBAC) with `@Roles()` decorator and `RolesGuard` (`SUPER_ADMIN`, `ADMIN`, `USER`, `MODERATOR`).
- **🗄️ Database & Prisma ORM**:
  - PostgreSQL integration with Prisma 7 client.
  - Database migrations, seeds, soft-delete pattern, and automatic connection management.
- **📦 Object Storage (MinIO / AWS S3)**:
  - Presigned upload & download URLs.
  - Server-side multipart file uploads.
  - Bucket auto-creation and file deletion.
- **📧 Templated Email Dispatcher**:
  - Built-in `@nestjs-modules/mailer` with Handlebars HTML templates (`welcome.hbs`, `verify-email.hbs`, `reset-password.hbs`, `notification.hbs`).
  - Pre-configured for Mailpit (local dev), Gmail, or production SMTP services (SendGrid, SES, Resend).
- **🛡️ Enterprise Security & Robustness**:
  - HTTP security headers with `helmet`.
  - Rate limiting with `@nestjs/throttler`.
  - Global `ValidationPipe` with class-validator.
  - Standardized JSON responses (`ApiResponseDto`) & global exception filters (`AllExceptionsFilter`, `PrismaClientExceptionFilter`).
  - Request ID tracing across incoming/outgoing calls (`AsyncLocalStorage`).
- **📚 Interactive Swagger OpenAPI Docs**:
  - Pre-configured at `/docs` with Bearer Authentication support and interactive schema testing.
- **🩺 Health & Readiness Probes**:
  - `/api/v1/health` checking database connectivity, storage status, and system memory.
- **🐳 Docker & DevOps**:
  - Ready-to-use `docker-compose.yml` (PostgreSQL, MinIO, Mailpit).
  - Multi-stage production `Dockerfile` with non-root security.

---

## 📁 Project Structure

```
src/
├── app.controller.ts            # Root application status endpoint
├── app.module.ts                # Application root module
├── app.service.ts               # Application metadata service
├── main.ts                      # Application bootstrap & Swagger initialization
│
├── common/                      # Reusable framework components
│   ├── context/                 # AsyncLocalStorage Request ID correlation
│   ├── decorators/              # @CurrentUser, @Public, @Roles, @ResponseMessage
│   ├── dto/                     # ApiResponse, ApiErrorResponse, PaginationQuery DTOs
│   ├── enums/                   # Role, UserStatus, OtpType enums
│   ├── filters/                 # AllExceptionsFilter, PrismaClientExceptionFilter
│   ├── guards/                  # JwtAuthGuard, RolesGuard
│   ├── interceptors/            # ResponseStandardization, Logging, Timeout
│   ├── middleware/              # RequestIdMiddleware
│   └── utils/                   # HashUtil, OtpUtil, PaginationUtil
│
├── config/                      # Type-safe configurations (App, DB, JWT, Mail, Storage, Swagger)
├── database/                    # Prisma service & module
├── modules/
│   ├── auth/                    # Register, Login, Refresh, OTP, Reset Password
│   ├── users/                   # User CRUD, Profiles, Status management (Admin RBAC)
│   ├── mail/                    # Email dispatch with Handlebars templates
│   ├── storage/                 # MinIO/S3 object storage & presigned URLs
│   ├── health/                  # Health & readiness probes
│   └── posts/                   # Reference CRUD module with pagination & RBAC
│
└── templates/                   # Handlebars email templates (welcome, otp, reset)
```

---

## ⚡ Quick Start

### 1. Clone & Install Dependencies

```bash
git clone <repository-url> my-nest-project
cd my-nest-project
npm install
```

### 2. Configure Environment Variables

Copy the `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 3. Start Database & Services via Docker Compose

```bash
npm run docker:up
```

This will start:
- **PostgreSQL**: `localhost:5432`
- **MinIO Object Storage**: S3 API `localhost:9000` | Console UI `http://localhost:9001` (`minioadmin` / `minioadmin`)
- **Mailpit (Local Email Testing)**: SMTP `localhost:1025` | Web UI `http://localhost:8025`

### 4. Run Migrations & Seed Database

```bash
npm run db:push
npm run db:seed
```

Default seeded accounts:
| Role | Email | Password |
|---|---|---|
| **Super Admin** | `superadmin@example.com` | `admin12345` |
| **Admin** | `admin@example.com` | `admin12345` |
| **User** | `user@example.com` | `user12345` |

### 5. Start Development Server

```bash
npm run start:dev
```

- API Base URL: `http://localhost:3000/api/v1`
- Swagger Documentation: `http://localhost:3000/docs`
- Mailpit Web Inspector: `http://localhost:8025`

---

## 🛠️ Available Scripts

| Command | Description |
|---|---|
| `npm run start:dev` | Start application in development watch mode |
| `npm run build` | Compile TypeScript to `dist/` bundle |
| `npm run start:prod` | Run compiled production bundle |
| `npm run test` | Run Jest unit tests |
| `npm run test:e2e` | Run end-to-end route wiring tests |
| `npm run test:cov` | Generate test coverage report |
| `npm run lint` | Run ESLint with automatic fixes |
| `npm run format` | Format codebase with Prettier |
| `npm run db:generate` | Generate Prisma Client from schema |
| `npm run db:migrate` | Run Prisma development migrations |
| `npm run db:push` | Push Prisma schema directly to DB |
| `npm run db:seed` | Seed database with initial accounts & data |
| `npm run db:studio` | Launch Prisma Studio GUI browser |
| `npm run docker:up` | Start background Docker services |
| `npm run docker:down` | Stop Docker services |

---

## 📖 API Documentation & Swagger

Once the app is running, visit **`http://localhost:3000/docs`** to explore all endpoints with interactive request payloads and authentication testing.

### Key Endpoint Groups

#### Authentication (`/api/v1/auth`)
- `POST /register`: Create new user account and dispatch verification OTP.
- `POST /login`: Authenticate and receive Access + Refresh tokens.
- `POST /refresh`: Rotate refresh token and get a new access token.
- `POST /verify-email`: Verify email with 6-digit OTP code.
- `POST /resend-otp`: Request a new email verification code.
- `POST /forgot-password`: Request password reset code via email.
- `POST /reset-password`: Set new password with OTP verification.
- `GET /me`: Retrieve authenticated user profile (Bearer token required).
- `POST /change-password`: Change password for authenticated session.
- `POST /logout`: Revoke active refresh token.

#### Users (`/api/v1/users`)
- `GET /`: List paginated users with role/status filters and search (Admin only).
- `GET /:id`: Get user details (Admin only).
- `POST /`: Create user account (Admin only).
- `PATCH /:id`: Update user role/status (Admin only).
- `DELETE /:id`: Soft delete user account (Super Admin only).
- `PATCH /profile`: Update current user's profile information.

#### Object Storage (`/api/v1/storage`)
- `POST /presign-upload`: Generate client-side direct S3 upload URL.
- `POST /presign-download`: Generate temporary access URL for stored objects.
- `POST /upload`: Multipart file upload directly through server.
- `POST /delete`: Delete object by key from bucket.

#### Health (`/api/v1/health`)
- `GET /`: Health check probe inspecting database, storage, and system resources.

---

## 📚 Guides & Documentation

- [Architecture & System Design](file:///docs/architecture.md)
- [How to Create a New Module](file:///docs/how-to-create-a-new-module.md)

---

## 📄 License

This starter template is open-source software licensed under the [MIT license](LICENSE).
