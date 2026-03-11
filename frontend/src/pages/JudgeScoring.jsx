import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { getTrackInfo } from "../constants/tracks";

// 页面内提示弹窗组件
function ResultModal({ show, type, title, message, onNext, onBack }) {
  if (!show) return null;
  const isSuccess = type === "success";
  const isApproved = type === "approved";
  const isRejected = type === "rejected";
  const iconName = isApproved ? "check_circle" : isRejected ? "cancel" : "star";
  const iconColor = isApproved
    ? "text-green-400"
    : isRejected
      ? "text-red-400"
      : "text-primary";
  const bgColor = isApproved
    ? "border-green-500/30"
    : isRejected
      ? "border-red-500/30"
      : "border-primary/30";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          className={`relative bg-background-dark border-2 ${bgColor} rounded-2xl p-10 flex flex-col items-center gap-6 shadow-2xl max-w-md w-full mx-4`}
        >
          <span className={`material-symbols-outlined text-7xl ${iconColor}`}>
            {iconName}
          </span>
          <div className="text-center">
            <h2 className="text-2xl font-black mb-2">{title}</h2>
            <p className="text-slate-400 text-sm">{message}</p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={onBack}
              className="flex-1 py-3 rounded-xl border border-primary/30 text-slate-300 font-bold hover:bg-primary/10 transition-all"
            >
              返回列表
            </button>
            {onNext && (
              <button
                onClick={onNext}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">
                  arrow_forward
                </span>
                下一个项目
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default function JudgeScoring() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [participant, setParticipant] = useState(null);
  const [existingScore, setExistingScore] = useState(null);
  const [activeTab, setActiveTab] = useState("pdf"); // pdf | video | links
  const [loadingStates, setLoadingStates] = useState({
    pdf: true,
    video: true,
    poster: true,
  });
  const fetchedRef = useRef(false);

  // 评分状态
  const [scores, setScores] = useState({
    innovation: 5,
    technical: 5,
    market: 5,
    demo: 5,
  });

  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [failedLoads, setFailedLoads] = useState({
    pdf: false,
    video: false,
    poster: false,
  });

  // 结果弹窗
  const [modal, setModal] = useState({
    show: false,
    type: "",
    title: "",
    message: "",
  });
  const [nextId, setNextId] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchParticipant();
    }
  }, [teamId]);

  const fetchParticipant = async () => {
    try {
      const [participantRes, nextRes] = await Promise.all([
        axios.get(`/api/judges/participants/${teamId}`),
        axios.get(`/api/judges/participants/${teamId}/next`),
      ]);
      const p = participantRes.data.data;
      setParticipant(p);
      setNextId(nextRes.data.data.next_id);

      // 如果已评分，从排行榜视图获取已有分数
      if (p.status === "scored") {
        try {
          const lbRes = await axios.get("/api/judges/leaderboard");
          const entry = lbRes.data.data.find((item) => item.id === p.id);
          if (entry) {
            setExistingScore({
              innovation: entry.avg_innovation,
              technical: entry.avg_technical,
              market: entry.avg_market,
              demo: entry.avg_demo,
              weighted: entry.avg_weighted_score,
            });
          }
        } catch (_) {
          // 获取分数失败不影响主流程
        }
      }
    } catch (error) {
      console.error("Error fetching participant:", error);
      navigate("/judge/dashboard");
    }
  };

  // 根据状态判断评审模式
  const reviewMode = !participant
    ? "preliminary"
    : participant.status === "pending"
      ? "preliminary"
      : "final";

  // 判断是否已经评分或拒绝
  const isReadOnly =
    participant &&
    (participant.status === "scored" || participant.status === "rejected");

  const handlePreliminarySubmit = async (decision) => {
    setSubmitting(true);
    try {
      const newStatus = decision === "approved" ? "reviewing" : "rejected";
      const formData = new FormData();
      formData.append("status", newStatus);
      if (comments) formData.append("comments", comments);
      await axios.patch(`/api/judges/participants/${teamId}/status`, formData);

      setModal({
        show: true,
        type: decision === "approved" ? "approved" : "rejected",
        title: decision === "approved" ? "已通过初筛 ✓" : "已标记为不通过",
        message:
          decision === "approved"
            ? "该项目已进入评审阶段，即将跳转到下一个项目"
            : "该项目已在初筛阶段被淘汰，即将跳转到下一个项目",
      });
    } catch (error) {
      console.error(error);
      setModal({
        show: true,
        type: "error",
        title: "提交失败",
        message: "请检查网络连接后重试",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("participant_id", teamId);
      Object.entries(scores).forEach(([k, v]) => fd.append(k, v));
      fd.append("comments", comments);
      await axios.post("/api/judges/score", fd);

      setModal({
        show: true,
        type: "scored",
        title: "评分已提交 ★",
        message: `加权总分 ${weightedScore} 分，即将跳转到下一个项目`,
      });
    } catch (error) {
      console.error(error);
      setModal({
        show: true,
        type: "error",
        title: "提交失败",
        message: "请检查网络连接后重试",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const weightedScore = (
    scores.innovation * 0.3 +
    scores.technical * 0.3 +
    scores.market * 0.2 +
    scores.demo * 0.2
  ).toFixed(1);

  const getVideoEmbedUrl = (url) => {
    if (!url) return null;

    // YouTube
    const youtubeMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    );
    if (youtubeMatch?.[1]) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Bilibili
    const biliMatch = url.match(/bilibili\.com\/video\/(BV[\w]+)/);
    if (biliMatch?.[1]) {
      return `https://player.bilibili.com/player.html?bvid=${biliMatch[1]}&high_quality=1`;
    }

    // 其他视频链接直接返回
    return url;
  };

  if (!participant) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="flex items-center gap-3 text-primary">
          <svg className="animate-spin size-5" viewBox="0 0 24 24" fill="none">
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
          <span className="text-sm font-bold">加载中…</span>
        </div>
      </div>
    );
  }

  const videoEmbedUrl = getVideoEmbedUrl(participant.video_url);

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark text-slate-100">
      <ResultModal
        show={modal.show}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onBack={() => navigate("/judge/dashboard")}
        onNext={nextId ? () => navigate(`/judge/scoring/${nextId}`) : null}
      />
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 border-b border-primary/20 px-6 lg:px-20 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate("/judge/dashboard")}
              className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors text-sm font-bold"
            >
              <span className="material-symbols-outlined text-lg">
                arrow_back
              </span>
              返回项目列表
            </button>
            <div className="h-6 w-px bg-primary/20"></div>
            <nav className="flex items-center gap-2 text-sm text-slate-500">
              <span className="hover:text-primary cursor-pointer">项目库</span>
              <span className="material-symbols-outlined text-xs">
                chevron_right
              </span>
              <span className="text-primary font-medium">团队详情</span>
            </nav>
          </div>

          {/* 模式切换 - 根据状态自动显示 */}
          <div className="flex items-center gap-2 bg-primary/10 rounded-lg p-1">
            <div
              className={`px-4 py-2 rounded text-sm font-bold ${
                reviewMode === "preliminary"
                  ? "bg-primary text-white"
                  : "bg-transparent text-slate-400"
              }`}
            >
              {reviewMode === "preliminary" ? "初筛阶段" : "评审阶段"}
            </div>
            {participant && (
              <div className="text-xs text-slate-500 px-2">
                状态: {participant.status === "pending" && "待初筛"}
                {participant.status === "reviewing" && "待评分"}
                {participant.status === "scored" && "已评分"}
                {participant.status === "rejected" && "已拒绝"}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-10 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 左侧：项目信息 */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            {/* 项目基本信息 */}
            <section className="glass-panel p-6 rounded-xl border border-primary/10">
              <h1 className="text-3xl font-black mb-2 leading-tight">
                {participant.project_title}
              </h1>

              {/* 赛道徽章 */}
              {participant.track &&
                (() => {
                  const trackInfo = getTrackInfo(participant.track);
                  return trackInfo ? (
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${trackInfo.bg} ${trackInfo.color} border ${trackInfo.border} text-xs font-bold mb-4`}
                    >
                      <span>{trackInfo.emoji}</span>
                      <span>{trackInfo.title}</span>
                      <span className="text-[10px] opacity-60">
                        · {trackInfo.subtitle}
                      </span>
                    </div>
                  ) : null;
                })()}

              <p className="text-slate-400 text-base leading-relaxed mb-6">
                {participant.project_description}
              </p>

              {/* 团队成员 */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                  核心团队成员
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center p-3 rounded-lg bg-background-dark/50 border border-primary/5">
                    <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                      <span className="material-symbols-outlined text-primary">
                        person
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold">
                        {participant.full_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {participant.organization}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {participant.email && (
                        <a
                          href={`mailto:${participant.email}`}
                          className="material-symbols-outlined text-slate-400 text-lg cursor-pointer hover:text-primary"
                        >
                          mail
                        </a>
                      )}
                      {participant.github && (
                        <a
                          href={participant.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="material-symbols-outlined text-slate-400 text-lg cursor-pointer hover:text-primary"
                        >
                          link
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 项目背景 */}
            <section className="bg-primary/5 p-6 rounded-xl border border-primary/20">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  info
                </span>
                项目链接
              </h3>
              <div className="space-y-3">
                {participant.demo_url ? (
                  <a
                    href={participant.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-background-dark/30 hover:bg-background-dark/50 transition-all border border-primary/10"
                  >
                    <span className="material-symbols-outlined text-primary">
                      link
                    </span>
                    <span className="text-sm">Demo 演示</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background-dark/20 border border-primary/5 opacity-50">
                    <span className="material-symbols-outlined text-slate-600">
                      link
                    </span>
                    <span className="text-sm text-slate-600">
                      暂无 Demo 演示
                    </span>
                  </div>
                )}
                {participant.repo_url ? (
                  <a
                    href={participant.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-background-dark/30 hover:bg-background-dark/50 transition-all border border-primary/10"
                  >
                    <span className="material-symbols-outlined text-primary">
                      code
                    </span>
                    <span className="text-sm">代码仓库</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background-dark/20 border border-primary/5 opacity-50">
                    <span className="material-symbols-outlined text-slate-600">
                      code
                    </span>
                    <span className="text-sm text-slate-600">暂无代码仓库</span>
                  </div>
                )}
                {participant.github ? (
                  <a
                    href={participant.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-background-dark/30 hover:bg-background-dark/50 transition-all border border-primary/10"
                  >
                    <span className="material-symbols-outlined text-primary">
                      person
                    </span>
                    <span className="text-sm">GitHub 主页</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background-dark/20 border border-primary/5 opacity-50">
                    <span className="material-symbols-outlined text-slate-600">
                      person
                    </span>
                    <span className="text-sm text-slate-600">
                      暂无 GitHub 主页
                    </span>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* 右侧：材料查看器 */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="glass-panel rounded-xl border border-primary/10 overflow-hidden flex flex-col h-[700px]">
              {/* Tab 切换 */}
              <div className="flex bg-background-dark/40 border-b border-primary/10 p-1">
                <button
                  onClick={() => setActiveTab("pdf")}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    activeTab === "pdf"
                      ? "bg-primary text-white"
                      : "text-slate-500 hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    picture_as_pdf
                  </span>
                  项目计划书 (PDF)
                </button>
                <button
                  onClick={() => setActiveTab("video")}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    activeTab === "video"
                      ? "bg-primary text-white"
                      : "text-slate-500 hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    play_circle
                  </span>
                  演示视频
                </button>
                <button
                  onClick={() => setActiveTab("poster")}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    activeTab === "poster"
                      ? "bg-primary text-white"
                      : "text-slate-500 hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    image
                  </span>
                  项目海报
                </button>
              </div>

              {/* 内容区域 */}
              <div className="flex-1 relative">
                {activeTab === "pdf" &&
                  (participant.pdf_url ? (
                    <div className="w-full h-full relative flex items-center justify-center bg-background-dark/20">
                      {loadingStates.pdf && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background-dark/40 z-10">
                          <div className="flex flex-col items-center gap-3">
                            <svg
                              className="animate-spin size-8 text-primary"
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
                            <span className="text-xs text-slate-400">
                              加载中...
                            </span>
                          </div>
                        </div>
                      )}
                      {!failedLoads.pdf && (
                        <iframe
                          src={participant.pdf_url}
                          className="w-full h-full"
                          title="项目计划书"
                          onLoad={() =>
                            setLoadingStates((prev) => ({
                              ...prev,
                              pdf: false,
                            }))
                          }
                          onError={() => {
                            setLoadingStates((prev) => ({
                              ...prev,
                              pdf: false,
                            }));
                            setFailedLoads((prev) => ({ ...prev, pdf: true }));
                          }}
                        />
                      )}
                      {failedLoads.pdf && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background-dark/40">
                          <div className="flex flex-col items-center gap-4 bg-background-dark/80 p-6 rounded-lg">
                            <span className="material-symbols-outlined text-4xl text-yellow-500">
                              warning
                            </span>
                            <div className="text-center">
                              <p className="text-sm font-medium mb-2">
                                无法在当前窗口加载PDF
                              </p>
                              <p className="text-xs text-slate-400 mb-4">
                                请点击下方按钮在新窗口打开
                              </p>
                            </div>
                            <a
                              href={participant.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-all"
                            >
                              在新窗口打开 PDF
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                      <span className="material-symbols-outlined text-6xl mb-4 opacity-30">
                        picture_as_pdf
                      </span>
                      <p className="text-sm">暂无项目计划书</p>
                    </div>
                  ))}
                {activeTab === "video" &&
                  (participant.video_url && videoEmbedUrl ? (
                    <div className="w-full h-full relative flex items-center justify-center bg-background-dark/20">
                      {loadingStates.video && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background-dark/40 z-10">
                          <div className="flex flex-col items-center gap-3">
                            <svg
                              className="animate-spin size-8 text-primary"
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
                            <span className="text-xs text-slate-400">
                              加载中...
                            </span>
                          </div>
                        </div>
                      )}
                      <iframe
                        src={videoEmbedUrl}
                        className="w-full h-full"
                        title="演示视频"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        onLoad={() =>
                          setLoadingStates((prev) => ({
                            ...prev,
                            video: false,
                          }))
                        }
                        onError={() => {
                          setLoadingStates((prev) => ({
                            ...prev,
                            video: false,
                          }));
                          setFailedLoads((prev) => ({ ...prev, video: true }));
                        }}
                      />
                      {failedLoads.video && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background-dark/40 z-10">
                          <div className="flex flex-col items-center gap-4 bg-background-dark/80 p-6 rounded-lg">
                            <span className="material-symbols-outlined text-4xl text-yellow-500">
                              warning
                            </span>
                            <div className="text-center">
                              <p className="text-sm font-medium mb-2">
                                无法在当前窗口加载视频
                              </p>
                              <p className="text-xs text-slate-400 mb-4">
                                请点击下方按钮在新窗口打开
                              </p>
                            </div>
                            <a
                              href={participant.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-all"
                            >
                              在新窗口打开视频
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                      <span className="material-symbols-outlined text-6xl mb-4 opacity-30">
                        play_circle
                      </span>
                      <p className="text-sm">暂无演示视频</p>
                    </div>
                  ))}
                {activeTab === "poster" &&
                  (participant.poster_url ? (
                    <div className="w-full h-full overflow-auto bg-background-dark/20 flex items-center justify-center p-4 relative">
                      {loadingStates.poster && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background-dark/40 z-10">
                          <div className="flex flex-col items-center gap-3">
                            <svg
                              className="animate-spin size-8 text-primary"
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
                            <span className="text-xs text-slate-400">
                              加载中...
                            </span>
                          </div>
                        </div>
                      )}
                      {!failedLoads.poster && (
                        <img
                          src={`/api/proxy-image?url=${encodeURIComponent(participant.poster_url)}`}
                          alt="项目海报"
                          className="max-w-full max-h-full object-contain"
                          onLoad={() =>
                            setLoadingStates((prev) => ({
                              ...prev,
                              poster: false,
                            }))
                          }
                          onError={() => {
                            setLoadingStates((prev) => ({
                              ...prev,
                              poster: false,
                            }));
                            setFailedLoads((prev) => ({
                              ...prev,
                              poster: true,
                            }));
                          }}
                        />
                      )}
                      {failedLoads.poster && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background-dark/40 z-10">
                          <div className="flex flex-col items-center gap-4 bg-background-dark/80 p-6 rounded-lg">
                            <span className="material-symbols-outlined text-4xl text-yellow-500">
                              warning
                            </span>
                            <div className="text-center">
                              <p className="text-sm font-medium mb-2">
                                无法在当前窗口加载图片
                              </p>
                              <p className="text-xs text-slate-400 mb-4">
                                请点击下方按钮在新窗口打开
                              </p>
                            </div>
                            <a
                              href={participant.poster_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-all"
                            >
                              在新窗口打开图片
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                      <span className="material-symbols-outlined text-6xl mb-4 opacity-30">
                        image
                      </span>
                      <p className="text-sm">暂无项目海报</p>
                    </div>
                  ))}
              </div>

              {/* 底部工具栏 */}
              <div className="p-4 bg-background-dark/40 border-t border-primary/10 flex justify-between items-center">
                <div className="flex gap-4">
                  {((activeTab === "pdf" && participant.pdf_url) ||
                    (activeTab === "video" && participant.video_url) ||
                    (activeTab === "poster" && participant.poster_url)) && (
                    <a
                      href={
                        activeTab === "pdf"
                          ? participant.pdf_url
                          : activeTab === "video"
                            ? participant.video_url
                            : participant.poster_url
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="size-8 rounded flex items-center justify-center bg-white/5 hover:bg-primary/20 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">
                        open_in_new
                      </span>
                    </a>
                  )}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {activeTab === "pdf" && "PDF 文档"}
                  {activeTab === "video" && "视频播放"}
                  {activeTab === "poster" && "项目海报"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 评审区域 */}
        <div className="mt-12">
          <div className="glass-panel rounded-2xl border-2 border-primary/30 p-8">
            {isReadOnly ? (
              /* 只读模式 - 已评分或已拒绝 */
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <span
                    className={`material-symbols-outlined text-5xl ${participant.status === "scored" ? "text-green-400" : "text-red-400"}`}
                  >
                    {participant.status === "scored"
                      ? "check_circle"
                      : "cancel"}
                  </span>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {participant.status === "scored"
                        ? "已完成评分"
                        : "已标记为不通过"}
                    </h2>
                    <p className="text-slate-400 text-sm">
                      {participant.status === "scored"
                        ? "该项目已完成评分，以下为本轮平均分"
                        : "该项目在初筛阶段被标记为不通过"}
                    </p>
                  </div>
                </div>

                {participant.status === "scored" && existingScore && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        {
                          key: "innovation",
                          label: "创新性",
                          weight: "30%",
                          icon: "lightbulb",
                        },
                        {
                          key: "technical",
                          label: "技术实现",
                          weight: "30%",
                          icon: "code",
                        },
                        {
                          key: "market",
                          label: "市场价值",
                          weight: "20%",
                          icon: "trending_up",
                        },
                        {
                          key: "demo",
                          label: "Demo演示",
                          weight: "20%",
                          icon: "play_circle",
                        },
                      ].map((dim) => (
                        <div
                          key={dim.key}
                          className="p-4 rounded-xl bg-background-dark/40 border border-primary/10 flex flex-col items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-primary text-xl">
                            {dim.icon}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {dim.label} ({dim.weight})
                          </span>
                          <span className="text-3xl font-black text-primary">
                            {existingScore[dim.key] ?? "-"}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="p-5 bg-primary/10 rounded-xl border border-primary/30 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-400">
                        加权总分
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-primary">
                          {existingScore.weighted}
                        </span>
                        <span className="text-slate-400">/ 10</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : reviewMode === "preliminary" ? (
              /* 初筛模式 */
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-2xl">
                    rate_review
                  </span>
                  <div>
                    <h2 className="text-2xl font-bold">初筛评审</h2>
                    <p className="text-sm text-slate-400">
                      请根据项目材料判断是否通过初筛
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handlePreliminarySubmit("approved")}
                    disabled={submitting}
                    className="py-6 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 text-lg"
                  >
                    <span className="material-symbols-outlined text-2xl">
                      check_circle
                    </span>
                    通过初筛（进入评审）
                  </button>

                  <button
                    onClick={() => handlePreliminarySubmit("rejected")}
                    disabled={submitting}
                    className="py-6 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 text-lg"
                  >
                    <span className="material-symbols-outlined text-2xl">
                      cancel
                    </span>
                    不通过（淘汰）
                  </button>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <label className="block text-sm font-medium mb-2">
                    备注（可选）
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-background-dark border border-primary/20 text-slate-100 placeholder:text-slate-600 text-sm resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 outline-none"
                    rows="4"
                    placeholder="记录初筛意见..."
                  />
                </div>
              </div>
            ) : (
              /* 复筛打分模式 */
              <form onSubmit={handleFinalSubmit} className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-2xl">
                    star
                  </span>
                  <div>
                    <h2 className="text-2xl font-bold">评委评价与打分</h2>
                    <p className="text-sm text-slate-400">
                      请据演示内容进行多维度评估，系统将自动计算加权总分
                    </p>
                  </div>
                </div>

                {/* 评分维度 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      key: "innovation",
                      label: "创新性",
                      weight: "30%",
                      icon: "lightbulb",
                    },
                    {
                      key: "technical",
                      label: "技术实现",
                      weight: "30%",
                      icon: "code",
                    },
                    {
                      key: "market",
                      label: "市场价值",
                      weight: "20%",
                      icon: "trending_up",
                    },
                    {
                      key: "demo",
                      label: "Demo演示",
                      weight: "20%",
                      icon: "play_circle",
                    },
                  ].map((dim) => (
                    <div
                      key={dim.key}
                      className="space-y-3 p-4 rounded-lg bg-background-dark/30 border border-primary/10"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-base">
                            {dim.icon}
                          </span>
                          {dim.label}
                          <span className="text-xs text-slate-500">
                            ({dim.weight})
                          </span>
                        </label>
                        <span className="text-2xl font-black text-primary">
                          {scores[dim.key].toFixed(1)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={scores[dim.key]}
                        onChange={(e) =>
                          setScores({
                            ...scores,
                            [dim.key]: parseFloat(e.target.value),
                          })
                        }
                        className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  ))}
                </div>

                {/* 加权总分 */}
                <div className="p-6 bg-primary/10 rounded-xl border-2 border-primary/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-slate-400">
                        最终加权总分
                      </span>
                      <p className="text-xs text-slate-500 mt-1">
                        创新×0.3 + 技术×0.3 + 市场×0.2 + Demo×0.2
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-5xl font-black text-primary">
                        {weightedScore}
                      </span>
                      <span className="text-xl text-slate-400 ml-1">/ 10</span>
                    </div>
                  </div>
                </div>

                {/* 评语 */}
                <div>
                  <label className="block text-sm font-bold mb-2">
                    评审意见
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-background-dark border border-primary/20 text-slate-100 placeholder:text-slate-600 text-sm resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 outline-none"
                    rows="4"
                    placeholder="记录评审意见和建议..."
                    required
                  />
                </div>

                {/* 提交按钮 */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-lg"
                >
                  {submitting ? (
                    <>
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
                      提交中...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">send</span>
                      提交评分
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
