import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function JudgeDashboard() {
  const [participants, setParticipants] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    total: 128,
    pending: 45,
    approved: 62,
    rejected: 21,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchParticipants();
  }, [filter]);

  const fetchParticipants = async () => {
    try {
      const token = localStorage.getItem("judgeToken");
      if (!token) {
        navigate("/judge/login");
        return;
      }

      // Mock data for demonstration
      const mockData = [
        {
          id: 1,
          full_name: "智绘未来队",
          project_title: "AI驱动的创意设计引擎",
          status: "pending",
          members: 4,
          submitted_at: "2小时前",
          has_pdf: true,
          has_video: true,
          has_url: true,
          cover_image:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuCSS8-tLh70ms-rupPuwm8cz-1LMlHliF5MocnYK3ByZKbTJR_VrxaN7uWu_LbV8JpYB-owUrvLRQEo-iDV35N_xdIYDgV4z8o8oyF4yarrVjIT7dGVsV7LsEYPl3XBoB34KoToMLV8P7JOROPL4GfKOGxkn4WW9JsS-vTQ2YhKgq4NHxbkcrAoARtH4LrfjXeo9Jin_HTe4-uT_GlE8jy4BBi_bv7dEOUObLqefjUVwsNAqS8SaFVkEiVfpOOAU0Rwk1sNkVK83L1D",
        },
        {
          id: 2,
          full_name: "量子极客",
          project_title: "去中心化算力交易平台",
          status: "approved",
          members: 3,
          submitted_at: "5小时前",
          has_pdf: true,
          has_video: false,
          has_url: true,
          cover_image:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuDr6lKNC86lFPRRWdk7dMa2-I09Bs-3gcYIbhmzWnMBbxbwaOeNJxWfrv6Rd-cs-kRb7x9gsbMdWxF4iODiycTLdSo9SMt6MQ9DUBfVqxJGbnvNvyNS3XTubGqhwGZSOHsqKSTreV7-x8799emd41bZ1jkdWxbwHWHkAZpbrh1UOsumtdzxdTt8cMBGRWlEKPLe9cEcNpMIEgqu9jJVd9DfGBpSKiPLWGKqb3QAZjlAyfy7EsGag73eFNX6_f0Eges-H37lpB3ywkKD",
        },
        {
          id: 3,
          full_name: "维度几何",
          project_title: "多模态情感计算模型",
          status: "rejected",
          members: 5,
          submitted_at: "昨日",
          has_pdf: false,
          has_video: true,
          has_url: false,
          cover_image:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuC_2ugj2Erihn0hh7jELZuJY-mRNkyUq1k5xvlZ9fufCZslu5ufwKnuvYbg8QfA9dFKLSb3tXDMKo6xise6LSDZ8AR1SjFG2eb6o0AqFSTpG3sFh6ZTIM6zxlhgRAEb-HIerC1CDKFKmJn5eOoTbfEWP2TPdH9sJ8iwCWKLFKGvzkaRXqSCTkOoQRFl8xSxTac-Qwc8xGIhesf7dssWvXXylmryEDLMKHXroI1REXk5yoq7YWgxzTKj0_gEhkgDjeUJJnzw8_1kd1NT",
        },
        {
          id: 4,
          full_name: "极境探索",
          project_title: "高性能图数据库引擎",
          status: "pending",
          members: 2,
          submitted_at: "昨日",
          has_pdf: true,
          has_video: false,
          has_url: true,
          cover_image:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuA9fGMdH8lNc0_cNuinx4AEQZYPo7zanmpjCcCY8vamVZtnVyouIyefsp76dXgU4fjjiA9_0urWRgbzbWEsZmLe_GiWhPUj_TenV4CBaIliDp-KUwaZYKIwbWNyBzqf9GkhECy989ij8gUk4fnF-AumIXi0ChmPhSp7do093yZ0VSu3dO1LBluGj7YT3rvQ7zF7amCnFZBu4OJov0qbskn4gNHqRKJBzbg57uJPTirMxYzEVoBEJRTuOfxvNQlNm2pUMtgUTEIpd0dx",
        },
        {
          id: 5,
          full_name: "星火燎原",
          project_title: "分布式边缘计算网关",
          status: "approved",
          members: 6,
          submitted_at: "2天前",
          has_pdf: false,
          has_video: true,
          has_url: true,
          cover_image:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuAV9bxzJeoWwphFzgzvxmpPccU-HyanmH5fB0hbdUyrOACCAZKpYymv2knEHX82Cj6xY4CMFHm4D1DOIyc5pF3k26VdxDL7T-RnW4_m2xRn8L9iUHsJf2jV56UjCv0cAFkYPkhZDX86QlOs2sZvWpiYfgHP0xpyp5osDOdtVEhUqFV7xPei0dBxjn_pNcvutWYTdu7TPEwNgN-CcfXBYXszdRnDzKt0owoWnR3QoZTB6NVetlvW7vVOhadzh55slMohx2ddHlo3BkdP",
        },
        {
          id: 6,
          full_name: "灵动核心",
          project_title: "低代码企业级应用框架",
          status: "pending",
          members: 4,
          submitted_at: "3天前",
          has_pdf: true,
          has_video: true,
          has_url: false,
          cover_image:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuBVyrro7s2ypdTIK5z2cxf7wZeKL6BF8tK9ppP4a3BxDW68IX-sDrrrIZAGDxlyDP3qRNQyeDam-t2z6gAN-dn9_cW99iZh0ZkSOxy7XZNVM-F_yR7ZzXDpsYyEq2aoEVRgioFL9-m-E13Z4Bu6o-B_SeoDBm9u6fEVMmIF1itaD6Kp_1_mUbQL3F9rTxxfIAKlLHLm5UnjR4mBl6Y353QYMdmFIu1CsvYN5lQOf1t5mvFZWPvBh8D98JUNDMEuds24dRfFauaSQnoD",
        },
      ];

      setParticipants(mockData);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const filteredParticipants = participants.filter((p) => {
    const matchesFilter = filter === "all" || p.status === filter;
    const matchesSearch =
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.project_title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: "bg-amber-500/90", text: "待评审", icon: "timer" },
      approved: { bg: "bg-green-500/90", text: "已晋级", icon: "check_circle" },
      rejected: { bg: "bg-red-500/90", text: "已淘汰", icon: "cancel" },
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark text-slate-100 overflow-x-hidden">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 border-b border-primary/20 px-6 lg:px-20 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 text-primary">
              <div className="size-8 bg-primary rounded flex items-center justify-center text-white">
                <span className="material-symbols-outlined">terminal</span>
              </div>
              <h2 className="text-xl font-bold leading-tight tracking-tight">
                OpenClaw <span className="text-slate-100">开发者大赛</span>
              </h2>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a
                className="text-slate-400 hover:text-primary text-sm font-medium transition-colors"
                href="#"
              >
                控制台
              </a>
              <a
                className="text-slate-400 hover:text-primary text-sm font-medium transition-colors"
                href="#"
              >
                评委指南
              </a>
              <a
                className="text-primary text-sm font-bold border-b-2 border-primary pb-1"
                href="#"
              >
                评审工作台
              </a>
            </nav>
          </div>
          <div className="flex flex-1 justify-end gap-6 items-center">
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
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-100">评审员 0x42</p>
                <p className="text-[10px] text-primary">高级评审专家</p>
              </div>
              <div className="bg-primary/20 rounded-full size-10 flex items-center justify-center border border-primary/30 overflow-hidden">
                <img
                  alt="评审员头像"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgkZH_pZtpUv_v7U_mQm8MXqsEuUwQpRRpWBK8UzF-_BjaO3L7F3gd6fW96Migup8uTmpeUO5XUOAnh18lGMGKfbJFLZpIDwHP0NtlQxxu0GSzBV6Znk5lB_XMjic1rJiyN8Ep6y58V0bKFU0sAApkpIjd0VxIa9Zor915iChkOur2gov9EFT6qoxdnzwQArBQf-3cGRIXlaYZD5RDNmpOfLINV_MKieDiAD7wFDwThlDhMbLz8KrM_jK6hb_BUxyziy4h0gUpnFdI"
                />
              </div>
            </div>
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
              <p className="text-green-500 text-xs font-bold">+12%</p>
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
              <div className="bg-amber-500 h-full rounded-full w-1/3"></div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-xl p-6 border-l-4 border-l-green-500"
          >
            <p className="text-green-500/70 text-sm font-medium">已晋级作品</p>
            <p className="text-slate-100 text-3xl font-black mt-1">
              {stats.approved}
            </p>
            <div className="w-full bg-white/5 h-1 rounded-full mt-4">
              <div className="bg-green-500 h-full rounded-full w-1/2"></div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-xl p-6 border-l-4 border-l-red-500"
          >
            <p className="text-red-500/70 text-sm font-medium">已淘汰作品</p>
            <p className="text-slate-100 text-3xl font-black mt-1">
              {stats.rejected}
            </p>
            <div className="w-full bg-white/5 h-1 rounded-full mt-4">
              <div className="bg-red-500 h-full rounded-full w-1/6"></div>
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
              待初筛 ({stats.pending})
            </button>
            <button
              onClick={() => setFilter("approved")}
              className={`flex items-center gap-2 border-b-2 ${filter === "approved" ? "border-primary text-slate-100" : "border-transparent text-slate-400 hover:text-slate-200"} pb-4 px-2 font-medium transition-all`}
            >
              <span className="material-symbols-outlined text-sm">
                check_circle
              </span>
              已晋级 ({stats.approved})
            </button>
            <button
              onClick={() => setFilter("rejected")}
              className={`flex items-center gap-2 border-b-2 ${filter === "rejected" ? "border-primary text-slate-100" : "border-transparent text-slate-400 hover:text-slate-200"} pb-4 px-2 font-medium transition-all`}
            >
              <span className="material-symbols-outlined text-sm">cancel</span>
              已淘汰 ({stats.rejected})
            </button>
          </div>
        </div>

        {/* Team Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredParticipants.map((participant, index) => {
            const badge = getStatusBadge(participant.status);
            return (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-xl flex flex-col overflow-hidden"
              >
                <div
                  className="h-40 bg-cover bg-center relative"
                  style={{
                    backgroundImage: `url('${participant.cover_image}')`,
                  }}
                >
                  <div
                    className={`absolute top-3 right-3 ${badge.bg} text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 backdrop-blur-sm`}
                  >
                    <span className="material-symbols-outlined text-[12px] fill-1">
                      {badge.icon}
                    </span>
                    {badge.text}
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-slate-100">
                      {participant.full_name}
                    </h3>
                    <div className="flex gap-2">
                      {participant.has_pdf && (
                        <span className="material-symbols-outlined text-primary/60 hover:text-primary cursor-pointer text-lg">
                          picture_as_pdf
                        </span>
                      )}
                      {participant.has_video && (
                        <span className="material-symbols-outlined text-primary/60 hover:text-primary cursor-pointer text-lg">
                          movie
                        </span>
                      )}
                      {participant.has_url && (
                        <span className="material-symbols-outlined text-primary/60 hover:text-primary cursor-pointer text-lg">
                          link
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-primary text-sm font-medium mb-3">
                    {participant.project_title}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-6">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        schedule
                      </span>
                      {participant.submitted_at}提交
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        group
                      </span>
                      {participant.members}人成员
                    </span>
                  </div>
                  <div className="mt-auto flex gap-3">
                    <button
                      onClick={() =>
                        navigate(`/judge/scoring/${participant.id}`)
                      }
                      className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-bold hover:bg-primary/80 transition-colors"
                    >
                      查看详情
                    </button>
                    <button className="px-3 border border-primary/30 rounded-lg text-primary hover:bg-primary/10 transition-colors">
                      <span className="material-symbols-outlined text-sm">
                        more_horiz
                      </span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="mt-12 flex justify-center">
          <div className="flex items-center gap-2">
            <button className="size-10 flex items-center justify-center rounded-lg glass-card text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="size-10 flex items-center justify-center rounded-lg bg-primary text-white font-bold">
              1
            </button>
            <button className="size-10 flex items-center justify-center rounded-lg glass-card text-slate-400 hover:text-primary transition-colors font-bold">
              2
            </button>
            <button className="size-10 flex items-center justify-center rounded-lg glass-card text-slate-400 hover:text-primary transition-colors font-bold">
              3
            </button>
            <span className="text-slate-500 px-2">...</span>
            <button className="size-10 flex items-center justify-center rounded-lg glass-card text-slate-400 hover:text-primary transition-colors font-bold">
              8
            </button>
            <button className="size-10 flex items-center justify-center rounded-lg glass-card text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
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
