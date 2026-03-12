import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LobsterCharacter from "./LobsterCharacter";

// ─── Scene 数据 ────────────────────────────────────────────────────────────────
const SCENES = [
  {
    id: 0,
    type: "hero",
    title: "官方举办",
    subtitle: "有规模",
    desc: "国内首场有规模的官方龙虾赛事，正式开赛。",
    duration: 4200,
    accent: "#ff5833",
  },
  {
    id: 1,
    type: "context",
    title: "全中国都在养虾",
    points: [
      { emoji: "⭐", text: "GitHub 星标 26万" },
      { emoji: "🏢", text: "腾讯门口千人排队装机" },
      { emoji: "🏛️", text: "两会正在讨论它" },
      { emoji: "🚀", text: "大厂在疯抢它" },
    ],
    duration: 4800,
    accent: "#ff8c42",
  },
  {
    id: 2,
    type: "prize",
    title: "千亿Token",
    countTarget: 1000000000,
    desc: "10位获奖者，每人100亿Token",
    accent: "Token自由——从此养虾不花钱",
    duration: 4500,
    color: "#ffd700",
  },
  {
    id: 3,
    type: "why",
    title: "为什么不一样",
    points: [
      { emoji: "🏆", text: "官方举办的有规模龙虾赛事" },
      { emoji: "🌍", text: "人人可参与，不限身份、年龄、技术背景" },
      { emoji: "💡", text: "正向叙事：一人加一虾等于一支团队" },
      { emoji: "🔧", text: "鼓励龙虾接入硬件设备，打开想象边界" },
    ],
    duration: 4800,
    accent: "#50c87a",
  },
  {
    id: 4,
    type: "safety",
    title: "安全与负责任使用",
    principles: [
      {
        emoji: "🔒",
        title: "数据安全",
        desc: "严禁非法获取或泄露用户隐私数据；运行环境做好权限隔离",
      },
      {
        emoji: "⚖️",
        title: "合规使用",
        desc: "不违法、不违背公序良俗，仅用可信插件",
      },
      {
        emoji: "👁️",
        title: "透明可控",
        desc: "鼓励清晰展示\u201c虾\u201d的行为边界与安全机制",
      },
      {
        emoji: "🤝",
        title: "社会责任",
        desc: "鼓励用\u201c虾\u201d创造社会价值",
      },
      {
        emoji: "📚",
        title: "尊重知识产权",
        desc: "生成内容须尊重原创版权，组委会保留取消违规作品资格的权利",
      },
    ],
    duration: 5500,
    accent: "#64c8a0",
  },
  {
    id: 5,
    type: "cta",
    title: "谁是虾王？",
    subtitle: "北纬·龙虾大赛（第一届）",
    accent: "2026年3月11日 — 3月22日",
    duration: null,
  },
];

