import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LobsterLogo from "./LobsterLogo";

/* ─────────────────────────────────────────
   Slide definitions
───────────────────────────────────────── */
const SLIDES = [
  {
    id: 0,
    type: "hero",
    heading: "全网首个。",
    heading2: "没有之二。",
    sub: "目前全国没有任何一场有规模的官方龙虾赛事。",
    duration: 3400,
  },
  {
    id: 1,
    type: "context",
    label: "背景",
    heading: "全中国都在养虾",
    points: [
      { icon: "star", text: "GitHub 星标 26万" },
      { icon: "groups", text: "腾讯门口千人排队装机" },
      { icon: "gavel", text: "两会正在讨论它" },
      { icon: "corporate_fare", text: "大厂在疯抢它" },
    ],
    sub: "但到今天为止，没有一场官方龙虾比赛。",
    duration: 3800,
  },
  {
    id: 2,
    type: "prize",
    label: "奖金池",
    heading: "530000",
    heading2: "千亿 GLM-5 Token",
    sub: "10位获奖者，每人100亿Token",
    accent: "Token自由——从此养虾不花钱",
    duration: 3600,
  },
  {
    id: 3,
    type: "why",
    label: "为什么不一样",
    points: [
      { icon: "emoji_events", text: "全网首个有规模的官方龙虾赛事" },
      { icon: "all_inclusive", text: "人人可参与，不限身份、年龄、技术背景" },
      { icon: "lightbulb", text: "正向叙事：一人加一虾等于一支团队" },
      { icon: "hardware", text: "鼓励龙虾接入硬件设备，打开想象边界" },
    ],
    duration: 4000,
  },
  {
    id: 4,
    type: "cta",
    heading: "谁是虾王？",
    sub: "北纬·龙虾大赛（第一届）",
    accent: "2026年3月11日 — 3月22日",
    duration: null,
  },
];

/* ─────────────────────────────────────────
   Particle system — deterministic positions
───────────────────────────────────────── */
const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: ((i * 37 + 11) % 97) + "%",
  y: ((i * 53 + 7) % 95) + "%",
  size: 1 + (i % 3) * 0.8,
  dur: 4 + (i % 6),
  delay: (i * 0.35) % 5,
  opacity: 0.04 + (i % 4) * 0.025,
}));

