import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import LobsterLogo from "../components/LobsterLogo";

/* ── 步骤定义 ── */
const STEPS = [
  { id: 1, label: "个人信息", icon: "person" },
  { id: 2, label: "项目提案", icon: "folder_open" },
  { id: 3, label: "提交确认", icon: "check_circle" },
];

/* ── 文件清单行（极客风格）── */
function AssetRow({
  getRootProps,
  getInputProps,
  file,
  badge,
  badgeColor,
  label,
  optional,
  preview,
  onRemove,
}) {
  return (
    <div
      {...getRootProps()}
      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-150 cursor-pointer
        ${
          file
            ? "border-white/10 bg-white/[0.03]"
            : "border-border-dark hover:border-white/10 hover:bg-white/[0.02]"
        }`}
    >
      <input {...getInputProps()} />

      {/* 类型徽章 */}
      <span
        className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 tracking-widest ${badgeColor}`}
      >
        {badge}
      </span>

      {/* 文件名 / 标签 */}
      <div className="flex-1 min-w-0">
        {file ? (
          <div className="flex items-center gap-2">
            {preview && (
              <img
                src={preview}
                alt=""
                className="size-5 rounded object-cover flex-shrink-0 border border-white/10"
              />
            )}
            <span className="text-xs font-mono text-slate-300 truncate">
              {file.name}
            </span>
            <span className="text-[10px] font-mono text-slate-600 flex-shrink-0">
              {file.size > 1_048_576
                ? `${(file.size / 1_048_576).toFixed(1)}MB`
                : `${(file.size / 1024).toFixed(0)}KB`}
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-600 font-mono">
            {label}
            {optional && (
              <span className="ml-1 text-slate-700">· optional</span>
            )}
          </span>
        )}
      </div>

      {/* 右侧操作 */}
      {file ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex-shrink-0 text-slate-700 hover:text-slate-300 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      ) : (
        <span className="flex-shrink-0 font-mono text-[10px] text-slate-700 group-hover:text-slate-500 transition-colors tracking-wide">
          + attach
        </span>
      )}

      {/* 已上传状态指示点 */}
      {file && (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
      )}
    </div>
  );
}

