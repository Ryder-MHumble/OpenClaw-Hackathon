import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../config/apiClient";
import LobsterLogo from "../components/LobsterLogo";

/* ── Steps ── */
const STEPS = [
  { id: 1, label: "个人信息", icon: "person" },
  { id: 2, label: "赛道 & 项目", icon: "folder_open" },
  { id: 3, label: "提交确认", icon: "check_circle" },
];

/* ── Track definitions ── */
const TRACKS = [
  {
    id: "academic",
    emoji: "🎓",
    icon: "school",
    title: "学术龙虾",
    subtitle: "做科研的最强搭档",
    desc: "让虾帮你读文献、跑分析、写综述",
    color: "text-blue-400",
    bg: "bg-blue-400/8",
    border: "border-blue-400/25",
    activeBorder: "border-blue-400",
  },
  {
    id: "productivity",
    emoji: "⚡",
    icon: "bolt",
    title: "生产力龙虾",
    subtitle: "一人成军的效率引擎",
    desc: "让虾管理项目、自动化流程、组建虚拟团队",
    color: "text-amber-400",
    bg: "bg-amber-400/8",
    border: "border-amber-400/25",
    activeBorder: "border-amber-400",
  },
  {
    id: "life",
    emoji: "🏠",
    icon: "home_heart",
    title: "生活龙虾",
    subtitle: "把日子过好",
    desc: "让虾规划生活、陪伴家人、让日子好一点",
    color: "text-emerald-400",
    bg: "bg-emerald-400/8",
    border: "border-emerald-400/25",
    activeBorder: "border-emerald-400",
  },
];

