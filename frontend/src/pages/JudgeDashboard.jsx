import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { getTrackInfo } from "../constants/tracks";

export default function JudgeDashboard() {
  const [participants, setParticipants] = useState([]);
  const [filter, setFilter] = useState("all");
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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchStats();
    fetchParticipants();
    setCurrentPage(1); // Reset to first page when filter changes
  }, [filter]);

  const fetchStats = async () => {
    try {
      const res = await axios.get("/api/judges/stats");
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

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("judgeToken");
      if (!token) {
        navigate("/judge/login");
        return;
      }

      // 获取参赛者数据
      const statusParam = filter !== "all" ? `?status=${filter}` : "";
      const res = await axios.get(`/api/judges/participants${statusParam}`);
      const data = res.data.data;

      // 转换数据格式以匹配前端需求
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
    const matchesSearch =
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.project_title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage);
  const paginatedParticipants = filteredParticipants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: "bg-amber-500/90", text: "待评审", icon: "timer" },
      reviewing: { bg: "bg-blue-500/90", text: "评审中", icon: "rate_review" },
      scored: { bg: "bg-green-500/90", text: "已评分", icon: "check_circle" },
      rejected: { bg: "bg-red-500/90", text: "已拒绝", icon: "cancel" },
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark text-slate-100 overflow-x-hidden">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 border-b border-primary/20 px-6 lg:px-20 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-primary">
            <div className="size-8 bg-primary rounded flex items-center justify-center text-white">
              <span className="material-symbols-outlined">terminal</span>
            </div>
            <h2 className="text-xl font-bold leading-tight tracking-tight">
              OpenClaw <span className="text-slate-100">开发者大赛</span>
            </h2>
          </div>
          <div className="flex flex-1 justify-end gap-6 items-center">
            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => navigate("/judge/dashboard")}
                className="text-primary text-sm font-bold border-b-2 border-primary pb-1"
              >
                控制面板
              </button>
              <button
                onClick={() => navigate("/judge/leaderboard")}
                className="text-slate-600 dark:text-slate-300 hover:text-primary transition-colors text-sm font-medium"
              >
                排行榜
              </button>
            </nav>
            <label className="hidden sm:flex flex-col min-w-40 h-10 max-w-64">
              <div className="flex w-full flex-1 items-stretch rounded-lg h-full overflow-hidden">
                <div className="text-primary/60 flex border-none bg-primary/10 items-center justify-center pl-4">
                  <span className="material-symbols-outlined text-[20px]">
                    search
                  </span>
                </div>
                <input
                  className="form-input flex w-full min-w-0 flex-1 border-none bg-primary/10 text-slate-100 placeholder:text-primary/40 px-3 text-sm focus:ring-0"
                  placeholder="搜索团队或项目..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </label>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 lg:px-20 py-8">
        {/* Title Section */}
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-slate-100 text-4xl font-black leading-tight tracking-tight">
              大赛评审工作台
            </h1>
            <p className="text-primary font-medium flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              当前阶段：初赛作品筛选
            </p>
          </div>
          <div className="flex gap-2">
            <button className="bg-primary hover:bg-primary/80 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">
                export_notes
              </span>
              导出评审报告
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-xl p-6"
          >
            <p className="text-primary/70 text-sm font-medium">总计参赛团队</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-slate-100 text-3xl font-black">
                {stats.total}
              </p>
            </div>
            <div className="w-full bg-white/5 h-1 rounded-full mt-4">
              <div className="bg-primary h-full rounded-full w-full"></div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-xl p-6 border-l-4 border-l-amber-500"
          >
            <p className="text-amber-500/70 text-sm font-medium">待评审作品</p>
            <p className="text-slate-100 text-3xl font-black mt-1">
              {stats.pending}
            </p>
            <div className="w-full bg-white/5 h-1 rounded-full mt-4">
              <div
                className="bg-amber-500 h-full rounded-full"
                style={{
                  width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-xl p-6 border-l-4 border-l-green-500"
          >
            <p className="text-green-500/70 text-sm font-medium">已评分作品</p>
            <p className="text-slate-100 text-3xl font-black mt-1">
              {stats.scored}
            </p>
            <div className="w-full bg-white/5 h-1 rounded-full mt-4">
              <div
                className="bg-green-500 h-full rounded-full"
                style={{
                  width: `${stats.total > 0 ? (stats.scored / stats.total) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-xl p-6 border-l-4 border-l-red-500"
          >
            <p className="text-red-500/70 text-sm font-medium">已拒绝作品</p>
            <p className="text-slate-100 text-3xl font-black mt-1">
              {stats.rejected}
            </p>
            <div className="w-full bg-white/5 h-1 rounded-full mt-4">
              <div
                className="bg-red-500 h-full rounded-full"
                style={{
                  width: `${stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </motion.div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex border-b border-primary/10 gap-8 min-w-max">
            <button
              onClick={() => setFilter("all")}
              className={`flex items-center gap-2 border-b-2 ${filter === "all" ? "border-primary text-slate-100" : "border-transparent text-slate-400 hover:text-slate-200"} pb-4 px-2 font-bold transition-all`}
            >
              <span className="material-symbols-outlined text-sm">
                grid_view
              </span>
              全部团队 ({stats.total})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`flex items-center gap-2 border-b-2 ${filter === "pending" ? "border-primary text-slate-100" : "border-transparent text-slate-400 hover:text-slate-200"} pb-4 px-2 font-medium transition-all`}
            >
              <span className="material-symbols-outlined text-sm">
                pending_actions
              </span>
              待评审 ({stats.pending})
            </button>
            <button
              onClick={() => setFilter("reviewing")}
              className={`flex items-center gap-2 border-b-2 ${filter === "reviewing" ? "border-primary text-slate-100" : "border-transparent text-slate-400 hover:text-slate-200"} pb-4 px-2 font-medium transition-all`}
            >
              <span className="material-symbols-outlined text-sm">
                rate_review
              </span>
              评审中 ({stats.reviewing})
            </button>
            <button
              onClick={() => setFilter("scored")}
              className={`flex items-center gap-2 border-b-2 ${filter === "scored" ? "border-primary text-slate-100" : "border-transparent text-slate-400 hover:text-slate-200"} pb-4 px-2 font-medium transition-all`}
            >
              <span className="material-symbols-outlined text-sm">
                check_circle
              </span>
              已评分 ({stats.scored})
            </button>
            <button
              onClick={() => setFilter("rejected")}
              className={`flex items-center gap-2 border-b-2 ${filter === "rejected" ? "border-primary text-slate-100" : "border-transparent text-slate-400 hover:text-slate-200"} pb-4 px-2 font-medium transition-all`}
            >
              <span className="material-symbols-outlined text-sm">cancel</span>
              已拒绝 ({stats.rejected})
            </button>
          </div>
        </div>

        {/* Team Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-primary">
              <svg
                className="animate-spin size-6"
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
              <span className="text-sm font-bold">加载中…</span>
            </div>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">
              inbox
            </span>
            <p className="text-slate-400 text-lg">暂无参赛项目</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedParticipants.map((participant, index) => {
              const badge = getStatusBadge(participant.status);
              const trackInfo = getTrackInfo(participant.track);
              return (
                <motion.div
                  key={participant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-xl overflow-hidden group cursor-pointer"
                >
                  <div
                    className="relative h-72 bg-cover bg-center rounded-xl overflow-hidden"
                    style={{
                      backgroundImage: `url('/api/proxy-image?url=${encodeURIComponent(participant.cover_image)}')`,
                    }}
                  >
                    {/* 底部渐变蒙版 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                    {/* 状态徽章 - 顶部右角 */}
                    <div
                      className={`absolute top-3 right-3 ${badge.bg} text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 backdrop-blur-sm`}
                    >
                      <span className="material-symbols-outlined text-[12px] fill-1">
                        {badge.icon}
                      </span>
                      {badge.text}
                    </div>

                    {/* 赛道徽章 - 顶部左角 */}
                    {trackInfo && (
                      <div
                        className={`absolute top-3 left-3 ${trackInfo.bg} ${trackInfo.color} text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 backdrop-blur-sm border ${trackInfo.border}`}
                      >
                        <span>{trackInfo.emoji}</span>
                        <span>{trackInfo.title}</span>
                      </div>
                    )}

                    {/* 内容区域 - 底部 */}
                    <div className="absolute inset-0 flex flex-col justify-end p-5">
                      {/* 标题和资料图标 */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-1">
                            {participant.full_name}
                          </h3>
                          <p className="text-primary text-sm font-medium line-clamp-2">
                            {participant.project_title}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-3 flex-shrink-0">
                          {participant.has_pdf && (
                            <span className="material-symbols-outlined text-primary/80 hover:text-primary cursor-pointer text-lg transition-colors">
                              picture_as_pdf
                            </span>
                          )}
                          {participant.has_video && (
                            <span className="material-symbols-outlined text-primary/80 hover:text-primary cursor-pointer text-lg transition-colors">
                              movie
                            </span>
                          )}
                          {participant.has_url && (
                            <span className="material-symbols-outlined text-primary/80 hover:text-primary cursor-pointer text-lg transition-colors">
                              link
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 组织和时间信息 */}
                      <div className="flex items-center gap-4 text-xs text-slate-300 mb-4 pb-3 border-t border-white/20 pt-3">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">
                            schedule
                          </span>
                          {participant.submitted_at}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">
                            business
                          </span>
                          {participant.organization}
                        </span>
                      </div>

                      {/* 按钮 */}
                      <div className="flex gap-3">
                        <button
                          onClick={() =>
                            navigate(`/judge/scoring/${participant.id}`)
                          }
                          className="flex-1 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg text-sm font-bold transition-all duration-200 transform group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-primary/40"
                        >
                          查看详情
                        </button>
                        <button className="px-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-white hover:text-primary transition-all duration-200">
                          <span className="material-symbols-outlined text-sm">
                            more_horiz
                          </span>
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
          <div className="mt-12 flex items-center justify-center gap-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="size-10 flex items-center justify-center rounded-lg glass-card text-slate-400 hover:text-primary transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <div className="flex items-center gap-2">
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
                        className={`size-10 flex items-center justify-center rounded-lg font-bold transition-all ${
                          page === currentPage
                            ? "bg-primary text-white"
                            : "glass-card text-slate-400 hover:text-primary"
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
                      <span key={page} className="text-slate-500 px-1">
                        ...
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
              className="size-10 flex items-center justify-center rounded-lg glass-card text-slate-400 hover:text-primary transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
            <div className="text-xs text-slate-500 ml-4">
              显示 {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(
                currentPage * itemsPerPage,
                filteredParticipants.length,
              )}{" "}
              项，共 {filteredParticipants.length} 项
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-6 lg:px-20 py-8 border-t border-primary/10 text-center glass-panel mt-10">
        <p className="text-slate-500 text-sm">
          © 2024 OpenClaw Developer Competition. All rights reserved.
        </p>
        <div className="flex justify-center gap-6 mt-4">
          <a
            className="text-xs text-primary/60 hover:text-primary transition-colors"
            href="#"
          >
            服务条款
          </a>
          <a
            className="text-xs text-primary/60 hover:text-primary transition-colors"
            href="#"
          >
            隐私政策
          </a>
          <a
            className="text-xs text-primary/60 hover:text-primary transition-colors"
            href="#"
          >
            联系技术支持
          </a>
        </div>
      </footer>
    </div>
  );
}
