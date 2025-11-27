// src/api.js
import axios from "axios";
import Cookies from "js-cookie";

// read environment variable for API base URL
// Force HTTPS for production to fix Mixed Content error
const API_BASE_URL = "https://yopapi.online";
// const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

// create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

// request interceptor: add token to header in each request
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 🔥 Important: Only set Content-Type for non-FormData requests
    // Let browser set Content-Type automatically for FormData (multipart/form-data with boundary)
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
      }

    // 调试日志
    console.log(`🔵 [API Request] ${config.method.toUpperCase()} ${config.url}`);
    console.log(`   BaseURL: ${config.baseURL}`);
    console.log(`   Full URL: ${config.baseURL || ''}${config.url}`);
    console.log("   Token:", token ? "Present" : "Missing");
    console.log("   Content-Type:", config.headers["Content-Type"] || "auto (FormData)");

    return config;
  },
  (error) => {
    console.error("🔴 [API Interceptor Error]:", error);
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