/* ── Terms Modal ── */
function TermsModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#141210] border border-white/[0.08] shadow-2xl"
          >
            <div className="sticky top-0 flex items-center justify-between px-5 py-4 bg-[#141210]/95 backdrop-blur-md border-b border-white/[0.06] rounded-t-3xl sm:rounded-t-2xl">
              {/* Mobile drag handle */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/20 sm:hidden" />
              <div className="flex items-center gap-2 pt-1 sm:pt-0">
                <span className="material-symbols-outlined text-primary text-lg">
                  gavel
                </span>
                <h3 className="font-bold text-white text-base">
                  参赛协议 & 安全声明
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
            <div className="px-5 py-6 space-y-6 text-sm leading-relaxed text-slate-300">
              <section>
                <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">
                    rule
                  </span>
                  参赛规则
                </h4>
                <ul className="space-y-1.5 text-slate-400">
                  <li>
                    ·
                    所有赛道不限身份、不限年龄、不限技术背景，线上提交，无需到场。
                  </li>
                  <li>
                    · 须提交项目说明书（10页以内）+
                    演示视频（3分钟以内），海报与链接为选填。
                  </li>
                  <li>· 每个邮箱仅可报名一次，每位参赛者每赛道限一份作品。</li>
                  <li>· 组委会保留对违规作品取消参赛资格的权利。</li>
                </ul>
              </section>
              <section>
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">
                    security
                  </span>
                  安全与责任使用
                </h4>
                <div className="mb-3 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <p className="text-amber-200 text-xs leading-relaxed">
                    <span className="font-bold">⚠️ 重要提示：</span>
                    参赛作品须严格遵守以下原则，组委会将对违反上述原则的作品保留取消参赛资格的权利。参赛者须对自身作品的安全性负责。
                  </p>
                </div>
                <div className="space-y-2.5">
                  {[
                    {
                      icon: "lock",
                      title: "数据安全",
                      desc: "严禁非法获取或泄露用户隐私数据；参赛作品不得将 OpenClaw 暴露于公网，运行环境须做好权限隔离。",
                    },
                    {
                      icon: "verified_user",
                      title: "合规使用",
                      desc: "不得用于违反法律法规及公序良俗的用途；严格管理插件来源，仅使用经可信渠道验证的扩展程序。",
                    },
                    {
                      icon: "visibility",
                      title: "透明可控",
                      desc: "鼓励清晰展示「虾」的行为边界与安全机制。懂得有所不为、知道边界在哪里的「虾」，才是可靠的「虾」。",
                    },
                    {
                      icon: "copyright",
                      title: "尊重知识产权",
                      desc: "「虾」所生成的内容，应充分尊重原创版权与创作者权益。",
                    },
                    {
                      icon: "favorite",
                      title: "社会责任",
                      desc: "以「虾」助力弱势群体、提升公共服务效率的作品，将获得评审的额外关注。",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]"
                    >
                      <span className="material-symbols-outlined text-primary/70 text-base flex-shrink-0 mt-0.5">
                        {item.icon}
                      </span>
                      <span className="text-slate-400">
                        <span className="text-white font-semibold">
                          {item.title}：
                        </span>
                        {item.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">
                    privacy_tip
                  </span>
                  隐私政策
                </h4>
                <ul className="space-y-1.5 text-slate-400">
                  <li>
                    · 个人信息仅用于赛事通知和奖项发放，不对外出售或滥用。
                  </li>
                  <li>· 参赛者授权组委会在宣传中展示项目标题与获奖信息。</li>
                  <li>· 参赛者保留对自身作品的完整知识产权。</li>
                </ul>
              </section>
              <p className="text-slate-600 text-xs pt-2 border-t border-white/[0.05]">
                主办：北京中关村学院 · 中关村人工智能研究院 · AI商学院
                <br />
                赞助：北京中关村学院教育基金会 · 海淀区西北旺政府
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Asset URL row ── */
function AssetUrlRow({
  badge,
  badgeColor,
  placeholder,
  optional,
  value,
  onChange,
}) {
  return (
    <div className="flex items-center gap-0 rounded-lg border-2 border-[rgba(100,80,75,0.4)] focus-within:border-primary/50 transition-colors overflow-hidden bg-[rgba(255,255,255,0.02)]">
      <span
        className={`font-mono text-xs font-bold px-3 py-3 border-r-2 border-[rgba(100,80,75,0.4)] flex-shrink-0 tracking-widest ${badgeColor}`}
      >
        {badge}
      </span>
      <input
        className="bg-transparent border-none focus:ring-0 text-slate-200 flex-1 placeholder:text-slate-500 text-sm font-mono px-3 py-3 min-w-0"
        placeholder={placeholder}
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={!optional}
      />
      {value && (
        <span className="flex-shrink-0 size-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50 mr-3" />
      )}
      {optional && !value && (
        <span className="flex-shrink-0 font-mono text-[10px] text-slate-500 mr-3 tracking-wide hidden sm:block">
          opt
        </span>
      )}
    </div>
  );
}

/* ── Terminal input ── */
function TerminalInput({ prefix, placeholder, value, onChange, required }) {
  return (
    <div className="flex items-center gap-0 rounded-lg border-2 border-[rgba(100,80,75,0.4)] focus-within:border-primary/50 transition-colors overflow-hidden bg-[rgba(255,255,255,0.02)]">
      <span className="font-mono text-xs text-slate-400 px-3 py-3 bg-surface-dark/60 border-r-2 border-[rgba(100,80,75,0.4)] flex-shrink-0 select-none font-semibold">
        {prefix}
      </span>
      <input
        className="bg-transparent border-none focus:ring-0 text-slate-200 flex-1 placeholder:text-slate-500 text-sm font-mono px-3 py-3 min-w-0"
        placeholder={placeholder}
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}

/* ── Panel header ── */
function PanelHeader({ label, ready }) {
  return (
    <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4 border-b border-border-dark bg-surface-dark/50">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex gap-1 sm:gap-1.5">
          <span className="size-2 sm:size-2.5 rounded-full bg-slate-600/80" />
          <span className="size-2 sm:size-2.5 rounded-full bg-slate-600/80" />
          <span className="size-2 sm:size-2.5 rounded-full bg-slate-600/80" />
        </div>
        <span className="font-mono text-[10px] sm:text-xs text-slate-400 tracking-widest select-none font-semibold">
          // {label}
        </span>
      </div>
      <AnimatePresence>
        {ready && (
          <motion.span
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            className="font-mono text-[10px] sm:text-xs text-green-500 tracking-widest font-bold"
          >
            ✓ READY
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Mono field ── */
function MonoField({ label, required, children }) {
  return (
    <div className="space-y-2">
      <label className="font-mono text-[10px] sm:text-xs text-slate-400 tracking-widest uppercase block font-semibold">
        {label}
        {required && <span className="text-primary ml-1.5">*</span>}
      </label>
      {children}
    </div>
  );
}

/* ── Mobile step indicator ── */
function MobileStepBar({ currentStep }) {
  return (
    <div className="lg:hidden flex items-center justify-center py-3 px-4">
      {STEPS.map((step, i) => {
        const done = currentStep > step.id;
        const active = currentStep === step.id;
        return (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center gap-1.5 rounded-full font-medium transition-all duration-300
              ${
                active
                  ? "bg-primary/15 text-primary border border-primary/30 px-3 py-1.5"
                  : done
                    ? "bg-green-500/10 text-green-400 border border-green-500/20 size-7 justify-center"
                    : "bg-white/[0.04] text-slate-600 border border-white/[0.06] size-7 justify-center"
              }`}
            >
              <span className="text-xs font-bold leading-none">
                {done ? "✓" : step.id}
              </span>
              {active && (
                <span className="text-xs font-semibold whitespace-nowrap">
                  {step.label}
                </span>
              )}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-5 h-px mx-1 flex-shrink-0 transition-colors duration-300 ${done ? "bg-green-500/50" : "bg-white/[0.08]"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Component ── */
export default function ParticipantRegistration() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [termsOpen, setTermsOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    organization: "",
    phone: "",
    track: "",
    projectTitle: "",
    projectDescription: "",
    repoUrl: "",
    pdfUrl: "",
    videoUrl: "",
    posterUrl: "",
  });

  const currentStep = useMemo(() => {
    const step1Done =
      formData.fullName && formData.email && formData.organization;
    const step2Done =
      formData.track &&
      formData.projectTitle &&
      formData.projectDescription &&
      formData.pdfUrl &&
      formData.posterUrl &&
      formData.videoUrl;
    if (!step1Done) return 1;
    if (!step2Done) return 2;
    return 3;
  }, [formData]);

  const set = (key, val) => setFormData((p) => ({ ...p, [key]: val }));

  const selectedTrack = TRACKS.find((t) => t.id === formData.track);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await apiClient.post("/api/participants/register", formData);
      setSubmitted(true);
    } catch (err) {
      const detail = err?.response?.data?.detail ?? "";
      if (
        typeof detail === "string" &&
        detail.includes("duplicate key") &&
        detail.includes("email")
      ) {
        setSubmitError("该邮箱已经报名过了，每个邮箱只能报名一次。");
      } else if (detail) {
        setSubmitError("提交失败，请稍后重试。");
      } else {
        setSubmitError("网络错误，请检查连接后重试。");
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success page ── */
  if (submitted) {
    const track = TRACKS.find((t) => t.id === formData.track);
    return (
      <div className="min-h-screen bg-background-dark font-display text-slate-100 flex flex-col">
        <Header navigate={navigate} />
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="text-center max-w-md w-full"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-5xl sm:text-7xl mb-4 sm:mb-6"
            >
              🦞
            </motion.div>
            <h2 className="text-2xl sm:text-3xl font-black mb-2">报名成功！</h2>
            {track && (
              <p
                className={`text-xs sm:text-sm font-bold mb-2 sm:mb-3 ${track.color}`}
              >
                {track.emoji} {track.title} · {track.subtitle}
              </p>
            )}
            <p className="text-slate-400 mb-6 sm:mb-8 leading-relaxed text-xs sm:text-sm px-4">
              你的参赛资料已提交成功。组委会将在审核通过后通过邮件通知你。
              <br />
              线下颁奖典礼：
              <span className="text-primary font-medium">2026年3月22日</span>
            </p>
            <button
              onClick={() => navigate("/")}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/80 transition-colors text-xs sm:text-sm"
            >
              返回首页
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark text-slate-100 font-display overflow-x-hidden">
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
      <Header navigate={navigate} />
      <MobileStepBar currentStep={currentStep} />

      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 lg:px-8 pb-8 sm:pb-16">
        {/* Hero Banner */}
        <section className="w-full max-w-7xl pt-4 sm:pt-10">
          <motion.div
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="relative w-full h-44 sm:h-56 md:h-72 rounded-2xl overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-background-dark/60 to-background-dark z-10" />
            <div className="absolute inset-0 bg-[url('/banner2.png')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute bottom-0 left-0 p-5 sm:p-8 z-20">
              <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                <span className="bg-primary text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md">
                  正在报名
                </span>
                <span className="text-xs text-slate-300 font-medium tracking-wide">
                  · 截止 3月19日
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-1">
                加入 <span className="text-primary italic">龙虾军团</span>
              </h1>
              <p className="text-slate-300 max-w-lg text-xs sm:text-base font-light hidden sm:block">
                北纬·龙虾大赛（第一届）· ¥53万现金 + 千亿 GLM-5 Token 奖池
              </p>
            </div>
          </motion.div>
        </section>

        {/* Form area */}
        <section className="w-full max-w-7xl mt-6 sm:mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-[72px] flex flex-col gap-0 z-40">
              {STEPS.map((step, i) => {
                const done = currentStep > step.id;
                const active = currentStep === step.id;
                const isLast = i === STEPS.length - 1;
                return (
                  <div key={step.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <motion.div
                        animate={{
                          backgroundColor: done
                            ? "#ff5833"
                            : active
                              ? "rgba(255,88,51,0.12)"
                              : "transparent",
                          borderColor: done
                            ? "#ff5833"
                            : active
                              ? "#ff5833"
                              : "#3a2a27",
                          scale: active ? 1.1 : 1,
                        }}
                        transition={{ duration: 0.35 }}
                        className="size-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 relative z-10"
                      >
                        <AnimatePresence mode="wait">
                          {done ? (
                            <motion.span
                              key="check"
                              initial={{ scale: 0, rotate: -90, opacity: 0 }}
                              animate={{ scale: 1, rotate: 0, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{
                                type: "spring",
                                bounce: 0.5,
                                duration: 0.4,
                              }}
                              className="material-symbols-outlined text-white text-lg leading-none"
                            >
                              check
                            </motion.span>
                          ) : (
                            <motion.span
                              key="icon"
                              initial={{ scale: 0.6, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className={`material-symbols-outlined text-lg leading-none ${active ? "text-primary" : "text-slate-600"}`}
                            >
                              {step.icon}
                            </motion.span>
                          )}
                        </AnimatePresence>
                        {active && (
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 border-primary"
                            animate={{
                              scale: [1, 1.5, 1],
                              opacity: [0.6, 0, 0.6],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </motion.div>
                      {!isLast && (
                        <div className="w-px flex-1 min-h-[40px] bg-border-dark relative overflow-hidden my-1">
                          <motion.div
                            className="absolute top-0 left-0 w-full bg-primary"
                            initial={{ height: 0 }}
                            animate={{ height: done ? "100%" : "0%" }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      )}
                    </div>
                    <div className={`pb-8 ${isLast ? "pb-0" : ""} pt-1.5`}>
                      <motion.p
                        animate={{
                          color: active
                            ? "#ff5833"
                            : done
                              ? "#94a3b8"
                              : "#475569",
                        }}
                        className="text-xs font-bold mb-0.5"
                      >
                        {active
                          ? "当前步骤"
                          : done
                            ? "已完成"
                            : `步骤 ${step.id}`}
                      </motion.p>
                      <motion.p
                        animate={{
                          color: active
                            ? "#f1f5f9"
                            : done
                              ? "#64748b"
                              : "#475569",
                        }}
                        className="text-sm font-semibold"
                      >
                        {step.label}
                      </motion.p>
                      {active && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-slate-500 mt-1"
                        >
                          {step.id === 1
                            ? "填写姓名、邮箱与机构"
                            : step.id === 2
                              ? "选赛道并上传项目资料"
                              : "确认信息后提交报名"}
                        </motion.p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Form */}
          <div className="lg:col-span-9 space-y-4 sm:space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* ── Step 1: Personal Info ── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel rounded-2xl overflow-hidden"
              >
                <PanelHeader
                  label="01_PERSONAL.INFO"
                  ready={
                    !!(
                      formData.fullName &&
                      formData.email &&
                      formData.organization
                    )
                  }
                />
                <div className="p-4 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 sm:gap-x-12 gap-y-6 sm:gap-y-8">
                  <MonoField label="name" required>
                    <input
                      className="mono-input"
                      placeholder="真实姓名"
                      type="text"
                      value={formData.fullName}
                      required
                      onChange={(e) => set("fullName", e.target.value)}
                    />
                  </MonoField>
                  <MonoField label="email" required>
                    <input
                      className="mono-input"
                      placeholder="用于接收赛事通知"
                      type="email"
                      value={formData.email}
                      required
                      onChange={(e) => set("email", e.target.value)}
                    />
                  </MonoField>
                  <MonoField label="organization" required>
                    <input
                      className="mono-input"
                      placeholder="公司、大学或研究所"
                      type="text"
                      value={formData.organization}
                      required
                      onChange={(e) => set("organization", e.target.value)}
                    />
                  </MonoField>
                  <MonoField label="phone" required>
                    <input
                      className="mono-input"
                      placeholder="便于紧急联系（选填）"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => set("phone", e.target.value)}
                    />
                  </MonoField>
                </div>
              </motion.div>

              {/* ── Step 2: Track + Project ── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-panel rounded-2xl overflow-hidden"
              >
                <PanelHeader
                  label="02_PROJECT.PROPOSAL"
                  ready={
                    !!(
                      formData.track &&
                      formData.projectTitle &&
                      formData.projectDescription &&
                      formData.pdfUrl &&
                      formData.videoUrl
                    )
                  }
                />

                <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                  {/* Track selector */}
                  <div>
                    <label className="font-mono text-xs text-slate-400 tracking-widest uppercase block font-semibold mb-3">
                      track.selection{" "}
                      <span className="text-primary ml-1">*</span>
                    </label>
                    <p className="text-xs text-slate-500 mb-3">
                      选择你的参赛赛道（不限身份 · 不限年龄 · 不限技术背景）
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {TRACKS.map((track) => {
                        const isSelected = formData.track === track.id;
                        return (
                          <motion.button
                            key={track.id}
                            type="button"
                            onClick={() => set("track", track.id)}
                            whileTap={{ scale: 0.97 }}
                            className={`relative flex flex-col p-3 sm:p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer
                              ${
                                isSelected
                                  ? `${track.bg} ${track.activeBorder} shadow-lg`
                                  : `bg-white/[0.02] ${track.border} hover:bg-white/[0.04]`
                              }`}
                          >
                            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                              <span className="text-xl sm:text-2xl">
                                {track.emoji}
                              </span>
                              {isSelected && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className={`material-symbols-outlined text-sm sm:text-base ${track.color}`}
                                >
                                  check_circle
                                </motion.span>
                              )}
                            </div>
                            <p
                              className={`font-bold text-xs sm:text-sm ${isSelected ? track.color : "text-slate-300"}`}
                            >
                              {track.title}
                            </p>
                            <p
                              className={`text-[10px] sm:text-xs mt-0.5 ${isSelected ? "text-slate-300" : "text-slate-500"}`}
                            >
                              {track.subtitle}
                            </p>
                            <p
                              className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2 leading-snug ${isSelected ? "text-slate-400" : "text-slate-600"}`}
                            >
                              {track.desc}
                            </p>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Project title */}
                  <MonoField label="project.title" required>
                    <input
                      className="mono-input text-base font-semibold"
                      placeholder="你的龙虾叫什么名字 / 能做什么事"
                      type="text"
                      value={formData.projectTitle}
                      required
                      onChange={(e) => set("projectTitle", e.target.value)}
                    />
                  </MonoField>

                  {/* Project description */}
                  <MonoField label="project.description" required>
                    <textarea
                      className="w-full bg-[rgba(255,255,255,0.02)] border-b-2 border-[rgba(100,80,75,0.5)] focus:border-primary/80 focus:bg-[rgba(255,255,255,0.04)] focus:outline-none text-slate-100 text-sm placeholder:text-slate-500 px-4 py-4 resize-none leading-relaxed transition-all rounded-t-lg"
                      placeholder="你的虾能干什么？解决了什么问题？效果如何？…"
                      rows={4}
                      value={formData.projectDescription}
                      required
                      onChange={(e) =>
                        set("projectDescription", e.target.value)
                      }
                    />
                    <p className="text-right font-mono text-[10px] text-slate-500 mt-1">
                      {formData.projectDescription.length} chars
                    </p>
                  </MonoField>

                  {/* Material links */}
                  <div>
                    <p className="font-mono text-xs text-slate-400 tracking-widest uppercase mb-1.5 font-semibold">
                      assets.manifest
                    </p>
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                      将文件上传至 Google Drive / 腾讯文档 / 飞书 /
                      钉钉后粘贴分享链接
                    </p>
                    <div className="space-y-2.5">
                      <AssetUrlRow
                        badge="项目说明书"
                        badgeColor="text-red-400 bg-red-400/10 border-red-400/20"
                        placeholder="项目说明书链接（10页以内 · 必填）"
                        value={formData.pdfUrl}
                        onChange={(v) => set("pdfUrl", v)}
                      />
                      <AssetUrlRow
                        badge="项目海报"
                        badgeColor="text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                        placeholder="宣传海报图片链接（必填）"
                        value={formData.posterUrl}
                        onChange={(v) => set("posterUrl", v)}
                      />
                      <AssetUrlRow
                        badge="vid://"
                        badgeColor="text-purple-400 bg-purple-400/10 border-purple-400/20"
                        placeholder="演示视频链接（YouTube / Bilibili · 3分钟以内 · 必填）"
                        value={formData.videoUrl}
                        onChange={(v) => set("videoUrl", v)}
                      />
                    </div>
                  </div>

                  {/* Links */}
                  <div>
                    <p className="font-mono text-xs text-slate-400 tracking-widest uppercase mb-3 font-semibold">
                      project.links
                    </p>
                    <div className="space-y-2.5">
                      <TerminalInput
                        prefix="git://"
                        placeholder="GitHub 仓库地址（选填）"
                        value={formData.repoUrl}
                        onChange={(v) => set("repoUrl", v)}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ── Step 3: Submit ── */}
              {submitError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium"
                >
                  <span className="material-symbols-outlined text-base flex-shrink-0">
                    error
                  </span>
                  {submitError}
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4 px-1 sm:px-2"
              >
                {/* Selected track summary */}
                {selectedTrack && (
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl ${selectedTrack.bg} border ${selectedTrack.border}`}
                  >
                    <span className="text-xl">{selectedTrack.emoji}</span>
                    <div>
                      <p className={`text-xs font-bold ${selectedTrack.color}`}>
                        {selectedTrack.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedTrack.subtitle}
                      </p>
                    </div>
                  </div>
                )}

                {/* Agreement - Enhanced visibility */}
                <div className="glass-panel rounded-2xl overflow-hidden border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Warning banner */}
                    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-500/40">
                      <span className="material-symbols-outlined text-amber-400 text-xl flex-shrink-0 mt-0.5">
                        warning
                      </span>
                      <div className="flex-1">
                        <p className="text-amber-200 text-sm font-bold mb-1">
                          安全与责任使用声明
                        </p>
                        <p className="text-amber-300/80 text-xs leading-relaxed">
                          参赛作品须严格遵守安全原则，组委会保留取消违规作品参赛资格的权利
                        </p>
                      </div>
                    </div>

                    {/* Agreement checkbox */}
                    <label className="flex items-start gap-3 sm:gap-4 cursor-pointer group">
                      <div className="mt-0.5 sm:mt-1 flex-shrink-0">
                        <input
                          type="checkbox"
                          required
                          checked={agreed}
                          onChange={(e) => setAgreed(e.target.checked)}
                          className="size-4 sm:size-5 rounded-md bg-surface-dark border-2 border-amber-500/50 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-dark transition-all"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          我已阅读并同意{" "}
                          <button
                            type="button"
                            className="inline-flex items-center gap-0.5 sm:gap-1 text-primary hover:text-primary/80 font-bold underline decoration-2 underline-offset-2 transition-colors"
                            onClick={() => setTermsOpen(true)}
                          >
                            <span className="material-symbols-outlined text-sm sm:text-base">
                              gavel
                            </span>
                            《参赛协议 & 安全声明》
                          </button>
                        </p>
                        <p className="text-[10px] sm:text-xs text-slate-500 mt-1.5 sm:mt-2 leading-relaxed">
                          承诺遵守数据安全、合规使用、透明可控、知识产权保护等原则，并授权组委会展示本项目参赛资料
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Submit buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full pt-2">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="order-2 sm:order-1 flex-shrink-0 px-5 sm:px-8 py-3 sm:py-4 border-2 border-slate-600 rounded-xl text-slate-300 font-bold hover:bg-slate-800 hover:border-slate-500 transition-all text-xs sm:text-sm"
                  >
                    <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <span className="material-symbols-outlined text-base sm:text-lg">
                        arrow_back
                      </span>
                      返回首页
                    </span>
                  </button>
                  <motion.button
                    type="submit"
                    disabled={submitting || !agreed}
                    whileHover={!submitting && agreed ? { scale: 1.02 } : {}}
                    whileTap={!submitting && agreed ? { scale: 0.97 } : {}}
                    className="order-1 sm:order-2 flex-1 relative py-4 sm:py-5 bg-primary text-white font-black rounded-xl
                      uppercase tracking-wider text-sm sm:text-base transition-all overflow-hidden
                      disabled:opacity-40 disabled:cursor-not-allowed
                      shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40"
                    style={{
                      background:
                        agreed && !submitting
                          ? "linear-gradient(135deg, #ff5833 0%, #ff7849 100%)"
                          : undefined,
                    }}
                  >
                    {/* Shimmer effect when enabled */}
                    {agreed && !submitting && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)",
                        }}
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 1,
                        }}
                      />
                    )}
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin size-5"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        提交中…
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2 relative z-10">
                        <span className="material-symbols-outlined text-xl">
                          rocket_launch
                        </span>
                        提交参赛作品
                        <span className="material-symbols-outlined text-xl">
                          arrow_forward
                        </span>
                      </span>
                    )}
                  </motion.button>
                </div>

                {/* Helper text */}
                {!agreed && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-amber-400/80 text-center flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">
                      info
                    </span>
                    请先阅读并同意参赛协议后再提交
                  </motion.p>
                )}
              </motion.div>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border-dark bg-background-dark py-6 sm:py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 opacity-50">
            <LobsterLogo size={20} className="text-slate-400" />
            <span className="font-bold text-sm tracking-widest uppercase text-slate-400">
              北纬·龙虾大赛
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTermsOpen(true)}
              className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
            >
              参赛协议 & 安全声明
            </button>
            <p className="text-[10px] text-slate-600 uppercase tracking-widest">
              © 2026 中关村人工智能研究院
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Header ── */
function Header({ navigate }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-dark bg-background-dark/80 backdrop-blur-md px-4 sm:px-6 md:px-12 py-3 sm:py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="size-8 sm:size-9 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/30">
            <LobsterLogo size={18} className="text-white" />
          </div>
          <div className="leading-tight">
            <span className="text-base font-black tracking-tight">
              北纬·<span className="text-primary">龙虾大赛</span>
            </span>
            <span className="hidden sm:inline text-[10px] text-slate-600 ml-1.5 font-mono">
              第一届
            </span>
          </div>
        </button>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-slate-600 text-xs">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <span>截止 3月19日</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
            <span className="relative flex size-1.5 sm:size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full size-1.5 sm:size-2 bg-primary" />
            </span>
            <span className="text-xs text-primary font-semibold">
              报名进行中
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
