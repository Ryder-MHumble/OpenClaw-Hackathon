import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../config/apiClient";
import LobsterLogo from "../components/LobsterLogo";

export default function JudgeLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) {
      setError("请输入评委密码");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("password", password);
      const response = await apiClient.post("/api/judges/login", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      localStorage.setItem("judgeToken", response.data.token);
      navigate("/judge/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] font-display text-slate-100 relative overflow-hidden flex flex-col">
      {/* 背景装饰 */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/[0.05] blur-[100px] pointer-events-none animate-blob-1" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-[80px] pointer-events-none animate-blob-2" />
      <div className="fixed inset-0 dot-grid opacity-60 pointer-events-none" />
      <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none" />

      {/* 导航 */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-20 border-b border-white/[0.06] backdrop-blur-md bg-black/20">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/")}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="size-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
            <LobsterLogo size={22} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            OpenClaw <span className="text-primary">虾王争霸赛</span>
          </span>
        </motion.button>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          <span className="material-symbols-outlined text-base">
            arrow_back
          </span>
          <span>返回首页</span>
        </motion.button>
      </header>

      {/* 主体 */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[460px]"
        >
          {/* 标题区 */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", bounce: 0.3 }}
              className="inline-flex items-center justify-center mb-5"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/10 scale-[1.6] animate-pulse-ring" />
                <div className="size-16 bg-primary/10 rounded-full border border-primary/25 flex items-center justify-center shadow-[0_0_30px_rgba(255,88,51,0.15)]">
                  <span className="material-symbols-outlined text-primary text-3xl">
                    gavel
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                <span className="size-1.5 rounded-full bg-primary" />
                Judge Portal
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-2">
                评委登录
              </h1>
              <p className="text-slate-400">欢迎参加本次黑客松评审工作</p>
            </motion.div>
          </div>

          {/* 登录卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-8 shadow-2xl"
            style={{
              boxShadow:
                "0 0 0 1px rgba(255,88,51,0.06), 0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            {/* 顶部光线 */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              {/* 密码输入 */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">
                  评委密码
                  <span className="text-primary ml-1">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl pointer-events-none">
                    lock
                  </span>
                  <input
                    className={`w-full pl-12 pr-12 py-4 rounded-xl border bg-background-dark text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-600 text-sm ${
                      error
                        ? "border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                        : "border-primary/20 focus:ring-2 focus:ring-primary/30 focus:border-primary/60"
                    }`}
                    placeholder="请输入评委密码"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>

                {/* 错误提示 */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-red-400 flex items-center gap-1.5 mt-1"
                    >
                      <span className="material-symbols-outlined text-sm">
                        error
                      </span>
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* 登录按钮 */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full py-4 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group mt-1"
              >
                {loading ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="material-symbols-outlined text-lg"
                    >
                      progress_activity
                    </motion.span>
                    <span>验证中...</span>
                  </>
                ) : (
                  <>
                    <span>确认登录</span>
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </>
                )}
              </motion.button>

              {/* 安全说明 */}
              <div className="flex items-start gap-2 pt-1 border-t border-white/[0.06]">
                <span className="material-symbols-outlined text-primary/60 text-sm mt-0.5 flex-shrink-0">
                  lock
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  登录状态将加密存储在浏览器本地，会话有效期 24 小时。
                </p>
              </div>
            </form>
          </motion.div>

          {/* 底部 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs text-slate-600 mt-6"
          >
            © 2026 OpenClaw Hackathon Committee · 中关村人工智能研究院
          </motion.p>
        </motion.div>
      </main>
    </div>
  );
}
