import participantsSeed from "./participants.static.json";

const PARTICIPANTS_KEY = "openclaw_static_participants_v1";
const SCORES_KEY = "openclaw_static_scores_v1";
const JUDGES_KEY = "openclaw_static_judges_v1";
const JUDGE_PASSWORD = "openclaw2026";
const FALLBACK_POSTER = "https://equal-white-jmg5rfasyt.edgeone.app/banner2.png";

const ALLOWED_STATUSES = new Set(["pending", "reviewing", "scored", "rejected"]);
const TRACKS = ["academic", "productivity", "life"];

function normalizeStatus(value) {
  return ALLOWED_STATUSES.has(value) ? value : "pending";
}

function normalizeTrack(value) {
  return TRACKS.includes(value) ? value : "academic";
}

function normalizeBool(value) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return null;
}

function normalizeParticipant(row) {
  const id = String(row.id || "").trim();
  const projectTitle = (row.project_title || "").trim();
  return {
    id,
    full_name: (row.full_name || "").trim() || "匿名参赛者",
    email: (row.email || "").trim(),
    organization: (row.organization || "").trim() || "未知组织",
    github: (row.github || "").trim(),
    project_title: projectTitle || `未命名项目 ${id}`,
    project_description: (row.project_description || "").trim() || "暂无项目描述",
    demo_url: (row.demo_url || "").trim(),
    repo_url: (row.repo_url || "").trim(),
    pdf_url: (row.pdf_url || "").trim(),
    video_url: (row.video_url || "").trim(),
    poster_url: (row.poster_url || "").trim() || FALLBACK_POSTER,
    status: normalizeStatus((row.status || "").trim()),
    created_at: (row.created_at || "").trim(),
    updated_at: (row.updated_at || "").trim(),
    track: normalizeTrack((row.track || "").trim()),
    materials_complete: normalizeBool(row.materials_complete),
    review_notes: (row.review_notes || "").trim(),
  };
}

function sortByCreatedDesc(items) {
  return [...items].sort((a, b) => {
    const ta = Date.parse(a.created_at || "") || 0;
    const tb = Date.parse(b.created_at || "") || 0;
    return tb - ta;
  });
}

function defaultParticipants() {
  const normalized = participantsSeed
    .map(normalizeParticipant)
    .filter((item) => item.id);
  return sortByCreatedDesc(normalized);
}

function defaultJudges() {
  return Array.from({ length: 15 }, (_, i) => ({
    id: `judge-${i + 1}`,
    name: `评委${i + 1}`,
  }));
}

function parseJSON(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function getParticipantsRaw() {
  const fromStorage = parseJSON(localStorage.getItem(PARTICIPANTS_KEY), null);
  if (Array.isArray(fromStorage) && fromStorage.length) {
    return fromStorage.map(normalizeParticipant);
  }

  const initial = defaultParticipants();
  localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(initial));
  return initial;
}

function setParticipantsRaw(participants) {
  localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants));
}

function getScoresRaw() {
  const scores = parseJSON(localStorage.getItem(SCORES_KEY), {});
  return scores && typeof scores === "object" ? scores : {};
}

function setScoresRaw(scores) {
  localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
}

export function getJudges() {
  const judges = parseJSON(localStorage.getItem(JUDGES_KEY), null);
  if (Array.isArray(judges) && judges.length) return judges;
  const seeded = defaultJudges();
  localStorage.setItem(JUDGES_KEY, JSON.stringify(seeded));
  return seeded;
}

export function loginJudgeWithPassword(password) {
  const ok = password === JUDGE_PASSWORD;
  if (!ok) {
    return { ok: false, error: "密码错误，请重试" };
  }
  const token = `local-judge-${Date.now()}`;
  localStorage.setItem("judgeToken", token);
  localStorage.setItem("judgeLoginAt", new Date().toISOString());
  return { ok: true, token };
}

export function getParticipants({ status } = {}) {
  const all = getParticipantsRaw();
  if (!status || status === "all") return all;
  return all.filter((item) => item.status === status);
}

export function getParticipantById(id) {
  const all = getParticipantsRaw();
  return all.find((item) => String(item.id) === String(id)) || null;
}

export function deleteParticipantById(id) {
  const all = getParticipantsRaw();
  const next = all.filter((item) => String(item.id) !== String(id));
  setParticipantsRaw(next);

  const scores = getScoresRaw();
  delete scores[String(id)];
  setScoresRaw(scores);
}

export function getJudgeDashboardStats() {
  const all = getParticipantsRaw();
  return {
    total_participants: all.length,
    pending_count: all.filter((p) => p.status === "pending").length,
    reviewing_count: all.filter((p) => p.status === "reviewing").length,
    scored_count: all.filter((p) => p.status === "scored").length,
    rejected_count: all.filter((p) => p.status === "rejected").length,
  };
}

export function getTrackStats(status = "all") {
  const all = getParticipantsRaw().filter((p) =>
    status === "all" ? true : p.status === status,
  );
  return {
    academic: all.filter((p) => p.track === "academic").length,
    productivity: all.filter((p) => p.track === "productivity").length,
    life: all.filter((p) => p.track === "life").length,
  };
}

