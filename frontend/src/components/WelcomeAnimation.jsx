import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LobsterCharacter from "./LobsterCharacter";

const SCENES = [
  {
    id: 0,
    type: "hero",
    title: "全网首个",
    subtitle: "没有之二",
    desc: "目前全国没有任何一场有规模的官方龙虾赛事。",
    duration: 4000,
    bgGradient:
      "radial-gradient(circle at 20% 50%, rgba(255,88,51,0.2) 0%, transparent 50%)",
  },
  {
    id: 1,
    type: "context",
    title: "全中国都在养虾",
    points: [
      { icon: "star", text: "GitHub 星标 26万" },
      { icon: "groups", text: "腾讯门口千人排队装机" },
      { icon: "gavel", text: "两会正在讨论它" },
      { icon: "corporate_fare", text: "大厂在疯抢它" },
    ],
    duration: 4500,
    bgGradient:
      "radial-gradient(circle at 80% 50%, rgba(255,160,50,0.15) 0%, transparent 50%)",
  },
  {
    id: 2,
    type: "prize",
    title: "530000",
    subtitle: "千亿 GLM-5 Token",
    desc: "10位获奖者，每人100亿Token",
    accent: "Token自由——从此养虾不花钱",
    duration: 4200,
    bgGradient:
      "radial-gradient(circle at 50% 40%, rgba(255,200,50,0.15) 0%, transparent 50%)",
  },
  {
    id: 3,
    type: "why",
    title: "为什么不一样",
    points: [
      { icon: "emoji_events", text: "全网首个有规模的官方龙虾赛事" },
      { icon: "all_inclusive", text: "人人可参与，不限身份、年龄、技术背景" },
      { icon: "lightbulb", text: "正向叙事：一人加一虾等于一支团队" },
      { icon: "hardware", text: "鼓励龙虾接入硬件设备，打开想象边界" },
    ],
    duration: 4500,
    bgGradient:
      "radial-gradient(circle at 20% 60%, rgba(80,200,140,0.1) 0%, transparent 50%)",
  },
  {
    id: 4,
    type: "safety",
    title: "安全与负责任使用",
    principles: [
      {
        icon: "lock",
        title: "数据安全",
        desc: "严禁非法获取或泄露用户隐私数据。参赛作品不得将 OpenClaw 暴露于公网，运行环境须做好权限隔离。",
      },
      {
        icon: "balance",
        title: "合规使用",
        desc: "不得用于违反法律法规及公序良俗的用途。严格管理插件来源，仅使用经可信渠道验证的扩展程序。",
      },
      {
        icon: "target",
        title: "透明可控",
        desc: "鼓励清晰展示虾的行为边界与安全机制。懂得有所不为、知道边界在哪里的虾，才是可靠的虾。",
      },
      {
        icon: "library_books",
        title: "尊重知识产权",
        desc: "虾所生成的内容应充分尊重原创版权与创作者权益。",
      },
      {
        icon: "handshake",
        title: "社会责任",
        desc: "以虾助力弱势群体、提升公共服务效率的作品，将获得评审的额外关注。",
      },
    ],
    duration: 5000,
    bgGradient:
      "radial-gradient(circle at 80% 60%, rgba(100,200,150,0.12) 0%, transparent 50%)",
  },
  {
    id: 5,
    type: "cta",
    title: "谁是虾王？",
    subtitle: "北纬·龙虾大赛（第一届）",
    accent: "2026年3月11日 — 3月22日",
    duration: null,
    bgGradient:
      "radial-gradient(circle at 50% 50%, rgba(255,88,51,0.2) 0%, transparent 50%)",
  },
];

const PARTICLES = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 0.5 + Math.random() * 3,
  dur: 3 + Math.random() * 5,
  delay: Math.random() * 4,
  opacity: 0.03 + Math.random() * 0.12,
}));

