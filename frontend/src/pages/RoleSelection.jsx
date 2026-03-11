import { useNavigate } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import { useRef, useEffect, useState } from "react";
import LobsterLogo from "../components/LobsterLogo";
import LobsterSwimAnimation from "../components/LobsterSwimAnimation";
import WelcomeAnimation from "../components/WelcomeAnimation";
import { useDeviceType } from "../hooks/useDeviceType";

/* ── Floating code symbols ── */
function FloatingSymbols() {
  const symbols = [
    "{",
    "}",
    "<>",
    "/>",
    "[]",
    "()",
    "=>",
    "**",
    "&&",
    "||",
    "++",
    "::",
  ];
  const items = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    symbol: symbols[i % symbols.length],
    left: `${(i * 7 + 3) % 95}%`,
    delay: `${(i * 1.3) % 12}s`,
    duration: `${14 + ((i * 2.1) % 8)}s`,
    size: i % 3 === 0 ? "1.125rem" : i % 3 === 1 ? "0.875rem" : "0.75rem",
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute bottom-0 font-mono font-bold text-primary/15 select-none"
          style={{
            left: item.left,
            fontSize: item.size,
            animation: `float-symbol ${item.duration} linear ${item.delay} infinite`,
          }}
        >
          {item.symbol}
        </div>
      ))}
    </div>
  );
}

