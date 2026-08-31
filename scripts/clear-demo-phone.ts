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

async function clearPhone() {
  const phone = "01567823568";
  console.log(`Deleting all records for ${phone}...`);
  
  const deletedParcels = await prisma.parcel.deleteMany({
    where: { recipientPhone: { in: [phone, `+88${phone}`, `88${phone}`, phone.replace(/^0/, "")] } },
  });
  console.log(`Deleted ${deletedParcels.count} parcels.`);

  const deletedChecks = await prisma.fraudCheckLog.deleteMany({
    where: { phone: { in: [phone, `+88${phone}`, `88${phone}`, phone.replace(/^0/, "")] } },
  });
  console.log(`Deleted ${deletedChecks.count} fraud check logs.`);

  const deletedCustomers = await prisma.customer.deleteMany({
    where: { phone: { in: [phone, `+88${phone}`, `88${phone}`, phone.replace(/^0/, "")] } },
  });
  console.log(`Deleted ${deletedCustomers.count} customers.`);

  console.log("Cleanup for 01567823568 completed successfully!");
}

clearPhone()
  .catch((e) => console.error("Error clearing:", e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
