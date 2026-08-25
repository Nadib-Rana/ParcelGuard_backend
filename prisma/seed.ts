import { PrismaClient } from "@prisma/client";
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

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding ParcelGuard enterprise database...");

  const adminPassword = await bcrypt.hash("admin123", 10);
  const merchantPassword = await bcrypt.hash("merchant123", 10);

  // 1. Seed Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@parcelguard.com" },
    update: {},
    create: {
      email: "admin@parcelguard.com",
      username: "superadmin",
      password: adminPassword,
      firstName: "Super",
      lastName: "Admin",
      phoneNumber: "+880 1800-000000",
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    },
  });
  console.log(`✅ Super Admin created: ${superAdmin.email}`);

  // 2. Seed Demo Merchant User & Merchant Profile
  const merchantUser = await prisma.user.upsert({
    where: { email: "merchant@store.bd" },
    update: {},
    create: {
      email: "merchant@store.bd",
      username: "rahmanfashion",
      password: merchantPassword,
      firstName: "Rahman",
      lastName: "Fashion",
      phoneNumber: "+880 1711-234567",
      role: Role.MERCHANT_OWNER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    },
  });

  const merchantProfile = await prisma.merchantProfile.upsert({
    where: { userId: merchantUser.id },
    update: {},
    create: {
      userId: merchantUser.id,
      businessName: "Rahman Fashion House",
      ownerName: "Rahman Fashion",
      phone: "+880 1711-234567",
      email: "merchant@store.bd",
      businessType: "F-Commerce (Facebook)",
      businessAddress: "House 12, Road 4, Sector 3, Uttara, Dhaka",
      district: "Dhaka",
      apiKey: "pg_live_89f02bca481e39a03cd711e9a22f",
      webhookUrl: "https://rahmanstore.com/api/webhooks/parcelguard",
      webhookSecret: "whsec_live_99d12fae43",
      plan: PlanTier.GROWTH,
      status: MerchantStatus.ACTIVE,
      balance: 14850,
      monthlyOrders: 184,
      totalParcels: 328,
      fraudChecksUsed: 42,
      fraudChecksLimit: 2000,
      notifyParcelUpdates: true,
      notifyPaymentUpdates: true,
      notifyHighRiskAlerts: true,
      notifySms: false,
      notifyEmail: true,
    },
  });
  console.log(`✅ Merchant Profile created: ${merchantProfile.businessName}`);

  // 3. Seed Courier Accounts for Merchant
  const courierData = [
    { provider: CourierProvider.STEADFAST, apiKey: "sf_live_a89bc34e09f8", isConnected: true, currentBalance: 12500, webhookEnabled: true },
    { provider: CourierProvider.PATHAO, apiKey: "pt_live_99d12fae43", isConnected: true, currentBalance: 8320, webhookEnabled: true },
    { provider: CourierProvider.REDX, apiKey: "", isConnected: false, currentBalance: 0, webhookEnabled: false },
    { provider: CourierProvider.PAPERFLY, apiKey: "", isConnected: false, currentBalance: 0, webhookEnabled: false },
  ];

  for (const c of courierData) {
    await prisma.courierAccount.upsert({
      where: {
        merchantId_provider: {
          merchantId: merchantProfile.id,
          provider: c.provider,
        },
      },
      update: {},
      create: {
        merchantId: merchantProfile.id,
        provider: c.provider,
        apiKey: c.apiKey,
        isConnected: c.isConnected,
        currentBalance: c.currentBalance,
        webhookEnabled: c.webhookEnabled,
        lastSyncedAt: c.isConnected ? new Date() : null,
      },
    });
  }
  console.log(`✅ Seeded Courier Accounts`);

  // 4. Seed Customers
  const customerList = [
    { name: "Rahim Uddin", phone: "01711-234567", ordersCount: 24, deliveredCount: 22, returnedCount: 2, cancelledCount: 0, successRate: "91.7%", riskLevel: RiskLevel.SAFE, isWatchlist: false, notes: "Reliable customer, prompt recipient." },
    { name: "Karim Hasan", phone: "01812-345678", ordersCount: 24, deliveredCount: 9, returnedCount: 12, cancelledCount: 3, successRate: "37.5%", riskLevel: RiskLevel.HIGH_RISK, isWatchlist: true, notes: "Frequently cancels after parcel arrives at hub. Always ask for advance delivery fee." },
    { name: "Nasrin Akter", phone: "01913-456789", ordersCount: 11, deliveredCount: 10, returnedCount: 1, cancelledCount: 0, successRate: "90.9%", riskLevel: RiskLevel.SAFE, isWatchlist: false },
    { name: "Farhan Hossain", phone: "01614-567890", ordersCount: 8, deliveredCount: 5, returnedCount: 2, cancelledCount: 1, successRate: "62.5%", riskLevel: RiskLevel.MODERATE, isWatchlist: false, notes: "Slow to answer calls, delivery takes 2 attempts." },
    { name: "Sadia Islam", phone: "01515-678901", ordersCount: 15, deliveredCount: 14, returnedCount: 1, cancelledCount: 0, successRate: "93.3%", riskLevel: RiskLevel.SAFE, isWatchlist: false },
    { name: "Jahangir Alam", phone: "01716-789012", ordersCount: 18, deliveredCount: 6, returnedCount: 10, cancelledCount: 2, successRate: "33.3%", riskLevel: RiskLevel.HIGH_RISK, isWatchlist: true, notes: "Multiple fake order reports across multiple FB pages." },
  ];

  for (const cust of customerList) {
    await prisma.customer.upsert({
      where: {
        merchantId_phone: {
          merchantId: merchantProfile.id,
          phone: cust.phone,
        },
      },
      update: {},
      create: {
        merchantId: merchantProfile.id,
        phone: cust.phone,
        name: cust.name,
        ordersCount: cust.ordersCount,
        deliveredCount: cust.deliveredCount,
        returnedCount: cust.returnedCount,
        cancelledCount: cust.cancelledCount,
        successRate: cust.successRate,
        riskLevel: cust.riskLevel,
        isWatchlist: cust.isWatchlist,
        notes: cust.notes,
      },
    });
  }
  console.log(`✅ Seeded Customers`);

  // 5. Seed Parcels
  const parcels = [
    { trackingId: "PG-102845", recipientName: "Rahim Uddin", recipientPhone: "01711-234567", recipientAddress: "Road 5, Mirpur-10", district: "Dhaka", area: "Mirpur-10", productTitle: "Cotton Shirt", category: "Fashion", courier: CourierProvider.STEADFAST, codAmount: 1250, deliveryCharge: 110, advancePaid: 0, riskLevel: RiskLevel.SAFE, riskScore: 12, status: ParcelStatus.DELIVERED, dateStr: "24 Aug 2026", riderName: "Md. Hasan Ali", riderPhone: "01700-000000" },
    { trackingId: "PG-102846", recipientName: "Karim Hasan", recipientPhone: "01812-345678", recipientAddress: "Block C, Khilgaon", district: "Dhaka", area: "Khilgaon", productTitle: "Wireless Earbuds", category: "Electronics", courier: CourierProvider.PATHAO, codAmount: 2500, deliveryCharge: 120, advancePaid: 0, riskLevel: RiskLevel.HIGH_RISK, riskScore: 82, status: ParcelStatus.RETURNED, dateStr: "24 Aug 2026", notes: "Customer refused delivery" },
    { trackingId: "PG-102847", recipientName: "Nasrin Akter", recipientPhone: "01913-456789", recipientAddress: "Zindabazar, Sylhet Sadar", district: "Sylhet", area: "Sylhet Sadar", productTitle: "Silk Saree", category: "Fashion", courier: CourierProvider.REDX, codAmount: 850, deliveryCharge: 130, advancePaid: 200, riskLevel: RiskLevel.SAFE, riskScore: 15, status: ParcelStatus.IN_TRANSIT, dateStr: "23 Aug 2026" },
    { trackingId: "PG-102848", recipientName: "Farhan Hossain", recipientPhone: "01614-567890", recipientAddress: "Station Road, Bogura", district: "Bogura", area: "Bogura Sadar", productTitle: "Leather Wallet", category: "Accessories", courier: CourierProvider.STEADFAST, codAmount: 3200, deliveryCharge: 110, advancePaid: 0, riskLevel: RiskLevel.MODERATE, riskScore: 48, status: ParcelStatus.PENDING_PICKUP, dateStr: "23 Aug 2026" },
    { trackingId: "PG-102849", recipientName: "Sadia Islam", recipientPhone: "01515-678901", recipientAddress: "GEC Circle, Chattogram", district: "Chattogram", area: "GEC", productTitle: "Skincare Set", category: "Beauty", courier: CourierProvider.PATHAO, codAmount: 1800, deliveryCharge: 120, advancePaid: 0, riskLevel: RiskLevel.SAFE, riskScore: 10, status: ParcelStatus.OUT_FOR_DELIVERY, dateStr: "22 Aug 2026", riderName: "Tanvir Rahman", riderPhone: "01800-111222" },
    { trackingId: "PG-102850", recipientName: "Jahangir Alam", recipientPhone: "01716-789012", recipientAddress: "Rajshahi University Area", district: "Rajshahi", area: "Motihar", productTitle: "Smart Watch", category: "Electronics", courier: CourierProvider.REDX, codAmount: 4500, deliveryCharge: 130, advancePaid: 0, riskLevel: RiskLevel.HIGH_RISK, riskScore: 89, status: ParcelStatus.RETURNED, dateStr: "22 Aug 2026" },
    { trackingId: "PG-102851", recipientName: "Tania Begum", recipientPhone: "01817-890123", recipientAddress: "Uttara Sector 7, Dhaka", district: "Dhaka", area: "Uttara", productTitle: "Handbag", category: "Fashion", courier: CourierProvider.STEADFAST, codAmount: 960, deliveryCharge: 110, advancePaid: 0, riskLevel: RiskLevel.SAFE, riskScore: 8, status: ParcelStatus.DELIVERED, dateStr: "21 Aug 2026" },
    { trackingId: "PG-102852", recipientName: "Mostak Ahmed", recipientPhone: "01918-901234", recipientAddress: "Shaheb Bazar, Rajshahi", district: "Rajshahi", area: "Boalia", productTitle: "Denim Jeans", category: "Fashion", courier: CourierProvider.PATHAO, codAmount: 2100, deliveryCharge: 120, advancePaid: 0, riskLevel: RiskLevel.MODERATE, riskScore: 42, status: ParcelStatus.CANCELLED, dateStr: "21 Aug 2026" },
  ];

  for (const p of parcels) {
    const createdParcel = await prisma.parcel.upsert({
      where: { trackingId: p.trackingId },
      update: {},
      create: {
        trackingId: p.trackingId,
        merchantId: merchantProfile.id,
        recipientName: p.recipientName,
        recipientPhone: p.recipientPhone,
        recipientAddress: p.recipientAddress,
        district: p.district,
        area: p.area,
        productTitle: p.productTitle,
        category: p.category,
        courier: p.courier,
        codAmount: p.codAmount,
        deliveryCharge: p.deliveryCharge,
        advancePaid: p.advancePaid,
        riskLevel: p.riskLevel,
        riskScore: p.riskScore,
        status: p.status,
        dateStr: p.dateStr,
        riderName: p.riderName,
        riderPhone: p.riderPhone,
        notes: p.notes,
      },
    });

    await prisma.parcelTimeline.createMany({
      data: [
        {
          parcelId: createdParcel.id,
          status: ParcelStatus.PENDING_PICKUP,
          title: "Order Booked & Tracking Generated",
          location: "Merchant Hub, Uttara",
          notes: "Courier notified for pickup dispatch.",
          timestamp: new Date(Date.now() - 3600 * 1000 * 24),
        },
      ],
      skipDuplicates: true,
    });
  }
  console.log(`✅ Seeded Parcels & Timelines`);

  // 6. Seed Global Blacklist
  const blacklistEntries = [
    { phone: "01812345678", customerName: "Karim Hasan", riskScore: 94, reportedByCount: 14, totalReturns: 28, reason: "Consistent parcel refusal after reaching local hub across multiple apparel and gadget shops.", status: BlacklistStatus.CONFIRMED_FRAUD, addedBy: "System (Auto-flagged)" },
    { phone: "01716789012", customerName: "Jahangir Alam", riskScore: 89, reportedByCount: 9, totalReturns: 19, reason: "Places fake high-value COD orders with non-existent addresses in Rajshahi.", status: BlacklistStatus.CONFIRMED_FRAUD, addedBy: "Super Admin" },
    { phone: "01999887766", customerName: "Shakil Chowdhury", riskScore: 78, reportedByCount: 6, totalReturns: 11, reason: "Repeatedly cancels orders while delivery agent is in transit.", status: BlacklistStatus.SUSPICIOUS, addedBy: "Merchant Report" },
    { phone: "01600112233", customerName: "Imran Khan", riskScore: 65, reportedByCount: 3, totalReturns: 7, reason: "Refuses payment at doorstep demanding free package opening without courier protocol.", status: BlacklistStatus.UNDER_REVIEW, addedBy: "Merchant Report" },
  ];

  for (const b of blacklistEntries) {
    await prisma.globalBlacklistEntry.upsert({
      where: { phone: b.phone },
      update: {},
      create: b,
    });
  }
  console.log(`✅ Seeded Global Blacklist`);

  // 7. Seed Settlements
  const settlements = [
    { settlementCode: "STL-2408-001", courierProvider: CourierProvider.STEADFAST, period: "Aug 1–15", expectedCod: 78500, receivedPayout: 78500, discrepancyAmount: 0, status: SettlementStatus.PAID, parcelsCount: 62 },
    { settlementCode: "STL-2408-002", courierProvider: CourierProvider.PATHAO, period: "Aug 1–15", expectedCod: 45200, receivedPayout: 42700, discrepancyAmount: -2500, status: SettlementStatus.DISPUTED, parcelsCount: 34, disputeReason: "COD deduction of ৳2,500 on 2 delivered parcels marked incorrectly as returned." },
    { settlementCode: "STL-2408-003", courierProvider: CourierProvider.REDX, period: "Aug 1–15", expectedCod: 32000, receivedPayout: 28400, discrepancyAmount: -3600, status: SettlementStatus.PARTIAL, parcelsCount: 22 },
    { settlementCode: "STL-2408-004", courierProvider: CourierProvider.STEADFAST, period: "Aug 16–24", expectedCod: 64000, receivedPayout: 0, discrepancyAmount: 0, status: SettlementStatus.PENDING, parcelsCount: 48 },
    { settlementCode: "STL-2408-005", courierProvider: CourierProvider.PATHAO, period: "Aug 16–24", expectedCod: 38500, receivedPayout: 0, discrepancyAmount: 0, status: SettlementStatus.PENDING, parcelsCount: 29 },
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
  console.log(`✅ Seeded Settlements`);

  // 8. Seed Courier Health Metrics
  const healthMetrics = [
    { provider: CourierProvider.STEADFAST, uptimePercent: "99.94%", latencyMs: 142, errorRatePercent: "0.06%", status: CourierHealthStatus.OPERATIONAL, lastIncident: "No incidents in 30 days", dailyRequests: 148500 },
    { provider: CourierProvider.PATHAO, uptimePercent: "99.82%", latencyMs: 188, errorRatePercent: "0.18%", status: CourierHealthStatus.OPERATIONAL, lastIncident: "Minor webhook delay (12 Aug)", dailyRequests: 98200 },
    { provider: CourierProvider.REDX, uptimePercent: "98.90%", latencyMs: 310, errorRatePercent: "1.10%", status: CourierHealthStatus.DEGRADED, lastIncident: "High latency on booking API (Today 14:00)", dailyRequests: 41200 },
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
  console.log(`✅ Seeded Courier Health Metrics`);

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
  console.log(`✅ Seeded Platform Transactions`);

  // 10. Seed System Broadcasts
  const broadcasts = [
    { broadcastCode: "BC-101", title: "RedX API Latency Notice", message: "RedX booking API is currently experiencing slight dispatch latency. Our auto-routing will prioritize Steadfast/Pathao where applicable.", type: BroadcastType.WARNING, target: BroadcastTarget.ALL_MERCHANTS, deliveredCount: 5420 },
    { broadcastCode: "BC-102", title: "New 4x6 Thermal Label Standard Released", message: "Merchants can now print high-resolution 4x6 thermal barcode labels directly from the new Bulk Labels menu.", type: BroadcastType.INFO, target: BroadcastTarget.ALL_MERCHANTS, deliveredCount: 5420 },
  ];

  for (const b of broadcasts) {
    await prisma.systemBroadcast.upsert({
      where: { broadcastCode: b.broadcastCode },
      update: {},
      create: b,
    });
  }
  console.log(`✅ Seeded System Broadcasts`);

  // 11. Seed Notifications
  const notifications = [
    { numericId: 1, category: NotificationCategory.RISK_ALERTS, title: "High-risk customer detected", body: "Order PG-102846 customer Karim Hasan has a 37.5% delivery success rate.", isRead: false },
    { numericId: 2, category: NotificationCategory.PAYMENTS, title: "COD payment received", body: "৳12,500 has been added to your settlement from Steadfast.", isRead: false },
    { numericId: 3, category: NotificationCategory.PARCELS, title: "Parcel delayed", body: "Tracking ID PG-102847 has been in transit for over 36 hours.", isRead: false },
    { numericId: 4, category: NotificationCategory.RISK_ALERTS, title: "Watchlist customer ordered", body: "Customer Karim Hasan placed a new order via Facebook Messenger.", isRead: true },
    { numericId: 5, category: NotificationCategory.PAYMENTS, title: "Settlement processed", body: "Steadfast settlement STL-2408-001 of ৳78,500 has been confirmed.", isRead: true },
    { numericId: 6, category: NotificationCategory.SYSTEM, title: "System maintenance scheduled", body: "ParcelGuard will undergo routine maintenance on Sep 1, 02:00–04:00 AM BDT.", isRead: true },
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
  console.log(`✅ Seeded App Notifications`);

  console.log("🚀 ParcelGuard backend seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