/* ── 主组件 ── */
export default function ParticipantRegistration() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    organization: "",
    phone: "",
    projectTitle: "",
    projectDescription: "",
    demoUrl: "",
    repoUrl: "",
  });

  const [files, setFiles] = useState({ pdf: null, video: null, poster: null });
  const [posterPreview, setPosterPreview] = useState(null);

  /* 文件上传配置 */
  const { getRootProps: getPdfRootProps, getInputProps: getPdfInputProps } =
    useDropzone({
      onDrop: (f) => setFiles((p) => ({ ...p, pdf: f[0] })),
      accept: { "application/pdf": [".pdf"] },
      maxSize: 10_485_760,
      multiple: false,
    });

  const { getRootProps: getVideoRootProps, getInputProps: getVideoInputProps } =
    useDropzone({
      onDrop: (f) => setFiles((p) => ({ ...p, video: f[0] })),
      accept: { "video/*": [".mp4", ".mov"] },
      maxSize: 104_857_600,
      multiple: false,
    });

  const {
    getRootProps: getPosterRootProps,
    getInputProps: getPosterInputProps,
  } = useDropzone({
    onDrop: (accepted) => {
      const file = accepted[0];
      if (!file) return;
      setFiles((p) => ({ ...p, poster: file }));
      const url = URL.createObjectURL(file);
      setPosterPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    },
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: 5_242_880,
    multiple: false,
  });

  /* ── 计算当前步骤 ── */
  const currentStep = useMemo(() => {
    const step1Done =
      formData.fullName && formData.email && formData.organization;
    const step2Done =
      formData.projectTitle &&
      formData.projectDescription &&
      (files.pdf || files.video || formData.demoUrl || formData.repoUrl);
    if (!step1Done) return 1;
    if (!step2Done) return 2;
    return 3;
  }, [formData, files]);

  const set = (key, val) => setFormData((p) => ({ ...p, [key]: val }));

  /* ── 提交 ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) return;
    setSubmitting(true);
    try {
      const body = new FormData();
      Object.entries(formData).forEach(([k, v]) => body.append(k, v));
      if (files.pdf) body.append("pdf", files.pdf);
      if (files.video) body.append("video", files.video);
      if (files.poster) body.append("poster", files.poster);
      await axios.post("/api/participants/register", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSubmitted(true);
    } catch {
      // 演示模式：直接成功
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── 成功页面 ── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-background-dark font-display text-slate-100 flex flex-col">
        <Header navigate={navigate} />
        <div className="flex-1 flex items-center justify-center px-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="text-center max-w-md"
          >
            <div className="size-24 bg-primary/10 rounded-full border-2 border-primary flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-5xl text-primary">
                celebration
              </span>
            </div>
            <h2 className="text-3xl font-black mb-3">报名成功！</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              你的参赛资料已提交成功。组委会将在 3
              个工作日内审核并通过邮件通知你。
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/80 transition-colors"
            >
              返回首页
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark text-slate-100 font-display">
      <Header navigate={navigate} />

      <main className="flex-1 flex flex-col items-center px-4 md:px-6 pb-16">
        {/* Hero Banner */}
        <section className="w-full max-w-7xl pt-10">
          <motion.div
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="relative w-full h-56 md:h-72 rounded-2xl overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-background-dark/60 to-background-dark z-10" />
            <div className="absolute inset-0 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuBIs0FhcJhlwbs0EYfp5iEfRZOjH8bhRa8POoYJQvairPnqgdOBG1h1A_Oyn5ETf3lU4KVIi1RGaGFPx9WHkb39kxb0I6SG8klAsuzuT9llr2CdKcr56C-n3ZxTjpgdaSADYY1PJHbGD6SU5WXU3IMFG-8eup7ZzkZXHGPkS-1p0M3U0D2GjkmPi9iOusWjjOXR6amEk53NHsn-OdDkJZn33oeoY-bW7WmGnod563NSlnegW-gzRHQFaUW1QcYr0zW8yTJIOGLRZyfA')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute bottom-0 left-0 p-8 z-20">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-primary text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md">
                  正在报名
                </span>
                <span className="text-xs text-slate-300 font-medium tracking-wide">
                  · 还剩 14 天截止
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-1">
                加入 <span className="text-primary italic">龙虾军团</span>
              </h1>
              <p className="text-slate-300 max-w-lg text-base font-light">
                带上你最有野心的创意，参加顶级 AI 开发者盛宴。丰厚奖金等你来战。
              </p>
            </div>
          </motion.div>
        </section>

        {/* 表单区 */}
        <section className="w-full max-w-7xl mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* 左侧：步骤时间轴（桌面端，滚动时吸顶） */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-[76px] flex flex-col gap-0">
              {STEPS.map((step, i) => {
                const done = currentStep > step.id;
                const active = currentStep === step.id;
                const isLast = i === STEPS.length - 1;
                return (
                  <div key={step.id} className="flex gap-4">
                    {/* 左侧：节点 + 连接线 */}
                    <div className="flex flex-col items-center">
                      {/* 圆形节点 */}
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
                        transition={{ duration: 0.35, ease: "easeInOut" }}
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

                        {/* 活动步骤脉冲光晕 */}
                        {active && (
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 border-primary"
                            animate={{
                              scale: [1, 1.5, 1],
                              opacity: [0.6, 0, 0.6],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />
                        )}
                      </motion.div>

                      {/* 连接线 */}
                      {!isLast && (
                        <div className="w-px flex-1 min-h-[40px] bg-border-dark relative overflow-hidden my-1">
                          <motion.div
                            className="absolute top-0 left-0 w-full bg-primary"
                            initial={{ height: 0 }}
                            animate={{ height: done ? "100%" : "0%" }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                          />
                        </div>
                      )}
                    </div>

                    {/* 右侧：文字 */}
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
                            ? "请填写姓名、邮箱与机构"
                            : step.id === 2
                              ? "上传资料并填写项目简介"
                              : "确认信息后提交报名"}
                        </motion.p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* 右侧：表单 */}
          <div className="lg:col-span-9 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ── 第一步：个人信息 ── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel rounded-2xl p-8 space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">
                      person
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">个人信息</h3>
                    <p className="text-slate-500 text-sm">
                      用于身份核验与赛事通知
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="姓名 *" icon="badge">
                    <input
                      className="input-base"
                      placeholder="请输入真实姓名"
                      type="text"
                      value={formData.fullName}
                      required
                      onChange={(e) => set("fullName", e.target.value)}
                    />
                  </Field>
                  <Field label="邮箱 *" icon="mail">
                    <input
                      className="input-base"
                      placeholder="用于接收赛事通知"
                      type="email"
                      value={formData.email}
                      required
                      onChange={(e) => set("email", e.target.value)}
                    />
                  </Field>
                  <Field label="所在机构 / 学校 *" icon="business">
                    <input
                      className="input-base"
                      placeholder="公司、大学或研究所"
                      type="text"
                      value={formData.organization}
                      required
                      onChange={(e) => set("organization", e.target.value)}
                    />
                  </Field>
                  <Field label="联系电话" icon="phone">
                    <input
                      className="input-base"
                      placeholder="（选填）便于紧急联系"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => set("phone", e.target.value)}
                    />
                  </Field>
                </div>

                {/* 完成提示 */}
                <AnimatePresence>
                  {formData.fullName &&
                    formData.email &&
                    formData.organization && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 text-green-400 text-sm font-medium"
                      >
                        <span className="material-symbols-outlined text-base">
                          check_circle
                        </span>
                        个人信息填写完毕
                      </motion.div>
                    )}
                </AnimatePresence>
              </motion.div>

              {/* ── 第二步：项目提案 ── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-panel rounded-2xl overflow-hidden"
              >
                {/* 终端风格标题栏 */}
                <div className="flex items-center justify-between px-6 py-3.5 border-b border-border-dark bg-surface-dark/60">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <span className="size-3 rounded-full bg-slate-700" />
                      <span className="size-3 rounded-full bg-slate-700" />
                      <span className="size-3 rounded-full bg-slate-700" />
                    </div>
                    <span className="font-mono text-xs text-slate-500 tracking-widest select-none">
                      // 02_PROJECT.PROPOSAL
                    </span>
                  </div>
                  <AnimatePresence>
                    {formData.projectTitle &&
                      formData.projectDescription &&
                      (files.pdf ||
                        files.video ||
                        formData.demoUrl ||
                        formData.repoUrl) && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="font-mono text-[10px] text-green-400 tracking-widest"
                        >
                          ✓ READY
                        </motion.span>
                      )}
                  </AnimatePresence>
                </div>

                {/* 主体：左右分栏 */}
                <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-border-dark">
                  {/* 左栏：文字信息 */}
                  <div className="lg:col-span-2 p-6 space-y-5">
                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] text-slate-500 tracking-widest uppercase block">
                        project.title <span className="text-primary">*</span>
                      </label>
                      <input
                        className="w-full bg-transparent border-0 border-b border-border-dark focus:border-primary/60 focus:ring-0 text-slate-100 text-lg font-bold placeholder:text-slate-700 pb-2 transition-colors outline-none"
                        placeholder="项目名称"
                        type="text"
                        value={formData.projectTitle}
                        required
                        onChange={(e) => set("projectTitle", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-mono text-[10px] text-slate-500 tracking-widest uppercase block">
                        project.description{" "}
                        <span className="text-primary">*</span>
                      </label>
                      <textarea
                        className="w-full bg-transparent border border-border-dark focus:border-primary/40 focus:ring-0 rounded-lg text-slate-300 text-sm placeholder:text-slate-700 p-3 resize-none transition-colors outline-none leading-relaxed"
                        placeholder="核心亮点、解决的问题与技术方案…"
                        rows={6}
                        value={formData.projectDescription}
                        required
                        onChange={(e) =>
                          set("projectDescription", e.target.value)
                        }
                      />
                      <p className="text-right font-mono text-[10px] text-slate-700">
                        {formData.projectDescription.length} chars
                      </p>
                    </div>
                  </div>

                  {/* 右栏：文件 & 链接 */}
                  <div className="lg:col-span-3 p-6 space-y-5">
                    {/* 文件清单区 */}
                    <div>
                      <p className="font-mono text-[10px] text-slate-500 tracking-widest uppercase mb-3">
                        assets.manifest
                      </p>
                      <div className="space-y-2">
                        {/* PDF 行 */}
                        <AssetRow
                          getRootProps={getPdfRootProps}
                          getInputProps={getPdfInputProps}
                          file={files.pdf}
                          badge="PDF"
                          badgeColor="text-red-400 bg-red-400/10 border-red-400/20"
                          label="项目计划书"
                          onRemove={() =>
                            setFiles((p) => ({ ...p, pdf: null }))
                          }
                        />
                        {/* VIDEO 行 */}
                        <AssetRow
                          getRootProps={getVideoRootProps}
                          getInputProps={getVideoInputProps}
                          file={files.video}
                          badge="VID"
                          badgeColor="text-blue-400 bg-blue-400/10 border-blue-400/20"
                          label="演示视频"
                          onRemove={() =>
                            setFiles((p) => ({ ...p, video: null }))
                          }
                        />
                        {/* POSTER 行 */}
                        <AssetRow
                          getRootProps={getPosterRootProps}
                          getInputProps={getPosterInputProps}
                          file={files.poster}
                          badge="IMG"
                          badgeColor="text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                          label="宣传海报"
                          optional
                          preview={posterPreview}
                          onRemove={() => {
                            setFiles((p) => ({ ...p, poster: null }));
                            setPosterPreview((prev) => {
                              if (prev) URL.revokeObjectURL(prev);
                              return null;
                            });
                          }}
                        />
                      </div>
                    </div>

                    {/* 分割线 */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-border-dark" />
                      <span className="font-mono text-[10px] text-slate-600 tracking-widest">
                        links
                      </span>
                      <div className="flex-1 h-px bg-border-dark" />
                    </div>

                    {/* 链接 */}
                    <div className="space-y-2">
                      <TerminalInput
                        prefix="demo://"
                        placeholder="在线 Demo 地址（选填）"
                        value={formData.demoUrl}
                        onChange={(v) => set("demoUrl", v)}
                      />
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

              {/* ── 第三步：提交确认 ── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col md:flex-row items-center justify-between gap-6 px-2"
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 rounded bg-surface-dark border-border-dark text-primary focus:ring-primary focus:ring-offset-background-dark"
                  />
                  <span className="text-xs text-slate-400 leading-relaxed max-w-sm">
                    我已阅读并同意{" "}
                    <a className="text-primary hover:underline" href="#">
                      《参赛规则》
                    </a>{" "}
                    与{" "}
                    <a className="text-primary hover:underline" href="#">
                      《隐私政策》
                    </a>
                    ，并授权组委会展示本项目的参赛资料。
                  </span>
                </label>

                <div className="flex items-center gap-4 w-full md:w-auto flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="flex-1 md:flex-none px-7 py-4 border border-border-dark rounded-xl text-slate-400 font-bold hover:bg-surface-dark transition-colors text-sm"
                  >
                    返回
                  </button>
                  <motion.button
                    type="submit"
                    disabled={submitting || !agreed}
                    whileHover={!submitting && agreed ? { scale: 1.03 } : {}}
                    whileTap={!submitting && agreed ? { scale: 0.97 } : {}}
                    className="flex-1 md:flex-none px-10 py-4 bg-primary text-white font-black rounded-xl glow-accent
                      uppercase tracking-wider text-sm transition-all
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin size-4"
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
                      "提交报名"
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </form>
          </div>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="mt-auto border-t border-border-dark bg-background-dark py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <LobsterLogo size={20} className="text-slate-400" />
            <span className="font-bold text-sm tracking-widest uppercase text-slate-400">
              OpenClaw
            </span>
          </div>
          <p className="text-[10px] text-slate-600 uppercase tracking-widest">
            © 2026 OpenClaw 龙虾黑客松大赛组委会
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ── 公共子组件 ── */
function Header({ navigate }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-dark bg-background-dark/80 backdrop-blur-md px-6 md:px-12 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="size-9 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/30">
            <LobsterLogo size={20} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight uppercase">
            OpenClaw <span className="text-primary">黑客松</span>
          </span>
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-primary" />
          </span>
          <span className="text-xs text-primary font-semibold">报名进行中</span>
        </div>
      </div>
    </header>
  );
}

function Field({ label, icon, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-300">
        <span className="material-symbols-outlined text-slate-500 text-base">
          {icon}
        </span>
        {label}
      </label>
      {children}
    </div>
  );
}

function TerminalInput({ prefix, placeholder, value, onChange }) {
  return (
    <div className="flex items-center gap-0 rounded-lg border border-border-dark focus-within:border-white/15 transition-colors overflow-hidden">
      <span className="font-mono text-[11px] text-slate-600 px-3 py-2.5 bg-surface-dark/60 border-r border-border-dark flex-shrink-0 select-none">
        {prefix}
      </span>
      <input
        className="bg-transparent border-none focus:ring-0 text-slate-300 flex-1 placeholder:text-slate-700 text-xs font-mono px-3 py-2.5"
        placeholder={placeholder}
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
