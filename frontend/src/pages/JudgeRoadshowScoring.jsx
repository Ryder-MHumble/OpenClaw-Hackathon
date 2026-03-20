import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  LogOut,
  Plus,
  Trash2,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import LobsterLogo from "../components/LobsterLogo";
import { getRoadshowProjectsGrouped } from "../data/judgeStaticStore";

const STORAGE_KEY = "openclaw_roadshow_scoring_v2";

const TRACKS = [
  { id: "academic", name: "学术赛道", emoji: "🎓" },
  { id: "productivity", name: "生产力赛道", emoji: "⚡" },
  { id: "life", name: "生活赛道", emoji: "🌟" },
];

const DIMENSIONS = [
  { key: "innovation", label: "创新性", weight: 0.3 },
  { key: "tech", label: "技术难度", weight: 0.3 },
  { key: "application", label: "应用前景", weight: 0.2 },
  { key: "roadshow", label: "路演表现", weight: 0.2 },
];

function round2(v) {
  return Number(v.toFixed(2));
}

function makeDefaultJudges(count = 15) {
  return Array.from({ length: count }, (_, i) => ({
    id: `judge-${i + 1}`,
    name: `评委${i + 1}`,
  }));
}

function makeDefaultParticipants() {
  return TRACKS.flatMap((track) =>
    Array.from({ length: 10 }, (_, i) => ({
      id: `${track.id}-${i + 1}`,
      trackId: track.id,
      order: i + 1,
      name: "",
    })),
  );
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
      sourceParticipantId: undefined,
    }));
  });
}

