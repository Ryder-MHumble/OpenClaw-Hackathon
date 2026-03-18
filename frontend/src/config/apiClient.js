import axios from "axios";
import { API_BASE_URL } from "./api.js";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器 - 自动添加 token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("judgeToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 响应拦截器 - 处理 401 未授权错误
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 如果是 401 未授权错误，清除 token 并跳转到登录页
    if (error.response?.status === 401) {
      localStorage.removeItem("judgeToken");
      // 只在 judge 相关页面才跳转
      if (
        window.location.pathname.startsWith("/judge") &&
        window.location.pathname !== "/judge/login"
      ) {
        window.location.href = "/judge/login";
      }
    }
    console.error("API Error:", error);
    return Promise.reject(error);
  },
);

export default apiClient;
