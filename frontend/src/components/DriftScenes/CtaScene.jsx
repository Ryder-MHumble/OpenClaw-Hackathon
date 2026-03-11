import { motion } from "framer-motion";
import LobsterCharacter from "../LobsterCharacter";

/**
 * CtaScene - 最终号召场景
 * 龙虾准备进入，展示最终的行动号召
 */
export default function CtaScene({ isActive, lobsterPos, onEnter }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* 背景渐变 - 强烈的主色调 */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(255,88,51,0.16) 0%, transparent 70%)",
        }}
      />

      {/* 龙虾角色 */}
      <LobsterCharacter
        size={120}
        x={lobsterPos.x}
        y={lobsterPos.y}
        rotation={0}
        opacity={isActive ? 1 : 0}
      />

      {/* 主标题 */}
      <motion.div
        className="absolute top-24 text-center text-6xl sm:text-8xl font-black text-white leading-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        谁是虾王？
      </motion.div>

      {/* 副标题 */}
      <motion.p
        className="absolute top-56 text-slate-200 text-2xl sm:text-3xl font-bold text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
      >
        北纬·龙虾大赛（第一届）
      </motion.p>

      {/* 时间信息 */}
      <motion.div
        className="absolute top-80 inline-flex items-center gap-2 px-5 py-2.5 rounded-full"
        style={{
          background: "rgba(255,88,51,0.15)",
          border: "2px solid rgba(255,88,51,0.4)",
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.9 }}
        transition={{ delay: 0.9, duration: 0.6 }}
      >
        <span className="material-symbols-outlined text-primary text-lg">
          calendar_today
        </span>
        <span className="font-mono text-base font-bold tracking-wide text-primary">
          2026年3月11日 — 3月22日
        </span>
      </motion.div>

      {/* 进入按钮 */}
      <motion.button
        className="absolute top-96 relative px-16 py-5 font-black text-xl rounded-2xl text-white overflow-hidden group"
        style={{
          background: "linear-gradient(135deg, #ff5833 0%, #ff7849 100%)",
          boxShadow:
            "0 8px 32px rgba(255,88,51,0.5), 0 0 80px rgba(255,88,51,0.2)",
          border: "2px solid rgba(255,88,51,0.8)",
        }}
        initial={{ opacity: 0, scale: 0.85, y: 10 }}
        animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.85, y: isActive ? 0 : 10 }}
        transition={{ delay: 1.3, duration: 0.6, type: "spring", bounce: 0.5 }}
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onEnter}
      >
        {/* 闪光扫过效果 */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)",
          }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{
            duration: 1.8,
            delay: 2,
            repeat: Infinity,
            repeatDelay: 2,
          }}
        />
        <span className="relative z-10 flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl">
            rocket_launch
          </span>
          进入大赛
          <span className="material-symbols-outlined text-2xl group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </span>
      </motion.button>

      {/* 底部提示 */}
      <motion.p
        className="absolute bottom-8 text-slate-500 text-xs mt-6 font-mono text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ delay: 1.5, duration: 0.6 }}
      >
        点击按钮或按 ESC 键继续
      </motion.p>
    </div>
  );
}
