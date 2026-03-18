import { Navigate } from "react-router-dom";

/**
 * 受保护的路由组件
 * 检查用户是否已登录（通过 localStorage 中的 judgeToken）
 * 如果未登录，重定向到登录页面
 */
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("judgeToken");

  if (!token) {
    // 未登录，重定向到登录页面
    return <Navigate to="/judge/login" replace />;
  }

  // 已登录，渲染子组件
  return children;
}
