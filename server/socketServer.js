require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const Redis = require("ioredis");

const redisSub = new Redis(process.env.REDIS_URL);

redisSub.on("connect", () => {
  console.log("✅ Redis connected");
});

redisSub.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3001",
      "http://localhost:3000",
      process.env.FRONTEND_URL,
    ],
    credentials: true,
  },
});

let activeConnections = 0;

io.on("connection", (socket) => {
  activeConnections++;
  console.log(
    `✅ Socket connected: ${socket.id} | Total: ${activeConnections}`
  );

  socket.on("authenticate", (userId) => {
    socket.userId = userId;
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} joined room user_${userId}`);
  });

  socket.on("disconnect", () => {
    activeConnections--;
    console.log(
      `❌ Disconnected: ${socket.id} | Remaining: ${activeConnections}`
    );
  });
});

redisSub.subscribe("notifications", (err) => {
  if (err) {
    console.error("❌ Redis subscribe error:", err);
  } else {
    console.log("✅ Subscribed to notifications channel");
  }
});

redisSub.on("message", (channel, message) => {
  if (channel === "notifications") {
    try {
      const { recipientId, notification } = JSON.parse(message);
      console.log(`📤 Pushing to user_${recipientId}`);
      io.to(`user_${recipientId}`).emit("new-notification", notification);
    } catch (err) {
      console.error("❌ Parse error:", err);
    }
  }
});

const SOCKET_PORT = process.env.SOCKET_PORT || 3001;
server.listen(SOCKET_PORT, () => {
  console.log(`🚀 Socket server on port ${SOCKET_PORT}`);
});