function Particles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white"
          style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
          animate={{
            y: [-8, 8, -8],
            opacity: [p.opacity, p.opacity * 2.5, p.opacity],
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

/* ─────────────────────────────────────────
   Morphing background orbs per slide
───────────────────────────────────────── */
const ORB_CONFIGS = [
  // hero
  [
    { x: "18%", y: "28%", color: "rgba(255,88,51,0.14)", size: 650 },
    { x: "82%", y: "72%", color: "rgba(255,120,60,0.07)", size: 480 },
  ],
  // context
  [
    { x: "78%", y: "22%", color: "rgba(255,88,51,0.11)", size: 560 },
    { x: "22%", y: "78%", color: "rgba(255,160,50,0.07)", size: 520 },
  ],
  // prize
  [
    { x: "50%", y: "38%", color: "rgba(255,200,50,0.12)", size: 750 },
    { x: "82%", y: "70%", color: "rgba(255,88,51,0.07)", size: 380 },
  ],
  // why
  [
    { x: "22%", y: "62%", color: "rgba(80,200,140,0.07)", size: 520 },
    { x: "78%", y: "32%", color: "rgba(255,88,51,0.09)", size: 480 },
  ],
  // cta
  [
    { x: "50%", y: "50%", color: "rgba(255,88,51,0.16)", size: 900 },
    { x: "50%", y: "50%", color: "rgba(255,88,51,0.06)", size: 500 },
  ],
];

function MorphOrbs({ slideIdx }) {
  const orbs = ORB_CONFIGS[slideIdx] ?? ORB_CONFIGS[0];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {orbs.map((orb, i) => (
        <motion.div
          key={`${slideIdx}-${i}`}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: [0, 1, 1], scale: [0.7, 1.04, 1] }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{
            opacity: { duration: 1.2, times: [0, 0.5, 1] },
            scale: { duration: 6, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute rounded-full"
          style={{
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 72%)`,
            transform: "translate(-50%, -50%)",
            filter: "blur(48px)",
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   Character-by-character text reveal
───────────────────────────────────────── */
function AnimChars({ text, delay = 0, className = "" }) {
  return (
    <span
      className={className}
      aria-label={text}
      style={{ display: "inline-block" }}
    >
      {text.split("").map((ch, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            delay: delay + i * 0.06,
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ display: "inline-block" }}
        >
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
    </span>
  );
}

/* ─────────────────────────────────────────
   Count-up number animation
───────────────────────────────────────── */
function CountUp({ to, delay = 0, duration = 1.6, prefix = "", suffix = "" }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf;
    const timer = setTimeout(() => {
      let startTs = null;
      const step = (ts) => {
        if (!startTs) startTs = ts;
        const p = Math.min((ts - startTs) / (duration * 1000), 1);
        const eased = 1 - Math.pow(1 - p, 4); // quartic ease-out
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
  return (
    <>
      {prefix}
      {val.toLocaleString("zh-CN")}
      {suffix}
    </>
  );
}

/* ─────────────────────────────────────────
   Pulsing logo with rings
───────────────────────────────────────── */
function PulsingLogo({ size = 40, boxSize = 20 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, type: "spring", bounce: 0.45 }}
      className="relative inline-flex items-center justify-center mx-auto mb-8"
      style={{ width: boxSize * 4, height: boxSize * 4 }}
    >
      {/* Ripple rings */}
      {[1, 1.5, 2].map((scale, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-3xl border border-primary/30"
          animate={{ scale: [1, scale, 1], opacity: [0.4, 0, 0.4] }}
          transition={{
            duration: 2.8,
            delay: i * 0.55,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
      <div
        className="relative z-10 flex items-center justify-center rounded-3xl bg-primary/10 border border-primary/25"
        style={{ width: boxSize * 4, height: boxSize * 4 }}
      >
        <LobsterLogo size={size} className="text-primary" />
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Slide transition variants
───────────────────────────────────────── */
const slideVar = {
  enter: {
    opacity: 0,
    y: 44,
    scale: 0.94,
    filter: "blur(8px)",
  },
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -44,
    scale: 0.94,
    filter: "blur(8px)",
    transition: { duration: 0.45, ease: [0.36, 0, 0.66, 0] },
  },
};

/* ─────────────────────────────────────────
   Slide: Hero
───────────────────────────────────────── */
function HeroSlide({ slide }) {
  return (
    <div className="text-center px-8 max-w-3xl flex flex-col items-center">
      <PulsingLogo size={38} boxSize={18} />
      <div className="text-6xl sm:text-8xl font-black tracking-tight text-white leading-none mb-2">
        <AnimChars text={slide.heading} delay={0.25} />
      </div>
      <div
        className="text-6xl sm:text-8xl font-black tracking-tight leading-none mb-10"
        style={{ color: "#ff5833" }}
      >
        <AnimChars text={slide.heading2} delay={0.6} />
      </div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.7 }}
        className="text-slate-400 text-base sm:text-xl leading-relaxed"
      >
        {slide.sub}
      </motion.p>
    </div>
  );
}

/* ─────────────────────────────────────────
   Slide: Context
───────────────────────────────────────── */
function ContextSlide({ slide }) {
  return (
    <div className="text-center px-8 max-w-2xl w-full">
      <motion.span
        initial={{ opacity: 0, letterSpacing: "0.5em" }}
        animate={{ opacity: 1, letterSpacing: "0.3em" }}
        transition={{ duration: 0.6 }}
        className="inline-block font-mono text-xs tracking-[0.3em] mb-5 uppercase"
        style={{ color: "rgba(255,88,51,0.7)" }}
      >
        {slide.label}
      </motion.span>
      <div className="text-4xl sm:text-6xl font-black text-white mb-8 leading-tight">
        <AnimChars text={slide.heading} delay={0.15} />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {slide.points.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 14, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: 0.35 + i * 0.16,
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-left"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
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
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.7 }}
        className="text-slate-500 text-base"
      >
        {slide.sub}
      </motion.p>
    </div>
  );
}

/* ─────────────────────────────────────────
   Slide: Prize — with count-up
───────────────────────────────────────── */
function PrizeSlide({ slide }) {
  return (
    <div className="text-center px-8 max-w-2xl flex flex-col items-center">
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="inline-block font-mono text-xs tracking-[0.3em] uppercase mb-8"
        style={{ color: "rgba(255,88,51,0.7)" }}
      >
        {slide.label}
      </motion.span>

      {/* Cash prize with count-up */}
      <motion.div
        initial={{ opacity: 0, scale: 0.75 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.9, type: "spring", bounce: 0.3 }}
        className="mb-5 flex flex-col items-center"
      >
        <div className="flex items-baseline gap-1 flex-wrap justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-3xl sm:text-4xl font-black text-white"
          >
            现金 ¥
          </motion.span>
          <span
            className="font-black tabular-nums"
            style={{
              fontSize: "clamp(3rem, 10vw, 6rem)",
              color: "white",
              lineHeight: 1,
            }}
          >
            <CountUp to={530000} delay={0.5} duration={1.5} />
          </span>
        </div>

        {/* Shimmer underline */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.7, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-2 h-0.5 w-3/4 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, #ff5833, transparent)",
            transformOrigin: "left",
          }}
        />
      </motion.div>

      {/* Token prize */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 px-6 py-3 rounded-2xl"
        style={{
          background: "rgba(255,88,51,0.1)",
          border: "1px solid rgba(255,88,51,0.22)",
        }}
      >
        <span
          className="text-2xl sm:text-4xl font-black"
          style={{ color: "#ff5833" }}
        >
          + 千亿 GLM-5 Token
        </span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="text-slate-400 text-lg mb-2"
      >
        {slide.sub}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="font-bold text-base"
        style={{ color: "#ff5833" }}
      >
        {slide.accent}
      </motion.p>
    </div>
  );
}

/* ─────────────────────────────────────────
   Slide: Why Different
───────────────────────────────────────── */
function WhySlide({ slide }) {
  return (
    <div className="text-center px-8 max-w-xl w-full flex flex-col items-center">
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="inline-block font-mono text-xs tracking-[0.3em] uppercase mb-7"
        style={{ color: "rgba(255,88,51,0.7)" }}
      >
        {slide.label}
      </motion.span>
      <div className="space-y-3 w-full">
        {slide.points.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -24, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{
              delay: 0.15 + i * 0.2,
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex items-center gap-4 px-5 py-4 rounded-xl text-left"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <motion.span
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.3 + i * 0.2,
                duration: 0.5,
                type: "spring",
                bounce: 0.5,
              }}
              className="material-symbols-outlined text-xl flex-shrink-0"
              style={{ color: "#ff5833" }}
            >
              {p.icon}
            </motion.span>
            <span className="text-slate-200 text-sm sm:text-base font-medium leading-snug">
              {p.text}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Slide: CTA
───────────────────────────────────────── */
function CtaSlide({ slide, onEnter }) {
  return (
    <div className="text-center px-8 max-w-2xl flex flex-col items-center">
      <PulsingLogo size={44} boxSize={22} />

      <div className="text-5xl sm:text-7xl font-black text-white mb-5 leading-none">
        <AnimChars text={slide.heading} delay={0.2} />
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="text-slate-300 text-xl font-medium mb-2"
      >
        {slide.sub}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="font-mono text-sm mb-10 tracking-wide"
        style={{ color: "#ff5833" }}
      >
        {slide.accent}
      </motion.p>

      <motion.button
        initial={{ opacity: 0, scale: 0.85, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.6, type: "spring", bounce: 0.5 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        onClick={onEnter}
        className="relative px-14 py-4 font-black text-lg rounded-2xl text-white overflow-hidden"
        style={{
          background: "#ff5833",
          boxShadow:
            "0 0 48px rgba(255,88,51,0.4), 0 0 96px rgba(255,88,51,0.15)",
          border: "1px solid rgba(255,88,51,0.6)",
        }}
      >
        {/* Shimmer sweep */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)",
          }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{
            duration: 1.8,
            delay: 1.8,
            repeat: Infinity,
            repeatDelay: 3,
          }}
        />
        进入大赛 →
      </motion.button>
    </div>
  );
}

/* ─────────────────────────────────────────
   Per-slide countdown timer strip
───────────────────────────────────────── */
function SlideTimer({ duration, slideKey }) {
  if (!duration) return null;
  return (
    <motion.div
      key={slideKey}
      className="absolute bottom-0 left-0 h-[2px]"
      style={{ background: "#ff5833", originX: 0 }}
      initial={{ scaleX: 0, opacity: 0.8 }}
      animate={{ scaleX: 1, opacity: 0.6 }}
      transition={{ duration: duration / 1000, ease: "linear" }}
    />
  );
}

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function WelcomeAnimation({ onDone }) {
  const [idx, setIdx] = useState(0);
  const [exiting, setExiting] = useState(false);

  const handleEnter = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    localStorage.setItem("lobster_welcome_seen", "1");
    setTimeout(onDone, 750);
  }, [exiting, onDone]);

  // Auto-advance
  useEffect(() => {
    const slide = SLIDES[idx];
    if (!slide.duration) return;
    const t = setTimeout(
      () => setIdx((s) => Math.min(s + 1, SLIDES.length - 1)),
      slide.duration,
    );
    return () => clearTimeout(t);
  }, [idx]);

  const slide = SLIDES[idx];
  const progress = ((idx + 1) / SLIDES.length) * 100;

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "#0c0a09" }}
        >
          {/* ── Animated background layers ── */}
          <AnimatePresence mode="wait">
            <MorphOrbs key={idx} slideIdx={idx} />
          </AnimatePresence>
          <Particles />

          {/* Dot-grid texture */}
          <div className="absolute inset-0 dot-grid opacity-25 pointer-events-none" />

          {/* Top edge glow */}
          <div
            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,88,51,0.5), transparent)",
            }}
          />

          {/* ── Top progress bar ── */}
          <div
            className="absolute top-0 left-0 right-0 h-0.5"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <motion.div
              className="h-full"
              initial={{ width: `${(idx / SLIDES.length) * 100}%` }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: "#ff5833" }}
            />
          </div>

          {/* ── Skip button ── */}
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

          {/* ── Slide content ── */}
          <div className="relative z-10 w-full flex items-center justify-center flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                variants={slideVar}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex items-center justify-center w-full"
              >
                {slide.type === "hero" && <HeroSlide slide={slide} />}
                {slide.type === "context" && <ContextSlide slide={slide} />}
                {slide.type === "prize" && <PrizeSlide slide={slide} />}
                {slide.type === "why" && <WhySlide slide={slide} />}
                {slide.type === "cta" && (
                  <CtaSlide slide={slide} onEnter={handleEnter} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Bottom: indicators + timer ── */}
          <div className="relative z-10 flex flex-col items-center gap-3 pb-8">
            {/* Slide dot indicators */}
            <div className="flex items-center gap-2">
              {SLIDES.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    width: i === idx ? 28 : 8,
                    opacity: i <= idx ? 1 : 0.2,
                    backgroundColor:
                      i === idx
                        ? "#ff5833"
                        : i < idx
                          ? "rgba(255,88,51,0.45)"
                          : "rgba(255,255,255,0.12)",
                  }}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  className="h-1 rounded-full"
                />
              ))}
            </div>

            {/* Per-slide linear countdown */}
            <div
              className="relative w-16 h-px"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <SlideTimer key={idx} duration={slide.duration} slideKey={idx} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
