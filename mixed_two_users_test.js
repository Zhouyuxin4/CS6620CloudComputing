const io = require("socket.io-client");
const axios = require("axios");
const crypto = require("crypto");

const API_URL = "https://yopapi.online";
const LOAD_CONCURRENCY = 300;
const TEST_ITERATIONS = 10;

function generateObjectId() {
  return crypto.randomBytes(12).toString("hex");
}

let loadRequestCount = 0;
let loadErrorCount = 0;
let isLoadTesting = true;

async function makeLoadRequest() {
  while (isLoadTesting) {
    try {
      await axios.get(`${API_URL}/`);
      loadRequestCount++;
    } catch (error) {
      loadErrorCount++;
      await new Promise((r) => setTimeout(r, 100));
    }
  }
}

async function startBackgroundLoad() {
  console.log(`🌪️ Starting background load with ${LOAD_CONCURRENCY} concurrent users...`);
  const workers = [];
  for (let i = 0; i < LOAD_CONCURRENCY; i++) {
    workers.push(makeLoadRequest());
  }
  return workers;
}

async function runInteractionUnderLoad() {
  const userA = generateObjectId(); // Sender
  const userB = generateObjectId(); // Recipient

  console.log(`\n👥 Setting up User A (${userA}) -> User B (${userB})`);

  const socketB = io(API_URL, {
    transports: ["websocket", "polling"],
    withCredentials: true,
  });

  await new Promise((resolve) => {
    socketB.on("connect", () => {
      console.log("✅ User B Connected to WebSocket");
      socketB.emit("authenticate", userB);
      resolve();
    });
  });

  console.log("\n⏳ Waiting 5s for system load to peak...");
  await new Promise((r) => setTimeout(r, 5000));

  console.log("\n🚀 Starting High-Stress Interaction Tests:");

  let totalLatency = 0;
  let successfulTests = 0;

  for (let i = 1; i <= TEST_ITERATIONS; i++) {
    process.stdout.write(`   Test ${i}/${TEST_ITERATIONS}: `);

    const notificationPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socketB.off("new-notification", listener);
        reject(new Error("Timeout"));
      }, 10000); // 10s timeout

      const listener = (data) => {
        if (data.senderId === userA) {
          clearTimeout(timeout);
          socketB.off("new-notification", listener);
          resolve(Date.now());
        }
      };

      socketB.on("new-notification", listener);
    });

    const startTime = Date.now();

    try {
      await axios.post(`${API_URL}/notifications/test`, {
        recipientId: userB,
        senderId: userA
      });

      const endTime = await notificationPromise;
      const latency = endTime - startTime;

      console.log(`✅ ${latency}ms`);
      totalLatency += latency;
      successfulTests++;
    } catch (error) {
      console.log(`❌ ${error.message}`);
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  socketB.disconnect();
  
  return {
    avgLatency: successfulTests > 0 ? (totalLatency / successfulTests).toFixed(2) : 0,
    successRate: successfulTests
  };
}

async function main() {
  console.log("===============================================");
  console.log("🔥 HIGH STRESS INTERACTION TEST");
  console.log("===============================================");

  startBackgroundLoad();

  const results = await runInteractionUnderLoad();

  isLoadTesting = false;

  // 4. 报告
  console.log("\n===============================================");
  console.log("📊 Final Report");
  console.log("===============================================");
  console.log(`Background Load:    ${LOAD_CONCURRENCY} concurrent users`);
  console.log(`Total HTTP Req:     ${loadRequestCount} processed`);
  console.log(`Avg Interaction Latency: ${results.avgLatency} ms`);
  console.log(`Success Rate:            ${results.successRate}/${TEST_ITERATIONS}`);
  console.log("===============================================");
  
  process.exit(0);
}

main();

