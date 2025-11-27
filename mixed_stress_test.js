const io = require("socket.io-client");
const axios = require("axios");
const crypto = require("crypto");

// 配置
const API_URL = "https://yopapi.online";
const LOAD_CONCURRENCY = 300; // 背景负载并发数
const LATENCY_TEST_COUNT = 10; // 测多少次延迟

// 生成随机 ID
function generateObjectId() {
  return crypto.randomBytes(12).toString("hex");
}

// ==========================================
// 1. 负载生成器 (制造噪音)
// ==========================================
let loadRequestCount = 0;
let loadErrorCount = 0;
let isLoadTesting = true;

async function makeLoadRequest() {
  while (isLoadTesting) {
    try {
      await axios.get(`${API_URL}/`); // 请求首页
      loadRequestCount++;
    } catch (error) {
      loadErrorCount++;
      // 稍微休息一下避免死循环报错
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

// ==========================================
// 2. 延迟测试器 (精准测量)
// ==========================================
async function runLatencyChecks() {
  const userId = generateObjectId();
  console.log(`🎯 Latency Test User ID: ${userId}`);

  // 连接 Socket
  const socket = io(API_URL, {
    transports: ["websocket", "polling"],
    withCredentials: true,
  });

  await new Promise((resolve) => {
    socket.on("connect", () => {
      console.log("✅ Monitor Socket Connected");
      socket.emit("authenticate", userId);
      resolve();
    });
  });

  console.log("\n⏳ Waiting 5s for load to stabilize...");
  await new Promise((r) => setTimeout(r, 5000));

  console.log("\n🚀 Starting Latency Measurements under Load:");
  
  let totalLatency = 0;
  let successfulTests = 0;

  for (let i = 1; i <= LATENCY_TEST_COUNT; i++) {
    process.stdout.write(`   Test ${i}/${LATENCY_TEST_COUNT}: `);

    const notificationPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.off("new-notification", listener);
        reject(new Error("Timeout"));
      }, 10000); // 给 10秒超时

      const listener = () => {
        clearTimeout(timeout);
        socket.off("new-notification", listener);
        resolve(Date.now());
      };

      socket.on("new-notification", listener);
    });

    const startTime = Date.now();
    
    try {
      await axios.post(`${API_URL}/notifications/test`, { recipientId: userId });
      const endTime = await notificationPromise;
      const latency = endTime - startTime;
      
      console.log(`✅ ${latency}ms`);
      totalLatency += latency;
      successfulTests++;
    } catch (error) {
      console.log(`❌ ${error.message}`);
    }

    // 间隔 1 秒
    await new Promise((r) => setTimeout(r, 1000));
  }

  socket.disconnect();
  
  return {
    avgLatency: successfulTests > 0 ? (totalLatency / successfulTests).toFixed(2) : 0,
    successRate: successfulTests,
  };
}

// ==========================================
// 主程序
// ==========================================
async function main() {
  console.log("===============================================");
  console.log("🔥 MIXED STRESS TEST: Load + Latency");
  console.log("===============================================");

  // 1. 启动负载
  startBackgroundLoad();

  // 2. 运行延迟测试
  const results = await runLatencyChecks();

  // 3. 停止负载
  isLoadTesting = false;

  // 4. 报告
  console.log("\n===============================================");
  console.log("📊 Final Report");
  console.log("===============================================");
  console.log(`Background Load:    ${LOAD_CONCURRENCY} concurrent users`);
  console.log(`Total HTTP Req:     ${loadRequestCount} processed`);
  console.log(`Total HTTP Errors:  ${loadErrorCount}`);
  console.log("-----------------------------------------------");
  console.log(`Avg Notification Latency: ${results.avgLatency} ms`);
  console.log(`Latency Test Success:     ${results.successRate}/${LATENCY_TEST_COUNT}`);
  console.log("===============================================");
  
  process.exit(0);
}

main();

