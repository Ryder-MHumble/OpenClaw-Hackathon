import { motion } from "framer-motion";

// 减少粒子数量以提升性能
const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

// 生成波浪粒子 - 大幅减少数量
const WAVE_PARTICLES = Array.from({ length: isMobile ? 15 : 25 }, (_, i) => ({
  id: i,
  x: (i * 100) / (isMobile ? 15 : 25),
  baseY: 50 + Math.sin(i * 0.5) * 20,
  amplitude: 15 + Math.random() * 25,
  frequency: 0.02 + Math.random() * 0.03,
  phase: Math.random() * Math.PI * 2,
  size: 2 + Math.random() * 4,
  opacity: 0.1 + Math.random() * 0.3,
  duration: 8 + Math.random() * 12,
  delay: Math.random() * 5,
}));

// 额外的漂浮粒子 - 大幅减少数量
const FLOAT_PARTICLES = Array.from({ length: isMobile ? 10 : 20 }, (_, i) => ({
  id: i + 100,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 1 + Math.random() * 3,
  opacity: 0.05 + Math.random() * 0.15,
  duration: 10 + Math.random() * 15,
  delay: Math.random() * 8,
  moveX: (Math.random() - 0.5) * 40,
  moveY: (Math.random() - 0.5) * 60,
}));

export default function ParticleWaves() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none will-change-transform">
      {/* 波浪粒子 */}
      {WAVE_PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, rgba(255,88,51,${p.opacity * 1.2}), rgba(255,120,80,${p.opacity * 0.6}))`,
            boxShadow: `0 0 ${p.size * 3}px rgba(255,88,51,${p.opacity * 0.8})`,
            willChange: "transform",
          }}
          animate={{
            y: [
              `${p.baseY - p.amplitude}%`,
              `${p.baseY + p.amplitude}%`,
              `${p.baseY - p.amplitude}%`,
            ],
            opacity: [p.opacity * 0.4, p.opacity * 1.5, p.opacity * 0.4],
            scale: [0.8, 1.4, 0.8],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* 漂浮粒子 */}
      {FLOAT_PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, rgba(255,160,80,${p.opacity * 1.5}), rgba(255,200,120,${p.opacity * 0.5}))`,
            boxShadow: `0 0 ${p.size * 2}px rgba(255,160,80,${p.opacity})`,
            willChange: "transform",
          }}
          animate={{
            x: [0, p.moveX, 0],
            y: [0, p.moveY, 0],
            opacity: [p.opacity * 0.3, p.opacity * 2, p.opacity * 0.3],
            scale: [0.6, 1.6, 0.6],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* 渐变波浪层 */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 20% 30%, rgba(255,88,51,0.08) 0%, transparent 50%),
            radial-gradient(ellipse 100% 70% at 80% 70%, rgba(255,160,80,0.06) 0%, transparent 50%),
            radial-gradient(ellipse 90% 60% at 50% 50%, rgba(255,120,60,0.04) 0%, transparent 50%)
          `,
        }}
        animate={{
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* 动态渐变光晕 */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(255,88,51,0.15) 0%, rgba(255,120,80,0.08) 30%, transparent 70%)`,
          filter: "blur(60px)",
        }}
        animate={{
          x: ["10%", "70%", "10%"],
          y: ["20%", "60%", "20%"],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(255,160,80,0.12) 0%, rgba(255,200,120,0.06) 30%, transparent 70%)`,
          filter: "blur(50px)",
        }}
        animate={{
          x: ["60%", "20%", "60%"],
          y: ["60%", "30%", "60%"],
          scale: [1.2, 1, 1.2],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
