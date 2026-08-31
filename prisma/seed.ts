import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import {
  Role,
  UserStatus,
  MerchantStatus,
  PlanTier,
  RiskLevel,
  ParcelStatus,
  BlacklistStatus,
} from "../src/common/enums";
import * as bcrypt from "bcryptjs";

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://polaris_admin:polaris_password_2026@localhost:5432/parcelguard_db?schema=public";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding ParcelGuard database with demo records...");

  const adminPassword = await bcrypt.hash("Password123!", 10);
  const merchantPassword = await bcrypt.hash("Password123!", 10);

  // 1. Seed Super Admin
  await prisma.user.upsert({
    where: { email: "admin@parcelguard.com" },
    update: {},
    create: {
      email: "admin@parcelguard.com",
      username: "superadmin",
      password: adminPassword,
      firstName: "System",
      lastName: "Administrator",
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    },
  });

  // 2. Seed Demo Merchant User
  const demoMerchantUser = await prisma.user.upsert({
    where: { email: "demo@parcelguard.com" },
    update: {},
    create: {
      email: "demo@parcelguard.com",
      username: "demostore",
      password: merchantPassword,
      firstName: "Demo",
      lastName: "Merchant",
      phoneNumber: "01711002233",
      role: Role.MERCHANT_OWNER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    },
  });

  const merchantProfile = await prisma.merchantProfile.upsert({
    where: { userId: demoMerchantUser.id },
    update: {},
    create: {
      userId: demoMerchantUser.id,
      businessName: "Fashion Hub BD",
      ownerName: "Demo Merchant",
      businessType: "Apparel & Fashion",
      phone: "01711002233",
      email: "demo@parcelguard.com",
      businessAddress: "House 42, Road 11, Banani, Dhaka",
      district: "Dhaka",
      plan: PlanTier.GROWTH,
      status: MerchantStatus.ACTIVE,
      monthlyOrders: 342,
      totalParcels: 1280,
      fraudChecksUsed: 42,
      fraudChecksLimit: 2000,
      balance: 48500.0,
    },
  });

  // 3. Seed Global Blacklist
  const blacklistEntries = [
    { phone: "01799887766", customerName: "Rafiqul Islam", riskScore: 95, reportedByCount: 8, totalReturns: 14, reason: "Serial parcel rejector across multiple e-commerce merchants in Bogra.", status: BlacklistStatus.CONFIRMED_FRAUD, addedBy: "Super Admin" },
    { phone: "01811223344", customerName: "Monir Hossain", riskScore: 88, reportedByCount: 5, totalReturns: 9, reason: "Provides fake address in Gazipur, switches off phone when courier calls.", status: BlacklistStatus.CONFIRMED_FRAUD, addedBy: "Super Admin" },
    { phone: "01600112233", customerName: "Imran Khan", riskScore: 65, reportedByCount: 3, totalReturns: 7, reason: "Refuses payment at doorstep demanding free package opening without courier protocol.", status: BlacklistStatus.UNDER_REVIEW, addedBy: "Merchant Report" },
  ];

  for (const b of blacklistEntries) {
    await prisma.globalBlacklistEntry.upsert({
      where: { phone: b.phone },
      update: {},
      create: b,
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
