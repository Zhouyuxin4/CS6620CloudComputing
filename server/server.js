require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const Redis = require("ioredis");

const app = express();

// 1. cookie parser
app.use(cookieParser());
const { pushMetric } = require("./utils/cloudwatchHelper");

// 2. Redis 发布连接（用于发送通知到 Socket 服务器）
const redisPub = new Redis(process.env.REDIS_URL);
redisPub.on("connect", () => console.log("✅ Redis publisher connected"));
redisPub.on("error", (err) => console.error("❌ Redis error:", err.message));

// 把 redisPub 挂到 app 上，方便其他地方使用
app.set("redisPub", redisPub);

// 3. CORS settings
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:3001",
        "http://localhost:3000",
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

// 4. body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. 调试日志中间件
app.use((req, res, next) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log("Origin:", req.headers.origin);
  console.log("Cookies:", req.cookies);
  console.log("Authorization:", req.headers.authorization);
  next();
});

// 6. 数据库连接
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

// 7. 路由
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

// 8. 启动服务器（纯 HTTP，不再包含 Socket.io）
app.listen(process.env.PORT, () => {
  console.log(`🚀 API Server running on port ${process.env.PORT}`);
  console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL}`);
});