function Particles() {
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
            background: `radial-gradient(circle, rgba(255,88,51,${p.opacity * 1.5}), rgba(255,160,80,${p.opacity * 0.8}))`,
            boxShadow: `0 0 ${p.size * 2}px rgba(255,88,51,${p.opacity * 0.6})`,
          }}
          animate={{
            y: [0, -120, 0],
            x: [0, Math.sin(p.id) * 30, 0],
            opacity: [p.opacity * 0.3, p.opacity * 2.5, p.opacity * 0.3],
            scale: [0.8, 1.8, 0.6],
          }}
          transition={{
            duration: p.dur,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function HeroContent({ scene }) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="text-6xl sm:text-8xl font-black tracking-tight text-white leading-none mb-2"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        {scene.title}
      </motion.div>
      <motion.div
        className="text-6xl sm:text-8xl font-black tracking-tight leading-none mb-10"
        style={{ color: "#ff5833" }}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        {scene.subtitle}
      </motion.div>
      <motion.p
        className="text-slate-400 text-base sm:text-xl leading-relaxed max-w-2xl"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        {scene.desc}
      </motion.p>
    </motion.div>
  );
}

function ContextContent({ scene }) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-8"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.h2
        className="text-4xl sm:text-6xl font-black text-white mb-12 text-center"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        {scene.title}
      </motion.h2>

      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        {scene.points.map((p, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-3 px-4 py-3 rounded-lg"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,88,51,0.2)",
            }}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{
              delay: 0.3 + i * 0.15,
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <span
              className="material-symbols-outlined text-lg flex-shrink-0"
              style={{ color: "#ff5833" }}
            >
              {p.icon}
            </span>
            <span className="text-slate-300 text-sm font-medium">{p.text}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function PrizeContent({ scene }) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="text-6xl sm:text-8xl font-black text-white mb-4"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        ¥{scene.title}
      </motion.div>
      <motion.div
        className="text-3xl sm:text-4xl font-black mb-8"
        style={{ color: "#ff5833" }}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        {scene.subtitle}
      </motion.div>
      <motion.p
        className="text-slate-400 text-lg mb-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        {scene.desc}
      </motion.p>
      <motion.p
        className="font-bold text-base"
        style={{ color: "#ff5833" }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        {scene.accent}
      </motion.p>
    </motion.div>
  );
}

function WhyContent({ scene }) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-8"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.h2
        className="text-4xl sm:text-5xl font-black text-white mb-8 text-center"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        {scene.title}
      </motion.h2>

      <div className="space-y-3 max-w-2xl">
        {scene.points.map((p, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-4 px-5 py-4 rounded-lg"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,88,51,0.15)",
            }}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{
              delay: 0.3 + i * 0.15,
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <span
              className="material-symbols-outlined text-xl flex-shrink-0"
              style={{ color: "#ff5833" }}
            >
              {p.icon}
            </span>
            <span className="text-slate-200 text-sm sm:text-base font-medium">
              {p.text}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function SafetyContent({ scene }) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-6 py-12"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.h2
        className="text-3xl sm:text-4xl font-black text-white mb-2 text-center flex items-center justify-center gap-2"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <span
          className="material-symbols-outlined"
          style={{ color: "#ff5833" }}
        >
          security
        </span>
        {scene.title}
      </motion.h2>
      <p className="text-slate-400 text-sm mb-8">参赛作品须严格遵守以下原则</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl">
        {scene.principles.map((p, i) => (
          <motion.div
            key={i}
            className="p-4 rounded-lg backdrop-blur-sm"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,88,51,0.15)",
            }}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{
              delay: 0.3 + i * 0.1,
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="material-symbols-outlined text-lg"
                style={{ color: "#ff5833" }}
              >
                {p.icon}
              </span>
              <h3 className="text-base font-bold text-white">{p.title}</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {p.desc}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.p
        className="text-slate-500 text-xs font-mono mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        组委会将对违反上述原则的作品保留取消参赛资格的权利
      </motion.p>
    </motion.div>
  );
}

function CtaContent({ scene, onEnter }) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="text-6xl sm:text-8xl font-black text-white mb-6 leading-none"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        {scene.title}
      </motion.div>

      <motion.p
        className="text-slate-200 text-2xl sm:text-3xl font-bold mb-6"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        {scene.subtitle}
      </motion.p>

      <motion.div
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-8"
        style={{
          background: "rgba(255,88,51,0.15)",
          border: "2px solid rgba(255,88,51,0.4)",
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="material-symbols-outlined text-primary text-lg">
          calendar_today
        </span>
        <span className="font-mono text-base font-bold tracking-wide text-primary">
          {scene.accent}
        </span>
      </motion.div>

      <motion.button
        className="relative px-16 py-5 font-black text-xl rounded-2xl text-white overflow-hidden group"
        style={{
          background: "linear-gradient(135deg, #ff5833 0%, #ff7849 100%)",
          boxShadow:
            "0 8px 32px rgba(255,88,51,0.5), 0 0 80px rgba(255,88,51,0.2)",
          border: "2px solid rgba(255,88,51,0.8)",
        }}
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 1, type: "spring", bounce: 0.5 }}
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onEnter}
      >
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)",
          }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{
            duration: 1.8,
            delay: 1.5,
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

      <motion.p
        className="text-slate-500 text-xs mt-6 font-mono"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        点击按钮或按 ESC 键继续
      </motion.p>
    </motion.div>
  );
}

