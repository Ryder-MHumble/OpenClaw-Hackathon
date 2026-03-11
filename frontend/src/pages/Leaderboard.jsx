import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 6;
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setIsRefreshing(true);
    try {
      const response = await axios.get("/api/judges/leaderboard");
      setLeaderboard(response.data.data);
    } catch (error) {
      console.error("Error:", error);
      // Mock data for demo
      setLeaderboard([
        {
          id: 1,
          team_name: "极客之光队",
          project_title: "AI 法律助手开源框架",
          innovation: 99.0,
          technical: 98.5,
          market: 97.0,
          demo: 99.5,
          weighted_score: 98.5,
          poster_url: "https://equal-white-jmg5rfasyt.edgeone.app/banner2.png",
        },
        {
          id: 2,
          team_name: "灵动代码队",
          project_title: "分布式 KV 数据库内核优化",
          innovation: 94.0,
          technical: 97.5,
          market: 93.0,
          demo: 95.0,
          weighted_score: 95.2,
          poster_url: "https://equal-white-jmg5rfasyt.edgeone.app/banner2.png",
        },
        {
          id: 3,
          team_name: "创新者联盟",
          project_title: "边缘计算低功耗调度引擎",
          innovation: 91.5,
          technical: 94.0,
          market: 96.0,
          demo: 89.0,
          weighted_score: 92.8,
          poster_url: "https://equal-white-jmg5rfasyt.edgeone.app/banner2.png",
        },
        {
          id: 4,
          team_name: "智联未来",
          project_title: "多模态语义搜索平台",
          innovation: 90.0,
          technical: 88.5,
          market: 92.0,
          demo: 94.5,
          weighted_score: 91.0,
          poster_url: "https://equal-white-jmg5rfasyt.edgeone.app/banner2.png",
        },
        {
          id: 5,
          team_name: "云端猎人",
          project_title: "无服务器架构安全审计工具",
          innovation: 85.0,
          technical: 91.0,
          market: 88.5,
          demo: 87.0,
          weighted_score: 88.1,
          poster_url: "https://equal-white-jmg5rfasyt.edgeone.app/banner2.png",
        },
        {
          id: 6,
          team_name: "数据之眼",
          project_title: "实时交互式大数据看板",
          innovation: 82.0,
          technical: 84.5,
          market: 90.0,
          demo: 89.5,
          weighted_score: 85.85,
          poster_url: "https://equal-white-jmg5rfasyt.edgeone.app/banner2.png",
        },
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter and paginate
  const filteredLeaderboard = leaderboard.filter(
    (team) =>
      team.team_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.project_title?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredLeaderboard.length / itemsPerPage);
  const paginatedLeaderboard = filteredLeaderboard.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleExportCSV = () => {
    // TODO: Implement CSV export
    console.log("Exporting CSV...");
  };

  const handleRefresh = () => {
    fetchLeaderboard();
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark text-slate-100">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-primary/20 px-6 md:px-20 py-4 bg-background-light/50 dark:bg-background-dark/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4 text-primary">
          <div className="size-8">
            <svg
              fill="none"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-tight">
            OpenClaw <span className="text-primary">Hackathon</span>
          </h2>
        </div>
        <div className="hidden md:flex flex-1 justify-end gap-8 items-center">
          <nav className="flex items-center gap-8">
            <button
              onClick={() => navigate("/judge/dashboard")}
              className="text-slate-600 dark:text-slate-300 hover:text-primary transition-colors text-sm font-medium"
            >
              控制面板
            </button>
            <button className="text-primary text-sm font-bold border-b-2 border-primary pb-1">
              排行榜
            </button>
          </nav>
          <div className="flex items-center gap-4 pl-4 border-l border-primary/20">
            <button className="bg-primary text-white text-sm font-bold h-10 px-6 rounded-lg hover:brightness-110 transition-all">
              退出登录
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                Internal Only
              </span>
              <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-tight">
                评审实时排行榜
              </h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              当前同步：15位评委已打分，共 {leaderboard.length} 支参赛团队
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-primary/30 text-primary font-bold hover:bg-primary/10 transition-all disabled:opacity-50"
            >
              <span
                className={`material-symbols-outlined ${isRefreshing ? "animate-spin" : ""}`}
              >
                refresh
              </span>
              刷新数据
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            >
              <span className="material-symbols-outlined">download</span>
              导出 CSV
            </button>
          </div>
        </div>

        {/* 3D Podium Visualization */}
        {leaderboard.length >= 3 && (
          <div className="relative w-full mb-20 pt-20">
            <div className="flex justify-center items-end gap-4 md:gap-12 relative z-10">
              {/* 2nd Place */}
              <div className="flex flex-col items-center group w-32 md:w-48">
                <div className="mb-4 text-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-slate-400 bg-slate-800 flex items-center justify-center overflow-hidden mb-2 mx-auto">
                    <img
                      alt={leaderboard[1].team_name}
                      className="w-full h-full object-cover"
                      src={leaderboard[1].poster_url}
                    />
                  </div>
                  <p className="text-slate-300 font-bold text-sm md:text-base">
                    {leaderboard[1].team_name}
                  </p>
                  <p className="text-primary text-xl md:text-2xl font-black">
                    {leaderboard[1].avg_weighted_score ??
                      leaderboard[1].weighted_score ??
                      "-"}
                  </p>
                </div>
                <div className="w-full h-32 md:h-48 bg-gradient-to-b from-slate-500/50 to-slate-700/80 rounded-t-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="text-5xl md:text-7xl font-black text-white/20">
                    2
                  </span>
                </div>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center group w-40 md:w-60 -mt-20">
                <div className="mb-6 text-center">
                  <div className="relative inline-block mb-3">
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400 text-4xl material-symbols-outlined animate-bounce">
                      emoji_events
                    </span>
                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-primary bg-slate-800 flex items-center justify-center overflow-hidden mx-auto shadow-[0_0_30px_rgba(255,88,51,0.4)]">
                      <img
                        alt={leaderboard[0].team_name}
                        className="w-full h-full object-cover"
                        src={leaderboard[0].poster_url}
                      />
                    </div>
                  </div>
                  <p className="text-white font-black text-base md:text-xl">
                    {leaderboard[0].team_name}
                  </p>
                  <p className="text-primary text-3xl md:text-5xl font-black drop-shadow-sm">
                    {leaderboard[0].avg_weighted_score ??
                      leaderboard[0].weighted_score ??
                      "-"}
                  </p>
                </div>
                <div className="w-full h-48 md:h-64 bg-gradient-to-b from-primary/60 to-primary/20 rounded-t-2xl flex items-center justify-center relative overflow-hidden ring-1 ring-primary/40 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-white/5 opacity-20"></div>
                  <span className="text-7xl md:text-9xl font-black text-white/30">
                    1
                  </span>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center group w-32 md:w-48">
                <div className="mb-4 text-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-amber-700/50 bg-slate-800 flex items-center justify-center overflow-hidden mb-2 mx-auto">
                    <img
                      alt={leaderboard[2].team_name}
                      className="w-full h-full object-cover"
                      src={leaderboard[2].poster_url}
                    />
                  </div>
                  <p className="text-slate-300 font-bold text-sm md:text-base">
                    {leaderboard[2].team_name}
                  </p>
                  <p className="text-primary text-xl md:text-2xl font-black">
                    {leaderboard[2].avg_weighted_score ??
                      leaderboard[2].weighted_score ??
                      "-"}
                  </p>
                </div>
                <div className="w-full h-24 md:h-36 bg-gradient-to-b from-amber-900/40 to-amber-950/80 rounded-t-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="text-5xl md:text-7xl font-black text-white/20">
                    3
                  </span>
                </div>
              </div>
            </div>
            {/* Platform Shadow/Reflection */}
            <div className="h-2 w-full bg-primary/20 blur-xl rounded-full absolute bottom-0 translate-y-full opacity-50"></div>
          </div>
        )}

        {/* Main Leaderboard Table */}
        <div className="bg-slate-900/40 border border-primary/10 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 border-b border-primary/10 flex items-center justify-between bg-primary/5">
            <h3 className="text-xl font-bold">全队排名详情</h3>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  className="bg-background-dark/50 border border-primary/20 rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-primary focus:border-primary w-64"
                  placeholder="搜索团队或项目..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  search
                </span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-primary/5 text-slate-400 text-xs uppercase tracking-wider font-bold">
                  <th className="px-6 py-4">排名</th>
                  <th className="px-6 py-4">团队名称</th>
                  <th className="px-6 py-4">参赛作品</th>
                  <th className="px-6 py-4 text-center">创新性 (30%)</th>
                  <th className="px-6 py-4 text-center">技术难度 (30%)</th>
                  <th className="px-6 py-4 text-center">应用前景 (20%)</th>
                  <th className="px-6 py-4 text-center">路演表现 (20%)</th>
                  <th className="px-6 py-4 text-right">加权总分</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {paginatedLeaderboard.map((team, index) => {
                  const globalIndex = (currentPage - 1) * itemsPerPage + index;
                  const rankBadgeClass =
                    globalIndex === 0
                      ? "bg-primary text-white"
                      : globalIndex === 1
                        ? "bg-slate-400 text-slate-900"
                        : globalIndex === 2
                          ? "bg-amber-700 text-white"
                          : "border border-slate-700 text-slate-400";

                  return (
                    <tr
                      key={team.id}
                      className="hover:bg-primary/5 transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <span
                          className={`flex items-center justify-center w-8 h-8 rounded-full ${rankBadgeClass} font-bold text-sm`}
                        >
                          {globalIndex + 1}
                        </span>
                      </td>
                      <td className="px-6 py-5 font-bold text-white">
                        {team.team_name}
                      </td>
                      <td className="px-6 py-5 text-slate-400">
                        {team.project_title}
                      </td>
                      <td className="px-6 py-5 text-center font-medium">
                        {team.avg_innovation ?? team.innovation ?? "-"}
                      </td>
                      <td className="px-6 py-5 text-center font-medium">
                        {team.avg_technical ?? team.technical ?? "-"}
                      </td>
                      <td className="px-6 py-5 text-center font-medium">
                        {team.avg_market ?? team.market ?? "-"}
                      </td>
                      <td className="px-6 py-5 text-center font-medium">
                        {team.avg_demo ?? team.demo ?? "-"}
                      </td>
                      <td className="px-6 py-5 text-right font-black text-primary text-lg">
                        {team.avg_weighted_score ?? team.weighted_score ?? "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-primary/5 border-t border-primary/10 text-slate-500 text-sm flex justify-between items-center">
            <p>
              显示 {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, filteredLeaderboard.length)}{" "}
              支团队，共 {filteredLeaderboard.length} 支
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-primary/20 hover:bg-primary/10 disabled:opacity-50"
              >
                上一页
              </button>
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
                        className={`px-3 py-1 rounded border ${
                          page === currentPage
                            ? "border-primary bg-primary text-white"
                            : "border-primary/20 hover:bg-primary/10"
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
                      <span key={page} className="px-2 py-1">
                        ...
                      </span>
                    );
                  }
                  return null;
                },
              )}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-primary/20 hover:bg-primary/10 disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Footnote */}
        <footer className="mt-12 py-8 border-t border-primary/10 text-center">
          <p className="text-slate-500 text-sm">
            © 2024 OpenClaw Hackathon Judge Dashboard.
            系统采用加密传输，所有评分数据具有审计追踪。
          </p>
        </footer>
      </main>
    </div>
  );
}
