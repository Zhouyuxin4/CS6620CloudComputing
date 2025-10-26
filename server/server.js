require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

// 1. 最重要：先使用 cookieParser
app.use(cookieParser());

// 2. 配置 CORS - 修复版本
app.use(
  cors({
    origin: function (origin, callback) {
      // 允许的来源列表
      const allowedOrigins = [
        "http://localhost:3001",
        "http://localhost:3000",
        process.env.FRONTEND_URL,
      ];

      // 允许没有 origin 的请求（比如 mobile apps, postman）
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        console.log("Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // ⚠️ 关键设置
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

// 6. 路由
const userRoutes = require("./routes/userRoutes");
const journeyRoutes = require("./routes/journeyRoutes");
const journeyDetailRoutes = require("./routes/journeyDetailRoutes");
const friendRoutes = require("./routes/friendsRoutes");

app.use("/users", userRoutes);
app.use("/journeys", journeyRoutes);
app.use("/details", journeyDetailRoutes);
app.use("/friends", friendRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the YOP API.");
});

// 7. 启动服务器
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
  console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL}`);
});
