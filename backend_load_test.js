const axios = require('axios');

// 配置
const TARGET_URL = 'https://yopapi.online'; 
const TOTAL_REQUESTS = 5000; 
const CONCURRENCY = 300;    

let successCount = 0;
let failCount = 0;
let totalTime = 0;

const startTime = Date.now();

async function makeRequest(id) {
  const start = Date.now();
  try {
    await axios.get(`${TARGET_URL}/`); 
    const duration = Date.now() - start;
    totalTime += duration;
    successCount++;
  } catch (error) {
    failCount++;
    console.error(`Request ${id}: Failed - ${error.message}`);
  }
}

async function runLoadTest() {
  console.log(`🚀 Starting Load Test on ${TARGET_URL}`);
  console.log(`Total Requests: ${TOTAL_REQUESTS}, Concurrency: ${CONCURRENCY}`);

  const queue = Array.from({ length: TOTAL_REQUESTS }, (_, i) => i);
  const workers = [];

  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(
      (async () => {
        while (queue.length > 0) {
          const id = queue.shift();
          await makeRequest(id);
          if (id % 10 === 0) process.stdout.write('.');
        }
      })()
    );
  }

  await Promise.all(workers);

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  console.log('\n\n📊 Load Test Results:');
  console.log(`Total Time: ${duration.toFixed(2)}s`);
  console.log(`Successful Requests: ${successCount}`);
  console.log(`Failed Requests: ${failCount}`);
  console.log(`Requests Per Second (RPS): ${(successCount / duration).toFixed(2)}`);
  console.log(`Average Response Time: ${(totalTime / successCount).toFixed(2)}ms`);
}

runLoadTest();

