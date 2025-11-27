require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();
const http = require("http");
const { Server } = require("socket.io");

// 1. cookie parser
// test cicd workflow 11.12 v2
app.use(cookieParser());
const { pushMetric } = require("./utils/cloudwatchHelper");

let activeConnections = 0;
let totalNotificationsSent = 0;

// 2. CORS settings
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:3001",
        "http://localhost:3000",
        "https://d3poa9chf7dsh1.cloudfront.net",
        process.env.FRONTEND_URL,
      ];

      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        console.log("Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
  })
);

// 3. body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. 添加调试日志中间件
app.use((req, res, next) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log("Origin:", req.headers.origin);
  console.log("Cookies:", req.cookies);
  console.log("Authorization:", req.headers.authorization);
  next();
});

// 5. 数据库连接
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.log("Error connecting to MongoDB", error.message);
  });

// 6. 路由!
const userRoutes = require("./routes/userRoutes");
const journeyRoutes = require("./routes/journeyRoutes");
const journeyDetailRoutes = require("./routes/journeyDetailRoutes");
const friendRoutes = require("./routes/friendsRoutes");
const socialRoutes = require("./routes/socialRoutes");
const notificationRoutes = require("./routes/notificationRoute");

app.use("/users", userRoutes);
app.use("/journeys", journeyRoutes);
app.use("/details", journeyDetailRoutes);
app.use("/friends", friendRoutes);
app.use("/social", socialRoutes);
app.use("/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the YOP API.");
});

// activate server
// app.listen(process.env.PORT, () => {
//   console.log(`Server running on port ${process.env.PORT}`);
//   console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL}`);
// });

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3001",
      "http://localhost:3000",
      "https://d3poa9chf7dsh1.cloudfront.net",
      process.env.FRONTEND_URL,
    ],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  activeConnections++;
  console.log(
    `✅ Connected: ${socket.id} | Total connections: ${activeConnections}`
  );

  pushMetric("WebSocketConnections", activeConnections, "Count");

  socket.on("authenticate", (userId) => {
    socket.userId = userId;
    socket.join(`user_${userId}`);
    console.log(`User ${userId} authenticated | Active: ${activeConnections}`);
  });

  socket.on("disconnect", () => {
    activeConnections--;
    console.log(
      `❌ Disconnected: ${socket.id} | Remaining: ${activeConnections}`
    );

    pushMetric("WebSocketConnections", activeConnections, "Count");
  });
});

app.set("io", io);

server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
  console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL}`);
  console.log("✨ Socket.io ready on port", process.env.PORT);
});

// 每分钟推送一次汇总指标
setInterval(() => {
  console.log(
    `📊 Stats - Connections: ${activeConnections}, Notifications: ${totalNotificationsSent}`
  );
  pushMetric("WebSocketConnections", activeConnections, "Count");
}, 60000);
