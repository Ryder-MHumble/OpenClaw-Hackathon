import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  Gavel,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import LobsterLogo from "../components/LobsterLogo";
import { loginJudgeWithPassword } from "../data/judgeStaticStore";

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
      const result = loginJudgeWithPassword(password);
      if (!result.ok) {
        setError(result.error || "登录失败，请重试");
        return;
      }
      navigate("/judge/dashboard");
    } catch (err) {
      setError(err?.message || "登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] font-display text-slate-100 relative overflow-hidden flex flex-col">
      {/* Aurora 背景 */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/[0.07] blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-primary/[0.04] blur-[100px] pointer-events-none" />
      <div className="fixed inset-0 dot-grid opacity-40 pointer-events-none" />
      <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent pointer-events-none" />

      {/* 导航 */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-20 border-b border-white/[0.05] backdrop-blur-md bg-black/10">
        <motion.button
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
            <LobsterLogo size={18} className="text-white" />
          </div>
          <span className="text-base font-bold tracking-tight">
            OpenClaw <span className="text-primary">虾王争霸赛</span>
          </span>
        </motion.button>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>返回首页</span>
        </motion.button>
      </header>

      {/* 主体 */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[420px]"
        >
          {/* 标题区 */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", bounce: 0.35 }}
              className="inline-flex items-center justify-center mb-6"
            >
              <div className="relative">
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/15"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="relative size-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full border border-primary/30 flex items-center justify-center shadow-[0_0_40px_rgba(255,88,51,0.15)]">
                  <Gavel size={26} className="text-primary" strokeWidth={1.8} />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/[0.07] text-primary text-[10px] font-bold uppercase tracking-widest mb-4">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                Judge Portal
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-2">评委登录</h1>
              <p className="text-slate-400 text-sm">欢迎参加本次黑客松评审工作</p>
            </motion.div>
          </div>

          {/* 登录卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.5 }}
            className="relative rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm p-7 shadow-2xl"
            style={{ boxShadow: "0 0 0 1px rgba(255,88,51,0.05), 0 24px 64px rgba(0,0,0,0.55)" }}
          >
            {/* 顶部光线 */}
            <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              {/* 密码输入 */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 tracking-wide uppercase">
                  评委密码 <span className="text-primary">*</span>
                </label>
                <div className="relative group">
                  <Lock
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none transition-colors group-focus-within:text-primary/70"
                  />
                  <input
                    className={`w-full pl-10 pr-11 py-3.5 rounded-xl border bg-black/20 text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-600 text-sm font-medium ${
                      error
                        ? "border-red-500/40 focus:ring-2 focus:ring-red-500/25 focus:border-red-400/60"
                        : "border-white/[0.08] focus:ring-2 focus:ring-primary/25 focus:border-primary/50"
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
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* 错误提示 */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-red-400 flex items-center gap-1.5 pt-0.5"
                    >
                      <AlertCircle size={12} />
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
                whileTap={{ scale: loading ? 1 : 0.97 }}
                className="w-full py-3.5 bg-primary hover:bg-primary/90 disabled:bg-primary/40 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>验证中…</span>
                  </>
                ) : (
                  <>
                    <span>确认登录</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>

              {/* 安全说明 */}
              <div className="flex items-start gap-2 pt-1 border-t border-white/[0.05]">
                <ShieldCheck size={13} className="text-primary/50 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-600 leading-relaxed">
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
            className="text-center text-xs text-slate-700 mt-6"
          >
            © 2026 OpenClaw Hackathon Committee · 中关村人工智能研究院
          </motion.p>
        </motion.div>
      </main>
    </div>
  );
}
