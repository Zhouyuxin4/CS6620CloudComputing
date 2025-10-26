const jwt = require("jsonwebtoken");

exports.authenticateToken = (req, res, next) => {
  let token = null;

  // 方法 1: 从 Cookie 获取（优先）
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log("✅ Token found in Cookie");
  }

  // 方法 2: 从 Authorization Header 获取（备用）
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
      console.log("✅ Token found in Authorization Header");
    }
  }

  // 没有 token
  if (!token) {
    console.log("❌ No token provided");
    console.log("   Cookies:", req.cookies);
    console.log("   Auth Header:", req.headers.authorization);
    return res
      .status(403)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId };
    console.log("✅ Token verified, userId:", decoded.userId);
    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    return res.status(403).json({ message: "Invalid token." });
  }
};