function initialState() {
  const judges = makeDefaultJudges(15);
  return {
    judges,
    participants: makeDefaultParticipants(),
    scores: {},
    activeTrackId: "academic",
    activeJudgeId: judges[0].id,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw);
    return {
      ...initialState(),
      ...parsed,
    };
  } catch {
    return initialState();
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

function computeParticipantResult(participantId, judges, scores) {
  const judgeScores = scores[participantId] || {};

  const dimAvg = {};
  DIMENSIONS.forEach((dim) => {
    const values = judges
      .map((judge) => judgeScores[judge.id]?.[dim.key])
      .filter((v) => typeof v === "number");
    dimAvg[dim.key] = trimmedAverage(values);
  });

  const hasAll = DIMENSIONS.every((d) => typeof dimAvg[d.key] === "number");
  const total = hasAll
    ? round2(
        dimAvg.innovation * 0.3 +
          dimAvg.tech * 0.3 +
          dimAvg.application * 0.2 +
          dimAvg.roadshow * 0.2,
      )
    : null;

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

  const iA = a.innovationAvg ?? -1;
  const iB = b.innovationAvg ?? -1;
  if (iA !== iB) return iB - iA;

  const tA = a.techAvg ?? -1;
  const tB = b.techAvg ?? -1;
  if (tA !== tB) return tB - tA;

  const aA = a.applicationAvg ?? -1;
  const aB = b.applicationAvg ?? -1;
  if (aA !== aB) return aB - aA;

  return 0;
}

function needsVote(a, b) {
  return (
    (a.total ?? -1) === (b.total ?? -1) &&
    (a.innovationAvg ?? -1) === (b.innovationAvg ?? -1) &&
    (a.techAvg ?? -1) === (b.techAvg ?? -1) &&
    (a.applicationAvg ?? -1) === (b.applicationAvg ?? -1)
  );
}

function rankResults(results) {
  const sorted = [...results].sort(compareResult);
  return sorted.map((result, idx) => ({
    ...result,
    rank: idx + 1,
    tie: sorted.some(
      (other) =>
        other.participantId !== result.participantId && needsVote(result, other),
    ),
  }));
}

function getAward(rank) {
  if (rank === 1) return "🏆 一等奖 (￥8万)";
  if (rank >= 2 && rank <= 4) return "🥈 二等奖 (￥3万)";
  return "🥉 三等奖 (￥2万)";
}

function parseInput(raw) {
  if (raw.trim() === "") return { ok: true, value: undefined };
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

function buildDemoDataset() {
  const judges = makeDefaultJudges(15);
  const participants = makeDefaultParticipants();
  const scores = {};

  const jitter = [-0.5, -0.3, -0.2, -0.1, 0, 0.1, 0.2, -0.25, 0.15, 0.3, -0.4, 0.45, -0.15, 0.25, -0.35];
  const baseMap = {
    academic: { innovation: 9.2, tech: 9.0, application: 8.7, roadshow: 8.6 },
    productivity: { innovation: 9.0, tech: 8.8, application: 9.0, roadshow: 8.9 },
    life: { innovation: 8.8, tech: 8.5, application: 8.8, roadshow: 8.9 },
  };

  participants.forEach((participant) => {
    const base = baseMap[participant.trackId];
    const decay = (participant.order - 1) * 0.28;
    scores[participant.id] = {};

    judges.forEach((judge, idx) => {
      const j = jitter[idx];
      scores[participant.id][judge.id] = {
        innovation: Number((base.innovation - decay + j * 0.4).toFixed(1)),
        tech: Number((base.tech - decay + j * 0.35).toFixed(1)),
        application: Number((base.application - decay + j * 0.3).toFixed(1)),
        roadshow: Number((base.roadshow - decay + j * 0.32).toFixed(1)),
      };
    });
  });

  return {
    judges,
    participants,
    scores,
    activeTrackId: "academic",
    activeJudgeId: judges[0].id,
  };
}

export default function JudgeRoadshowScoring() {
  const navigate = useNavigate();
  const [state, setState] = useState(loadState);
  const [errors, setErrors] = useState({});
  const [judgeBulkText, setJudgeBulkText] = useState("");
  const [collapsed, setCollapsed] = useState({
    judgeImport: false,
  });
  const [optionsMsg, setOptionsMsg] = useState("");
  const autoAdvanceTimerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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
        const counts = TRACKS.map(
          (track) => `${track.name}${grouped[track.id]?.length || 0} 个`,
        ).join("，");
      } catch (error) {
        console.error("Load roadshow projects failed:", error);
        setOptionsMsg("项目名称加载失败，请检查前端静态数据");
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

  const applyJudgeNames = () => {
    const names = judgeBulkText
      .split(/[\n,，]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (!names.length) {
      setOptionsMsg("请先输入评委名称（逗号或换行分隔）");
      return;
    }

    setState((prev) => ({
      ...prev,
      judges: prev.judges.map((judge, idx) => ({
        ...judge,
        name: names[idx] || judge.name,
      })),
    }));

    setOptionsMsg(`已更新评委名称 ${Math.min(names.length, state.judges.length)} 位`);
  };

  const clearAllScores = () => {
    if (!window.confirm("确定清空当前页面的全部评分数据吗？此操作不可恢复。")) return;
    setState((prev) => ({
      ...prev,
      scores: {},
    }));
    setErrors({});
    setOptionsMsg("已清空全部评分数据，项目名称保持不变。");
  };

  const trackParticipants = useMemo(
    () =>
      state.participants
        .filter((p) => p.trackId === state.activeTrackId)
        .sort((a, b) => a.order - b.order),
    [state.participants, state.activeTrackId],
  );
  const activeJudge =
    state.judges.find((j) => j.id === state.activeJudgeId) || state.judges[0];
  const activeJudgeIndex = state.judges.findIndex((j) => j.id === activeJudge?.id);
  const activeJudgeOrder = activeJudgeIndex >= 0 ? activeJudgeIndex + 1 : 1;

  const switchJudgeByStep = (step) => {
    setState((prev) => {
      if (!prev.judges.length) return prev;
      const currentIdx = prev.judges.findIndex((j) => j.id === prev.activeJudgeId);
      const startIdx = currentIdx >= 0 ? currentIdx : 0;
      const nextIdx = (startIdx + step + prev.judges.length) % prev.judges.length;
      return {
        ...prev,
        activeJudgeId: prev.judges[nextIdx].id,
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

  const setScore = (participantId, judgeId, dimension, value) => {
    setState((prev) => {
      const participantScores = prev.scores[participantId] || {};
      const judgeScores = participantScores[judgeId] || {};
      const nextDim = { ...judgeScores };
      if (typeof value === "number") {
        nextDim[dimension] = value;
      } else {
        delete nextDim[dimension];
      }
      return {
        ...prev,
        scores: {
          ...prev.scores,
          [participantId]: {
            ...participantScores,
            [judgeId]: nextDim,
          },
        },
      };
    });
  };

  const addJudge = () => {
    setState((prev) => {
      const nextNum = prev.judges.length + 1;
      const newJudge = { id: `judge-${Date.now()}`, name: `评委${nextNum}` };
      return { ...prev, judges: [...prev.judges, newJudge] };
    });
  };

  const removeJudge = (judgeId) => {
    setState((prev) => {
      if (prev.judges.length <= 1) return prev;

      const nextScores = {};
      Object.entries(prev.scores).forEach(([participantId, judgeScores]) => {
        const copy = { ...judgeScores };
        delete copy[judgeId];
        nextScores[participantId] = copy;
      });

      const judges = prev.judges.filter((j) => j.id !== judgeId);
      return {
        ...prev,
        judges,
        scores: nextScores,
        activeJudgeId:
          prev.activeJudgeId === judgeId ? judges[0]?.id || "" : prev.activeJudgeId,
      };
    });
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

  const exportTrackRankingToExcel = () => {
    const activeTrack = TRACKS.find((t) => t.id === state.activeTrackId);
    const trackName = activeTrack?.name || "赛道";

    if (!trackRank.length) {
      window.alert("当前赛道暂无可导出的排名数据");
      return;
    }

    const headers = [
      "排名",
      "项目名称",
      "创新性",
      "技术难度",
      "应用前景",
      "路演表现",
      "总分",
      "奖项",
      "是否需投票",
    ];

    const rows = trackRank.map((row) => {
      const participant = trackParticipants.find((p) => p.id === row.participantId);
      return [
        row.rank,
        participant?.name || "未命名项目",
        row.innovationAvg ?? "",
        row.techAvg ?? "",
        row.applicationAvg ?? "",
        row.roadshowAvg ?? "",
        row.total ?? "",
        getAward(row.rank),
        row.tie ? "是" : "否",
      ];
    });

    const xml = buildExcelXml(`${trackName}实时排名`, headers, rows);
    const blob = new Blob([`\uFEFF${xml}`], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${trackName}_实时排名_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
              const dims = state.scores[participant.id]?.[activeJudge?.id] || {};
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
              value={state.activeJudgeId}
              onChange={(e) =>
                setState((prev) => ({ ...prev, activeJudgeId: e.target.value }))
              }
              className="h-8 min-w-36 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-xs text-slate-100 outline-none focus:border-primary/60"
            >
              {state.judges.map((judge, idx) => (
                <option key={judge.id} value={judge.id} className="bg-[#1b120f]">
                  {idx + 1}. {judge.name}
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
              当前：{activeJudge?.name || "-"}（{activeJudgeOrder}/{state.judges.length}）
            </span>
            <a href="#rank-track" className="text-xs text-slate-400 hover:text-slate-200 ml-auto">
              跳转到排行区
            </a>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h3 className="font-bold text-lg">录入准备</h3>
              <div className="flex gap-2">
                <button
                  onClick={clearAllScores}
                  className="px-3 py-2 rounded-lg border border-red-300/30 text-red-200 bg-red-500/10 text-sm font-medium"
                >
                  清空评分数据
                </button>
                <button
                  onClick={() => {
                    if (window.confirm("写入一批真实风格测试数据？")) {
                      setState(buildDemoDataset());
                    }
                  }}
                  className="px-3 py-2 rounded-lg border border-amber-300/30 text-amber-200 bg-amber-500/10 text-sm font-medium flex items-center gap-1"
                >
                  <FlaskConical size={14} /> 写入测试数据
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <button
                onClick={() =>
                  setCollapsed((prev) => ({
                    ...prev,
                    judgeImport: !prev.judgeImport,
                  }))
                }
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-sm font-semibold">评委导入与管理模块</span>
                {collapsed.judgeImport ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>

              {!collapsed.judgeImport && (
                <>
                  <div className="flex justify-end mt-2 mb-3">
                    <button
                      onClick={addJudge}
                      className="px-3 py-2 rounded-lg border border-primary/40 text-primary bg-primary/10 text-sm font-medium flex items-center gap-1"
                    >
                      <Plus size={14} /> 添加评委
                    </button>
                  </div>

                  <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                    <p className="text-xs text-slate-400 mb-2">
                      批量更新评委名称（逗号或换行分隔）
                    </p>
                    <div className="flex flex-col md:flex-row gap-2">
                      <textarea
                        value={judgeBulkText}
                        onChange={(e) => setJudgeBulkText(e.target.value)}
                        placeholder="例如：张三,李四,王五..."
                        className="flex-1 min-h-16 bg-transparent border border-white/10 rounded px-2 py-1 text-xs"
                      />
                      <button
                        onClick={applyJudgeNames}
                        className="px-3 py-2 rounded-lg border border-primary/40 text-primary bg-primary/10 text-sm font-medium"
                      >
                        应用评委名称
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {state.judges.map((judge) => (
                      <div
                        key={judge.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border ${state.activeJudgeId === judge.id ? "border-primary/40 bg-primary/10" : "border-white/10 bg-white/[0.02]"}`}
                      >
                        <button
                          onClick={() => setState((prev) => ({ ...prev, activeJudgeId: judge.id }))}
                          className="text-left text-sm font-medium flex-1"
                        >
                          {judge.name}
                        </button>
                        <input
                          value={judge.name}
                          onChange={(e) => {
                            const name = e.target.value;
                            setState((prev) => ({
                              ...prev,
                              judges: prev.judges.map((j) =>
                                j.id === judge.id
                                  ? { ...j, name: name.trim() || j.name }
                                  : j,
                              ),
                            }));
                          }}
                          className="w-28 bg-transparent border border-white/10 rounded px-2 py-1 text-xs"
                        />
                        <button
                          onClick={() => removeJudge(judge.id)}
                          className="text-red-300 hover:text-red-200"
                          disabled={state.judges.length <= 1}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {optionsMsg && <p className="text-xs text-emerald-300 mt-3">{optionsMsg}</p>}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 overflow-auto">
            <h3 className="font-bold text-lg mb-1">
              {`${TRACKS.find((t) => t.id === state.activeTrackId)?.name || "-"} - ${activeJudge?.name || "-"}`}
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
                        state.scores[participant.id]?.[activeJudge?.id]?.[dim.key];
                      const invalid = errors[key];
                      return (
                        <td key={dim.key} className="py-2 pr-2">
                          <input
                            data-score-cell={key}
                            value={typeof value === "number" ? String(value) : ""}
                            inputMode="decimal"
                            placeholder="-"
                            className={`w-20 px-2 py-1 rounded border bg-white/[0.03] text-center outline-none ${invalid ? "border-red-400 bg-red-500/10" : "border-white/20 focus:border-primary/60"}`}
                            onChange={(e) => {
                              if (autoAdvanceTimerRef.current) {
                                clearTimeout(autoAdvanceTimerRef.current);
                                autoAdvanceTimerRef.current = null;
                              }

                              const raw = e.target.value;
                              const parsed = parseInput(e.target.value);
                              if (!parsed.ok) {
                                setErrors((prev) => ({ ...prev, [key]: true }));
                                return;
                              }
                              setErrors((prev) => ({ ...prev, [key]: false }));
                              setScore(
                                participant.id,
                                activeJudge?.id,
                                dim.key,
                                parsed.value,
                              );

                              if (shouldAutoAdvance(raw, parsed.value)) {
                                autoAdvanceTimerRef.current = setTimeout(() => {
                                  focusNextCell(participant.id, dim.key);
                                }, 220);
                              }
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
                <h3 className="font-bold text-lg">当前赛道实时排名</h3>
                <button
                  onClick={exportTrackRankingToExcel}
                  className="px-3 py-1.5 rounded-lg border border-primary/40 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all flex items-center gap-1.5"
                >
                  <Download size={13} />
                  导出Excel
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
                        <p className="text-xs text-slate-400">
                          创新 {row.innovationAvg ?? "-"} · 技术 {row.techAvg ?? "-"} · 应用 {row.applicationAvg ?? "-"} 路演 {row.roadshowAvg ?? "-"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-amber-300">
                          {row.total ?? "-"}
                        </p>
                        <p className="text-xs text-slate-300">{getAward(row.rank)}</p>
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
              <h3 className="font-bold text-lg mb-3">🦐 虾王候选（各赛道第一）</h3>
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
                  </div>
                ))}
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
