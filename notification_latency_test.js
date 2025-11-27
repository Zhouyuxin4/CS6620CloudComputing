const io = require("socket.io-client");
const axios = require("axios");
const crypto = require("crypto");

// Configuration
const API_URL = "https://yopapi.online"; // Or http://localhost:3000
const TEST_ITERATIONS = 10;

// Helper to generate a valid MongoDB ObjectId
function generateObjectId() {
  return crypto.randomBytes(12).toString("hex");
}

const userId = generateObjectId();
console.log("🆔 Generated Test User ID:", userId);

async function runLatencyTest() {
  console.log(`🚀 Starting Notification Latency Test`);
  console.log(`Target: ${API_URL}`);
  console.log(`User ID: ${userId}`);

  // 1. Connect WebSocket
  const socket = io(API_URL, {
    transports: ["websocket", "polling"],
    withCredentials: true,
  });

  await new Promise((resolve) => {
    socket.on("connect", () => {
      console.log("✅ WebSocket Connected");
      // Authenticate
      socket.emit("authenticate", userId);
      resolve();
    });
  });

  // 2. Run Tests
  let totalLatency = 0;
  let successfulTests = 0;

  for (let i = 1; i <= TEST_ITERATIONS; i++) {
    process.stdout.write(`Test ${i}/${TEST_ITERATIONS}: `);

    // Create a promise that resolves when notification is received
    const notificationPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.off("new-notification", listener);
        reject(new Error("Timeout waiting for notification"));
      }, 5000);

      const listener = (data) => {
        const receivedTime = Date.now();
        clearTimeout(timeout);
        socket.off("new-notification", listener);
        resolve(receivedTime);
      };

      socket.on("new-notification", listener);
    });

    // Send Trigger Request
    const startTime = Date.now();
    try {
      await axios.post(`${API_URL}/notifications/test`, {
        recipientId: userId,
      });
    } catch (error) {
      console.error("❌ Trigger Failed:", error.message);
      continue;
    }

    // Wait for notification
    try {
      const endTime = await notificationPromise;
      const latency = endTime - startTime;
      totalLatency += latency;
      successfulTests++;
      console.log(`✅ Received in ${latency}ms`);
    } catch (error) {
      console.log(`❌ ${error.message}`);
    }

    // Small delay between tests
    await new Promise((r) => setTimeout(r, 1000));
  }

  // 3. Summary
  console.log("\n📊 Latency Test Results:");
  if (successfulTests > 0) {
    const avgLatency = totalLatency / successfulTests;
    console.log(`Average Latency: ${avgLatency.toFixed(2)}ms`);
    console.log(`Successful: ${successfulTests}/${TEST_ITERATIONS}`);
  } else {
    console.log("No successful tests.");
  }

  socket.disconnect();
}

runLatencyTest();

