// 评分维度配置
export const SCORING_DIMENSIONS = [
  {
    key: "innovation",
    label: "创新性",
    weight: "30%",
    icon: "lightbulb",
    desc: "项目的创新程度和独特性",
  },
  {
    key: "technical",
    label: "技术实现",
    weight: "30%",
    icon: "code",
    desc: "技术方案的完整性和可行性",
  },
  {
    key: "market",
    label: "市场价值",
    weight: "20%",
    icon: "trending_up",
    desc: "项目的实用性和市场潜力",
  },
  {
    key: "demo",
    label: "演示效果",
    weight: "20%",
    icon: "play_circle",
    desc: "演示的完整性和表现力",
  },
];

// 计算加权总分
export const calculateWeightedScore = (scores) => {
  return (
    scores.innovation * 0.3 +
    scores.technical * 0.3 +
    scores.market * 0.2 +
    scores.demo * 0.2
  ).toFixed(1);
};

// 视频URL解析
export const getVideoEmbedUrl = (url) => {
  if (!url) return null;

  // YouTube
  const youtubeMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
  );
  if (youtubeMatch?.[1]) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  // Bilibili
  const bilibiliMatch = url.match(/bilibili\.com\/video\/(BV\w+)/);
  if (bilibiliMatch?.[1]) {
    return `https://player.bilibili.com/player.html?bvid=${bilibiliMatch[1]}&high_quality=1`;
  }

  return null;
};
