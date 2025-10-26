// src/api.js
import axios from "axios";
import Cookies from "js-cookie";

// 从环境变量读取 API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // 非常重要!允许跨域请求携带 Cookie
  timeout: 10000, // 10秒超时
});

// 请求拦截器:在每个请求中添加 token 到 header
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 调试日志
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    console.log("Token:", token ? "Present" : "Missing");

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// 响应拦截器:统一处理错误
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 403) {
      console.error("403 Forbidden - Authentication failed");
      console.log("Request details:", {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers,
      });
    } else if (error.response?.status === 401) {
      console.error("401 Unauthorized - Please login again");
      // 可选:自动跳转到登录页
      // window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export default api;
