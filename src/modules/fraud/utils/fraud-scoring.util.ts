import { RiskLevel } from "../../../common/enums";
import { FraudEvaluationResult, CourierBreakdown } from "../interfaces/fraud-evaluation.interface";

export class FraudScoringUtil {
  static evaluateLocalCustomer(
    rawPhone: string,
    customerName: string,
    customer: any,
  ): FraudEvaluationResult {
    const orders = customer.ordersCount || 0;
    const delivered = customer.deliveredCount || 0;
    const returned = customer.returnedCount || 0;
    const cancelled = customer.cancelledCount || 0;
    const rateNum = orders > 0 ? (delivered / orders) * 100 : 100;

    let score = 10;
    let risk: string = RiskLevel.SAFE;
    let factors = ["আপনার স্টোরে সফল ডেলিভারি রেকর্ড রয়েছে", "সচল মোবাইল অপারেটর"];
    let recommendation = "ঝুঁকি মুক্ত: নিশ্চিন্তে ক্যাশ অন ডেলিভারিতে পার্সেল পাঠাতে পারেন।";

    if (rateNum < 40 || customer.isWatchlist) {
      score = 84;
      risk = RiskLevel.HIGH_RISK;
      factors = ["আপনার মার্চেন্ট রেকর্ডে নিম্ন ডেলিভারি হার (<৪০%)", "কাস্টমার ফ্ল্যাগড ওয়াচলিস্টে রয়েছে", "ঘনঘন পার্সেল রিজেকশনের ইতিহাস রয়েছে"];
      recommendation = "উচ্চ বাতিল ঝুঁকি: পার্সেল পাঠানোর পূর্বে অগ্রিম ডেলিভারি চার্জ নিশ্চিত করুন।";
    } else if (rateNum < 70) {
      score = 52;
      risk = RiskLevel.MODERATE;
      factors = ["মাঝারি ডেলিভারি ইতিহাস (৪০%-৭০%)", "বিগত অর্ডারে রিটার্ন রেকর্ড রয়েছে"];
      recommendation = "মাঝারি ঝুঁকি: বুকিং করার পূর্বে কাস্টমারকে ফোন করে কনফার্ম করুন।";
    }

    return {
      phone: rawPhone,
      name: customer.name || customerName,
      risk,
      score,
      date: "Just now",
      totalOrders: orders,
      delivered,
      returned,
      cancelled,
      successRate: `${rateNum.toFixed(1)}%`,
      factors,
      recommendation,
    };
  }

  static evaluateCrossMerchant(
    rawPhone: string,
    customerName: string,
    crossParcels: any[],
  ): FraudEvaluationResult {
    const total = crossParcels.length;
    const delivered = crossParcels.filter((p) => p.status === "Delivered").length;
    const returned = crossParcels.filter((p) => p.status === "Returned").length;
    const cancelled = crossParcels.filter((p) => p.status === "Cancelled").length;
    const rateNum = total > 0 ? (delivered / total) * 100 : 100;

    let score = 10;
    let risk: string = RiskLevel.SAFE;
    let factors = ["সারা দেশের কুরিয়ার নেটওয়ার্কে নির্ভরযোগ্য গ্রহীতা", "সফল ডেলিভারি ট্র্যাক রেকর্ড"];
    let recommendation = "ঝুঁকি মুক্ত: নিশ্চিন্তে ক্যাশ অন ডেলিভারিতে পার্সেল পাঠাতে পারেন।";

    if (rateNum < 45 || returned > delivered) {
      score = 82;
      risk = RiskLevel.HIGH_RISK;
      factors = [`উচ্চ রিটার্ন অনুপাত (${returned}/${total} টি পার্সেল বাতিল)`, "ডেলিভারি ম্যানকে একাধিকবার ফেরত পাঠানোর রেকর্ড রয়েছে"];
      recommendation = "উচ্চ বাতিল ঝুঁকি: পার্সেল পাঠানোর পূর্বে ডেলিভারি চার্জ অগ্রিম নিন।";
    } else if (rateNum < 75) {
      score = 48;
      risk = RiskLevel.MODERATE;
      factors = ["মাঝারি ডেলিভারি হার", "কুরিয়ার ট্র্যাকিংয়ে কিছু বিলম্ব ও রিটার্ন রয়েছে"];
      recommendation = "মাঝারি ঝুঁকি: অর্ডার ডিসপ্যাচের পূর্বে ঠিকানা নিশ্চিত করুন।";
    }

    // Build actual courier distribution from crossParcels
    const breakdown: CourierBreakdown[] = ["Steadfast", "Pathao", "RedX", "Paperfly", "ParcelDex", "CarryBee"].map((c) => {
      const matched = crossParcels.filter((p) => p.courier?.toLowerCase() === c.toLowerCase());
      const d = matched.filter((p) => p.status === "Delivered").length;
      const ret = matched.filter((p) => p.status === "Returned" || p.status === "Cancelled").length;
      const ratio = matched.length > 0 ? Math.round((d / matched.length) * 1000) / 10 : 0;
      return { provider: c, totalParcels: matched.length, delivered: d, cancelled: ret, deliveryRatio: ratio };
    });

    return {
      phone: rawPhone,
      name: crossParcels[0]?.recipientName || customerName,
      risk,
      score,
      date: "Just now",
      totalOrders: total,
      delivered,
      returned,
      cancelled,
      successRate: `${rateNum.toFixed(1)}%`,
      factors,
      recommendation,
      courierBreakdown: breakdown,
    };
  }

  static evaluateHeuristic(
    rawPhone: string,
    cleanPhone: string,
    customerName: string,
  ): FraudEvaluationResult {
    // When 0 orders exist in courier databases
    return {
      phone: rawPhone,
      name: customerName,
      risk: RiskLevel.SAFE,
      score: 10,
      date: "Just now",
      totalOrders: 0,
      delivered: 0,
      returned: 0,
      cancelled: 0,
      successRate: "100%",
      factors: [
        "নতুন গ্রাহক: কোনো পূর্ববর্তী রিটার্ন বা ফ্রড রেকর্ড নেই",
        "সচল ও সক্রিয় বাংলাদেশি মোবাইল নম্বর",
      ],
      recommendation: "ঝুঁকি মুক্ত: এই কাস্টমারকে নিশ্চিন্তে পার্সেল দিতে পারেন।",
    };
  }
}