// ─── Aurora 背景 ────────────────────────────────────────────────────────────────
function AuroraBackground({ sceneIdx }) {
  const colors = [
    ["rgba(255,88,51,0.35)", "rgba(255,120,60,0.2)", "rgba(255,50,20,0.15)"],
    ["rgba(255,140,66,0.3)", "rgba(255,88,51,0.25)", "rgba(200,60,20,0.1)"],
    ["rgba(255,215,0,0.25)", "rgba(255,160,50,0.3)", "rgba(255,88,51,0.15)"],
    ["rgba(80,200,122,0.25)", "rgba(60,180,100,0.2)", "rgba(255,88,51,0.1)"],
    ["rgba(100,200,160,0.2)", "rgba(80,180,140,0.18)", "rgba(60,120,100,0.12)"],
    ["rgba(255,88,51,0.4)", "rgba(255,120,60,0.3)", "rgba(200,40,10,0.2)"],
  ];
  const c = colors[sceneIdx] || colors[0];

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 基础深色背景 */}
      <div className="absolute inset-0" style={{ background: "#080706" }} />

      {/* Aurora 光晕 1 */}
      <motion.div
        className="absolute rounded-full"
        animate={{
          x: ["-10%", "15%", "-5%", "-10%"],
          y: ["-20%", "10%", "-15%", "-20%"],
          scale: [1, 1.3, 0.9, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: "80vw",
          height: "80vw",
          left: "-20%",
          top: "-30%",
          background: `radial-gradient(circle, ${c[0]} 0%, transparent 65%)`,
          filter: "blur(40px)",
        }}
      />

      {/* Aurora 光晕 2 */}
      <motion.div
        className="absolute rounded-full"
        animate={{
          x: ["20%", "-10%", "30%", "20%"],
          y: ["30%", "60%", "20%", "30%"],
          scale: [0.8, 1.2, 1, 0.8],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        style={{
          width: "70vw",
          height: "70vw",
          right: "-25%",
          bottom: "-20%",
          background: `radial-gradient(circle, ${c[1]} 0%, transparent 65%)`,
          filter: "blur(50px)",
        }}
      />

      {/* Aurora 光晕 3 - 中心 */}
      <motion.div
        className="absolute rounded-full"
        animate={{
          scale: [1, 1.4, 0.8, 1],
          opacity: [0.4, 0.7, 0.3, 0.4],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        style={{
          width: "50vw",
          height: "50vw",
          left: "25%",
          top: "20%",
          background: `radial-gradient(circle, ${c[2]} 0%, transparent 65%)`,
          filter: "blur(60px)",
        }}
      />

      {/* 噪点纹理叠加 */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* 场景切换遮罩 */}
      <motion.div
        key={sceneIdx}
        className="absolute inset-0"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ background: "#080706" }}
      />
    </div>
  );
}

// ─── 浮动粒子 ────────────────────────────────────────────────────────────────
const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
const PARTICLE_COUNT = isMobile ? 12 : 25;

const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 1 + Math.random() * 2.5,
  dur: 6 + Math.random() * 8,
  delay: Math.random() * 5,
  opacity: 0.04 + Math.random() * 0.12,
  drift: (Math.random() - 0.5) * 60,
}));

function FloatingParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `rgba(255,${100 + Math.random() * 80},${50 + Math.random() * 50},${p.opacity})`,
            boxShadow: `0 0 ${p.size * 3}px rgba(255,88,51,${p.opacity * 0.5})`,
          }}
          animate={{
            y: [0, -100 - Math.random() * 60, 0],
            x: [0, p.drift, 0],
            opacity: [0, p.opacity * 2, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: p.dur,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* 水平扫描线 */}
      {[0.25, 0.5, 0.75].map((pos, i) => (
        <motion.div
          key={`line-${i}`}
          className="absolute left-0 right-0"
          style={{
            top: `${pos * 100}%`,
            height: "1px",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,88,51,0.06) 30%, rgba(255,88,51,0.12) 50%, rgba(255,88,51,0.06) 70%, transparent 100%)",
          }}
          animate={{ opacity: [0, 1, 0], scaleX: [0.3, 1, 0.3] }}
          transition={{
            duration: 4 + i * 2,
            repeat: Infinity,
            delay: i * 1.5,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── 数字计数动画 ─────────────────────────────────────────────────────────────
function CountUp({ target, duration = 2, delay = 0.3, suffix = "" }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = null;
    let rafId;
    const startTime = performance.now() + delay * 1000;

    const tick = (now) => {
      if (now < startTime) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      if (!start) start = now;
      const elapsed = now - start;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(eased * target));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration, delay]);

  const formatted =
    count >= 1e8
      ? `${(count / 1e8).toFixed(0)}亿`
      : count >= 1e4
        ? `${(count / 1e4).toFixed(0)}万`
        : count.toLocaleString();

  return (
    <span>
      {formatted}
      {suffix}
    </span>
  );
}

// ─── Scene Components ────────────────────────────────────────────────────────

function HeroScene({ scene }) {
  return (
    <motion.div
      key="hero"
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.7 }}
    >
      {/* 大标题 */}
      <div className="overflow-hidden mb-1">
        <motion.div
          className="text-6xl sm:text-8xl lg:text-9xl font-black tracking-tighter text-white leading-none"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {scene.title}
        </motion.div>
      </div>

      <div className="overflow-hidden mb-10">
        <motion.div
          className="text-6xl sm:text-8xl lg:text-9xl font-black tracking-tighter leading-none"
          style={{ color: "#ff5833" }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        >
          {scene.subtitle}
        </motion.div>
      </div>

      {/* 分隔线 */}
      <motion.div
        className="mb-8"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        style={{
          width: 80,
          height: 2,
          background:
            "linear-gradient(90deg, transparent, #ff5833, transparent)",
        }}
      />

      <motion.p
        className="text-slate-300 text-base sm:text-xl leading-relaxed max-w-xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        {scene.desc}
      </motion.p>

      {/* 角标 */}
      <motion.div
        className="absolute bottom-16 left-8 flex items-center gap-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        <div
          style={{
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: "#ff5833",
          }}
        />
        <span
          style={{
            color: "rgba(255,255,255,0.25)",
            fontSize: "0.6rem",
            letterSpacing: "0.2em",
            fontFamily: "monospace",
          }}
        >
          OPENCLAW HACKATHON
        </span>
      </motion.div>
    </motion.div>
  );
}

function ContextScene({ scene }) {
  return (
    <motion.div
      key="context"
      className="absolute inset-0 flex flex-col items-center justify-center px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.6 }}
    >
      <div className="overflow-hidden mb-12">
        <motion.h2
          className="text-4xl sm:text-6xl font-black text-white text-center"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {scene.title}
        </motion.h2>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-xl w-full">
        {scene.points.map((p, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-3 px-5 py-4 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,88,51,0.2)",
              backdropFilter: "blur(10px)",
            }}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: 0.25 + i * 0.1,
              duration: 0.55,
              ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={{
              scale: 1.02,
              border: "1px solid rgba(255,88,51,0.4)",
            }}
          >
            <span style={{ fontSize: "1.3rem" }}>{p.emoji}</span>
            <span className="text-slate-200 text-sm font-medium leading-snug">
              {p.text}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function PrizeScene({ scene }) {
  return (
    <motion.div
      key="prize"
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.6 }}
    >
      {/* 背景光圈 */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: "60vmin",
          height: "60vmin",
          background:
            "radial-gradient(circle, rgba(255,215,0,0.12) 0%, transparent 70%)",
        }}
      />

      <motion.div
        className="text-5xl sm:text-7xl font-black mb-4 leading-none"
        style={{ color: "#ffd700", textShadow: "0 0 60px rgba(255,215,0,0.4)" }}
        initial={{ scale: 0.5, opacity: 0, filter: "blur(20px)" }}
        animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {scene.title}
      </motion.div>

      {/* 计数器 */}
      <motion.div
        className="text-7xl sm:text-9xl font-black text-white mb-6"
        style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <CountUp target={scene.countTarget} duration={2.2} delay={0.4} />
      </motion.div>

      <motion.p
        className="text-slate-300 text-lg mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {scene.desc}
      </motion.p>

      <motion.div
        className="inline-flex items-center gap-2 px-5 py-2 rounded-full mt-2"
        style={{
          background: "rgba(255,215,0,0.1)",
          border: "1px solid rgba(255,215,0,0.3)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <span style={{ color: "#ffd700", fontSize: "0.9rem", fontWeight: 700 }}>
          ✨ {scene.accent}
        </span>
      </motion.div>
    </motion.div>
  );
}

function WhyScene({ scene }) {
  return (
    <motion.div
      key="why"
      className="absolute inset-0 flex flex-col items-center justify-center px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="overflow-hidden mb-10">
        <motion.h2
          className="text-4xl sm:text-5xl font-black text-white text-center"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {scene.title}
        </motion.h2>
      </div>

      <div className="space-y-3 max-w-lg w-full">
        {scene.points.map((p, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-4 px-5 py-4 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,88,51,0.15)",
            }}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.2 + i * 0.12,
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>{p.emoji}</span>
            <div
              style={{
                width: 1,
                height: 28,
                background: "rgba(255,88,51,0.3)",
                flexShrink: 0,
              }}
            />
            <span className="text-slate-200 text-sm sm:text-base font-medium leading-snug">
              {p.text}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function SafetyScene({ scene }) {
  return (
    <motion.div
      key="safety"
      className="absolute inset-0 flex flex-col items-center justify-center px-6 py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="overflow-hidden mb-2">
        <motion.h2
          className="text-3xl sm:text-4xl font-black text-white text-center"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ duration: 0.7 }}
        >
          {scene.title}
        </motion.h2>
      </div>

      <motion.p
        className="text-slate-500 text-xs mb-8 tracking-widest uppercase font-mono"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        参赛作品须严格遵守以下原则
      </motion.p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl w-full">
        {scene.principles.map((p, i) => (
          <motion.div
            key={i}
            className="p-4 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.035)",
              border: "1px solid rgba(100,200,160,0.15)",
              backdropFilter: "blur(8px)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.08, duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span style={{ fontSize: "1.1rem" }}>{p.emoji}</span>
              <h3 className="text-sm font-bold text-white">{p.title}</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.p
        className="text-slate-600 text-xs font-mono mt-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        参赛者须对作品安全负责
      </motion.p>
    </motion.div>
  );
}

function CtaScene({ scene, onEnter }) {
  return (
    <motion.div
      key="cta"
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
    >
      {/* 光束扫描 */}
      <motion.div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              top: 0,
              bottom: 0,
              width: "30vw",
              background: `linear-gradient(90deg, transparent 0%, rgba(255,88,51,0.06) 50%, transparent 100%)`,
              transform: "skewX(-15deg)",
            }}
            animate={{ x: ["-40vw", "150vw"] }}
            transition={{
              duration: 3,
              delay: i * 0.8,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      {/* 大标题 */}
      <div className="overflow-hidden mb-4">
        <motion.div
          className="font-black text-white leading-none"
          style={{ fontSize: "clamp(3.5rem, 12vw, 7rem)" }}
          initial={{ y: "110%" }}
          animate={{ y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          {scene.title}
        </motion.div>
      </div>

      <motion.p
        className="text-slate-200 text-xl sm:text-2xl font-bold mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.6 }}
      >
        {scene.subtitle}
      </motion.p>

      {/* 日期徽章 */}
      <motion.div
        className="inline-flex items-center gap-3 px-6 py-3 rounded-full mb-10"
        style={{
          background: "rgba(255,88,51,0.1)",
          border: "1.5px solid rgba(255,88,51,0.35)",
          backdropFilter: "blur(12px)",
        }}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="rounded-full"
          style={{ width: 6, height: 6, background: "#ff5833" }}
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span
          style={{
            color: "#ff5833",
            fontWeight: 700,
            fontSize: "0.95rem",
            letterSpacing: "0.05em",
          }}
        >
          {scene.accent}
        </span>
      </motion.div>

      {/* 进入按钮 */}
      <motion.button
        className="relative px-14 py-5 font-black text-lg rounded-2xl text-white overflow-hidden group"
        style={{
          background:
            "linear-gradient(135deg, #ff5833 0%, #ff7849 60%, #ff9060 100%)",
          boxShadow:
            "0 8px 40px rgba(255,88,51,0.5), 0 0 0 1px rgba(255,88,51,0.3)",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{
          scale: 1.05,
          boxShadow:
            "0 12px 60px rgba(255,88,51,0.7), 0 0 0 1px rgba(255,88,51,0.5)",
        }}
        whileTap={{ scale: 0.96 }}
        onClick={onEnter}
      >
        {/* 光泽扫过效果 */}
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)",
          }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
        />
        <span className="relative z-10 tracking-wide">进入大赛</span>
      </motion.button>

      <motion.p
        className="text-slate-600 text-xs mt-6 font-mono tracking-wider"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        按 ESC 键快速跳过
      </motion.p>
    </motion.div>
  );
}

// ─── 龙虾 ────────────────────────────────────────────────────────────────────
function FloatingLobster({ sceneIdx }) {
  const positions = [
    { x: "12%", y: "48%" },
    { x: "82%", y: "35%" },
    { x: "50%", y: "72%" },
    { x: "18%", y: "60%" },
    { x: "75%", y: "55%" },
    { x: "50%", y: "42%" },
  ];
  const pos = positions[sceneIdx] || positions[0];

  return (
    <motion.div
      className="absolute z-20 pointer-events-none"
      animate={{ left: pos.x, top: pos.y }}
      transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
      style={{ transform: "translate(-50%, -50%)" }}
    >
      {/* 光晕 */}
      <motion.div
        className="absolute rounded-full"
        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: 90,
          height: 90,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(255,88,51,0.15) 0%, transparent 70%)",
          filter: "blur(8px)",
        }}
      />
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <LobsterCharacter size={isMobile ? 100 : 130} opacity={1} />
      </motion.div>
    </motion.div>
  );
}

// ─── 主组件 ──────────────────────────────────────────────────────────────────
export default function WelcomeAnimation({ onDone }) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [exiting, setExiting] = useState(false);

  const handleEnter = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    localStorage.setItem("lobster_welcome_seen", "1");
    setTimeout(onDone, 800);
  }, [exiting, onDone]);

  // 自动推进场景
  useEffect(() => {
    const scene = SCENES[sceneIdx];
    if (!scene.duration) return;
    const t = setTimeout(
      () => setSceneIdx((s) => Math.min(s + 1, SCENES.length - 1)),
      scene.duration,
    );
    return () => clearTimeout(t);
  }, [sceneIdx]);

  // ESC 退出
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") handleEnter();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [handleEnter]);

  const scene = SCENES[sceneIdx];

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.7 }}
          className="fixed inset-0 z-[200] overflow-hidden"
        >
          {/* Aurora 背景 */}
          <AuroraBackground sceneIdx={sceneIdx} />

          {/* 粒子 */}
          <FloatingParticles />

          {/* 格纹 */}
          <div className="absolute inset-0 dot-grid opacity-[0.15] pointer-events-none" />

          {/* 顶部进度条 */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <motion.div
              className="h-full"
              animate={{ width: `${((sceneIdx + 1) / SCENES.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ background: "linear-gradient(90deg, #ff5833, #ff9060)" }}
            />
          </div>

          {/* 跳过按钮 */}
          <motion.button
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={handleEnter}
            className="absolute top-5 right-5 sm:top-6 sm:right-8 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
            style={{
              color: "rgba(148,163,184,0.4)",
              fontSize: "0.65rem",
              letterSpacing: "0.18em",
              border: "1px solid rgba(148,163,184,0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(148,163,184,0.8)";
              e.currentTarget.style.borderColor = "rgba(148,163,184,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(148,163,184,0.4)";
              e.currentTarget.style.borderColor = "rgba(148,163,184,0.1)";
            }}
          >
            跳过
          </motion.button>

          {/* 龙虾 */}
          <FloatingLobster sceneIdx={sceneIdx} />

          {/* 场景内容 */}
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              {scene.type === "hero" && (
                <HeroScene key={sceneIdx} scene={scene} />
              )}
              {scene.type === "context" && (
                <ContextScene key={sceneIdx} scene={scene} />
              )}
              {scene.type === "prize" && (
                <PrizeScene key={sceneIdx} scene={scene} />
              )}
              {scene.type === "why" && (
                <WhyScene key={sceneIdx} scene={scene} />
              )}
              {scene.type === "safety" && (
                <SafetyScene key={sceneIdx} scene={scene} />
              )}
              {scene.type === "cta" && (
                <CtaScene key={sceneIdx} scene={scene} onEnter={handleEnter} />
              )}
            </AnimatePresence>
          </div>

          {/* 底部指示器 */}
          <div className="absolute bottom-7 left-0 right-0 flex justify-center gap-2 z-10">
            {SCENES.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => setSceneIdx(i)}
                className="rounded-full transition-all duration-300 cursor-pointer"
                animate={{
                  width: i === sceneIdx ? 28 : 6,
                  opacity: i <= sceneIdx ? 1 : 0.25,
                  backgroundColor:
                    i === sceneIdx
                      ? "#ff5833"
                      : i < sceneIdx
                        ? "rgba(255,88,51,0.5)"
                        : "rgba(255,255,255,0.15)",
                }}
                style={{
                  height: 4,
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
                whileHover={{ opacity: 0.9 }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
