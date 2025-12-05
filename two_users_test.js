const io = require("socket.io-client");
const axios = require("axios");
const crypto = require("crypto");

const API_URL = "https://yopapi.online"; 
const TEST_ITERATIONS = 10;

function generateObjectId() {
  return crypto.randomBytes(12).toString("hex");
}

async function runRealInteractionTest() {
  const userA = generateObjectId(); // Sender
  const userB = generateObjectId(); // Recipient

  console.log("===============================================");
  console.log("👥 Real User Interaction Test (A -> B)");
  console.log("===============================================");
  console.log(`👤 User A (Sender):    ${userA}`);
  console.log(`👤 User B (Recipient): ${userB}`);
  console.log("===============================================");

  const socketB = io(API_URL, {
    transports: ["websocket", "polling"],
    withCredentials: true,
  });

  await new Promise((resolve) => {
    socketB.on("connect", () => {
      console.log("✅ User B Connected to WebSocket");
      // User B authenticate
      socketB.emit("authenticate", userB);
      resolve();
    });
  });

  console.log("\n🚀 Starting Interaction Tests:");

  let totalLatency = 0;
  let successfulTests = 0;

  for (let i = 1; i <= TEST_ITERATIONS; i++) {
    process.stdout.write(`   Test ${i}/${TEST_ITERATIONS}: `);

    const notificationPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socketB.off("new-notification", listener);
        reject(new Error("Timeout waiting for notification"));
      }, 5000);

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
      
      console.log(`✅ B received msg from A in ${latency}ms`);
      totalLatency += latency;
      successfulTests++;
    } catch (error) {
      console.log(`❌ ${error.message}`);
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  socketB.disconnect();

  console.log("\n===============================================");
  console.log("📊 Final Result");
  console.log("===============================================");
  if (successfulTests > 0) {
      const avgLatency = totalLatency / successfulTests;
      console.log(`Average Interaction Latency: ${avgLatency.toFixed(2)}ms`);
      console.log(`Success Rate: ${successfulTests}/${TEST_ITERATIONS}`);
  } else {
      console.log("Failed to record any interactions.");
  }
}

runRealInteractionTest();