export default function WelcomeAnimation({ onDone }) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [exiting, setExiting] = useState(false);

  const handleEnter = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    localStorage.setItem("lobster_welcome_seen", "1");
    setTimeout(onDone, 750);
  }, [exiting, onDone]);

  useEffect(() => {
    const scene = SCENES[sceneIdx];
    if (!scene.duration) return;
    const t = setTimeout(
      () => setSceneIdx((s) => Math.min(s + 1, SCENES.length - 1)),
      scene.duration,
    );
    return () => clearTimeout(t);
  }, [sceneIdx]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleEnter();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleEnter]);

  const scene = SCENES[sceneIdx];
  const progress = ((sceneIdx + 1) / SCENES.length) * 100;
  const lobsterX =
    sceneIdx === 0 ? "10%" : sceneIdx === 5 ? "50%" : `${15 + sceneIdx * 15}%`;

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "#0c0a09" }}
        >
          {/* 主背景渐变 - 带平滑过渡 */}
          <motion.div
            className="absolute inset-0"
            animate={{
              background: scene.bgGradient,
            }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />

          {/* 额外的动态渐变层 */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 100% 80% at 30% 40%, rgba(255,88,51,0.12) 0%, transparent 60%),
                radial-gradient(ellipse 80% 60% at 70% 60%, rgba(255,160,80,0.08) 0%, transparent 50%)
              `,
            }}
            animate={{
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <Particles />

          <div className="absolute inset-0 dot-grid opacity-25 pointer-events-none" />

          <div
            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,88,51,0.5), transparent)",
            }}
          />

          <div
            className="absolute top-0 left-0 right-0 h-0.5"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <motion.div
              className="h-full"
              initial={{ width: `${(sceneIdx / SCENES.length) * 100}%` }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: "#ff5833" }}
            />
          </div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onClick={handleEnter}
            className="absolute top-5 right-5 sm:top-6 sm:right-8 flex items-center gap-1.5 z-10 transition-colors"
            style={{
              color: "rgba(148,163,184,0.5)",
              fontSize: "0.7rem",
              letterSpacing: "0.15em",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "rgba(148,163,184,0.9)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "rgba(148,163,184,0.5)")
            }
          >
            跳过
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "0.85rem" }}
            >
              skip_next
            </span>
          </motion.button>

          <motion.div
            className="absolute z-20 pointer-events-none"
            animate={{
              x: lobsterX,
              y: "50%",
            }}
            transition={{
              duration: 1.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              transform: "translate(-50%, -50%)",
            }}
          >
            <LobsterCharacter size={140} opacity={1} />
          </motion.div>

          <div className="relative z-10 w-full flex items-center justify-center flex-1">
            <AnimatePresence mode="wait">
              {scene.type === "hero" && (
                <HeroContent key={sceneIdx} scene={scene} />
              )}
              {scene.type === "context" && (
                <ContextContent key={sceneIdx} scene={scene} />
              )}
              {scene.type === "prize" && (
                <PrizeContent key={sceneIdx} scene={scene} />
              )}
              {scene.type === "why" && (
                <WhyContent key={sceneIdx} scene={scene} />
              )}
              {scene.type === "safety" && (
                <SafetyContent key={sceneIdx} scene={scene} />
              )}
              {scene.type === "cta" && (
                <CtaContent
                  key={sceneIdx}
                  scene={scene}
                  onEnter={handleEnter}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-3 pb-8">
            <div className="flex items-center gap-2">
              {SCENES.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    width: i === sceneIdx ? 28 : 8,
                    opacity: i <= sceneIdx ? 1 : 0.2,
                    backgroundColor:
                      i === sceneIdx
                        ? "#ff5833"
                        : i < sceneIdx
                          ? "rgba(255,88,51,0.45)"
                          : "rgba(255,255,255,0.12)",
                  }}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  className="h-1 rounded-full"
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
