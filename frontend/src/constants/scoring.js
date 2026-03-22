// 评分维度配置
export const SCORING_DIMENSIONS = [
  {
    key: "market",
    label: "应用前景",
    weight: "50%",
    icon: "trending_up",
    desc: "项目的落地能力、实用性和应用价值",
  },
  {
    key: "innovation",
    label: "创新难度",
    weight: "20%",
    icon: "lightbulb",
    desc: "项目的创新程度和实现难度",
  },
  {
    key: "technical",
    label: "技术实现与完成度",
    weight: "20%",
    icon: "code",
    desc: "技术方案的完整性、实现质量和可行性",
  },
  {
    key: "demo",
    label: "路演表现",
    weight: "10%",
    icon: "play_circle",
    desc: "路演表达清晰度和现场展示效果",
  },
];

// 计算加权总分
export const calculateWeightedScore = (scores) => {
  return (
    scores.market * 0.5 +
    scores.innovation * 0.2 +
    scores.technical * 0.2 +
    scores.demo * 0.1
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
