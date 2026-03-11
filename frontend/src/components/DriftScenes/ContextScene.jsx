import { motion } from "framer-motion";
import { Star, Users, Gavel, Building2 } from "lucide-react";
import LobsterCharacter from "../LobsterCharacter";

/**
 * ContextScene - 背景场景
 * 龙虾在中心，4个背景要点围绕显示
 */
export default function ContextScene({ isActive, lobsterPos }) {
  const points = [
    { icon: Star, text: "GitHub 星标 26万", angle: 0 },
    { icon: Users, text: "腾讯门口千人排队装机", angle: 90 },
    { icon: Gavel, text: "两会正在讨论它", angle: 180 },
    { icon: Building2, text: "大厂在疯抢它", angle: 270 },
  ];

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
            "radial-gradient(circle at 70% 50%, rgba(255,160,50,0.12) 0%, transparent 60%)",
        }}
      />

      {/* 龙虾角色 */}
      <LobsterCharacter
        size={100}
        x={lobsterPos.x}
        y={lobsterPos.y}
        rotation={0}
        opacity={isActive ? 1 : 0}
      />

      {/* 标签 */}
      <motion.span
        className="absolute top-20 font-mono text-xs tracking-[0.3em] uppercase"
        style={{ color: "rgba(255,88,51,0.7)" }}
        initial={{ opacity: 0, letterSpacing: "0.5em" }}
        animate={{
          opacity: isActive ? 1 : 0,
          letterSpacing: isActive ? "0.3em" : "0.5em",
        }}
        transition={{ duration: 0.6 }}
      >
        背景
      </motion.span>

      {/* 标题 */}
      <motion.div
        className="absolute top-32 text-center text-4xl sm:text-6xl font-black text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        全中国都在养虾
      </motion.div>

      {/* 4个要点围绕龙虾 */}
      {points.map((point, i) => {
        const radius = 200;
        const rad = (point.angle * Math.PI) / 180;
        const x = Math.cos(rad) * radius;
        const y = Math.sin(rad) * radius;

        return (
          <motion.div
            key={i}
            className="absolute flex items-center gap-3 px-4 py-3.5 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              width: 200,
            }}
            initial={{ opacity: 0, scale: 0.8, x: 0, y: 0 }}
            animate={{
              opacity: isActive ? 1 : 0,
              scale: isActive ? 1 : 0.8,
              x: isActive ? x : 0,
              y: isActive ? y : 0,
            }}
            transition={{
              delay: isActive ? 0.3 + i * 0.15 : 0,
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <point.icon
              className="flex-shrink-0"
              style={{ color: "#ff5833" }}
              size={18}
            />
            <span className="text-slate-300 text-sm font-medium">
              {point.text}
            </span>
          </motion.div>
        );
      })}

      {/* 底部文案 */}
      <motion.p
        className="absolute bottom-20 text-slate-500 text-base text-center max-w-2xl px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ delay: 0.8, duration: 0.7 }}
      >
        但到今天为止，没有一场官方龙虾比赛。
      </motion.p>
    </div>
  );
}
