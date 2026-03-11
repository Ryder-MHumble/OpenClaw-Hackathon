// API 配置
const getApiBaseUrl = () => {
  // 开发环境：使用相对路径（Vite 代理会处理）
  if (import.meta.env.DEV) {
    return "";
  }

  // 生产环境：前端部署在 43.98.254.243:3000，后端在 43.98.254.243:8000
  // 用户访问 https://claw.lab.bza.edu.cn 会重定向到 http://43.98.254.243:3000
  return "http://43.98.254.243:8000";
};

export const API_BASE_URL = getApiBaseUrl();

export default {
  API_BASE_URL,
};
