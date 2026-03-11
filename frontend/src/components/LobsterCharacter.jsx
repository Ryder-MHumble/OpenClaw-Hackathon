import { motion } from "framer-motion";

/**
 * LobsterCharacter - 可动画的龙虾角色
 * 用于漂流动画中的主角
 */
export default function LobsterCharacter({
  size = 80,
  x = 0,
  y = 0,
  rotation = 0,
  opacity = 1,
  animate = {},
  transition = {},
}) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: x,
        top: y,
        transform: `translate(-50%, -50%)`,
      }}
      animate={animate}
      transition={transition}
      initial={{ opacity: 0, scale: 0.8 }}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 80 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: "drop-shadow(0 8px 24px rgba(255, 88, 51, 0.3))",
          opacity,
        }}
        animate={{ rotate: rotation }}
        transition={{ duration: 0.3 }}
      >
        {/* ── 身体（头胸甲，横向椭圆） ── */}
        <ellipse cx="40" cy="30" rx="16" ry="10" fill="#ff5833" opacity="0.95" />

        {/* ── 腹部节段（向右延伸） ── */}
        <ellipse cx="56" cy="30" rx="7" ry="7.5" fill="#ff5833" opacity="0.9" />
        <ellipse cx="65" cy="30" rx="5" ry="6" fill="#ff5833" opacity="0.85" />
        <ellipse cx="72" cy="30" rx="3.5" ry="4.5" fill="#ff5833" opacity="0.8" />

        {/* ── 尾扇 ── */}
        <path d="M75 30 Q80 24 80 20 Q77 26 75 28Z" fill="#ff5833" opacity="0.75" />
        <path d="M75 30 Q80 30 82 28 Q79 30 76 31Z" fill="#ff5833" opacity="0.8" />
        <path d="M75 30 Q80 36 80 40 Q77 34 75 32Z" fill="#ff5833" opacity="0.75" />
        <path d="M75 30 Q82 27 84 24 Q80 28 76 29Z" fill="#ff5833" opacity="0.65" />
        <path d="M75 30 Q82 33 84 36 Q80 32 76 31Z" fill="#ff5833" opacity="0.65" />

        {/* ── 眼睛（头部左侧） ── */}
        <circle cx="26" cy="24" r="2.8" fill="#ff5833" />
        <circle cx="26" cy="24" r="1.3" fill="#1a0a06" />
        <circle cx="26.6" cy="23.4" r="0.5" fill="rgba(255,255,255,0.7)" />

        <circle cx="26" cy="36" r="2.8" fill="#ff5833" />
        <circle cx="26" cy="36" r="1.3" fill="#1a0a06" />
        <circle cx="26.6" cy="35.4" r="0.5" fill="rgba(255,255,255,0.7)" />

        {/* ── 触角（向左伸出） ── */}
        <path d="M25 23 Q16 16 6 10" stroke="#ff5833" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
        <path d="M25 37 Q16 44 6 50" stroke="#ff5833" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
        <path d="M25 24 Q18 20 12 14" stroke="#ff5833" strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />
        <path d="M25 36 Q18 40 12 46" stroke="#ff5833" strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />

        {/* ── 左大螯（上，向左前方伸出） ── */}
        <path d="M28 24 Q18 18 12 16 Q8 15 7 18 Q6 22 10 23 Q14 24 18 22 Q22 24 28 26"
          stroke="#ff5833" strokeWidth="2.8" strokeLinecap="round" fill="none" />
        {/* 螯钳上叶 */}
        <path d="M7 18 Q3 14 5 10 Q9 12 10 16Z" fill="#ff5833" />
        {/* 螯钳下叶 */}
        <path d="M7 18 Q2 20 3 24 Q7 24 9 21Z" fill="#ff5833" />

        {/* ── 右大螯（下，向左前方伸出） ── */}
        <path d="M28 36 Q18 42 12 44 Q8 45 7 42 Q6 38 10 37 Q14 36 18 38 Q22 36 28 34"
          stroke="#ff5833" strokeWidth="2.8" strokeLinecap="round" fill="none" />
        {/* 螯钳上叶 */}
        <path d="M7 42 Q3 46 5 50 Q9 48 10 44Z" fill="#ff5833" />
        {/* 螯钳下叶 */}
        <path d="M7 42 Q2 40 3 36 Q7 36 9 39Z" fill="#ff5833" />

        {/* ── 步足（上方 3 对） ── */}
        <path d="M36 22 Q34 16 32 12" stroke="#ff5833" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
        <path d="M40 21 Q39 15 38 11" stroke="#ff5833" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
        <path d="M44 21 Q44 15 44 11" stroke="#ff5833" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />

        {/* ── 步足（下方 3 对） ── */}
        <path d="M36 38 Q34 44 32 48" stroke="#ff5833" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
        <path d="M40 39 Q39 45 38 49" stroke="#ff5833" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
        <path d="M44 39 Q44 45 44 49" stroke="#ff5833" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
      </motion.svg>
    </motion.div>
  );
}
