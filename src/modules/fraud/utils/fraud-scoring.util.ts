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
    let factors = ["মার্চেন্ট লোকাল ডিরেক্টরি রেকর্ড যাচাই সম্পন্ন", "পূর্ববর্তী সফল কাস্টমার ট্রানজ্যাকশন"];
    let recommendation = "ঝুঁকি মুক্ত: এই কাস্টমারকে নিশ্চিন্তে ক্যাশ অন ডেলিভারিতে পার্সেল পাঠাতে পারেন।";

    if (rateNum < 40 || customer.isWatchlist) {
      score = 84;
      risk = RiskLevel.HIGH_RISK;
      factors = ["উচ্চ পার্সেল রিটার্ন ও বাতিল হার (<৪০%)", "মার্চেন্ট ওয়াচলিস্টে অন্তর্ভুক্ত গ্রাহক", "রিপিটেড কুরিয়ার রিজেকশনের রেকর্ড রয়েছে"];
      recommendation = "উচ্চ ঝুঁকি সতর্কবার্তা: পার্সেল পাঠানোর আগে ডেলিভারি চার্জ অগ্রিম নিয়ে অর্ডার কনফার্ম করুন।";
    } else if (rateNum < 70) {
      score = 52;
      risk = RiskLevel.MODERATE;
      factors = ["মাঝারি ডেলিভারি সাকসেস রেট (৪০%-৭০%)", "অর্ডার পাঠানোর আগে ফোন কনফার্মেশন প্রয়োজন"];
      recommendation = "মাঝারি ঝুঁকি: অর্ডারটি পাঠানোর আগে কাস্টমারকে কল করে নিশ্চিত হোন।";
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
    let factors = ["জাতীয় ই-কমার্স নেটওয়ার্ক হিস্ট্রি ট্র্যাকিং সম্পন্ন", "ভেরিফাইড ডেলিভারি ট্রানজ্যাকশন রেকর্ড"];
    let recommendation = "ঝুঁকি মুক্ত: এই কাস্টমারকে নিশ্চিন্তে ক্যাশ অন ডেলিভারিতে পার্সেল পাঠাতে পারেন।";

    if (rateNum < 45 || returned > delivered) {
      score = 82;
      risk = RiskLevel.HIGH_RISK;
      factors = [`উচ্চ রিটার্ন ও বাতিল হার (${returned}/${total}টি পার্সেল ফেরত এসেছে)`, "একাধিক স্টোরে পার্সেল রিজেকশনের হিস্ট্রি রয়েছে"];
      recommendation = "উচ্চ ঝুঁকি সতর্কবার্তা: পার্সেল পাঠানোর আগে ডেলিভারি চার্জ অগ্রিম নিন।";
    } else if (rateNum < 75) {
      score = 48;
      risk = RiskLevel.MODERATE;
      factors = ["মাঝারি ডেলিভারি সাকসেস রেট", "পার্সেল পাঠানোর আগে গ্রাহককে কল করে কনফার্ম করুন"];
      recommendation = "মাঝারি ঝুঁকি: অর্ডারটি পাঠানোর আগে ফোন কলে নিশ্চিত হোন।";
    }

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
        "নতুন গ্রাহক: কোনো পূর্ববর্তী কুরিয়ার অভিযোগ নেই",
        "ভেরিফাইড ও ঝুঁকি মুক্ত কাস্টমার প্রোফাইল",
      ],
      recommendation: "ঝুঁকি মুক্ত: এই কাস্টমারকে নিশ্চিন্তে ক্যাশ অন ডেলিভারিতে পার্সেল পাঠাতে পারেন।",
    };
  }
}
