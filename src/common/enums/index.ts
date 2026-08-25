export const Role = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  MERCHANT_OWNER: "MERCHANT_OWNER",
  MERCHANT_STAFF: "MERCHANT_STAFF",
  USER: "USER",
  MODERATOR: "MODERATOR",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const UserStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  SUSPENDED: "SUSPENDED",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const MerchantStatus = {
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  TRIAL: "Trial",
} as const;
export type MerchantStatus = (typeof MerchantStatus)[keyof typeof MerchantStatus];

export const PlanTier = {
  STARTER: "Starter",
  GROWTH: "Growth",
  ENTERPRISE: "Enterprise",
} as const;
export type PlanTier = (typeof PlanTier)[keyof typeof PlanTier];

export const OtpType = {
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  PASSWORD_RESET: "PASSWORD_RESET",
  TWO_FACTOR: "TWO_FACTOR",
} as const;
export type OtpType = (typeof OtpType)[keyof typeof OtpType];

export const CourierProvider = {
  STEADFAST: "Steadfast",
  PATHAO: "Pathao",
  REDX: "RedX",
  PAPERFLY: "Paperfly",
  ECOURIER: "eCourier",
} as const;
export type CourierProvider = (typeof CourierProvider)[keyof typeof CourierProvider];

export const RiskLevel = {
  SAFE: "Safe",
  MODERATE: "Moderate",
  HIGH_RISK: "High Risk",
} as const;
export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];

export const ParcelStatus = {
  PENDING_PICKUP: "Pending Pickup",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  RETURNED: "Returned",
  CANCELLED: "Cancelled",
} as const;
export type ParcelStatus = (typeof ParcelStatus)[keyof typeof ParcelStatus];

export const SettlementStatus = {
  PENDING: "Pending",
  PAID: "Paid",
  PARTIAL: "Partial",
  DISPUTED: "Disputed",
} as const;
export type SettlementStatus = (typeof SettlementStatus)[keyof typeof SettlementStatus];

export const DisputeStatus = {
  OPEN: "Open",
  UNDER_INVESTIGATION: "Under Investigation",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
} as const;
export type DisputeStatus = (typeof DisputeStatus)[keyof typeof DisputeStatus];

export const PaymentMethod = {
  BKASH: "bKash",
  NAGAD: "Nagad",
  CARD: "Card",
  BANK_TRANSFER: "Bank Transfer",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const TransactionType = {
  SUBSCRIPTION: "Subscription",
  CREDIT_TOPUP: "Credit Top-up",
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const TransactionStatus = {
  COMPLETED: "Completed",
  PENDING: "Pending",
  FAILED: "Failed",
} as const;
export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];

export const CourierHealthStatus = {
  OPERATIONAL: "Operational",
  DEGRADED: "Degraded",
  OUTAGE: "Outage",
} as const;
export type CourierHealthStatus = (typeof CourierHealthStatus)[keyof typeof CourierHealthStatus];

export const BlacklistStatus = {
  CONFIRMED_FRAUD: "Confirmed Fraud",
  SUSPICIOUS: "Suspicious",
  UNDER_REVIEW: "Under Review",
} as const;
export type BlacklistStatus = (typeof BlacklistStatus)[keyof typeof BlacklistStatus];

export const BroadcastType = {
  INFO: "info",
  WARNING: "warning",
  URGENT: "urgent",
  MAINTENANCE: "maintenance",
} as const;
export type BroadcastType = (typeof BroadcastType)[keyof typeof BroadcastType];

export const BroadcastTarget = {
  ALL_MERCHANTS: "All Merchants",
  STARTER: "Starter",
  GROWTH: "Growth",
  ENTERPRISE: "Enterprise",
} as const;
export type BroadcastTarget = (typeof BroadcastTarget)[keyof typeof BroadcastTarget];

export const NotificationCategory = {
  PARCELS: "Parcels",
  PAYMENTS: "Payments",
  RISK_ALERTS: "Risk Alerts",
  SYSTEM: "System",
} as const;
export type NotificationCategory = (typeof NotificationCategory)[keyof typeof NotificationCategory];

export enum Environment {
  DEVELOPMENT = "development",
  PRODUCTION = "production",
  TEST = "test",
}
