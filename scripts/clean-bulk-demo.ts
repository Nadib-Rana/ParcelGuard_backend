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

async function clearOldParcels() {
  const idsToDelete = ["PG-102845", "PG-102846", "PG-102849", "PG-102850", "PG-102851", "PG-102852"];
  console.log("Cleaning old demo parcels:", idsToDelete);
  
  const res = await prisma.parcel.deleteMany({
    where: { trackingId: { in: idsToDelete } },
  });
  console.log(`Deleted ${res.count} old demo parcels from database.`);
}

clearOldParcels()
  .catch((e) => console.error("Error:", e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
