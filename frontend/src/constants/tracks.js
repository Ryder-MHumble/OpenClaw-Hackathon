// 赛道配置常量
export const TRACKS = {
  academic: {
    id: "academic",
    emoji: "🎓",
    icon: "school",
    title: "学术龙虾",
    subtitle: "做科研的最强搭档",
    desc: "让虾帮你读文献、跑分析、写综述",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/25",
    activeBorder: "border-blue-400",
  },
  productivity: {
    id: "productivity",
    emoji: "⚡",
    icon: "bolt",
    title: "生产力龙虾",
    subtitle: "一人成军的效率引擎",
    desc: "让虾管理项目、自动化流程、组建虚拟团队",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/25",
    activeBorder: "border-amber-400",
  },
  life: {
    id: "life",
    emoji: "🏠",
    icon: "home_heart",
    title: "生活龙虾",
    subtitle: "把日子过好",
    desc: "让虾规划生活、陪伴家人、让日子好一点",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/25",
    activeBorder: "border-emerald-400",
  },
};

export const getTrackInfo = (trackId) => {
  return TRACKS[trackId] || null;
};
