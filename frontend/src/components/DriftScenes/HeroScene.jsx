import { motion } from "framer-motion";
import LobsterCharacter from "../LobsterCharacter";

/**
 * HeroScene - 英雄场景
 * 龙虾从左侧游入，展示"全网首个"
 */
export default function HeroScene({ isActive, lobsterPos, onComplete }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* 背景渐变 */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        style={{
          background: "radial-gradient(circle at 30% 50%, rgba(255,88,51,0.15) 0%, transparent 50%)",
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

      {/* 文本内容 */}
      <motion.div
        className="absolute text-center px-8 max-w-3xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <div className="text-6xl sm:text-8xl font-black tracking-tight text-white leading-none mb-2">
          全网首个。
        </div>
        <div className="text-6xl sm:text-8xl font-black tracking-tight leading-none mb-10" style={{ color: "#ff5833" }}>
          没有之二。
        </div>
        <p className="text-slate-400 text-base sm:text-xl leading-relaxed">
          目前全国没有任何一场有规模的官方龙虾赛事。
        </p>
      </motion.div>
    </div>
  );
}
