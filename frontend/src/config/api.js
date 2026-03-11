// API 配置
const getApiBaseUrl = () => {
  // 开发环境：使用相对路径（Vite 代理会处理）
  if (import.meta.env.DEV) {
    return "";
  }

  // 生产环境：直接访问公网 IP 的后端服务
  // 临时方案：阿里云域名的前端访问公网 IP 的后端
  return "http://43.98.254.243:3000/";
};

export const API_BASE_URL = getApiBaseUrl();

export default {
  API_BASE_URL,
};
