import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import {
  Role,
  UserStatus,
  MerchantStatus,
  PlanTier,
  CourierProvider,
  RiskLevel,
  ParcelStatus,
  SettlementStatus,
  PaymentMethod,
  TransactionType,
  TransactionStatus,
  CourierHealthStatus,
  BlacklistStatus,
  BroadcastType,
  BroadcastTarget,
  NotificationCategory,
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
  const superAdmin = await prisma.user.upsert({
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
  console.log(`Seeded Super Admin: ${superAdmin.email}`);

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
  console.log(`Seeded Demo Merchant Profile: ${merchantProfile.businessName}`);

  // 3. Seed Courier Accounts
  const couriers = [
    { provider: CourierProvider.STEADFAST, isConnected: true, apiKey: "sf_live_key_99812", secretKey: "sf_sec_01", currentBalance: 24500 },
    { provider: CourierProvider.PATHAO, isConnected: true, apiKey: "pt_client_88120", secretKey: "pt_sec_02", currentBalance: 18200 },
    { provider: CourierProvider.REDX, isConnected: true, apiKey: "rx_api_77102", secretKey: "rx_sec_03", currentBalance: 5800 },
    { provider: CourierProvider.PAPERFLY, isConnected: false, currentBalance: 0 },
  ];

  for (const c of couriers) {
    await prisma.courierAccount.upsert({
      where: { merchantId_provider: { merchantId: merchantProfile.id, provider: c.provider } },
      update: {},
      create: { merchantId: merchantProfile.id, ...c },
    });
  }
  console.log(`Seeded Courier Accounts`);

  // 4. Seed Customers
  const customers = [
    { phone: "01711223344", name: "Anisur Rahman", ordersCount: 8, deliveredCount: 8, returnedCount: 0, cancelledCount: 0, successRate: "100%", riskLevel: RiskLevel.SAFE, isWatchlist: false },
    { phone: "01822334455", name: "Tanvir Ahmed", ordersCount: 14, deliveredCount: 12, returnedCount: 2, cancelledCount: 0, successRate: "85.7%", riskLevel: RiskLevel.SAFE, isWatchlist: false },
    { phone: "01933445566", name: "Karim Hasan", ordersCount: 8, deliveredCount: 3, returnedCount: 4, cancelledCount: 1, successRate: "37.5%", riskLevel: RiskLevel.HIGH_RISK, isWatchlist: true, notes: "Frequently cancels after parcel reaches destination hub." },
    { phone: "01644556677", name: "Nusrat Jahan", ordersCount: 5, deliveredCount: 3, returnedCount: 2, cancelledCount: 0, successRate: "60.0%", riskLevel: RiskLevel.MODERATE, isWatchlist: false },
    { phone: "01555667788", name: "Sakib Al Hasan", ordersCount: 19, deliveredCount: 19, returnedCount: 0, cancelledCount: 0, successRate: "100%", riskLevel: RiskLevel.SAFE, isWatchlist: false },
  ];

  for (const cust of customers) {
    await prisma.customer.upsert({
      where: { merchantId_phone: { merchantId: merchantProfile.id, phone: cust.phone } },
      update: {},
      create: { merchantId: merchantProfile.id, ...cust },
    });
  }
  console.log(`Seeded Customers`);

  // 5. Seed Parcels
  const parcels = [
    { trackingId: "PG-102845", consignmentId: "SF-881920", recipientName: "Anisur Rahman", recipientPhone: "01711223344", recipientAddress: "House 12, Road 27, Dhanmondi", district: "Dhaka", area: "Dhanmondi", productTitle: "Premium Cotton Panjabi (L)", category: "Clothing", weightKg: 0.8, courier: CourierProvider.STEADFAST, codAmount: 2450, deliveryCharge: 110, advancePaid: 0, riskLevel: RiskLevel.SAFE, riskScore: 12, status: ParcelStatus.DELIVERED, dateStr: "24 Aug 2026" },
    { trackingId: "PG-102846", consignmentId: "PT-771829", recipientName: "Karim Hasan", recipientPhone: "01933445566", recipientAddress: "Flat 4B, Green Tower, Zindabazar", district: "Sylhet", area: "Zindabazar", productTitle: "Leather Wallet + Belt Combo", category: "Accessories", weightKg: 0.5, courier: CourierProvider.PATHAO, codAmount: 1850, deliveryCharge: 170, advancePaid: 200, riskLevel: RiskLevel.HIGH_RISK, riskScore: 88, status: ParcelStatus.RETURNED, dateStr: "24 Aug 2026", notes: "Customer phone unreachable upon 3 delivery attempts." },
    { trackingId: "PG-102847", consignmentId: "RX-661928", recipientName: "Nusrat Jahan", recipientPhone: "01644556677", recipientAddress: "House 5, Road 9, Sector 4, Uttara", district: "Dhaka", area: "Uttara", productTitle: "Embroidered Silk Saree", category: "Women Wear", weightKg: 1.2, courier: CourierProvider.REDX, codAmount: 4200, deliveryCharge: 130, advancePaid: 500, riskLevel: RiskLevel.MODERATE, riskScore: 54, status: ParcelStatus.IN_TRANSIT, dateStr: "25 Aug 2026" },
    { trackingId: "PG-102848", consignmentId: "SF-551029", recipientName: "Sakib Al Hasan", recipientPhone: "01555667788", recipientAddress: "Alokar Mor, Shaheb Bazar", district: "Rajshahi", area: "Shaheb Bazar", productTitle: "Wireless Noise Cancelling Earbuds", category: "Electronics", weightKg: 0.4, courier: CourierProvider.STEADFAST, codAmount: 3100, deliveryCharge: 160, advancePaid: 0, riskLevel: RiskLevel.SAFE, riskScore: 10, status: ParcelStatus.OUT_FOR_DELIVERY, dateStr: "25 Aug 2026" },
    { trackingId: "PG-102849", consignmentId: "PT-441920", recipientName: "Tanvir Ahmed", recipientPhone: "01822334455", recipientAddress: "Khulshi R/A, Road 3", district: "Chittagong", area: "Khulshi", productTitle: "Running Sneakers Shoes (Size 42)", category: "Footwear", weightKg: 1.1, courier: CourierProvider.PATHAO, codAmount: 2950, deliveryCharge: 170, advancePaid: 0, riskLevel: RiskLevel.SAFE, riskScore: 18, status: ParcelStatus.PENDING_PICKUP, dateStr: "25 Aug 2026" },
  ];

  for (const p of parcels) {
    await prisma.parcel.upsert({
      where: { trackingId: p.trackingId },
      update: {},
      create: {
        merchantId: merchantProfile.id,
        ...p,
        timeline: {
          create: [
            { status: ParcelStatus.PENDING_PICKUP, title: "Order Placed & Booked", location: "Merchant Hub", notes: `Consignment ID: ${p.consignmentId}` },
            { status: p.status, title: `Status: ${p.status}`, location: "Central Logistics Hub", notes: "Updated by courier webhook" },
          ],
        },
      },
    });
  }
  console.log(`Seeded Parcels with Timelines`);

  // 6. Seed Global Blacklist
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
  console.log(`Seeded Global Blacklist`);

  // 7. Seed Settlements
  const settlements = [
    { settlementCode: "STL-2408-001", courierProvider: CourierProvider.STEADFAST, period: "Aug 1-15", expectedCod: 78500, receivedPayout: 78500, discrepancyAmount: 0, status: SettlementStatus.PAID, parcelsCount: 62 },
    { settlementCode: "STL-2408-002", courierProvider: CourierProvider.PATHAO, period: "Aug 1-15", expectedCod: 45200, receivedPayout: 42700, discrepancyAmount: -2500, status: SettlementStatus.DISPUTED, parcelsCount: 34, disputeReason: "COD deduction on 2 delivered parcels marked incorrectly as returned." },
    { settlementCode: "STL-2408-003", courierProvider: CourierProvider.REDX, period: "Aug 1-15", expectedCod: 32000, receivedPayout: 28400, discrepancyAmount: -3600, status: SettlementStatus.PARTIAL, parcelsCount: 22 },
    { settlementCode: "STL-2408-004", courierProvider: CourierProvider.STEADFAST, period: "Aug 16-24", expectedCod: 64000, receivedPayout: 0, discrepancyAmount: 0, status: SettlementStatus.PENDING, parcelsCount: 48 },
    { settlementCode: "STL-2408-005", courierProvider: CourierProvider.PATHAO, period: "Aug 16-24", expectedCod: 38500, receivedPayout: 0, discrepancyAmount: 0, status: SettlementStatus.PENDING, parcelsCount: 29 },
  ];

  for (const s of settlements) {
    await prisma.settlement.upsert({
      where: { settlementCode: s.settlementCode },
      update: {},
      create: {
        settlementCode: s.settlementCode,
        merchantId: merchantProfile.id,
        courierProvider: s.courierProvider,
        period: s.period,
        expectedCod: s.expectedCod,
        receivedPayout: s.receivedPayout,
        discrepancyAmount: s.discrepancyAmount,
        status: s.status,
        parcelsCount: s.parcelsCount,
        disputeReason: s.disputeReason,
      },
    });
  }
  console.log(`Seeded Settlements`);

  // 8. Seed Courier Health Metrics
  const healthMetrics = [
    { provider: CourierProvider.STEADFAST, uptimePercent: "99.94%", latencyMs: 142, errorRatePercent: "0.06%", status: CourierHealthStatus.OPERATIONAL, lastIncident: "No incidents in 30 days", dailyRequests: 148500 },
    { provider: CourierProvider.PATHAO, uptimePercent: "99.82%", latencyMs: 188, errorRatePercent: "0.18%", status: CourierHealthStatus.OPERATIONAL, lastIncident: "Minor webhook delay (12 Aug)", dailyRequests: 98200 },
    { provider: CourierProvider.REDX, uptimePercent: "98.90%", latencyMs: 310, errorRatePercent: "1.10%", status: CourierHealthStatus.DEGRADED, lastIncident: "High latency on booking API", dailyRequests: 41200 },
    { provider: CourierProvider.PAPERFLY, uptimePercent: "99.65%", latencyMs: 220, errorRatePercent: "0.35%", status: CourierHealthStatus.OPERATIONAL, lastIncident: "Resolved (22 Jul)", dailyRequests: 18400 },
    { provider: CourierProvider.ECOURIER, uptimePercent: "99.10%", latencyMs: 275, errorRatePercent: "0.90%", status: CourierHealthStatus.OPERATIONAL, lastIncident: "Maintenance window (18 Aug)", dailyRequests: 9600 },
  ];

  for (const h of healthMetrics) {
    await prisma.courierHealthMetric.upsert({
      where: { provider: h.provider },
      update: {},
      create: h,
    });
  }
  console.log(`Seeded Courier Health Metrics`);

  // 9. Seed Platform Transactions
  const transactions = [
    { trxNumber: "TRX-9981", merchantName: "Dhaka Gadget Hub", amount: 5999, method: PaymentMethod.BKASH, type: TransactionType.SUBSCRIPTION, status: TransactionStatus.COMPLETED, trxId: "BK99X8102A" },
    { trxNumber: "TRX-9982", merchantName: "Rahman Fashion House", amount: 2499, method: PaymentMethod.NAGAD, type: TransactionType.SUBSCRIPTION, status: TransactionStatus.COMPLETED, trxId: "NG44P9102L" },
    { trxNumber: "TRX-9983", merchantName: "Trendy Footwear BD", amount: 799, method: PaymentMethod.BKASH, type: TransactionType.CREDIT_TOPUP, status: TransactionStatus.COMPLETED, trxId: "BK77T1099Q" },
    { trxNumber: "TRX-9984", merchantName: "Pure Organics Sylhet", amount: 2499, method: PaymentMethod.CARD, type: TransactionType.SUBSCRIPTION, status: TransactionStatus.COMPLETED, trxId: "CR88M4401K" },
    { trxNumber: "TRX-9985", merchantName: "ElectroMart BD", amount: 999, method: PaymentMethod.BKASH, type: TransactionType.SUBSCRIPTION, status: TransactionStatus.COMPLETED, trxId: "BK11Z0033N" },
  ];

  for (const t of transactions) {
    await prisma.platformTransaction.upsert({
      where: { trxNumber: t.trxNumber },
      update: {},
      create: {
        trxNumber: t.trxNumber,
        merchantId: merchantProfile.id,
        merchantName: t.merchantName,
        amount: t.amount,
        method: t.method,
        type: t.type,
        status: t.status,
        trxId: t.trxId,
      },
    });
  }
  console.log(`Seeded Platform Transactions`);

  // 10. Seed System Broadcasts
  const broadcasts = [
    { broadcastCode: "BC-101", title: "RedX API Latency Notice", message: "RedX booking API is currently experiencing slight dispatch latency. Auto-routing will prioritize Steadfast/Pathao where applicable.", type: BroadcastType.WARNING, target: BroadcastTarget.ALL_MERCHANTS, deliveredCount: 5420 },
    { broadcastCode: "BC-102", title: "New 4x6 Thermal Label Standard Released", message: "Merchants can now print high-resolution 4x6 thermal barcode labels directly from the Bulk Labels menu.", type: BroadcastType.INFO, target: BroadcastTarget.ALL_MERCHANTS, deliveredCount: 5420 },
  ];

  for (const b of broadcasts) {
    await prisma.systemBroadcast.upsert({
      where: { broadcastCode: b.broadcastCode },
      update: {},
      create: b,
    });
  }
  console.log(`Seeded System Broadcasts`);

  // 11. Seed Notifications
  const notifications = [
    { numericId: 1, category: NotificationCategory.RISK_ALERTS, title: "High-risk customer detected", body: "Order PG-102846 customer Karim Hasan has a 37.5% delivery success rate.", isRead: false },
    { numericId: 2, category: NotificationCategory.PAYMENTS, title: "COD payment received", body: "BDT 12,500 has been added to your settlement from Steadfast.", isRead: false },
    { numericId: 3, category: NotificationCategory.PARCELS, title: "Parcel delayed", body: "Tracking ID PG-102847 has been in transit for over 36 hours.", isRead: false },
    { numericId: 4, category: NotificationCategory.RISK_ALERTS, title: "Watchlist customer ordered", body: "Customer Karim Hasan placed a new order via Facebook Messenger.", isRead: true },
    { numericId: 5, category: NotificationCategory.PAYMENTS, title: "Settlement processed", body: "Steadfast settlement STL-2408-001 of BDT 78,500 has been confirmed.", isRead: true },
    { numericId: 6, category: NotificationCategory.SYSTEM, title: "System maintenance scheduled", body: "ParcelGuard will undergo routine maintenance on Sep 1, 02:00-04:00 AM BDT.", isRead: true },
  ];

  for (const n of notifications) {
    await prisma.appNotification.create({
      data: {
        numericId: n.numericId,
        merchantId: merchantProfile.id,
        category: n.category,
        title: n.title,
        body: n.body,
        isRead: n.isRead,
      },
    });
  }
  console.log(`Seeded App Notifications`);

  // 12. Seed Recent Fraud Check Logs
  const fraudLogs = [
    {
      merchantId: merchantProfile.id,
      phone: "01933445566",
      name: "Karim Hasan",
      riskScore: 88,
      riskCategory: RiskLevel.HIGH_RISK,
      successRate: "37.5%",
      totalOrdersFound: 8,
      deliveredFound: 3,
      returnedFound: 4,
      cancelledFound: 1,
      factors: [
        "Low completion rate (<40%) in your merchant records",
        "Customer marked on your flagged watchlist",
        "Frequent delivery returns/refusals",
      ],
      recommendation: "Request advance delivery payment (BDT 150-200) before dispatch.",
    },
    {
      merchantId: merchantProfile.id,
      phone: "01711223344",
      name: "Anisur Rahman",
      riskScore: 12,
      riskCategory: RiskLevel.SAFE,
      successRate: "100%",
      totalOrdersFound: 8,
      deliveredFound: 8,
      returnedFound: 0,
      cancelledFound: 0,
      factors: ["Verified delivery record with your store", "Active mobile subscriber"],
      recommendation: "Safe to ship with standard Cash on Delivery.",
    },
    {
      merchantId: merchantProfile.id,
      phone: "01644556677",
      name: "Nusrat Jahan",
      riskScore: 54,
      riskCategory: RiskLevel.MODERATE,
      successRate: "60.0%",
      totalOrdersFound: 5,
      deliveredFound: 3,
      returnedFound: 2,
      cancelledFound: 0,
      factors: ["Moderate completion history (40%-70%)", "1-2 returns noted in recent history"],
      recommendation: "Call customer to re-confirm order before booking.",
    },
    {
      merchantId: merchantProfile.id,
      phone: "01799887766",
      name: "Rafiqul Islam",
      riskScore: 95,
      riskCategory: RiskLevel.HIGH_RISK,
      successRate: "0.0%",
      totalOrdersFound: 14,
      deliveredFound: 0,
      returnedFound: 14,
      cancelledFound: 0,
      factors: [
        "Nationwide Blacklist: Serial parcel rejector across multiple e-commerce merchants",
        "Reported by 8 other merchants",
        "Critical parcel refusal risk",
      ],
      recommendation: "HIGH RISK: Reject Cash on Delivery or request full payment in advance.",
    },
  ];

  for (const f of fraudLogs) {
    await prisma.fraudCheckLog.create({
      data: f,
    });
  }
  console.log(`Seeded Recent Fraud Check Logs`);

  console.log("ParcelGuard database seeding completed successfully!");
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
