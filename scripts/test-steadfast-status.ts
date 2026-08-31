import * as dotenv from "dotenv";

dotenv.config();

async function testSteadfastApi() {
  const apiKey = process.env.STEADFAST_API_KEY;
  const secretKey = process.env.STEADFAST_SECRET_KEY;

  console.log("\n==========================================");
  console.log("🔍 Testing Steadfast API Connection & Status");
  console.log("==========================================");
  console.log(`API Key: ${apiKey ? apiKey.substring(0, 8) + "..." : "NOT SET"}`);
  console.log(`Secret Key: ${secretKey ? secretKey.substring(0, 8) + "..." : "NOT SET"}\n`);

  if (!apiKey || !secretKey) {
    console.error("❌ Error: STEADFAST_API_KEY or STEADFAST_SECRET_KEY is missing in .env");
    return;
  }

  const testPhone = "01711223344";
  const url = `https://portal.packzy.com/api/v1/fraud_check/${testPhone}`;

  try {
    console.log(`📡 Sending test request to: ${url}`);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Api-Key": apiKey,
        "Secret-Key": secretKey,
        "Content-Type": "application/json",
      },
    });

    const status = response.status;
    const data = await response.json().catch(() => null);

    console.log(`\n📥 Response Status Code: ${status}`);
    console.log("📦 Response Payload:", JSON.stringify(data, null, 2));

    console.log("\n------------------------------------------");
    if (status === 200) {
      console.log("🎉 SUCCESS: আপনার Steadfast একাউন্ট সম্পূর্ণ ACTIVE এবং API কাজ করছে!");
    } else if (status === 403) {
      console.log("⚠️ STATUS: আপনার একাউন্টটি এখনও INACTIVE (Steadfast সাপোর্ট থেকে একটিভ করাতে হবে)।");
    } else if (status === 401) {
      console.log("❌ STATUS: API Key বা Secret Key ভুল/ইনভ্যালিড।");
    } else {
      console.log(`ℹ️ STATUS: অন্য কোনো রেসপন্স কোড (${status})।`);
    }
    console.log("------------------------------------------\n");
  } catch (error) {
    console.error("❌ Request Error:", error instanceof Error ? error.message : error);
  }
}

testSteadfastApi();
