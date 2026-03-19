import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutGrid,
  Clock,
  Star,
  XCircle,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  Video,
  Link2,
  Building2,
  CalendarClock,
  Inbox,
  Loader2,
  ClipboardList,
  BarChart3,
  Keyboard,
  Trash2,
  LogOut,
} from "lucide-react";
import apiClient from "../config/apiClient";
import { getTrackInfo } from "../constants/tracks";
import { API_BASE_URL } from "../config/api";
import LobsterLogo from "../components/LobsterLogo";

export default function JudgeDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const STATUS_TABS = ["all", "pending", "reviewing", "rejected"];
  const initialStatus = searchParams.get("status");
  const savedStatus = localStorage.getItem("judge_dashboard_status_tab");

  const [participants, setParticipants] = useState([]);
  const [filter, setFilter] = useState(
    STATUS_TABS.includes(initialStatus)
      ? initialStatus
      : STATUS_TABS.includes(savedStatus)
        ? savedStatus
        : "all",
  );
  const [trackFilter, setTrackFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewing: 0,
    scored: 0,
    rejected: 0,
  });
  const [trackStats, setTrackStats] = useState({
    academic: 0,
    productivity: 0,
    life: 0,
  });
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchStats();
    fetchTrackStats();
    fetchParticipants();
    setCurrentPage(1);
  }, [filter, trackFilter]);

  useEffect(() => {
    localStorage.setItem("judge_dashboard_status_tab", filter);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (filter === "all") {
          next.delete("status");
        } else {
          next.set("status", filter);
        }
        return next;
      },
      { replace: true },
    );
  }, [filter, setSearchParams]);

  const fetchStats = async () => {
    try {
      const res = await apiClient.get("/api/judges/stats");
      const data = res.data.data;
      setStats({
        total: data.total_participants || 0,
        pending: data.pending_count || 0,
        reviewing: data.reviewing_count || 0,
        scored: data.scored_count || 0,
        rejected: data.rejected_count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchTrackStats = async () => {
    try {
      const statusParam = filter !== "all" ? `?status=${filter}` : "";
      const res = await apiClient.get(
        `/api/judges/participants/stats/tracks${statusParam}`,
      );
      const data = res.data.data;
      const stats = {
        academic: 0,
        productivity: 0,
        life: 0,
      };
      data.forEach((item) => {
        if (item.track in stats) {
          stats[item.track] = item.count;
        }
      });
      setTrackStats(stats);
    } catch (error) {
      console.error("Error fetching track stats:", error);
    }
  };

  const handleDelete = async (participantId, projectTitle) => {
    if (
      !window.confirm(
        `确定要删除 "${projectTitle}" 的参赛项目吗？此操作不可恢复！`,
      )
    ) {
      return;
    }

    try {
      await apiClient.delete(`/api/judges/participants/${participantId}`);
      // 重新加载数据
      await fetchParticipants();
      await fetchStats();
    } catch (error) {
      console.error("Delete error:", error);
      alert("删除失败，请重试");
    }
  };

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("judgeToken");
      if (!token) {
        navigate("/judge/login");
        return;
      }
      const statusParam = filter !== "all" ? `?status=${filter}` : "";
      const res = await apiClient.get(`/api/judges/participants${statusParam}`);
      const data = res.data.data;
      const formattedData = data.map((p) => ({
        id: p.id,
        full_name: p.full_name,
        project_title: p.project_title,
        status: p.status,
        organization: p.organization,
        track: p.track,
        submitted_at: formatDate(p.created_at),
        has_pdf: !!p.pdf_url,
        has_video: !!p.video_url,
        has_url: !!p.demo_url || !!p.repo_url,
        cover_image:
          p.poster_url ||
          "https://equal-white-jmg5rfasyt.edgeone.app/banner2.png",
      }));
      setParticipants(formattedData);
    } catch (error) {
      console.error("Error fetching participants:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      const token = localStorage.getItem("judgeToken");
      const response = await fetch(
        `${API_BASE_URL}/api/judges/participants/export/excel`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("导出失败");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `参赛者评审情况_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
      alert("导出失败，请重试");
    } finally {
      setExportLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("确定要退出登录吗？")) {
      localStorage.removeItem("judgeToken");
      navigate("/judge/login");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "未知";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffHours < 1) return "刚刚";
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays === 1) return "昨日";
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString("zh-CN");
  };

  const filteredParticipants = participants.filter((p) => {
    const matchesFilter = filter === "all" || p.status === filter;
    const matchesTrack = trackFilter === "all" || p.track === trackFilter;
    const matchesSearch =
      p.project_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.organization.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesTrack && matchesSearch;
  });

  const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage);
  const paginatedParticipants = filteredParticipants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: "bg-amber-500/90", text: "待评审", Icon: Clock },
      reviewing: { bg: "bg-blue-500/90", text: "评审中", Icon: ClipboardList },
      scored: { bg: "bg-green-500/90", text: "已评分", Icon: Star },
      rejected: { bg: "bg-red-500/90", text: "已拒绝", Icon: XCircle },
    };
    return badges[status] || badges.pending;
  };

  const TABS = [
    { key: "all", label: "全部团队", Icon: LayoutGrid, count: stats.total },
    { key: "pending", label: "待初筛", Icon: Clock, count: stats.pending },
    {
      key: "reviewing",
      label: "初筛通过",
      Icon: ClipboardList,
      count: stats.reviewing,
    },
    { key: "rejected", label: "已拒绝", Icon: XCircle, count: stats.rejected },
  ];

  const TRACK_TABS = [
    { key: "all", label: "全部赛道", emoji: "🦞", count: stats.total },
    {
      key: "academic",
      label: "学术龙虾",
      emoji: "🎓",
      count: trackStats.academic,
    },
    {
      key: "productivity",
      label: "生产力龙虾",
      emoji: "⚡",
      count: trackStats.productivity,
    },
    { key: "life", label: "生活龙虾", emoji: "🌟", count: trackStats.life },
  ];

  const STAT_CARDS = [
    {
      label: "总计参赛团队",
      value: stats.total,
      accent: "primary",
      accentClass: "text-primary/70",
      barClass: "bg-primary",
      barWidth: "100%",
      borderClass: "",
    },
    {
      label: "待初筛作品",
      value: stats.pending,
      accentClass: "text-amber-400/80",
      barClass: "bg-amber-400",
      barWidth: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%`,
      borderClass: "border-l-2 border-l-amber-400/50",
    },
    {
      label: "初筛通过",
      value: stats.reviewing,
      accentClass: "text-emerald-400/80",
      barClass: "bg-emerald-400",
      barWidth: `${stats.total > 0 ? (stats.reviewing / stats.total) * 100 : 0}%`,
      borderClass: "border-l-2 border-l-emerald-400/50",
    },
    {
      label: "已拒绝作品",
      value: stats.rejected,
      accentClass: "text-red-400/80",
      barClass: "bg-red-400",
      barWidth: `${stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0}%`,
      borderClass: "border-l-2 border-l-red-400/50",
    },
  ];

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#0c0a09] text-slate-100 overflow-x-hidden">
      {/* 背景 */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/[0.05] blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-[100px] pointer-events-none" />
      <div className="fixed inset-0 dot-grid opacity-20 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] backdrop-blur-xl bg-black/30 px-6 lg:px-16 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
              <LobsterLogo size={18} className="text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight">
              OpenClaw <span className="text-slate-300">开发者大赛</span>
            </span>
          </div>

          <div className="flex flex-1 justify-end items-center gap-5">
            <nav className="hidden md:flex items-center gap-5">
              <button
                onClick={() => navigate("/judge/dashboard")}
                className="text-primary text-sm font-bold border-b border-primary pb-0.5"
              >
                控制面板
              </button>
              <button
                onClick={() => navigate("/judge/roadshow-scoring")}
                className="text-slate-500 hover:text-slate-200 transition-colors text-sm font-medium flex items-center gap-1.5"
              >
                <Keyboard size={14} />
                路演计分
              </button>
              <button
                onClick={() => navigate("/judge/leaderboard")}
                className="text-slate-500 hover:text-slate-200 transition-colors text-sm font-medium flex items-center gap-1.5"
              >
                <BarChart3 size={14} />
                排行榜
              </button>
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-400 transition-colors text-sm font-medium flex items-center gap-1.5"
                title="退出登录"
              >
                <LogOut size={14} />
                退出
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 lg:px-16 py-8">
        {/* Title */}
        <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-3xl font-black tracking-tight">
              大赛初筛工作台
            </h1>
            <p className="text-primary text-sm font-medium flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
              </span>
              当前阶段：初赛作品筛选
            </p>
          </div>
          <button
            onClick={handleExportExcel}
            disabled={exportLoading}
            className="bg-primary hover:bg-primary/85 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download size={14} />
                导出评审报告
              </>
            )}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {STAT_CARDS.map((card, idx) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * idx }}
              className={`rounded-xl p-5 bg-white/[0.03] border border-white/[0.06] ${card.borderClass}`}
            >
              <p className={`text-xs font-medium mb-1 ${card.accentClass}`}>
                {card.label}
              </p>
              <p className="text-3xl font-black text-slate-100">{card.value}</p>
              <div className="w-full bg-white/5 h-0.5 rounded-full mt-4">
                <motion.div
                  className={`${card.barClass} h-full rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: card.barWidth }}
                  transition={{ delay: 0.2 + idx * 0.05, duration: 0.6 }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="mb-5 overflow-x-auto">
          <div className="flex border-b border-white/[0.07] gap-1 min-w-max">
            {TABS.map(({ key, label, Icon, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex items-center gap-1.5 px-4 pb-3 pt-1 text-sm font-medium border-b-2 transition-all ${
                  filter === key
                    ? "border-primary text-white font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                <Icon size={13} />
                {label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-md ${filter === key ? "bg-primary/20 text-primary" : "bg-white/5 text-slate-600"}`}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Track Filter Tabs with Search */}
        <div className="mb-7 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="overflow-x-auto w-full sm:w-auto">
            <div className="flex gap-2 min-w-max">
              {TRACK_TABS.map(({ key, label, emoji, count }) => (
                <button
                  key={key}
                  onClick={() => setTrackFilter(key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    trackFilter === key
                      ? "bg-primary/15 border-2 border-primary/40 text-white shadow-lg shadow-primary/10"
                      : "bg-white/[0.03] border-2 border-white/[0.06] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                  }`}
                >
                  <span className="text-base">{emoji}</span>
                  <span>{label}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md font-mono ${trackFilter === key ? "bg-primary/25 text-primary" : "bg-white/5 text-slate-600"}`}
                  >
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 搜索框 */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.06] focus-within:border-primary/30 transition-colors w-full sm:w-64">
            <Search size={13} className="text-slate-500 shrink-0" />
            <input
              className="bg-transparent text-slate-100 placeholder:text-slate-600 text-sm outline-none w-full"
              placeholder="搜索团队或项目…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex items-center gap-3 text-primary">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm font-bold">加载中…</span>
            </div>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="text-center py-24">
            <Inbox
              size={48}
              className="text-slate-700 mx-auto mb-4"
              strokeWidth={1.2}
            />
            <p className="text-slate-500">暂无参赛项目</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedParticipants.map((participant, index) => {
              const badge = getStatusBadge(participant.status);
              const { Icon: BadgeIcon } = badge;
              const trackInfo = getTrackInfo(participant.track);
              return (
                <motion.div
                  key={participant.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="rounded-2xl overflow-hidden group cursor-pointer border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
                  onClick={() => navigate(`/judge/scoring/${participant.id}`)}
                >
                  <div
                    className="relative h-64 bg-cover bg-center"
                    style={{
                      backgroundImage: `url('${API_BASE_URL}/api/proxy-image?url=${encodeURIComponent(participant.cover_image)}')`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />

                    {/* 状态徽章 */}
                    <div
                      className={`absolute top-3 right-3 ${badge.bg} text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 backdrop-blur-sm`}
                    >
                      <BadgeIcon size={10} />
                      {badge.text}
                    </div>

                    {/* 赛道徽章 */}
                    {trackInfo && (
                      <div
                        className={`absolute top-3 left-3 ${trackInfo.bg} ${trackInfo.color} text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-sm border ${trackInfo.border}`}
                      >
                        <span>{trackInfo.emoji}</span>
                        <span>{trackInfo.title}</span>
                      </div>
                    )}

                    {/* 内容 */}
                    <div className="absolute inset-0 flex flex-col justify-end p-4">
                      <div className="flex justify-between items-start mb-2.5">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-white mb-0.5 truncate">
                            {participant.project_title}
                          </h3>
                          <p className="text-slate-400 text-xs font-medium line-clamp-1">
                            {participant.organization}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-3 shrink-0">
                          {participant.has_pdf && (
                            <FileText
                              size={15}
                              className="text-primary/70 hover:text-primary cursor-pointer transition-colors"
                            />
                          )}
                          {participant.has_video && (
                            <Video
                              size={15}
                              className="text-primary/70 hover:text-primary cursor-pointer transition-colors"
                            />
                          )}
                          {participant.has_url && (
                            <Link2
                              size={15}
                              className="text-primary/70 hover:text-primary cursor-pointer transition-colors"
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-3 pb-3 border-t border-white/10 pt-2.5">
                        <span className="flex items-center gap-1">
                          <CalendarClock size={11} />
                          {participant.submitted_at}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <Building2 size={11} className="shrink-0" />
                          <span className="truncate">
                            {participant.organization}
                          </span>
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/judge/scoring/${participant.id}`);
                          }}
                          className="flex-1 bg-primary hover:bg-primary/85 text-white py-2 rounded-lg text-sm font-bold transition-all duration-200 group-hover:shadow-lg group-hover:shadow-primary/30"
                        >
                          查看详情
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(
                              participant.id,
                              participant.project_title,
                            );
                          }}
                          className="px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-all duration-200"
                          title="删除项目"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {filteredParticipants.length > 0 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="size-9 flex items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`size-9 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                          page === currentPage
                            ? "bg-primary text-white shadow-lg shadow-primary/30"
                            : "bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-primary hover:border-primary/30"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span key={page} className="text-slate-600 px-1 text-sm">
                        …
                      </span>
                    );
                  }
                  return null;
                },
              )}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="size-9 flex items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
            <span className="text-xs text-slate-600 ml-2 font-mono">
              {(currentPage - 1) * itemsPerPage + 1}–
              {Math.min(
                currentPage * itemsPerPage,
                filteredParticipants.length,
              )}{" "}
              / {filteredParticipants.length}
            </span>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-6 lg:px-16 py-6 border-t border-white/[0.05] text-center mt-8">
        <p className="text-slate-700 text-xs">
          © 2026 OpenClaw Hackathon Committee · All rights reserved.
        </p>
      </footer>
    </div>
  );
}
