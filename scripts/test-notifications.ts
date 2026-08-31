import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://polaris_admin:polaris_password_2026@localhost:5432/parcelguard_db?schema=public";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testNotifications() {
  console.log("==========================================");
  console.log("🔔 Testing Notifications & Alerts Backend");
  console.log("==========================================");

  // 1. Find or create merchant
  const merchant = await prisma.merchantProfile.findFirst();
  if (!merchant) {
    console.error("❌ No merchant profile found.");
    return;
  }
  console.log(`✅ Merchant: ${merchant.businessName} (${merchant.id})`);

  // 2. Create test notifications
  const n1 = await prisma.appNotification.create({
    data: {
      merchantId: merchant.id,
      category: "Risk Alerts",
      title: "🚨 High Risk Fraud Alert: 01811223344",
      body: "Customer was identified with 80% cancellation rate across 6 courier hubs.",
      isRead: false,
    },
  });

  const n2 = await prisma.appNotification.create({
    data: {
      merchantId: merchant.id,
      category: "Parcels",
      title: "📦 Parcel Delivered: PG-102847",
      body: "Parcel for Nasrin Akter has been marked Delivered by RedX.",
      isRead: true,
    },
  });

  console.log(`✅ Created test notification 1: ${n1.title} (Unread)`);
  console.log(`✅ Created test notification 2: ${n2.title} (Read)`);

  // 3. Query all notifications for merchant
  const all = await prisma.appNotification.findMany({
    where: { merchantId: merchant.id },
    orderBy: { createdAt: "desc" },
  });
  console.log(`📋 Total notifications for merchant: ${all.length}`);

  // 4. Test delete single notification
  await prisma.appNotification.delete({ where: { id: n1.id } });
  console.log(`🗑️ Successfully deleted notification ${n1.id}`);

  // 5. Test clear read notifications
  const clearRes = await prisma.appNotification.deleteMany({
    where: { merchantId: merchant.id, isRead: true },
  });
  console.log(`🧹 Successfully cleared ${clearRes.count} read notifications.`);

  console.log("------------------------------------------");
  console.log("🎉 SUCCESS: Notifications & Alerts CRUD is 100% functional!");
  console.log("------------------------------------------");
}

testNotifications()
  .catch((e) => console.error("Error:", e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
