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

async function checkPhone() {
  const parcels = await prisma.parcel.findMany({
    select: { id: true, trackingId: true, recipientPhone: true, recipientName: true, courier: true, status: true },
  });
  console.log("All Parcels in DB:", parcels);

  const customers = await prisma.customer.findMany();
  console.log("All Customers in DB:", customers);
}

checkPhone()
  .catch((e) => console.error("Error:", e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
