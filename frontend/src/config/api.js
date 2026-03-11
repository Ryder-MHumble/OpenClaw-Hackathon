// API 配置
const getApiBaseUrl = () => {
  // 开发环境：使用相对路径（Vite 代理会处理）
  if (import.meta.env.DEV) {
    return "";
  }

  // 生产环境：使用完整的服务器地址
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;

  // HTTPS 域名：使用反向代理，不需要端口号
  if (protocol === "https:" && hostname.includes(".")) {
    return `${protocol}//${hostname}`;
  }

  // HTTP 公网 IP：直接访问 8000 端口
  if (hostname === "43.98.254.243" || hostname.includes(".")) {
    return `${protocol}//${hostname}:8000`;
  }

  // 默认：使用相对路径
  return "";
};

export const API_BASE_URL = getApiBaseUrl();

export default {
  API_BASE_URL,
};