export function updateParticipantStatus(id, { status, comments, materialsComplete }) {
  const all = getParticipantsRaw();
  const next = all.map((item) => {
    if (String(item.id) !== String(id)) return item;
    return {
      ...item,
      status: normalizeStatus(status),
      review_notes: comments || item.review_notes,
      materials_complete:
        typeof materialsComplete === "boolean"
          ? materialsComplete
          : item.materials_complete,
      updated_at: new Date().toISOString(),
    };
  });
  setParticipantsRaw(next);
}

export function submitFinalScore(id, { innovation, technical, market, demo, comments }) {
  const score = {
    innovation: Number(innovation),
    technical: Number(technical),
    market: Number(market),
    demo: Number(demo),
    comments: comments || "",
    weighted_score:
      Number(innovation) * 0.3 +
      Number(technical) * 0.3 +
      Number(market) * 0.2 +
      Number(demo) * 0.2,
    judge_id: "local-judge",
    submitted_at: new Date().toISOString(),
  };

  const scores = getScoresRaw();
  scores[String(id)] = score;
  setScoresRaw(scores);

  updateParticipantStatus(id, {
    status: "scored",
    comments,
    materialsComplete: true,
  });

  return score;
}

export function getScoreByParticipantId(id) {
  const scores = getScoresRaw();
  return scores[String(id)] || null;
}

function mapParticipantToLeaderboard(participant, score) {
  return {
    id: participant.id,
    team_name: participant.organization || participant.full_name,
    project_title: participant.project_title,
    poster_url: participant.poster_url || FALLBACK_POSTER,
    avg_innovation: Number(score.innovation.toFixed(2)),
    avg_technical: Number(score.technical.toFixed(2)),
    avg_market: Number(score.market.toFixed(2)),
    avg_demo: Number(score.demo.toFixed(2)),
    avg_weighted_score: Number(score.weighted_score.toFixed(2)),
  };
}

export function getLeaderboard() {
  const participants = getParticipantsRaw();
  const scores = getScoresRaw();

  return participants
    .filter((p) => p.status === "scored" && scores[String(p.id)])
    .map((participant) => mapParticipantToLeaderboard(participant, scores[String(participant.id)]))
    .sort((a, b) => {
      if (b.avg_weighted_score !== a.avg_weighted_score) {
        return b.avg_weighted_score - a.avg_weighted_score;
      }
      if (b.avg_innovation !== a.avg_innovation) {
        return b.avg_innovation - a.avg_innovation;
      }
      return b.avg_technical - a.avg_technical;
    });
}

export function getNextParticipantId(currentId, status = null) {
  const all = getParticipantsRaw();
  const list = status ? all.filter((p) => p.status === status) : all;
  const idx = list.findIndex((p) => String(p.id) === String(currentId));
  if (idx < 0) return null;
  const next = list[idx + 1];
  return next ? String(next.id) : null;
}

export function getRoadshowProjectsGrouped() {
  const participants = getParticipantsRaw();
  const grouped = {
    academic: [],
    productivity: [],
    life: [],
  };

  participants.forEach((participant) => {
    const track = normalizeTrack(participant.track);
    grouped[track].push({
      id: participant.id,
      name: participant.project_title || `项目 ${participant.id}`,
    });
  });

  Object.keys(grouped).forEach((track) => {
    grouped[track] = grouped[track].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  });

  return grouped;
}

function escapeCsvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function rowsToCsv(headers, rows) {
  const headerLine = headers.join(",");
  const lines = rows.map((row) =>
    headers.map((header) => escapeCsvCell(row[header])).join(","),
  );
  return [headerLine, ...lines].join("\n");
}

export function exportParticipantsCsvText() {
  const participants = getParticipantsRaw();
  const scores = getScoresRaw();
  const rows = participants.map((participant) => {
    const score = scores[String(participant.id)] || {};
    return {
      id: participant.id,
      project_title: participant.project_title,
      organization: participant.organization,
      track: participant.track,
      status: participant.status,
      innovation: score.innovation ?? "",
      technical: score.technical ?? "",
      market: score.market ?? "",
      demo: score.demo ?? "",
      weighted_score:
        typeof score.weighted_score === "number"
          ? Number(score.weighted_score.toFixed(2))
          : "",
      comments: score.comments ?? participant.review_notes ?? "",
      updated_at: participant.updated_at || participant.created_at || "",
    };
  });

  return rowsToCsv(
    [
      "id",
      "project_title",
      "organization",
      "track",
      "status",
      "innovation",
      "technical",
      "market",
      "demo",
      "weighted_score",
      "comments",
      "updated_at",
    ],
    rows,
  );
}

export function exportLeaderboardCsvText() {
  const rows = getLeaderboard().map((item, index) => ({
    rank: index + 1,
    team_name: item.team_name,
    project_title: item.project_title,
    innovation: item.avg_innovation,
    technical: item.avg_technical,
    market: item.avg_market,
    demo: item.avg_demo,
    weighted_score: item.avg_weighted_score,
  }));

  return rowsToCsv(
    [
      "rank",
      "team_name",
      "project_title",
      "innovation",
      "technical",
      "market",
      "demo",
      "weighted_score",
    ],
    rows,
  );
}

export function resetToSeedData() {
  localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(defaultParticipants()));
  localStorage.removeItem(SCORES_KEY);
  localStorage.setItem(JUDGES_KEY, JSON.stringify(defaultJudges()));
}
