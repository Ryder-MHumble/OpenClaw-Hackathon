import React from "react";
import { motion } from "framer-motion";
import LobsterCharacter from "../LobsterCharacter";

/**
 * CountUp - 数字计数动画
 */
function CountUp({ to, delay = 0, duration = 1.6 }) {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    let raf;
    const timer = setTimeout(() => {
      let startTs = null;
      const step = (ts) => {
        if (!startTs) startTs = ts;
        const p = Math.min((ts - startTs) / (duration * 1000), 1);
        const eased = 1 - Math.pow(1 - p, 4);
        setVal(Math.round(eased * to));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay * 1000);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [to, delay, duration]);
  return val.toLocaleString("zh-CN");
}

/**
 * PrizeScene - 奖金池场景
 * 龙虾周围展示奖金信息
 */
export default function PrizeScene({ isActive, lobsterPos }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* 背景渐变 */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(255,200,50,0.12) 0%, transparent 60%)",
        }}
      />

      {/* 龙虾角色 */}
      <LobsterCharacter
        size={110}
        x={lobsterPos.x}
        y={lobsterPos.y}
        rotation={0}
        opacity={isActive ? 1 : 0}
      />

      {/* 标签 */}
      <motion.span
        className="absolute top-20 font-mono text-xs tracking-[0.3em] uppercase"
        style={{ color: "rgba(255,88,51,0.7)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
        奖金池
      </motion.span>

      {/* 现金奖金 */}
      <motion.div
        className="absolute top-40 text-center flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.75 }}
        animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.75 }}
        transition={{ delay: 0.15, duration: 0.9, type: "spring", bounce: 0.3 }}
      >
        <div className="flex items-baseline gap-1 flex-wrap justify-center">
          <motion.span
            className="text-3xl sm:text-4xl font-black text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: isActive ? 1 : 0 }}
            transition={{ delay: 0.4 }}
          >
            现金 ¥
          </motion.span>
          <span
            className="font-black tabular-nums"
            style={{
              fontSize: "clamp(3rem, 10vw, 5rem)",
              color: "white",
              lineHeight: 1,
            }}
          >
            {isActive && <CountUp to={530000} delay={0.5} duration={1.5} />}
          </span>
        </div>

        {/* 下划线 */}
        <motion.div
          className="mt-2 h-0.5 w-3/4 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, #ff5833, transparent)",
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isActive ? 1 : 0 }}
          transition={{ delay: 0.7, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.div>

      {/* Token 奖励 */}
      <motion.div
        className="absolute top-64 px-6 py-3 rounded-2xl"
        style={{
          background: "rgba(255,88,51,0.1)",
          border: "1px solid rgba(255,88,51,0.22)",
        }}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 18 }}
        transition={{ delay: 0.85, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <span
          className="text-2xl sm:text-4xl font-black"
          style={{ color: "#ff5833" }}
        >
          + 千亿Token
        </span>
      </motion.div>

      {/* 描述文案 */}
      <motion.div
        className="absolute bottom-24 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <p className="text-slate-400 text-lg mb-2">
          10位获奖者，每人100亿Token
        </p>
        <p className="font-bold text-base" style={{ color: "#ff5833" }}>
          Token自由——从此养虾不花钱
        </p>
      </motion.div>
    </div>
  );
}
