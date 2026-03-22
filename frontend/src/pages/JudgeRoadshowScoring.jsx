import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  LogOut,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Download,
  GripVertical,
  RefreshCcw,
} from "lucide-react";
import LobsterLogo from "../components/LobsterLogo";
import {
  getDefaultJudgeNames,
  getJudges,
  getRoadshowProjectsGrouped,
  saveJudges,
} from "../data/judgeStaticStore";

const STORAGE_KEY = "openclaw_roadshow_scoring_v2";

const TRACKS = [
  { id: "academic", name: "学术赛道", emoji: "🎓" },
  { id: "productivity", name: "生产力赛道", emoji: "⚡" },
  { id: "life", name: "生活赛道", emoji: "🌟" },
];

const DIMENSIONS = [
  { key: "application", label: "应用前景", weight: 0.5 },
  { key: "innovation", label: "创新难度", weight: 0.2 },
  { key: "tech", label: "技术实现与完成度", weight: 0.2 },
  { key: "roadshow", label: "路演表现", weight: 0.1 },
];

const SCORING_RULE_TEXT =
  "总分计算：先按单个评委对单个项目的四维分数计算加权总分（应用前景×0.5 + 创新难度×0.2 + 技术实现与完成度×0.2 + 路演表现×0.1）；再在全部评委总分中去掉 1 个最高分和 1 个最低分，取剩余评委总分平均值。并列规则：若总分相同，则依次比较应用前景、创新难度、技术实现与完成度；这些维度均分同样采用该项目在全部评委原始分中的去掉 1 个最高分和 1 个最低分后取平均。";

const DEFAULT_JUDGE_NAMES = getDefaultJudgeNames();
const DEFAULT_JUDGE_COUNT = DEFAULT_JUDGE_NAMES.length;

function round2(v) {
  return Number(v.toFixed(2));
}

function makeDefaultJudges(count = DEFAULT_JUDGE_COUNT) {
  return Array.from(
    { length: count },
    (_, i) => DEFAULT_JUDGE_NAMES[i] || `评委${i + 1}`,
  );
}

function makeDefaultParticipants() {
  return TRACKS.flatMap((track) =>
    Array.from({ length: 10 }, (_, i) => ({
      id: `${track.id}-${i + 1}`,
      trackId: track.id,
      order: i + 1,
      name: "",
      teamName: "",
      contestantName: "",
      projectDescription: "",
      sourceParticipantId: undefined,
    })),
  );
}

function makeDefaultShrimpKing() {
  return {
    projectName: "",
    trackId: "",
    score: "",
    notes: "",
  };
}

function makeParticipantsFromGrouped(grouped) {
  return TRACKS.flatMap((track) => {
    const options = grouped[track.id] || [];
    const count = options.length || 10;
    return Array.from({ length: count }, (_, i) => ({
      id: `${track.id}-${i + 1}`,
      trackId: track.id,
      order: i + 1,
      name: options[i]?.name || "",
      teamName: options[i]?.teamName || "",
      contestantName: options[i]?.contestantName || "",
      projectDescription: options[i]?.projectDescription || "",
      sourceParticipantId: options[i]?.sourceParticipantId,
    }));
  });
}

function getSystemJudgeNames() {
  return normalizeJudges(getJudges());
}

function areJudgeListsEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.every((name, idx) => name === b[idx]);
}

function isPlaceholderJudgeName(name, idx) {
  const normalized = String(name || "").trim();
  return !normalized || normalized === `评委${idx + 1}`;
}

function mergeJudgesWithSystem(storedJudges, systemJudges) {
  if (!storedJudges.length) {
    return systemJudges.length ? systemJudges : makeDefaultJudges(DEFAULT_JUDGE_COUNT);
  }

  const fallbackSystemJudges = systemJudges.length
    ? systemJudges
    : makeDefaultJudges(DEFAULT_JUDGE_COUNT);

  const allPlaceholders = storedJudges.every((name, idx) =>
    isPlaceholderJudgeName(name, idx),
  );
  if (allPlaceholders) {
    return fallbackSystemJudges;
  }

  const storedSet = new Set(storedJudges.map((name) => String(name || "").trim()).filter(Boolean));
  const orderedKnownJudges = fallbackSystemJudges.filter((name) => storedSet.has(String(name || "").trim()));
  const unknownStoredJudges = storedJudges.filter((name) => {
    const normalized = String(name || "").trim();
    return normalized && !fallbackSystemJudges.includes(normalized);
  });
  const missingSystemJudges = fallbackSystemJudges.filter((name) => !storedSet.has(String(name || "").trim()));

  return [...orderedKnownJudges, ...unknownStoredJudges, ...missingSystemJudges];
}

function remapScoresForJudges(rawScores, previousJudges, nextJudges) {
  if (!rawScores || typeof rawScores !== "object") return {};

  return Object.fromEntries(
    Object.entries(rawScores).map(([participantId, judgeScores]) => {
      const sourceScores = Array.isArray(judgeScores) ? judgeScores : [];
      const scoreBuckets = {};

      previousJudges.forEach((judgeName, idx) => {
        const key = String(judgeName || "").trim();
        if (!scoreBuckets[key]) {
          scoreBuckets[key] = [];
        }
        scoreBuckets[key].push(sourceScores[idx]);
      });

      const nextScores = nextJudges.map((judgeName, idx) => {
        const key = String(judgeName || "").trim();
        const bucket = scoreBuckets[key];
        if (Array.isArray(bucket) && bucket.length) {
          return bucket.shift();
        }
        return sourceScores[idx];
      });

      return [participantId, nextScores];
    }),
  );
}

function initialState(systemJudges = getSystemJudgeNames()) {
  const judges = systemJudges.length
    ? systemJudges
    : makeDefaultJudges(DEFAULT_JUDGE_COUNT);
  return {
    judges,
    participants: makeDefaultParticipants(),
    scores: {},
    activeTrackId: "academic",
    activeJudgeIndex: 0,
    shrimpKing: makeDefaultShrimpKing(),
  };
}

function normalizeJudges(rawJudges) {
  if (!Array.isArray(rawJudges) || !rawJudges.length) {
    return makeDefaultJudges(DEFAULT_JUDGE_COUNT);
  }
  const names = rawJudges
    .map((judge, idx) => {
      if (typeof judge === "string") return judge.trim() || `评委${idx + 1}`;
      if (judge && typeof judge === "object" && typeof judge.name === "string") {
        return judge.name.trim() || `评委${idx + 1}`;
      }
      return `评委${idx + 1}`;
    })
    .filter(Boolean);
  if (!names.length) return makeDefaultJudges(DEFAULT_JUDGE_COUNT);
  return names;
}

function migrateScores(rawScores, rawJudges, judges) {
  if (!rawScores || typeof rawScores !== "object") return {};
  const legacyJudgeIds = Array.isArray(rawJudges)
    ? rawJudges
        .map((judge) =>
          judge && typeof judge === "object" && typeof judge.id === "string"
            ? judge.id
            : null,
        )
        .filter(Boolean)
    : [];

  return Object.fromEntries(
    Object.entries(rawScores).map(([participantId, participantScores]) => {
      if (Array.isArray(participantScores)) {
        return [participantId, participantScores];
      }
      if (!participantScores || typeof participantScores !== "object") {
        return [participantId, []];
      }

      // 兼容旧版本：按旧评委 id 顺序迁移到数组结构。
      if (legacyJudgeIds.length) {
        const arr = legacyJudgeIds.map((judgeId) => participantScores[judgeId] || {});
        return [participantId, arr];
      }

      const arr = judges.map((_, idx) => participantScores[idx] || {});
      return [participantId, arr];
    }),
  );
}

