import { motion } from "framer-motion";
import { Trophy, Infinity, Lightbulb, Cpu } from "lucide-react";
import LobsterCharacter from "../LobsterCharacter";

/**
 * WhyScene - 为什么不一样场景
 * 龙虾游过4个特色点
 */
export default function WhyScene({ isActive, lobsterPos }) {
  const points = [
    { icon: Trophy, text: "官方举办的有规模龙虾赛事" },
    { icon: Infinity, text: "人人可参与，不限身份、年龄、技术背景" },
    { icon: Lightbulb, text: "正向叙事：一人加一虾等于一支团队" },
    { icon: Cpu, text: "鼓励龙虾接入硬件设备，打开想象边界" },
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
            "radial-gradient(circle at 30% 60%, rgba(80,200,140,0.08) 0%, transparent 60%)",
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
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
        为什么不一样
      </motion.span>

      {/* 4个特色点 - 垂直排列 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8">
        {points.map((point, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-4 px-5 py-4 rounded-xl max-w-xl"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
            initial={{ opacity: 0, x: -24, scale: 0.97 }}
            animate={{
              opacity: isActive ? 1 : 0,
              x: isActive ? 0 : -24,
              scale: isActive ? 1 : 0.97,
            }}
            transition={{
              delay: isActive ? 0.15 + i * 0.2 : 0,
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <motion.div
              className="flex-shrink-0"
              style={{ color: "#ff5833" }}
              initial={{ scale: 0, rotate: -20 }}
              animate={{
                scale: isActive ? 1 : 0,
                rotate: isActive ? 0 : -20,
              }}
              transition={{
                delay: isActive ? 0.3 + i * 0.2 : 0,
                duration: 0.5,
                type: "spring",
                bounce: 0.5,
              }}
            >
              <point.icon size={20} />
            </motion.div>
            <span className="text-slate-200 text-sm sm:text-base font-medium leading-snug">
              {point.text}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
