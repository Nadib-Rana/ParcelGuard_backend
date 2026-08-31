import * as dotenv from "dotenv";

dotenv.config();

async function testAllCouriers() {
  console.log("\n========================================================");
  console.log("🚚 Testing All Courier API Credentials (.env)");
  console.log("========================================================\n");

  // 1. STEADFAST
  console.log("--------------------------------------------------------");
  console.log("1️⃣  STEADFAST COURIER");
  console.log("--------------------------------------------------------");
  const sfKey = process.env.STEADFAST_API_KEY;
  const sfSecret = process.env.STEADFAST_SECRET_KEY;
  if (!sfKey || !sfSecret) {
    console.log("❌ Keys missing in .env");
  } else {
    try {
      const res = await fetch("https://portal.packzy.com/api/v1/fraud_check/01711223344", {
        headers: { "Api-Key": sfKey, "Secret-Key": sfSecret, "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => null);
      console.log(`Status Code: ${res.status}`);
      console.log("Response:", JSON.stringify(data));
      if (res.status === 200) console.log("✅ Steadfast: ACTIVE & WORKING!");
      else if (res.status === 403) console.log("⚠️ Steadfast: Account is INACTIVE (Contact Support).");
      else console.log("❌ Steadfast: Failed / Invalid Keys.");
    } catch (e) {
      console.log("❌ Steadfast Error:", e instanceof Error ? e.message : e);
    }
  }

  // 2. REDX
  console.log("\n--------------------------------------------------------");
  console.log("2️⃣  REDX COURIER");
  console.log("--------------------------------------------------------");
  const redxToken = process.env.REDX_API_TOKEN;
  const redxBase = process.env.REDX_BASE_URL || "https://openapi.redx.com.bd/v1.0.0-beta";
  const sandboxToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzM1NTMxNjU2LCJpc3MiOiJ0OTlnbEVnZTBUTm5MYTNvalh6MG9VaGxtNEVoamNFMyIsInNob3BfaWQiOjEsInVzZXJfaWQiOjZ9.zpKfyHK6zPBVaTrYevnCqnUA-e2jFKQJ7lK-z4aOx2g";

  if (!redxToken) {
    console.log("❌ REDX_API_TOKEN missing in .env");
  } else {
    try {
      console.log(`📡 Testing Production: ${redxBase}/pickup/stores`);
      const res = await fetch(`${redxBase}/pickup/stores`, {
        headers: {
          "API-ACCESS-TOKEN": `Bearer ${redxToken}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json().catch(() => null);
      console.log(`Status Code: ${res.status}`);
      console.log("Response:", JSON.stringify(data));
      if (res.status === 200 || res.ok) {
        console.log("✅ RedX Production: ACTIVE & WORKING! Token is verified.");
      } else {
        console.log(`⚠️ RedX Production Status: ${res.status} (${data?.message || "Failed"})`);

        // Test with Sandbox
        console.log(`\n📡 Testing Sandbox: https://sandbox.redx.com.bd/v1.0.0-beta/pickup/stores`);
        const sRes = await fetch("https://sandbox.redx.com.bd/v1.0.0-beta/pickup/stores", {
          headers: {
            "API-ACCESS-TOKEN": `Bearer ${sandboxToken}`,
            "Content-Type": "application/json",
          },
        });
        const sData = await sRes.json().catch(() => null);
        console.log(`Sandbox Status Code: ${sRes.status}`);
        console.log("Sandbox Response:", JSON.stringify(sData));
        if (sRes.status === 200 || sRes.ok) {
          console.log("✅ RedX Sandbox: ACTIVE & WORKING!");
        }
      }
    } catch (e) {
      console.log("❌ RedX Error:", e instanceof Error ? e.message : e);
    }
  }

  // 3. PATHAO
  console.log("\n--------------------------------------------------------");
  console.log("3️⃣  PATHAO COURIER");
  console.log("--------------------------------------------------------");
  const pathaoId = process.env.PATHAO_CLIENT_ID;
  const pathaoSecret = process.env.PATHAO_CLIENT_SECRET;
  if (!pathaoId || !pathaoSecret) {
    console.log("❌ Pathao Client ID/Secret missing in .env");
  } else {
    try {
      // Pathao Aladdin OAuth Endpoint
      const endpoints = [
        "https://api.pathao.com/aladdin/api/v1/issue-token",
        "https://courier-api-sandbox.pathao.com/aladdin/api/v1/issue-token",
      ];
      let pathaoSuccess = false;

      for (const ep of endpoints) {
        const res = await fetch(ep, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            client_id: pathaoId,
            client_secret: pathaoSecret,
            grant_type: "client_credentials",
          }),
        });
        const data = await res.json().catch(() => null);
        console.log(`Testing: ${ep}`);
        console.log(`Status Code: ${res.status}`);
        console.log("Response:", JSON.stringify(data));
        if (res.status === 200 && data?.access_token) {
          console.log("✅ Pathao: ACTIVE & TOKEN ISSUED!");
          pathaoSuccess = true;
          break;
        }
      }

      if (!pathaoSuccess) {
        console.log("ℹ️ Pathao: Pathao Aladdin requires merchant email/password in addition to Client ID/Secret for OAuth grant.");
      }
    } catch (e) {
      console.log("❌ Pathao Error:", e instanceof Error ? e.message : e);
    }
  }

  // 4. PAPERFLY
  console.log("\n--------------------------------------------------------");
  console.log("4️⃣  PAPERFLY COURIER");
  console.log("--------------------------------------------------------");
  const pfKey = process.env.PAPERFLY_KEY;
  const pfBase = process.env.PAPERFLY_BASE_URL || "https://api.paperfly.com.bd/merchant/api/service";
  if (!pfKey) {
    console.log("❌ PAPERFLY_KEY missing in .env");
  } else {
    try {
      const res = await fetch(pfBase, {
        method: "POST",
        headers: {
          "paperfly-key": pfKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const data = await res.text().catch(() => "");
      console.log(`Endpoint: ${pfBase}`);
      console.log(`Status Code: ${res.status}`);
      console.log("Response:", data.substring(0, 150));
      if (res.status === 200 || res.status === 400) {
        console.log("✅ Paperfly: API endpoint reached successfully.");
      } else {
        console.log(`ℹ️ Paperfly: Status ${res.status}`);
      }
    } catch (e) {
      console.log("❌ Paperfly Error:", e instanceof Error ? e.message : e);
    }
  }

  console.log("\n========================================================\n");
}

testAllCouriers();