function loadState() {
  const systemJudges = getSystemJudgeNames();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState(systemJudges);
    const parsed = JSON.parse(raw);
    const storedJudges = normalizeJudges(parsed?.judges);
    const judges = mergeJudgesWithSystem(storedJudges, systemJudges);
    const activeJudgeIndex = Number.isInteger(parsed?.activeJudgeIndex)
      ? Math.max(0, Math.min(parsed.activeJudgeIndex, judges.length - 1))
      : 0;
    let scores = migrateScores(parsed?.scores, parsed?.judges, storedJudges);
    if (!areJudgeListsEqual(storedJudges, judges)) {
      scores = remapScoresForJudges(scores, storedJudges, judges);
    }

    return {
      ...initialState(systemJudges),
      ...parsed,
      judges,
      scores,
      activeJudgeIndex,
    };
  } catch {
    return initialState(systemJudges);
  }
}

function trimmedAverage(values) {
  if (!values.length) return null;
  if (values.length <= 2) {
    return round2(values.reduce((a, b) => a + b, 0) / values.length);
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.slice(1, -1);
  return round2(mid.reduce((a, b) => a + b, 0) / mid.length);
}

function computeJudgeTotal(scoreEntry) {
  if (!scoreEntry || typeof scoreEntry !== "object") return null;

  const innovation = scoreEntry.innovation;
  const tech = scoreEntry.tech;
  const application = scoreEntry.application;
  const roadshow = scoreEntry.roadshow;

  if (
    [innovation, tech, application, roadshow].some(
      (value) => typeof value !== "number",
    )
  ) {
    return null;
  }

  return (
    application * 0.5 +
    innovation * 0.2 +
    tech * 0.2 +
    roadshow * 0.1
  );
}

function computeParticipantResult(participantId, judges, scores) {
  const judgeScores = scores[participantId] || {};

  const dimAvg = {};
  DIMENSIONS.forEach((dim) => {
    const values = judges
      .map((_, idx) => judgeScores[idx]?.[dim.key])
      .filter((v) => typeof v === "number");
    dimAvg[dim.key] = trimmedAverage(values);
  });

  const judgeTotals = judges
    .map((_, idx) => computeJudgeTotal(judgeScores[idx]))
    .filter((value) => typeof value === "number");
  const total = trimmedAverage(judgeTotals);

  return {
    participantId,
    innovationAvg: dimAvg.innovation,
    techAvg: dimAvg.tech,
    applicationAvg: dimAvg.application,
    roadshowAvg: dimAvg.roadshow,
    total,
  };
}

function compareResult(a, b) {
  const ta = a.total ?? -1;
  const tb = b.total ?? -1;
  if (ta !== tb) return tb - ta;

  const aA = a.applicationAvg ?? -1;
  const aB = b.applicationAvg ?? -1;
  if (aA !== aB) return aB - aA;

  const iA = a.innovationAvg ?? -1;
  const iB = b.innovationAvg ?? -1;
  if (iA !== iB) return iB - iA;

  const tA = a.techAvg ?? -1;
  const tB = b.techAvg ?? -1;
  if (tA !== tB) return tB - tA;

  return String(a.participantId || "").localeCompare(
    String(b.participantId || ""),
    "zh-Hans-CN",
    {
      numeric: true,
      sensitivity: "base",
    },
  );
}

function hasComparableRankingScores(result) {
  return [result.total, result.applicationAvg, result.innovationAvg, result.techAvg].every(
    (value) => typeof value === "number" && Number.isFinite(value),
  );
}

function hasSameRankingScores(a, b) {
  if (!hasComparableRankingScores(a) || !hasComparableRankingScores(b)) {
    return false;
  }

  return (
    a.total === b.total &&
    a.applicationAvg === b.applicationAvg &&
    a.innovationAvg === b.innovationAvg &&
    a.techAvg === b.techAvg
  );
}

function needsVote(a, b) {
  return hasSameRankingScores(a, b);
}

function rankResults(results) {
  const sorted = [...results].sort(compareResult);
  let currentRank = 0;

  return sorted.map((result, idx) => {
    const previous = sorted[idx - 1];
    const isExactTie = idx > 0 && previous && hasSameRankingScores(previous, result);
    currentRank = isExactTie ? currentRank : idx + 1;

    return {
      ...result,
      rank: currentRank,
      tie: sorted.some(
        (other) =>
          other.participantId !== result.participantId && needsVote(result, other),
      ),
    };
  });
}

function getAward(rank, tie) {
  if (tie) return "待投票确认";
  if (rank === 1) return "🏆 一等奖 (￥8万)";
  if (rank >= 2 && rank <= 4) return "🥈 二等奖 (￥3万)";
  return "🥉 三等奖 (￥2万)";
}

function getAwardTitleByRank(rank) {
  if (rank === 1) return "一等奖";
  if (rank >= 2 && rank <= 4) return "二等奖";
  return "三等奖";
}

function parseInput(raw) {
  if (raw.trim() === "") return { ok: true, value: undefined };
  if (/^\d{1,2}\.$/.test(raw)) return { ok: true, value: undefined, incomplete: true };
  if (!/^\d{1,2}(\.\d)?$/.test(raw)) return { ok: false };
  const n = Number(raw);
  if (Number.isNaN(n) || n < 1 || n > 10) return { ok: false };
  return { ok: true, value: n };
}

function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildExcelXml(sheetName, headers, rows) {
  const headerXml = headers
    .map(
      (header) =>
        `<Cell><Data ss:Type="String">${xmlEscape(header)}</Data></Cell>`,
    )
    .join("");

  const rowXml = rows
    .map((row) => {
      const cells = row
        .map((value) => {
          if (typeof value === "number" && Number.isFinite(value)) {
            return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
          }
          return `<Cell><Data ss:Type="String">${xmlEscape(value ?? "")}</Data></Cell>`;
        })
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="${xmlEscape(sheetName)}">
  <Table>
   <Row>${headerXml}</Row>
   ${rowXml}
  </Table>
 </Worksheet>
</Workbook>`;
}

function formatScore(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(2)
    : "-";
}

function formatDateForFilename(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function downloadBlob(filename, blob) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

function normalizeProjectIntro(value, maxLength = 180) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "暂无简介";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

function buildWordExportDocument(docx, { trackSummaries, shrimpKing, exportedAt }) {
  const {
    AlignmentType,
    Document,
    HeadingLevel,
    Paragraph,
    TextRun,
  } = docx;
  const awardLabels = ["一等奖", "二等奖", "三等奖"];
  const children = [
    new Paragraph({
      text: "OpenClaw 主持人口播稿",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `生成时间：${exportedAt}`,
          size: 20,
        }),
      ],
    }),
    new Paragraph({ text: "" }),
  ];

  trackSummaries.forEach((summary) => {
    children.push(
      new Paragraph({
        text: summary.trackName,
        heading: HeadingLevel.HEADING_1,
      }),
    );

    awardLabels.forEach((awardLabel) => {
      const awardRows = summary.rows.filter((row) => row.awardTitle === awardLabel);
      awardRows.forEach((row) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${awardLabel}：${row.projectName || "待定"}`,
                bold: true,
              }),
            ],
          }),
        );
      });
    });
    children.push(new Paragraph({ text: "" }));
  });

  return new Document({
    sections: [
      {
        children,
      },
    ],
  });
}

