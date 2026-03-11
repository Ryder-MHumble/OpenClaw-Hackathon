import axios from "axios";
import { API_BASE_URL } from "./api.js";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 移除重复的 /api 前缀
    if (config.url?.startsWith("/api/") && config.baseURL?.includes(":8000")) {
      config.url = config.url.replace(/^\/api\//, "/");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  },
);

export default apiClient;