/* ── Terms Modal ── */
function TermsModal({ open, onClose }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-[#141210] border border-white/[0.08] shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-[#141210]/95 backdrop-blur-md border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">
                  gavel
                </span>
                <h3 className="font-bold text-white text-lg">
                  参赛协议与安全声明
                </h3>
              </div>
              <button
                onClick={onClose}
                className="size-8 rounded-lg hover:bg-white/[0.08] flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-slate-400 text-xl">
                  close
                </span>
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-8 text-sm leading-relaxed text-slate-300">
              {/* 参赛规则 */}
              <section>
                <h4 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    rule
                  </span>
                  参赛规则
                </h4>
                <div className="space-y-2 text-slate-400">
                  <p>
                    ·
                    所有赛道不限身份、不限年龄、不限技术背景，线上提交，无需到场。
                  </p>
                  <p>
                    · 参赛者须提交：PPT（10页以内）+
                    演示视频（3分钟以内），海报与在线链接为可选项。
                  </p>
                  <p>
                    · 每位参赛者每个赛道限提交一份作品，每个邮箱仅可报名一次。
                  </p>
                  <p>· 参赛作品须为参赛者本人原创，不得抄袭他人成果。</p>
                  <p>· 组委会保留对违反规则的作品取消参赛资格的权利。</p>
                </div>
              </section>

              {/* 时间线 */}
              <section>
                <h4 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    schedule
                  </span>
                  赛事时间线
                </h4>
                <div className="space-y-2">
                  {[
                    { phase: "报名 + 提交作品", date: "3月11日 — 3月19日" },
                    { phase: "线上评审", date: "3月20日 — 3月21日" },
                    { phase: "线下路演 + 颁奖", date: "3月22日" },
                  ].map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0"
                    >
                      <span className="text-slate-300">{t.phase}</span>
                      <span className="font-mono text-primary text-xs">
                        {t.date}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* 安全与伦理 */}
              <section>
                <h4 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    security
                  </span>
                  安全、伦理与负责任使用
                </h4>
                <p className="text-slate-500 mb-3">
                  本赛事倡导负责任的 AI Agent 使用，参赛作品须遵守以下原则：
                </p>
                <div className="space-y-3">
                  {[
                    {
                      title: "数据安全",
                      icon: "lock",
                      desc: "参赛作品不得涉及非法获取、泄露他人隐私数据或敏感信息。参赛者应重视自身及他人的数据安全。",
                    },
                    {
                      title: "合规使用",
                      icon: "verified_user",
                      desc: "参赛作品不得用于违反法律法规的用途，包括但不限于网络攻击、欺诈、虚假信息生成、未经授权的自动化操作等。",
                    },
                    {
                      title: "透明可控",
                      icon: "visibility",
                      desc: "鼓励参赛者展示龙虾的行为边界和安全机制——你的虾能干什么很重要，你的虾知道什么不该干同样重要。设置了明确权限边界和人类监督机制的作品，将获得评审的积极评价。",
                    },
                    {
                      title: "尊重知识产权",
                      icon: "copyright",
                      desc: "龙虾生成的内容应尊重原创版权，不得大规模抓取或复制受保护的内容。",
                    },
                    {
                      title: "社会责任",
                      icon: "favorite",
                      desc: "我们尤其欢迎体现 AI 向善价值观的作品——用龙虾帮助弱势群体、提升公共服务效率、解决社会问题的项目，将在评审中获得额外关注。",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05]"
                    >
                      <span className="material-symbols-outlined text-primary/70 text-lg flex-shrink-0 mt-0.5">
                        {item.icon}
                      </span>
                      <div>
                        <span className="text-white font-semibold text-sm">
                          {item.title}：
                        </span>
                        <span className="text-slate-400">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-slate-500 text-xs">
                  组委会保留对违反上述原则的作品取消参赛资格的权利。我们相信，好的龙虾不只是能干，还得靠谱。
                </p>
              </section>

              {/* 隐私政策 */}
              <section>
                <h4 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    privacy_tip
                  </span>
                  隐私政策
                </h4>
                <div className="space-y-2 text-slate-400">
                  <p>
                    ·
                    参赛者提交的个人信息（姓名、邮箱、机构）仅用于赛事通知和奖项发放，不会对外出售或滥用。
                  </p>
                  <p>
                    ·
                    参赛者授权组委会在赛事宣传材料中展示项目标题、演示内容及获奖信息。
                  </p>
                  <p>· 参赛者保留对自身作品的完整知识产权。</p>
                </div>
              </section>

              {/* Organizers */}
              <section className="pt-2 border-t border-white/[0.06]">
                <p className="text-slate-500 text-xs">
                  <span className="text-slate-400 font-medium">主办：</span>
                  北京中关村学院 · 中关村人工智能研究院 · AI商学院
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  <span className="text-slate-400 font-medium">赞助：</span>
                  北京中关村学院教育基金会 · 海淀区西北旺政府
                </p>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── 3D tilt card ── */
function TiltCard({ role, onClick, index }) {
  const cardRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), {
    stiffness: 300,
    damping: 30,
  });
  const glowX = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]);
  const glowY = useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const isParticipant = role.id === "participant";
  const accentColor = isParticipant ? "rgba(255,88,51," : "rgba(96,165,250,";
  const cardClass = isParticipant
    ? "role-card-gradient"
    : "judge-card-gradient";
  const iconBg = isParticipant
    ? "bg-primary/10 group-hover:bg-primary/20"
    : "bg-blue-400/10 group-hover:bg-blue-400/20";
  const iconColor = isParticipant ? "text-primary" : "text-blue-400";
  const subtitleColor = isParticipant ? "text-primary" : "text-blue-400";
  const dotColor = isParticipant ? "bg-primary" : "bg-blue-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: 0.3 + index * 0.12,
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{ perspective: 1000 }}
    >
      <motion.div
        ref={cardRef}
        style={{
          rotateX: window.innerWidth >= 1024 ? rotateX : 0,
          rotateY: window.innerWidth >= 1024 ? rotateY : 0,
          transformStyle: "preserve-3d",
        }}
        onMouseMove={window.innerWidth >= 1024 ? handleMouseMove : undefined}
        onMouseLeave={window.innerWidth >= 1024 ? handleMouseLeave : undefined}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className={`group relative cursor-pointer rounded-2xl p-6 lg:p-8 ${cardClass} backdrop-blur-sm overflow-hidden`}
      >
        <motion.div
          className="absolute w-56 h-56 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${accentColor}0.12) 0%, transparent 70%)`,
            left: window.innerWidth >= 1024 ? glowX : "50%",
            top: window.innerWidth >= 1024 ? glowY : "50%",
            transform: "translate(-50%, -50%)",
            filter: "blur(20px)",
          }}
        />
        <div
          className="absolute top-0 left-8 right-8 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${accentColor}0.6), transparent)`,
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`size-12 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 transition-all duration-300 border border-current/10`}
            >
              <span
                className={`material-symbols-outlined text-2xl ${iconColor}`}
              >
                {role.icon}
              </span>
            </div>
            <p
              className={`text-xs ${subtitleColor} font-bold uppercase tracking-[0.2em]`}
            >
              {role.subtitle}
            </p>
          </div>
          <h3 className="text-2xl font-black mb-2 text-white tracking-tight">
            {role.title}
          </h3>
          <p className="text-slate-400 leading-relaxed text-sm mb-5">
            {role.description}
          </p>
          <div className="space-y-2 mb-5">
            {role.features.map((f, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div
                  className={`size-1.5 rounded-full ${dotColor} flex-shrink-0`}
                />
                <span className="text-slate-400 text-xs">{f}</span>
              </div>
            ))}
          </div>
          <div
            className={`flex items-center gap-2 ${subtitleColor} font-bold text-sm`}
          >
            <span>立即进入</span>
            <motion.span
              className="material-symbols-outlined text-base"
              animate={{ x: [0, 4, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              arrow_forward
            </motion.span>
          </div>
        </div>
        <div
          className="absolute bottom-0 right-0 w-28 h-28 rounded-tl-full opacity-30 pointer-events-none"
          style={{
            background: `radial-gradient(circle at bottom right, ${accentColor}0.2), transparent 70%)`,
          }}
        />
      </motion.div>
    </motion.div>
  );
}

/* ── Main Page ── */
export default function RoleSelection() {
  const navigate = useNavigate();
  const { isWeb } = useDeviceType();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showWelcome, setShowWelcome] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  // Determine if welcome animation should show
  useEffect(() => {
    const seen = localStorage.getItem("lobster_welcome_seen");
    if (!seen) setShowWelcome(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Calculate days until March 19, 2026
  const deadline = new Date("2026-03-19T23:59:59+08:00");
  const now = new Date();
  const daysLeft = Math.max(
    0,
    Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)),
  );

  const roles = [
    {
      id: "participant",
      title: "参赛者",
      subtitle: "Participant",
      description:
        "展示你的龙虾能干什么——学术、生产力或生活三大赛道，无论背景皆可参赛",
      icon: "cruelty_free",
      features: [
        "选择赛道并填写个人与项目信息",
        "上传 PPT 材料与演示视频链接",
        "可附海报图片与 Demo / GitHub 链接",
      ],
      path: "/participant/register",
    },
    {
      id: "judge",
      title: "评委",
      subtitle: "Judge",
      description:
        "浏览所有参赛作品、在线预览资料，并对项目进行初筛与全维度评分",
      icon: "balance",
      features: [
        "查看全部参赛项目详情",
        "在线评阅 PPT 与视频材料",
        "多维度评分并生成排行榜",
      ],
      path: "/judge/login",
    },
  ];

  const timeline = [
    {
      phase: "报名 + 提交",
      date: "3月11日—19日",
      icon: "edit_note",
      active: true,
    },
    {
      phase: "线上评审",
      date: "3月20日—21日",
      icon: "fact_check",
      active: false,
    },
    { phase: "颁奖典礼", date: "3月22日", icon: "emoji_events", active: false },
  ];

  return (
    <>
      {/* Welcome animation overlay */}
      {showWelcome && <WelcomeAnimation onDone={() => setShowWelcome(false)} />}

      {/* Terms modal */}
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />

      <div className="h-screen overflow-hidden bg-[#0c0a09] font-display text-slate-100 relative flex flex-col">
        {/* 龙虾游标效果 - 仅在 Web 端显示 */}
        {isWeb && (
          <div>
            <LobsterSwimAnimation />
          </div>
        )}

        {/* Dynamic gradient */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at ${20 + mousePos.x * 10}% ${20 + mousePos.y * 10}%, rgba(255,88,51,0.08) 0%, transparent 60%),
              radial-gradient(ellipse 70% 50% at ${80 - mousePos.x * 10}% ${80 - mousePos.y * 10}%, rgba(255,88,51,0.05) 0%, transparent 60%),
              radial-gradient(ellipse 60% 40% at 50% 50%, rgba(255,88,51,0.03) 0%, transparent 50%)
            `,
            transition: "background 0.5s ease",
            zIndex: 1,
          }}
        />
        <div className="fixed inset-0 dot-grid opacity-100 pointer-events-none z-10" />
        <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-0 z-10 pointer-events-none">
          <FloatingSymbols />
        </div>

        {/* ── Header ── */}
        <header className="relative z-20 flex-shrink-0 flex items-center justify-between px-6 py-4 lg:px-16 border-b border-white/[0.06] backdrop-blur-md bg-black/20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="size-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <LobsterLogo size={20} className="text-white" />
            </div>
            <div className="leading-tight">
              <span className="text-base font-black tracking-tight">
                北纬·<span className="text-primary">龙虾大赛</span>
              </span>
              <span className="text-[10px] text-slate-600 ml-2 font-mono">
                第一届
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/8 rounded-full border border-primary/15 backdrop-blur-sm">
              <span className="relative flex size-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full size-1.5 bg-primary" />
              </span>
              <span className="text-xs text-primary font-medium">
                报名通道开放中
              </span>
            </div>
            {daysLeft > 0 && (
              <div className="hidden md:flex items-center gap-1.5 text-slate-600 text-xs ml-2">
                <span className="material-symbols-outlined text-sm">
                  schedule
                </span>
                <span>距截止还有 {daysLeft} 天</span>
              </div>
            )}
          </motion.div>
        </header>

        {/* ── Main ── */}
        <main className="relative z-20 flex-1 flex flex-col lg:flex-row items-center justify-center px-3 sm:px-6 lg:px-16 gap-4 sm:gap-6 lg:gap-16 min-h-0 py-4 sm:py-6 lg:py-0 overflow-y-auto lg:overflow-visible">
          {/* Left: title + info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col justify-center w-full lg:w-[42%] flex-shrink-0"
          >
            {/* Tagline badge */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-3 sm:mb-4 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] w-fit"
            >
              <span className="text-[9px] sm:text-[10px] font-mono text-primary/80 tracking-[0.2em] uppercase">
                全网首个官方龙虾赛事
              </span>
            </motion.div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[1.0] mb-2 sm:mb-3">
              <span className="text-white">谁是</span>
              <br />
              <span className="text-gradient-primary">虾王？</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-base lg:text-lg text-slate-300 leading-relaxed mb-4 sm:mb-6 font-medium">
              北纬·龙虾大赛（第一届）· 2026年3月
              <br />
              <span className="text-slate-400">
                展示你的 AI Agent 能干什么，拿出来比一比
              </span>
            </p>

            {/* Stats */}
            <div className="flex items-center gap-3 sm:gap-8 text-center mb-4 sm:mb-8 flex-wrap">
              {[
                { num: "¥53万", label: "现金奖励" },
                { num: "千亿", label: "GLM-5 Token" },
                { num: "3", label: "参赛赛道" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-lg sm:text-2xl lg:text-3xl font-black text-white">
                    {stat.num}
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 font-medium">
                    {stat.label}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="flex items-center gap-1 mb-4 sm:mb-6 overflow-x-auto pb-2"
            >
              {timeline.map((t, i) => (
                <div key={i} className="flex items-center flex-shrink-0">
                  <div
                    className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border transition-all text-[11px] sm:text-sm ${
                      t.active
                        ? "bg-primary/10 border-primary/30"
                        : "bg-white/[0.03] border-white/[0.06]"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-xs sm:text-sm ${t.active ? "text-primary" : "text-slate-600"}`}
                    >
                      {t.icon}
                    </span>
                    <div className="hidden sm:block">
                      <p
                        className={`text-[10px] sm:text-xs font-bold ${t.active ? "text-primary" : "text-slate-500"}`}
                      >
                        {t.phase}
                      </p>
                      <p className="text-[9px] text-slate-600 font-mono">
                        {t.date}
                      </p>
                    </div>
                    <div className="sm:hidden">
                      <p
                        className={`text-[9px] font-bold ${t.active ? "text-primary" : "text-slate-500"}`}
                      >
                        {t.phase}
                      </p>
                    </div>
                  </div>
                  {i < timeline.length - 1 && (
                    <div className="w-2 sm:w-4 h-px bg-white/[0.12] mx-0.5 sm:mx-1 flex-shrink-0" />
                  )}
                </div>
              ))}
            </motion.div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-primary/20 via-primary/10 to-transparent mb-3 sm:mb-4" />

            {/* Organizers + terms */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="flex flex-col gap-2 sm:gap-3"
            >
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed">
                  <span className="text-slate-400 font-semibold">主办：</span>
                  北京中关村学院 · 中关村人工智能研究院 · AI商学院
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 leading-relaxed">
                  <span className="text-slate-400 font-semibold">赞助：</span>
                  北京中关村学院教育基金会 · 海淀区西北旺政府
                </p>
              </div>
              <button
                onClick={() => setTermsOpen(true)}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border-2 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 text-amber-300 font-bold text-xs sm:text-sm transition-all group w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-base sm:text-lg">
                  gavel
                </span>
                <span className="hidden sm:inline">
                  查看参赛协议 & 安全声明
                </span>
                <span className="sm:hidden">查看协议</span>
                <span className="material-symbols-outlined text-base sm:text-lg group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            </motion.div>
          </motion.div>

          {/* Right: role cards */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full lg:w-[58%] max-w-3xl">
            {roles.map((role, i) => (
              <TiltCard
                key={role.id}
                role={role}
                index={i}
                onClick={() => navigate(role.path)}
              />
            ))}
          </div>
        </main>

        {/* ── Footer ── */}
        <footer className="relative z-20 flex-shrink-0 border-t border-white/[0.05] py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-600 text-xs">
            © 2026 北纬·龙虾大赛组委会 · 中关村人工智能研究院 · 保留所有权利
          </p>
        </footer>
      </div>
    </>
  );
}