function buildTrackRankingWordDocument(docx, { trackRanking, exportedAt }) {
  const {
    AlignmentType,
    Document,
    HeadingLevel,
    Paragraph,
    TextRun,
  } = docx;

  const rows = trackRanking?.rows || [];
  const awardOrder = [
    "🏆 一等奖 (￥8万)",
    "🥈 二等奖 (￥3万)",
    "🥉 三等奖 (￥2万)",
    "待投票确认",
  ];
  const awardTitleMap = {
    "🏆 一等奖 (￥8万)": "一等奖",
    "🥈 二等奖 (￥3万)": "二等奖",
    "🥉 三等奖 (￥2万)": "三等奖",
    "待投票确认": "待投票确认",
  };
  const groupedRows = awardOrder
    .map((awardLabel) => ({
      awardLabel,
      title: awardTitleMap[awardLabel] || awardLabel,
      rows: rows.filter((row) => row.awardLabel === awardLabel),
    }))
    .filter((group) => group.rows.length);

  const children = [
    new Paragraph({
      text: `${trackRanking?.trackName || "当前赛道"}排名`,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `导出时间：${exportedAt}`,
          size: 20,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `排名规则：${SCORING_RULE_TEXT}`,
          size: 20,
        }),
      ],
    }),
    new Paragraph({ text: "" }),
  ];

  children.push(
    new Paragraph({
      text: `${trackRanking?.trackEmoji || ""} ${trackRanking?.trackName || "当前赛道"}`.trim(),
      heading: HeadingLevel.HEADING_1,
    }),
  );

  if (!rows.length) {
    children.push(
      new Paragraph({
        text: "当前赛道暂无项目数据",
      }),
    );
  } else {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `共 ${rows.length} 个项目`,
            size: 20,
          }),
        ],
      }),
    );

    groupedRows.forEach((group) => {
      children.push(
        new Paragraph({
          text: group.title,
          heading: HeadingLevel.HEADING_2,
        }),
      );

      group.rows.forEach((row) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${row.projectNumber}号项目 - ${row.projectName} - ${row.scoreLabel}`,
                bold: true,
              }),
            ],
          }),
        );

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: row.contestantName
                  ? `参赛选手：${row.contestantName}`
                  : "参赛选手：-",
              }),
            ],
          }),
        );

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `应用前景：${row.applicationLabel}    创新难度：${row.innovationLabel}    技术实现与完成度：${row.techLabel}    路演表现：${row.roadshowLabel}`,
              }),
            ],
          }),
        );

        if (row.teamName) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `团队：${row.teamName}`,
                  color: "64748B",
                }),
              ],
            }),
          );
        }

        if (row.tie) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "备注：该项目当前并列，需评委投票确认。",
                  bold: true,
                  color: "C2410C",
                }),
              ],
            }),
          );
        }

        children.push(new Paragraph({ text: "" }));
      });
    });
  }

  return new Document({
    sections: [
      {
        children,
      },
    ],
  });
}

export default function JudgeRoadshowScoring() {
  const navigate = useNavigate();
  const [state, setState] = useState(loadState);
  const [errors, setErrors] = useState({});
  const [draftInputs, setDraftInputs] = useState({});
  const [judgeBulkText, setJudgeBulkText] = useState("");
  const [editingJudgeIndex, setEditingJudgeIndex] = useState(null);
  const [editingJudgeName, setEditingJudgeName] = useState("");
  const [draggingJudgeIndex, setDraggingJudgeIndex] = useState(null);
  const [dragOverJudgeIndex, setDragOverJudgeIndex] = useState(null);
  const [collapsed, setCollapsed] = useState({
    judgeImport: false,
  });
  const [optionsMsg, setOptionsMsg] = useState("");
  const [optionsMsgType, setOptionsMsgType] = useState("info");
  const autoAdvanceTimerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    saveJudges(state.judges);
  }, [state.judges]);

  useEffect(
    () => () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const loadRoadshowProjects = async () => {
      setOptionsMsg("");
      try {
        const grouped = getRoadshowProjectsGrouped();
        setState((prev) => {
          const participants = makeParticipantsFromGrouped(grouped);
          const validIds = new Set(participants.map((p) => p.id));
          const nextScores = Object.fromEntries(
            Object.entries(prev.scores).filter(([participantId]) =>
              validIds.has(participantId),
            ),
          );

          const activeTrackExists = TRACKS.some(
            (track) => track.id === prev.activeTrackId,
          );
          return {
            ...prev,
            participants,
            scores: nextScores,
            activeTrackId: activeTrackExists ? prev.activeTrackId : "academic",
          };
        });
      } catch (error) {
        console.error("Load roadshow projects failed:", error);
        setOptionsMsg("项目名称加载失败，请检查前端静态数据");
        setOptionsMsgType("warn");
      }
    };

    loadRoadshowProjects();
  }, []);

  const handleLogout = () => {
    if (window.confirm("确定要退出登录吗？")) {
      localStorage.removeItem("judgeToken");
      navigate("/judge/login");
    }
  };

  const commitJudgeList = (
    nextJudgeList,
    { remapScores = false, message = "", messageType = "success" } = {},
  ) => {
    setState((prev) => {
      const judges = normalizeJudges(
        typeof nextJudgeList === "function" ? nextJudgeList(prev.judges) : nextJudgeList,
      );
      const scores = remapScores
        ? remapScoresForJudges(prev.scores, prev.judges, judges)
        : prev.scores;

      return {
        ...prev,
        judges,
        scores,
        activeJudgeIndex: Math.max(
          0,
          Math.min(prev.activeJudgeIndex, judges.length - 1),
        ),
      };
    });

    if (message) {
      setOptionsMsg(message);
      setOptionsMsgType(messageType);
    }
  };

  const applyJudgeNames = () => {
    const names = judgeBulkText
      .split(/[\n,，]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (!names.length) {
      setOptionsMsg("请先输入评委名称（逗号或换行分隔）");
      setOptionsMsgType("warn");
      return;
    }

    commitJudgeList(
      (previousJudges) => {
        const targetLength = Math.max(previousJudges.length, names.length);
        return Array.from({ length: targetLength }, (_, idx) => {
          return names[idx] || previousJudges[idx] || DEFAULT_JUDGE_NAMES[idx] || `评委${idx + 1}`;
        });
      },
      {
        message: `已按顺序应用 ${names.length} 位评委名称`,
      },
    );
  };

  const clearAllScores = () => {
    if (!window.confirm("确定清空当前页面的全部评分数据吗？此操作不可恢复。")) return;
    setState((prev) => ({
      ...prev,
      scores: {},
    }));
    setErrors({});
    setOptionsMsg("已清空全部评分数据，项目名称保持不变。");
    setOptionsMsgType("success");
  };

  const trackParticipants = useMemo(
    () =>
      state.participants
        .filter((p) => p.trackId === state.activeTrackId)
        .sort((a, b) => a.order - b.order),
    [state.participants, state.activeTrackId],
  );
  const activeJudge = state.judges[state.activeJudgeIndex] || state.judges[0];
  const activeJudgeIndex = Number.isInteger(state.activeJudgeIndex)
    ? state.activeJudgeIndex
    : 0;
  const activeJudgeOrder = activeJudgeIndex >= 0 ? activeJudgeIndex + 1 : 1;
  const totalJudgeScoreSlots = state.participants.length * DIMENSIONS.length;

  const judgeStats = useMemo(
    () =>
      state.judges.map((judgeName, judgeIndex) => {
        let completedProjects = 0;
        let filledDimensions = 0;

        state.participants.forEach((participant) => {
          const judgeScores = state.scores[participant.id]?.[judgeIndex] || {};
          const filled = DIMENSIONS.filter(
            (dim) => typeof judgeScores[dim.key] === "number",
          ).length;

          filledDimensions += filled;
          if (filled === DIMENSIONS.length) {
            completedProjects += 1;
          }
        });

        return {
          judgeName,
          completedProjects,
          filledDimensions,
          pendingProjects: Math.max(0, state.participants.length - completedProjects),
          completionRate:
            state.participants.length > 0
              ? Math.round((completedProjects / state.participants.length) * 100)
              : 0,
        };
      }),
    [state.judges, state.participants, state.scores],
  );

  const activeJudgeStats = judgeStats[activeJudgeIndex] || {
    completedProjects: 0,
    filledDimensions: 0,
    pendingProjects: state.participants.length,
    completionRate: 0,
  };

  const activeTrackCompletedCount = useMemo(
    () =>
      trackParticipants.filter((participant) => {
        const judgeScores = state.scores[participant.id]?.[activeJudgeIndex] || {};
        return DIMENSIONS.every((dim) => typeof judgeScores[dim.key] === "number");
      }).length,
    [trackParticipants, state.scores, activeJudgeIndex],
  );

  const switchJudgeByStep = (step) => {
    setState((prev) => {
      if (!prev.judges.length) return prev;
      const startIdx = Number.isInteger(prev.activeJudgeIndex)
        ? prev.activeJudgeIndex
        : 0;
      const nextIdx = (startIdx + step + prev.judges.length) % prev.judges.length;
      return {
        ...prev,
        activeJudgeIndex: nextIdx,
      };
    });
  };

  const focusNextCell = (participantId, dimensionKey) => {
    const rowIdx = trackParticipants.findIndex((p) => p.id === participantId);
    const colIdx = DIMENSIONS.findIndex((d) => d.key === dimensionKey);
    if (rowIdx < 0 || colIdx < 0) return;

    const isLastCol = colIdx === DIMENSIONS.length - 1;
    const nextRowIdx = isLastCol ? rowIdx + 1 : rowIdx;
    const nextColIdx = isLastCol ? 0 : colIdx + 1;
    const nextParticipant = trackParticipants[nextRowIdx];
    const nextDimension = DIMENSIONS[nextColIdx];
    if (!nextParticipant || !nextDimension) return;

    const nextCellId = `${nextParticipant.id}:${nextDimension.key}`;
    const nextInput = document.querySelector(`input[data-score-cell="${nextCellId}"]`);
    if (nextInput instanceof HTMLInputElement) {
      nextInput.focus();
      nextInput.select();
    }
  };

  const shouldAutoAdvance = (raw, value) => {
    if (typeof value !== "number") return false;
    const normalized = raw.trim();
    return /^[1-9]$/.test(normalized) || normalized === "10";
  };

  const setScore = (participantId, judgeIndex, dimension, value) => {
    setState((prev) => {
      const participantScores = Array.isArray(prev.scores[participantId])
        ? [...prev.scores[participantId]]
        : [];
      const judgeScores = participantScores[judgeIndex] || {};
      const nextDim = { ...judgeScores };
      if (typeof value === "number") {
        nextDim[dimension] = value;
      } else {
        delete nextDim[dimension];
      }
      participantScores[judgeIndex] = nextDim;
      return {
        ...prev,
        scores: {
          ...prev.scores,
          [participantId]: participantScores,
        },
      };
    });
  };

  const addJudge = () => {
    commitJudgeList((previousJudges) => {
      const nextNum = previousJudges.length + 1;
      const newJudge = DEFAULT_JUDGE_NAMES[nextNum - 1] || `评委${nextNum}`;
      return [...previousJudges, newJudge];
    }, {
      message: "已添加一位评委",
    });
  };

  const moveJudge = (fromIndex, toIndex) => {
    setState((prev) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.judges.length ||
        toIndex >= prev.judges.length ||
        fromIndex === toIndex
      ) {
        return prev;
      }

      const judges = [...prev.judges];
      const [movedJudge] = judges.splice(fromIndex, 1);
      judges.splice(toIndex, 0, movedJudge);

      const nextScores = {};
      Object.entries(prev.scores).forEach(([participantId, judgeScores]) => {
        const arr = Array.isArray(judgeScores) ? [...judgeScores] : [];
        const [movedScore] = arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, movedScore);
        nextScores[participantId] = arr;
      });

      let activeJudgeIndex = prev.activeJudgeIndex;
      if (activeJudgeIndex === fromIndex) {
        activeJudgeIndex = toIndex;
      } else if (fromIndex < toIndex) {
        if (activeJudgeIndex > fromIndex && activeJudgeIndex <= toIndex) {
          activeJudgeIndex -= 1;
        }
      } else if (toIndex < fromIndex) {
        if (activeJudgeIndex >= toIndex && activeJudgeIndex < fromIndex) {
          activeJudgeIndex += 1;
        }
      }

      return {
        ...prev,
        judges,
        scores: nextScores,
        activeJudgeIndex,
      };
    });
  };

  const removeJudge = (judgeIndex) => {
    setState((prev) => {
      if (prev.judges.length <= 1) return prev;

      const nextScores = {};
      Object.entries(prev.scores).forEach(([participantId, judgeScores]) => {
        const arr = Array.isArray(judgeScores) ? [...judgeScores] : [];
        arr.splice(judgeIndex, 1);
        nextScores[participantId] = arr;
      });

      const judges = prev.judges.filter((_, idx) => idx !== judgeIndex);
      let activeJudgeIndex = prev.activeJudgeIndex;
      if (activeJudgeIndex === judgeIndex) {
        activeJudgeIndex = Math.min(judgeIndex, judges.length - 1);
      } else if (activeJudgeIndex > judgeIndex) {
        activeJudgeIndex -= 1;
      }
      return {
        ...prev,
        judges,
        scores: nextScores,
        activeJudgeIndex: Math.max(0, activeJudgeIndex),
      };
    });
  };

  const replaceWithSystemJudges = () => {
    const systemJudgeNames = getSystemJudgeNames();
    if (!systemJudgeNames.length) {
      setOptionsMsg("系统中暂无可同步的评委名单");
      setOptionsMsgType("warn");
      return;
    }

    commitJudgeList(systemJudgeNames, {
      remapScores: true,
      message: `已从系统名单同步 ${systemJudgeNames.length} 位评委`,
    });
  };

  const resetJudgeNamesToDefault = () => {
    commitJudgeList(makeDefaultJudges(DEFAULT_JUDGE_COUNT), {
      remapScores: true,
      message: "已恢复默认评委名单与顺序",
    });
  };

  const handleJudgeDragStart = (judgeIndex) => {
    setDraggingJudgeIndex(judgeIndex);
    setDragOverJudgeIndex(judgeIndex);
  };

  const handleJudgeDragEnd = () => {
    setDraggingJudgeIndex(null);
    setDragOverJudgeIndex(null);
  };

  const handleJudgeDrop = (judgeIndex) => {
    if (draggingJudgeIndex === null) return;

    if (draggingJudgeIndex !== judgeIndex) {
      moveJudge(draggingJudgeIndex, judgeIndex);
      setOptionsMsg(`已将评委调整到第 ${judgeIndex + 1} 位`);
      setOptionsMsgType("success");
    }

    handleJudgeDragEnd();
  };

  const beginEditJudgeName = (judgeIndex) => {
    setState((prev) => ({ ...prev, activeJudgeIndex: judgeIndex }));
    setEditingJudgeIndex(judgeIndex);
    setEditingJudgeName(state.judges[judgeIndex] || "");
  };

  const commitEditJudgeName = () => {
    if (editingJudgeIndex === null) return;
    const nextName = editingJudgeName.trim();
    if (!nextName) {
      setEditingJudgeIndex(null);
      setEditingJudgeName("");
      return;
    }
    setState((prev) => ({
      ...prev,
      judges: prev.judges.map((name, idx) =>
        idx === editingJudgeIndex ? nextName : name,
      ),
    }));
    setEditingJudgeIndex(null);
    setEditingJudgeName("");
    setOptionsMsg(`已更新评委名称：${nextName}`);
    setOptionsMsgType("success");
  };

  const trackRank = useMemo(() => {
    const results = trackParticipants.map((p) =>
      computeParticipantResult(p.id, state.judges, state.scores),
    );
    return rankResults(results);
  }, [trackParticipants, state.judges, state.scores]);

  const globalRank = useMemo(() => {
    const results = state.participants.map((p) => ({
      ...computeParticipantResult(p.id, state.judges, state.scores),
      participant: p,
    }));
    const ranked = rankResults(results);
    return ranked;
  }, [state.participants, state.judges, state.scores]);

  const shrimpCandidates = useMemo(() => {
    return TRACKS.map((track) => {
      const members = state.participants.filter((p) => p.trackId === track.id);
      const ranked = rankResults(
        members.map((p) => computeParticipantResult(p.id, state.judges, state.scores)),
      );
      const first = ranked[0];
      if (!first) return null;
      const participant = members.find((p) => p.id === first.participantId);
      if (!participant) return null;
      return { track, participant, score: first.total };
    }).filter(Boolean);
  }, [state.participants, state.judges, state.scores]);

  const exportTrackSummaries = useMemo(
    () =>
      TRACKS.map((track) => {
        const members = state.participants.filter((p) => p.trackId === track.id);
        const ranked = rankResults(
          members.map((p) => ({
            ...computeParticipantResult(p.id, state.judges, state.scores),
            participant: p,
          })),
        ).slice(0, 10);

        return {
          trackId: track.id,
          trackName: track.name,
          rows: ranked.map((row) => {
            return {
              projectName: row?.participant?.name || "暂无数据",
              awardTitle: getAwardTitleByRank(row?.rank ?? 10),
              contestantName: row?.participant?.contestantName || "暂无数据",
              projectIntro: normalizeProjectIntro(row?.participant?.projectDescription),
              applicationLabel: formatScore(row?.applicationAvg),
              innovationLabel: formatScore(row?.innovationAvg),
              techLabel: formatScore(row?.techAvg),
              roadshowLabel: formatScore(row?.roadshowAvg),
              scoreLabel: formatScore(row?.total),
            };
          }),
        };
      }),
    [state.participants, state.judges, state.scores],
  );

  const exportTrackRankings = useMemo(
    () =>
      TRACKS.map((track) => {
        const members = state.participants.filter((p) => p.trackId === track.id);
        const ranked = rankResults(
          members.map((p) => ({
            ...computeParticipantResult(p.id, state.judges, state.scores),
            participant: p,
          })),
        );

        return {
          trackId: track.id,
          trackName: track.name,
          trackEmoji: track.emoji,
          rows: ranked.map((row) => ({
            rank: row.rank,
            tie: row.tie,
            projectNumber: row?.participant?.order ?? row.rank,
            projectName: row?.participant?.name || "未命名项目",
            teamName: row?.participant?.teamName || "",
            contestantName: row?.participant?.contestantName || "",
            scoreLabel: formatScore(row?.total),
            applicationLabel: formatScore(row?.applicationAvg),
            innovationLabel: formatScore(row?.innovationAvg),
            techLabel: formatScore(row?.techAvg),
            roadshowLabel: formatScore(row?.roadshowAvg),
            awardLabel: getAward(row.rank, row.tie),
          })),
        };
      }),
    [state.participants, state.judges, state.scores],
  );

  const activeTrackRanking = useMemo(
    () =>
      exportTrackRankings.find((track) => track.trackId === state.activeTrackId) || {
        trackId: state.activeTrackId,
        trackName:
          TRACKS.find((track) => track.id === state.activeTrackId)?.name || "当前赛道",
        trackEmoji:
          TRACKS.find((track) => track.id === state.activeTrackId)?.emoji || "",
        rows: [],
      },
    [exportTrackRankings, state.activeTrackId],
  );

  const shrimpKingTrackName = useMemo(
    () => TRACKS.find((track) => track.id === state.shrimpKing?.trackId)?.name || "",
    [state.shrimpKing],
  );

  const handleShrimpKingFieldChange = (field, value) => {
    setState((prev) => ({
      ...prev,
      shrimpKing: {
        ...makeDefaultShrimpKing(),
        ...prev.shrimpKing,
        [field]: value,
      },
    }));
  };

  const fillShrimpKingFromGlobalLeader = () => {
    const leader = globalRank[0];
    if (!leader?.participant) {
      window.alert("当前还没有可带入的总榜第一项目");
      return;
    }

    setState((prev) => ({
      ...prev,
      shrimpKing: {
        ...makeDefaultShrimpKing(),
        ...prev.shrimpKing,
        projectName: leader.participant.name || "",
        trackId: leader.participant.trackId || "",
        score:
          typeof leader.total === "number" && Number.isFinite(leader.total)
            ? leader.total.toFixed(2)
            : "",
      },
    }));
    setOptionsMsg("已将全局总榜第一带入最终虾王信息，可继续手动修改");
    setOptionsMsgType("success");
  };

  const exportResultsToWord = async () => {
    try {
      const docx = await import("docx");
      const doc = buildWordExportDocument(docx, {
        trackSummaries: exportTrackSummaries,
        shrimpKing: {
          projectName: state.shrimpKing?.projectName || "",
          trackName: shrimpKingTrackName,
          scoreLabel:
            state.shrimpKing?.score && String(state.shrimpKing.score).trim()
              ? String(state.shrimpKing.score).trim()
              : "-",
          notes: state.shrimpKing?.notes || "",
        },
        exportedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
      });

      const blob = await docx.Packer.toBlob(doc);
      downloadBlob(
        `OpenClaw_路演结果_${formatDateForFilename()}.docx`,
        blob,
      );
      setOptionsMsg("Word 已生成并开始下载");
      setOptionsMsgType("success");
    } catch (error) {
      console.error("Export Word failed:", error);
      setOptionsMsg("Word 导出失败，请重试");
      setOptionsMsgType("warn");
    }
  };

  const exportTrackRankingToWord = async () => {
    if (!activeTrackRanking.rows.length) {
      window.alert("当前选中赛道暂无可导出的排名数据");
      return;
    }

    try {
      const docx = await import("docx");
      const doc = buildTrackRankingWordDocument(docx, {
        trackRanking: activeTrackRanking,
        exportedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
      });

      const blob = await docx.Packer.toBlob(doc);
      downloadBlob(
        `OpenClaw_${activeTrackRanking.trackName}_${formatDateForFilename()}.docx`,
        blob,
      );
      setOptionsMsg(`${activeTrackRanking.trackName} Word 已生成并开始下载`);
      setOptionsMsgType("success");
    } catch (error) {
      console.error("Export ranking Word failed:", error);
      setOptionsMsg("赛道排名 Word 导出失败，请重试");
      setOptionsMsgType("warn");
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] text-slate-100">
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

          <nav className="hidden md:flex items-center gap-5">
            <button
              onClick={() => navigate("/judge/dashboard")}
              className="text-slate-500 hover:text-slate-200 transition-colors text-sm font-medium"
            >
              控制面板
            </button>
            <button className="text-primary text-sm font-bold border-b border-primary pb-0.5">
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
            >
              <LogOut size={14} />退出
            </button>
          </nav>
        </div>
      </header>

      <main className="px-6 lg:px-16 py-8 grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-5">
        <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 h-fit">
          <h2 className="font-bold text-lg mb-3">🦞 赛道与团队</h2>

          <div className="space-y-2 mb-4">
            {TRACKS.map((track) => (
              <button
                key={track.id}
                onClick={() => setState((prev) => ({ ...prev, activeTrackId: track.id }))}
                className={`w-full text-left px-3 py-2 rounded-lg border text-sm ${state.activeTrackId === track.id ? "bg-primary/15 border-primary/40 text-white" : "bg-white/[0.03] border-white/10 text-slate-300"}`}
              >
                {track.emoji} {track.name}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {trackParticipants.map((participant) => {
              const dims = state.scores[participant.id]?.[activeJudgeIndex] || {};
              const filled = DIMENSIONS.filter(
                (dim) => typeof dims[dim.key] === "number",
              ).length;

              return (
                <div
                  key={participant.id}
                  className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-sm flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm truncate">
                      {participant.name || "待导入项目"}
                    </p>
                    {participant.teamName && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {participant.teamName}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">{filled}/4</span>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="space-y-5">
          <section className="sticky top-[72px] z-30 rounded-2xl border border-primary/20 bg-[#1b120f]/95 backdrop-blur px-4 py-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-300 mr-2">快速切换赛道</span>
            {TRACKS.map((track) => (
              <button
                key={track.id}
                onClick={() => setState((prev) => ({ ...prev, activeTrackId: track.id }))}
                className={`px-3 py-1.5 rounded-lg text-xs border ${state.activeTrackId === track.id ? "bg-primary/20 text-white border-primary/40" : "bg-white/[0.03] text-slate-300 border-white/10"}`}
              >
                {track.emoji} {track.name}
              </button>
            ))}
            <span className="text-xs text-slate-300 ml-2">快速切换评委</span>
            <button
              onClick={() => switchJudgeByStep(-1)}
              className="px-2 py-1.5 rounded-lg text-xs border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]"
              title="上一个评委"
              aria-label="上一个评委"
            >
              <ChevronLeft size={14} />
            </button>
            <select
              value={String(state.activeJudgeIndex)}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  activeJudgeIndex: Number(e.target.value),
                }))
              }
              className="h-8 min-w-36 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-xs text-slate-100 outline-none focus:border-primary/60"
            >
              {state.judges.map((judgeName, idx) => (
                <option key={`${judgeName}-${idx}`} value={String(idx)} className="bg-[#1b120f]">
                  {idx + 1}. {judgeName}
                </option>
              ))}
            </select>
            <button
              onClick={() => switchJudgeByStep(1)}
              className="px-2 py-1.5 rounded-lg text-xs border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]"
              title="下一个评委"
              aria-label="下一个评委"
            >
              <ChevronRight size={14} />
            </button>
            <span className="text-xs text-slate-400">
              当前：{activeJudge || "-"}（{activeJudgeOrder}/{state.judges.length}）
            </span>
            <span className="text-xs text-slate-500">
              全场进度 {activeJudgeStats.completedProjects}/{state.participants.length} 项
            </span>
            <span className="text-xs text-slate-500">
              本赛道 {activeTrackCompletedCount}/{trackParticipants.length} 项
            </span>
            <a href="#rank-track" className="text-xs text-slate-400 hover:text-slate-200 ml-auto">
              跳转到排行区
            </a>
          </section>

          <section className="rounded-2xl border border-[#3b241d] bg-[linear-gradient(180deg,#1a1210_0%,#120f0d_100%)] p-4 md:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-lg tracking-wide">录入准备</h3>
                <p className="text-xs text-slate-400 mt-1">
                  评委名单已接入系统存储。这里的改动会同步影响路演页的默认评委，并实时更新评分区。
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={clearAllScores}
                  className="px-3 py-2 rounded-lg border border-red-300/30 text-red-200 bg-red-500/10 text-sm font-medium hover:bg-red-500/15"
                >
                  清空评分数据
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-[#3a2a24] bg-[#14100e] p-3 md:p-4">
              <button
                onClick={() =>
                  setCollapsed((prev) => ({
                    ...prev,
                    judgeImport: !prev.judgeImport,
                  }))
                }
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-sm font-semibold tracking-wide">
                  评委导入与管理
                </span>
                <span className="flex items-center gap-2 text-xs text-slate-400">
                  共 {state.judges.length} 位
                  {collapsed.judgeImport ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </span>
              </button>

              {!collapsed.judgeImport && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.25fr)_320px] gap-4">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-100">
                            批量导入评委名单
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            支持逗号或换行分隔，按顺序覆盖现有名称；如果粘贴的名单更长，会自动补充到末尾。
                          </p>
                        </div>
                        <button
                          onClick={() => setJudgeBulkText(state.judges.join("\n"))}
                          className="shrink-0 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-xs text-slate-200 hover:bg-white/[0.06]"
                        >
                          填入当前名单
                        </button>
                      </div>
                      <div className="flex flex-col gap-3">
                        <textarea
                          value={judgeBulkText}
                          onChange={(e) => setJudgeBulkText(e.target.value)}
                          placeholder={"例如：\n何昌华\n李子玄\n张直政"}
                          className="min-h-[124px] bg-[#1a1512] border border-white/10 rounded-xl px-3 py-3 text-sm outline-none focus:border-primary/50"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={applyJudgeNames}
                            className="px-4 py-2 rounded-lg border border-primary/40 text-primary bg-primary/10 text-sm font-medium hover:bg-primary/15"
                          >
                            按顺序应用名单
                          </button>
                          <button
                            onClick={replaceWithSystemJudges}
                            className="px-4 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-sm font-medium text-slate-200 hover:bg-white/[0.06] flex items-center gap-2"
                          >
                            <RefreshCcw size={14} />
                            从系统名单同步
                          </button>
                          <button
                            onClick={resetJudgeNamesToDefault}
                            className="px-4 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-sm font-medium text-slate-200 hover:bg-white/[0.06]"
                          >
                            恢复默认名单
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">
                          当前评委工作台
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          先在这里确认当前录分人，再去下方表格持续录入。
                        </p>
                      </div>

                      <div className="rounded-xl border border-primary/20 bg-[#1b120f] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-primary/80">
                          Active Judge
                        </p>
                        <p className="mt-2 text-lg font-bold text-slate-100 truncate">
                          {activeJudge || "-"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          第 {activeJudgeOrder} 位，共 {state.judges.length} 位
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                          <p className="text-[11px] text-slate-400">全场完成</p>
                          <p className="mt-1 text-base font-semibold text-slate-100">
                            {activeJudgeStats.completedProjects}/{state.participants.length}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {activeJudgeStats.completionRate}% 已录完
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                          <p className="text-[11px] text-slate-400">分项录入</p>
                          <p className="mt-1 text-base font-semibold text-slate-100">
                            {activeJudgeStats.filledDimensions}/{totalJudgeScoreSlots}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            本赛道已完成 {activeTrackCompletedCount}/{trackParticipants.length}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={addJudge}
                        className="px-3 py-2 rounded-lg border border-primary/40 text-primary bg-primary/10 text-sm font-medium flex items-center justify-center gap-1 hover:bg-primary/15"
                      >
                        <Plus size={14} /> 添加评委
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#12100e] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">评委位次管理</p>
                        <p className="text-xs text-slate-400 mt-1">
                          拖拽左侧手柄调整位次，点击名称编辑，点击“设为当前”会立即切换下方评分表。
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <GripVertical size={14} />
                        拖拽排序
                      </div>
                    </div>

                    <div className="space-y-2 max-h-[560px] overflow-auto pr-1">
                      {state.judges.map((judgeName, judgeIndex) => (
                        <div
                          key={`${judgeName}-${judgeIndex}`}
                          draggable={editingJudgeIndex !== judgeIndex}
                          onDragStart={() => handleJudgeDragStart(judgeIndex)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (dragOverJudgeIndex !== judgeIndex) {
                              setDragOverJudgeIndex(judgeIndex);
                            }
                          }}
                          onDrop={() => handleJudgeDrop(judgeIndex)}
                          onDragEnd={handleJudgeDragEnd}
                          className={`rounded-2xl border px-3 py-3 transition-all ${
                            activeJudgeIndex === judgeIndex
                              ? "border-primary/40 bg-primary/10"
                              : "border-white/10 bg-white/[0.03]"
                          } ${
                            dragOverJudgeIndex === judgeIndex && draggingJudgeIndex !== judgeIndex
                              ? "ring-2 ring-primary/40 border-primary/50"
                              : ""
                          } ${
                            draggingJudgeIndex === judgeIndex ? "opacity-60" : ""
                          }`}
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="size-9 shrink-0 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-slate-400 cursor-grab active:cursor-grabbing">
                                <GripVertical size={16} />
                              </div>
                              <button
                                onClick={() =>
                                  setState((prev) => ({
                                    ...prev,
                                    activeJudgeIndex: judgeIndex,
                                  }))
                                }
                                className={`shrink-0 min-w-11 rounded-xl border px-3 py-2 text-xs font-semibold ${
                                  activeJudgeIndex === judgeIndex
                                    ? "border-primary/40 bg-primary/15 text-primary"
                                    : "border-white/10 bg-white/[0.03] text-slate-300"
                                }`}
                                title="切换为当前评委"
                              >
                                {String(judgeIndex + 1).padStart(2, "0")}
                              </button>
                              <div className="min-w-0 flex-1">
                                {editingJudgeIndex === judgeIndex ? (
                                  <input
                                    autoFocus
                                    value={editingJudgeName}
                                    onChange={(e) => setEditingJudgeName(e.target.value)}
                                    onBlur={commitEditJudgeName}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        commitEditJudgeName();
                                      }
                                      if (e.key === "Escape") {
                                        e.preventDefault();
                                        setEditingJudgeIndex(null);
                                        setEditingJudgeName("");
                                      }
                                    }}
                                    className="h-11 w-full bg-[#1b120f] border border-primary/50 rounded-xl px-3 text-sm text-slate-100 outline-none"
                                  />
                                ) : (
                                  <button
                                    onClick={() => beginEditJudgeName(judgeIndex)}
                                    className="w-full text-left"
                                    title="单击修改评委名称"
                                  >
                                    <span className="block text-sm font-semibold text-slate-100 truncate">
                                      {judgeName}
                                    </span>
                                    <span className="block text-xs text-slate-500 mt-1">
                                      {activeJudgeIndex === judgeIndex
                                        ? "当前录分中的评委"
                                        : "点击名称即可修改"}
                                    </span>
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <div className="min-w-[130px] rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                                <p className="text-[11px] text-slate-400">录入进度</p>
                                <p className="mt-1 text-sm font-semibold text-slate-100">
                                  {judgeStats[judgeIndex]?.completedProjects || 0}/{state.participants.length} 项
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {judgeStats[judgeIndex]?.filledDimensions || 0}/{totalJudgeScoreSlots} 分项
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  setState((prev) => ({
                                    ...prev,
                                    activeJudgeIndex: judgeIndex,
                                  }))
                                }
                                className={`px-3 py-2 rounded-xl border text-sm font-medium ${
                                  activeJudgeIndex === judgeIndex
                                    ? "border-primary/40 bg-primary/15 text-primary"
                                    : "border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]"
                                }`}
                              >
                                {activeJudgeIndex === judgeIndex ? "当前评委" : "设为当前"}
                              </button>
                              <button
                                onClick={() => removeJudge(judgeIndex)}
                                className="px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-sm font-medium text-red-300 hover:text-red-200 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                                disabled={state.judges.length <= 1}
                                title="删除评委"
                              >
                                <span className="inline-flex items-center gap-1.5">
                                  <Trash2 size={14} />
                                  删除
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {optionsMsg && (
              <p
                className={`text-xs mt-3 ${optionsMsgType === "warn" ? "text-amber-300" : "text-emerald-300"}`}
              >
                {optionsMsg}
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 overflow-auto">
            <h3 className="font-bold text-lg mb-1">
              {`${TRACKS.find((t) => t.id === state.activeTrackId)?.name || "-"} - ${activeJudge || "-"}`}
            </h3>

            <table className="w-full min-w-[780px] text-sm">
              <thead>
                <tr className="text-left border-b border-white/10">
                  <th className="py-2 pr-2 w-[36%]">团队</th>
                  {DIMENSIONS.map((dim) => (
                    <th key={dim.key} className="py-2 pr-2 w-[16%]">
                      {dim.label}
                      <span className="text-xs text-slate-500 ml-1">x{dim.weight * 100}%</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trackParticipants.map((participant) => (
                  <tr key={participant.id} className="border-b border-white/5">
                    <td className="py-2 pr-2 text-slate-300 max-w-0">
                      <span className="block truncate" title={participant.name}>
                        {participant.name}
                      </span>
                    </td>
                    {DIMENSIONS.map((dim) => {
                      const key = `${participant.id}:${dim.key}`;
                      const value =
                        state.scores[participant.id]?.[activeJudgeIndex]?.[dim.key];
                      const invalid = errors[key];
                      const displayValue =
                        draftInputs[key] ?? (typeof value === "number" ? String(value) : "");
                      return (
                        <td key={dim.key} className="py-2 pr-2">
                          <input
                            data-score-cell={key}
                            value={displayValue}
                            inputMode="decimal"
                            placeholder="-"
                            className={`w-20 px-2 py-1 rounded border bg-white/[0.03] text-center outline-none ${invalid ? "border-red-400 bg-red-500/10" : "border-white/20 focus:border-primary/60"}`}
                            onChange={(e) => {
                              if (autoAdvanceTimerRef.current) {
                                clearTimeout(autoAdvanceTimerRef.current);
                                autoAdvanceTimerRef.current = null;
                              }

                              const raw = e.target.value;
                              setDraftInputs((prev) => ({ ...prev, [key]: raw }));
                              const parsed = parseInput(raw);
                              if (!parsed.ok) {
                                setErrors((prev) => ({ ...prev, [key]: true }));
                                return;
                              }
                              setErrors((prev) => ({ ...prev, [key]: false }));
                              if (!parsed.incomplete) {
                                setScore(
                                  participant.id,
                                  activeJudgeIndex,
                                  dim.key,
                                  parsed.value,
                                );
                              }

                              if (!parsed.incomplete && shouldAutoAdvance(raw, parsed.value)) {
                                autoAdvanceTimerRef.current = setTimeout(() => {
                                  focusNextCell(participant.id, dim.key);
                                }, 220);
                              }
                            }}
                            onBlur={() => {
                              const raw = draftInputs[key];
                              if (raw === undefined) return;
                              const parsed = parseInput(raw);
                              if (!parsed.ok || parsed.incomplete) {
                                setDraftInputs((prev) => {
                                  const next = { ...prev };
                                  delete next[key];
                                  return next;
                                });
                                setErrors((prev) => ({ ...prev, [key]: !!raw.trim() }));
                                return;
                              }

                              setDraftInputs((prev) => {
                                const next = { ...prev };
                                delete next[key];
                                return next;
                              });
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section id="rank-track" className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 xl:col-span-2">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-bold text-lg">当前赛道实时排名</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {SCORING_RULE_TEXT}
                  </p>
                </div>
                <button
                  onClick={exportTrackRankingToWord}
                  className="px-3 py-1.5 rounded-lg border border-primary/40 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all flex items-center gap-1.5"
                >
                  <Download size={13} />
                  导出排名 Word
                </button>
              </div>
              <div className="space-y-2 max-h-[540px] overflow-auto pr-1">
                {trackRank.map((row) => {
                  const participant = trackParticipants.find(
                    (p) => p.id === row.participantId,
                  );
                  return (
                    <div
                      key={row.participantId}
                      className="p-3 rounded-lg border border-white/10 bg-white/[0.02] flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold">
                          {participant?.name || row.participantId}
                        </p>
                        {participant?.teamName && (
                          <p className="text-xs text-slate-500 truncate">
                            {participant.teamName}
                          </p>
                        )}
                        <p className="text-xs text-slate-400">
                          应用 {row.applicationAvg ?? "-"} · 创新难度 {row.innovationAvg ?? "-"} · 技术实现与完成度 {row.techAvg ?? "-"} · 路演 {row.roadshowAvg ?? "-"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-amber-300">
                          {row.total ?? "-"}
                        </p>
                        <p className="text-xs text-slate-300">
                          {getAward(row.rank, row.tie)}
                        </p>
                        {row.tie && (
                          <p className="text-xs font-bold text-red-300">
                            [需评委投票]
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="font-bold text-lg mb-2">计算说明</h3>
              <p className="text-xs leading-6 text-slate-300">
                {SCORING_RULE_TEXT}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-bold text-lg mb-1">🦐 虾王讨论参考</h3>
                  <p className="text-xs text-slate-400">
                    这里展示各赛道当前暂列第一项目；下方“最终虾王”支持手动确认后直接导出 Word。
                  </p>
                </div>
                <button
                  onClick={exportResultsToWord}
                  className="shrink-0 px-3 py-1.5 rounded-lg border border-primary/40 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all flex items-center gap-1.5"
                >
                  <Download size={13} />
                  导出 Word
                </button>
              </div>
              <div className="space-y-2">
                {shrimpCandidates.map((item) => (
                  <div
                    key={item.track.id}
                    className="p-3 rounded-lg border border-white/10 bg-white/[0.02]"
                  >
                    <p className="font-semibold">
                      {item.track.emoji} {item.track.name}
                    </p>
                    <p className="text-sm text-slate-300">
                      {item.participant.name} · {item.score ?? "-"}
                    </p>
                    {item.participant.teamName && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {item.participant.teamName}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                      <p className="text-sm font-semibold text-slate-100">最终虾王</p>
                      <p className="text-xs text-slate-400 mt-1">
                      导出 Word 时会带上这里的最终确认结果。
                      </p>
                    </div>
                  <button
                    onClick={fillShrimpKingFromGlobalLeader}
                    className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-xs font-medium text-slate-200 hover:bg-white/[0.08]"
                  >
                    带入总榜第一
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      项目名称
                    </label>
                    <input
                      value={state.shrimpKing?.projectName || ""}
                      onChange={(e) =>
                        handleShrimpKingFieldChange("projectName", e.target.value)
                      }
                      placeholder="例如：PodClaw"
                      className="w-full h-10 rounded-lg border border-white/10 bg-[#1b120f] px-3 text-sm text-slate-100 outline-none focus:border-primary/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        所属赛道
                      </label>
                      <select
                        value={state.shrimpKing?.trackId || ""}
                        onChange={(e) =>
                          handleShrimpKingFieldChange("trackId", e.target.value)
                        }
                        className="w-full h-10 rounded-lg border border-white/10 bg-[#1b120f] px-3 text-sm text-slate-100 outline-none focus:border-primary/50"
                      >
                        <option value="">请选择</option>
                        {TRACKS.map((track) => (
                          <option key={track.id} value={track.id} className="bg-[#1b120f]">
                            {track.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        总分
                      </label>
                      <input
                        value={state.shrimpKing?.score || ""}
                        onChange={(e) =>
                          handleShrimpKingFieldChange("score", e.target.value)
                        }
                        placeholder="例如：9.36"
                        className="w-full h-10 rounded-lg border border-white/10 bg-[#1b120f] px-3 text-sm text-slate-100 outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      备注
                    </label>
                    <textarea
                      value={state.shrimpKing?.notes || ""}
                      onChange={(e) =>
                        handleShrimpKingFieldChange("notes", e.target.value)
                      }
                      placeholder="例如：全场讨论一致通过，应用价值和完成度最强"
                      className="min-h-[84px] w-full rounded-lg border border-white/10 bg-[#1b120f] px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 xl:col-span-3">
              <h4 className="font-semibold mb-2">
                全局总榜（{state.participants.length}个项目）
              </h4>
              <div className="max-h-72 overflow-auto border border-white/10 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-white/[0.03] sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-3">排名</th>
                      <th className="text-left py-2 px-3">赛道</th>
                      <th className="text-left py-2 px-3">项目</th>
                      <th className="text-right py-2 px-3">分数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalRank.map((row) => {
                      const participant = row.participant;
                      const track = TRACKS.find((t) => t.id === participant.trackId);
                      return (
                        <tr key={row.participantId} className="border-t border-white/5">
                          <td className="py-2 px-3">#{row.rank}</td>
                          <td className="py-2 px-3">{track?.name || "-"}</td>
                          <td className="py-2 px-3">{participant.name || "待导入项目"}</td>
                          <td className="py-2 px-3 text-right">{row.total ?? "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
