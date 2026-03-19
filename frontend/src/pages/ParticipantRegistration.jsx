import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import apiClient from "../config/apiClient";
import LobsterLogo from "../components/LobsterLogo";
import { STEPS, TRACKS } from "../constants/registration";
import {
  TermsModal,
  Step1PersonalInfo,
  Step2ProjectProposal,
  Step3Submit,
  MobileStepBar,
  Header,
} from "../components/registration";

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

  const [urlValidations, setUrlValidations] = useState({
    pdfUrl: true,
    posterUrl: true,
    videoUrl: true,
  });

  const allUrlsValid = Object.values(urlValidations).every((v) => v);

  const currentStep = useMemo(() => {
    const step1Done =
      formData.fullName && formData.email && formData.organization;
    const step2Done =
      formData.track &&
      formData.projectTitle &&
      formData.projectDescription &&
      formData.pdfUrl &&
      formData.posterUrl &&
      formData.videoUrl &&
      allUrlsValid;
    if (!step1Done) return 1;
    if (!step2Done) return 2;
    return 3;
  }, [formData, allUrlsValid]);

  const set = (key, val) => setFormData((p) => ({ ...p, [key]: val }));

  const selectedTrack = TRACKS.find((t) => t.id === formData.track);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) return;

    // 检查 URL 验证状态
    if (!allUrlsValid) {
      setSubmitError("请确保所有链接都可以正常访问后再提交");
      return;
    }

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
                北纬·龙虾大赛（第一届）· 百万现金 + 千亿Token 奖池
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.45 }}
            className="mt-4 rounded-2xl border border-amber-400/35 bg-amber-500/10 px-4 py-4 sm:px-5"
          >
            <p className="text-sm sm:text-base font-bold text-amber-300 mb-2">
              重要通知（报名高峰期）
            </p>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              为防止临近截止提交量过大造成网络不稳定，新增邮箱投稿备选通道：
              <span className="font-bold text-amber-300">
                【中关村北纬龙虾大赛组委会】claw@bza.edu.cn
              </span>
              。
            </p>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2">
              另外，决赛名单预计明天发布，请所有选手保持邮箱和电话畅通。
            </p>
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
                            <motion.div
                              key="check"
                              initial={{ scale: 0, rotate: -90, opacity: 0 }}
                              animate={{ scale: 1, rotate: 0, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{
                                type: "spring",
                                bounce: 0.5,
                                duration: 0.4,
                              }}
                              className="text-white"
                            >
                              <Check size={18} />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="icon"
                              initial={{ scale: 0.6, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className={
                                active ? "text-primary" : "text-slate-600"
                              }
                            >
                              <step.icon size={18} />
                            </motion.div>
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
              <Step1PersonalInfo formData={formData} set={set} />

              {/* ── Step 2: Track + Project ── */}
              <Step2ProjectProposal
                formData={formData}
                set={set}
                urlValidations={urlValidations}
                setUrlValidations={setUrlValidations}
              />

              {/* ── Step 3: Submit ── */}
              <Step3Submit
                selectedTrack={selectedTrack}
                agreed={agreed}
                setAgreed={setAgreed}
                setTermsOpen={setTermsOpen}
                submitting={submitting}
                submitError={submitError}
                navigate={navigate}
              />
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
