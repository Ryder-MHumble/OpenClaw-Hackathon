import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  PlayCircle,
  Image,
  ExternalLink,
  Link,
  Code,
  User,
  Mail,
  Info,
  CheckCircle,
  XCircle,
  Star,
  Lightbulb,
  TrendingUp,
  ClipboardList,
  Send,
  AlertTriangle,
  ArrowRight,
  Keyboard,
  Trash2,
} from "lucide-react";
import apiClient from "../config/apiClient";
import { getTrackInfo } from "../constants/tracks";
import { API_BASE_URL } from "../config/api";

// Spinner component
function Spinner({ size = 20, className = "" }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width={size}
      height={size}
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
  );
}

// 页面内提示弹窗组件
function ResultModal({ show, type, title, message, onNext, onBack }) {
  if (!show) return null;
  const isApproved = type === "approved";
  const isRejected = type === "rejected";

  const Icon = isApproved ? CheckCircle : isRejected ? XCircle : Star;
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
          <Icon className={`size-16 ${iconColor}`} />
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
                <ArrowRight className="size-4" />
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
  const [activeTab, setActiveTab] = useState("pdf"); // pdf | video | poster
  const [loadingStates, setLoadingStates] = useState({
    pdf: true,
    video: true,
    poster: true,
  });

  // 评分状态
  const [scores, setScores] = useState({
    innovation: 5,
    technical: 5,
    market: 5,
    demo: 5,
  });

  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [materialsComplete, setMaterialsComplete] = useState(null); // null | true | false
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
    setModal({
      show: false,
      type: "",
      title: "",
      message: "",
    });
    setParticipant(null);
    setExistingScore(null);
    setComments("");
    setMaterialsComplete(null);
    setLoadingStates({
      pdf: true,
      video: true,
      poster: true,
    });
    setFailedLoads({
      pdf: false,
      video: false,
      poster: false,
    });
    fetchParticipant();
  }, [teamId]);

  const fetchParticipant = async () => {
    try {
      const participantRes = await apiClient.get(`/api/judges/participants/${teamId}`);
      const p = participantRes.data.data;

      const nextStatusFilter =
        p.status === "pending"
          ? "pending"
          : p.status === "reviewing"
            ? "reviewing"
            : null;

      const nextRes = await apiClient.get(`/api/judges/participants/${teamId}/next`, {
        params: nextStatusFilter ? { status: nextStatusFilter } : undefined,
      });

      setParticipant(p);
      setNextId(nextRes.data.data.next_id);

      if (p.status === "scored") {
        try {
          const lbRes = await apiClient.get("/api/judges/leaderboard");
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
        } catch (_) {}
      }
    } catch (error) {
      console.error("Error fetching participant:", error);
      navigate("/judge/dashboard");
    }
  };

  const reviewMode = !participant
    ? "preliminary"
    : participant.status === "pending"
      ? "preliminary"
      : "final";

  const isReadOnly =
    participant &&
    (participant.status === "scored" || participant.status === "rejected");

  const handleDelete = async () => {
    if (!window.confirm("确定要删除这个参赛项目吗？此操作不可恢复！")) {
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.delete(`/api/judges/participants/${teamId}`);

      setModal({
        show: true,
        type: "approved",
        title: "删除成功",
        message: "项目已删除，即将返回列表",
      });

      setTimeout(() => {
        navigate("/judge/dashboard");
      }, 1500);
    } catch (error) {
      console.error(error);
      alert("删除失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreliminarySubmit = async (decision) => {
    setSubmitting(true);
    try {
      const newStatus = decision === "approved" ? "reviewing" : "rejected";
      await apiClient.patch(`/api/judges/participants/${teamId}/status`, {
        status: newStatus,
        comments: comments || undefined,
        materials_complete: materialsComplete,
      });

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
      await apiClient.post("/api/judges/score", fd);

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

  const handleGoNextProject = async () => {
    try {
      let targetId = nextId;
      const nextStatusFilter =
        participant?.status === "pending"
          ? "pending"
          : participant?.status === "reviewing"
            ? "reviewing"
            : null;

      // Fallback: re-fetch next id at click time
      if (!targetId || Number(targetId) === Number(teamId)) {
        const nextRes = await apiClient.get(
          `/api/judges/participants/${teamId}/next`,
          {
            params: nextStatusFilter ? { status: nextStatusFilter } : undefined,
          },
        );
        targetId = nextRes?.data?.data?.next_id ?? null;
      }

      setModal((prev) => ({ ...prev, show: false }));

      if (targetId && Number(targetId) !== Number(teamId)) {
        window.location.assign(`/judge/scoring/${targetId}`);
        return;
      }

      navigate("/judge/dashboard?status=pending");
    } catch (error) {
      console.error("Go next project failed:", error);
      navigate("/judge/dashboard?status=pending");
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
    const youtubeMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    );
    if (youtubeMatch?.[1]) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    const biliMatch = url.match(/bilibili\.com\/video\/(BV[\w]+)/);
    if (biliMatch?.[1]) {
      return `https://player.bilibili.com/player.html?bvid=${biliMatch[1]}&high_quality=1`;
    }
    return url;
  };

  if (!participant) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="flex items-center gap-3 text-primary">
          <Spinner size={20} />
          <span className="text-sm font-bold">加载中…</span>
        </div>
      </div>
    );
  }

  const videoEmbedUrl = getVideoEmbedUrl(participant.video_url);

  const tabs = [
    {
      id: "pdf",
      label: "计划书",
      labelFull: "项目计划书 (PDF)",
      Icon: FileText,
    },
    { id: "video", label: "视频", labelFull: "演示视频", Icon: PlayCircle },
    { id: "poster", label: "海报", labelFull: "项目海报", Icon: Image },
  ];

  const scoreDimensions = [
    { key: "innovation", label: "创新性", weight: "30%", Icon: Lightbulb },
    { key: "technical", label: "技术实现", weight: "30%", Icon: Code },
    { key: "market", label: "市场价值", weight: "20%", Icon: TrendingUp },
    { key: "demo", label: "Demo演示", weight: "20%", Icon: PlayCircle },
  ];

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark text-slate-100">
      <ResultModal
        show={modal.show}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onBack={() => navigate("/judge/dashboard")}
        onNext={nextId ? handleGoNextProject : null}
      />

      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 border-b border-primary/20 px-4 lg:px-20 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate("/judge/dashboard")}
              className="flex items-center gap-1.5 text-slate-400 hover:text-primary transition-colors text-sm font-bold shrink-0"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">返回项目列表</span>
            </button>
            <div className="hidden sm:block h-6 w-px bg-primary/20" />
            <nav className="hidden md:flex items-center gap-2 text-sm text-slate-500">
              <span className="hover:text-primary cursor-pointer">项目库</span>
              <ChevronRight className="size-3" />
              <span className="text-primary font-medium">团队详情</span>
            </nav>
            {/* Mobile: show project title truncated */}
            <span className="sm:hidden text-sm font-medium text-slate-300 truncate max-w-[140px]">
              {participant?.project_title}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-primary/10 rounded-lg p-1">
              <div
                className={`px-2 sm:px-4 py-1.5 rounded text-xs sm:text-sm font-bold whitespace-nowrap ${
                  reviewMode === "preliminary"
                    ? "bg-primary text-white"
                    : "bg-transparent text-slate-400"
                }`}
              >
                {reviewMode === "preliminary" ? "初筛" : "评审"}
              </div>
              {participant && (
                <div className="hidden sm:block text-xs text-slate-500 px-2">
                  {participant.status === "pending" && "待初筛"}
                  {participant.status === "reviewing" && "待评分"}
                  {participant.status === "scored" && "已评分"}
                  {participant.status === "rejected" && "已拒绝"}
                </div>
              )}
            </div>

            <button
              onClick={() => navigate("/judge/roadshow-scoring")}
              className="p-2 sm:px-4 sm:py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary border border-primary/30 transition-all flex items-center gap-2 text-sm font-bold"
              title="路演计分"
            >
              <Keyboard className="size-4" />
              <span className="hidden sm:inline">路演计分</span>
            </button>

            <button
              onClick={handleDelete}
              disabled={submitting}
              className="p-2 sm:px-4 sm:py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 transition-all flex items-center gap-2 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              title="删除此项目"
            >
              <Trash2 className="size-4" />
              <span className="hidden sm:inline">删除</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1800px] mx-auto w-full px-4 lg:px-10 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 左侧：项目信息 */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* 项目基本信息 */}
            <section className="glass-panel p-6 rounded-xl border border-primary/10">
              <h1 className="text-2xl font-black mb-2 leading-tight line-clamp-3">
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

              {/* 描述 - 限制高度，超出折叠 */}
              <ExpandableText
                text={participant.project_description}
                className="text-slate-400 text-sm leading-relaxed mb-5"
              />

              {/* 团队成员 */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                  核心团队成员
                </h3>
                <div className="flex items-center p-3 rounded-lg bg-background-dark/50 border border-primary/5">
                  <div className="size-9 rounded-full bg-primary/20 flex items-center justify-center mr-3 shrink-0">
                    <User className="size-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">匿名参赛者</div>
                    <div className="text-xs text-slate-500 truncate">
                      {participant.organization}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {participant.github && (
                      <a
                        href={participant.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md text-slate-400 hover:text-primary hover:bg-primary/10 transition-all"
                        title="GitHub 主页"
                      >
                        <Link className="size-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 项目链接 */}
            <section className="bg-primary/5 p-5 rounded-xl border border-primary/20">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <Info className="size-4 text-primary" />
                项目链接
              </h3>
              <div className="space-y-2">
                <LinkItem
                  href={participant.demo_url}
                  Icon={Link}
                  label="Demo 演示"
                  emptyLabel="暂无 Demo 演示"
                />
                <LinkItem
                  href={participant.repo_url}
                  Icon={Code}
                  label="代码仓库"
                  emptyLabel="暂无代码仓库"
                />
                <LinkItem
                  href={participant.github}
                  Icon={User}
                  label="GitHub 主页"
                  emptyLabel="暂无 GitHub 主页"
                />
              </div>
            </section>
          </div>

          {/* 右侧：材料查看器 */}
          <div className="lg:col-span-9">
            <div className="glass-panel rounded-xl border border-primary/10 overflow-hidden flex flex-col h-[55vw] sm:h-[600px] lg:h-[800px] min-h-[400px] max-h-[900px]">
              {/* Tab 切换 */}
              <div className="flex bg-background-dark/40 border-b border-primary/10 p-1 shrink-0">
                {tabs.map(({ id, label, labelFull, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex-1 py-2.5 px-1 sm:px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all ${
                      activeTab === id
                        ? "bg-primary text-white"
                        : "text-slate-500 hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span className="sm:hidden">{label}</span>
                    <span className="hidden sm:inline truncate">
                      {labelFull}
                    </span>
                  </button>
                ))}
              </div>

              {/* 内容区域 */}
              <div className="flex-1 relative min-h-0">
                {/* PDF Tab */}
                {activeTab === "pdf" &&
                  (participant.pdf_url ? (
                    <div className="w-full h-full relative">
                      {loadingStates.pdf && <LoadingOverlay />}
                      {!failedLoads.pdf && (
                        <iframe
                          src={participant.pdf_url}
                          className="w-full h-full"
                          title="项目计划书"
                          onLoad={() =>
                            setLoadingStates((p) => ({ ...p, pdf: false }))
                          }
                          onError={() => {
                            setLoadingStates((p) => ({ ...p, pdf: false }));
                            setFailedLoads((p) => ({ ...p, pdf: true }));
                          }}
                        />
                      )}
                      {failedLoads.pdf && (
                        <FailedOverlay
                          href={participant.pdf_url}
                          label="在新窗口打开 PDF"
                        />
                      )}
                    </div>
                  ) : (
                    <EmptyState Icon={FileText} label="暂无项目计划书" />
                  ))}

                {/* Video Tab */}
                {activeTab === "video" &&
                  (participant.video_url && videoEmbedUrl ? (
                    <div className="w-full h-full relative">
                      {loadingStates.video && <LoadingOverlay />}
                      <iframe
                        src={videoEmbedUrl}
                        className="w-full h-full"
                        title="演示视频"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        onLoad={() =>
                          setLoadingStates((p) => ({ ...p, video: false }))
                        }
                        onError={() => {
                          setLoadingStates((p) => ({ ...p, video: false }));
                          setFailedLoads((p) => ({ ...p, video: true }));
                        }}
                      />
                      {failedLoads.video && (
                        <FailedOverlay
                          href={participant.video_url}
                          label="在新窗口打开视频"
                        />
                      )}
                    </div>
                  ) : (
                    <EmptyState Icon={PlayCircle} label="暂无演示视频" />
                  ))}

                {/* Poster Tab */}
                {activeTab === "poster" &&
                  (participant.poster_url ? (
                    <div className="w-full h-full overflow-auto bg-background-dark/20 flex items-center justify-center p-4 relative">
                      {loadingStates.poster && <LoadingOverlay />}
                      {!failedLoads.poster && (
                        <img
                          src={`${API_BASE_URL}/api/proxy-image?url=${encodeURIComponent(participant.poster_url)}`}
                          alt="项目海报"
                          className="max-w-full max-h-full object-contain"
                          onLoad={() =>
                            setLoadingStates((p) => ({ ...p, poster: false }))
                          }
                          onError={() => {
                            setLoadingStates((p) => ({ ...p, poster: false }));
                            setFailedLoads((p) => ({ ...p, poster: true }));
                          }}
                        />
                      )}
                      {failedLoads.poster && (
                        <FailedOverlay
                          href={participant.poster_url}
                          label="在新窗口打开图片"
                        />
                      )}
                    </div>
                  ) : (
                    <EmptyState Icon={Image} label="暂无项目海报" />
                  ))}
              </div>

              {/* 底部工具栏 */}
              <div className="px-4 py-3 bg-background-dark/40 border-t border-primary/10 flex justify-between items-center shrink-0">
                <div>
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
                      title="在新窗口打开"
                    >
                      <ExternalLink className="size-3.5" />
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
        <div className="mt-8">
          <div className="glass-panel rounded-2xl border-2 border-primary/30 p-8">
            {isReadOnly ? (
              /* 只读模式 */
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  {participant.status === "scored" ? (
                    <CheckCircle className="size-12 text-green-400 shrink-0" />
                  ) : (
                    <XCircle className="size-12 text-red-400 shrink-0" />
                  )}
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
                      {scoreDimensions.map((dim) => (
                        <div
                          key={dim.key}
                          className="p-4 rounded-xl bg-background-dark/40 border border-primary/10 flex flex-col items-center gap-2"
                        >
                          <dim.Icon className="size-5 text-primary" />
                          <span className="text-xs text-slate-400 font-medium text-center">
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
                  <ClipboardList className="size-6 text-primary shrink-0" />
                  <div>
                    <h2 className="text-2xl font-bold">初筛评审</h2>
                    <p className="text-sm text-slate-400">
                      请根据项目材料判断是否通过初筛
                    </p>
                  </div>
                </div>

                {/* 材料完整性选项 */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold">
                    材料完整性评估
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setMaterialsComplete(true)}
                      className={`py-4 px-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        materialsComplete === true
                          ? "bg-green-500/20 border-green-500 text-green-300"
                          : "bg-background-dark/30 border-white/10 text-slate-400 hover:border-green-500/50"
                      }`}
                    >
                      <CheckCircle className="size-5" />
                      <span className="text-sm font-bold">材料齐全</span>
                      <span className="text-xs opacity-70">通过初筛</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMaterialsComplete(false)}
                      className={`py-4 px-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        materialsComplete === false
                          ? "bg-red-500/20 border-red-500 text-red-300"
                          : "bg-background-dark/30 border-white/10 text-slate-400 hover:border-red-500/50"
                      }`}
                    >
                      <XCircle className="size-5" />
                      <span className="text-sm font-bold">材料不齐全</span>
                      <span className="text-xs opacity-70">严重问题</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMaterialsComplete(null)}
                      className={`py-4 px-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        materialsComplete === null
                          ? "bg-amber-500/20 border-amber-500 text-amber-300"
                          : "bg-background-dark/30 border-white/10 text-slate-400 hover:border-amber-500/50"
                      }`}
                    >
                      <AlertTriangle className="size-5" />
                      <span className="text-sm font-bold">待审核</span>
                      <span className="text-xs opacity-70">有小问题</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handlePreliminarySubmit("approved")}
                    disabled={submitting}
                    className="py-5 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 text-base"
                  >
                    <CheckCircle className="size-5" />
                    通过初筛（进入评审）
                  </button>
                  <button
                    onClick={() => handlePreliminarySubmit("rejected")}
                    disabled={submitting}
                    className="py-5 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 text-base"
                  >
                    <XCircle className="size-5" />
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
                  <Star className="size-6 text-primary shrink-0" />
                  <div>
                    <h2 className="text-2xl font-bold">评委评价与打分</h2>
                    <p className="text-sm text-slate-400">
                      请据演示内容进行多维度评估，系统将自动计算加权总分
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {scoreDimensions.map((dim) => (
                    <div
                      key={dim.key}
                      className="space-y-3 p-4 rounded-lg bg-background-dark/30 border border-primary/10"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold flex items-center gap-2">
                          <dim.Icon className="size-4 text-primary" />
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

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-lg"
                >
                  {submitting ? (
                    <>
                      <Spinner size={20} />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Send className="size-5" />
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

// ── helper sub-components ──────────────────────────────────────────────────

function ExpandableText({ text, className }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const isLong = text.length > 200;
  return (
    <div className="mb-5">
      <p
        className={`${className} ${!expanded && isLong ? "line-clamp-4" : ""}`}
      >
        {text}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary/70 hover:text-primary mt-1 transition-colors"
        >
          {expanded ? "收起" : "展开全部"}
        </button>
      )}
    </div>
  );
}

function LinkItem({ href, Icon, label, emptyLabel }) {
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 rounded-lg bg-background-dark/30 hover:bg-background-dark/50 transition-all border border-primary/10"
      >
        <Icon className="size-4 text-primary shrink-0" />
        <span className="text-sm truncate">{label}</span>
        <ExternalLink className="size-3 text-slate-500 shrink-0 ml-auto" />
      </a>
    );
  }
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-background-dark/20 border border-primary/5 opacity-40">
      <Icon className="size-4 text-slate-600 shrink-0" />
      <span className="text-sm text-slate-600">{emptyLabel}</span>
    </div>
  );
}

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background-dark/40 z-10">
      <div className="flex flex-col items-center gap-3">
        <Spinner size={32} className="text-primary" />
        <span className="text-xs text-slate-400">加载中...</span>
      </div>
    </div>
  );
}

function FailedOverlay({ href, label }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background-dark/40 z-10">
      <div className="flex flex-col items-center gap-4 bg-background-dark/80 p-6 rounded-lg">
        <AlertTriangle className="size-10 text-yellow-500" />
        <div className="text-center">
          <p className="text-sm font-medium mb-1">无法在当前窗口加载</p>
          <p className="text-xs text-slate-400 mb-4">
            请点击下方按钮在新窗口打开
          </p>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
        >
          <ExternalLink className="size-4" />
          {label}
        </a>
      </div>
    </div>
  );
}

function EmptyState({ Icon, label }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3">
      <Icon className="size-14 opacity-20" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
