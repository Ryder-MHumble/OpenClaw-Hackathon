-- ============================================================
-- 添加 track (赛道) 字段到 participants 表
-- 执行时间：2026-03-11
-- ============================================================

-- 1. 添加 track 字段
ALTER TABLE participants
ADD COLUMN IF NOT EXISTS track TEXT
CHECK (track IN ('academic', 'productivity', 'life'));

-- 2. 添加注释
COMMENT ON COLUMN participants.track IS '参赛赛道: academic=学术龙虾, productivity=生产力龙虾, life=生活龙虾';

-- 3. 添加索引以便按赛道筛选
CREATE INDEX IF NOT EXISTS idx_participants_track ON participants(track);

-- 4. 删除旧视图，然后重新创建（因为列顺序变化）
DROP VIEW IF EXISTS leaderboard_view;
DROP VIEW IF EXISTS participant_details_view;

-- 5. 重新创建 leaderboard_view 视图，包含 track 字段
CREATE VIEW leaderboard_view AS
SELECT
  p.id,
  p.full_name        AS team_name,
  p.organization,
  p.track,
  p.project_title,
  p.demo_url,
  p.repo_url,
  p.status,
  p.created_at       AS registered_at,

  -- 评分统计
  COUNT(s.id)                                           AS judge_count,
  ROUND(AVG(s.innovation_score)::NUMERIC, 2)            AS avg_innovation,
  ROUND(AVG(s.technical_score)::NUMERIC, 2)             AS avg_technical,
  ROUND(AVG(s.market_score)::NUMERIC, 2)                AS avg_market,
  ROUND(AVG(s.demo_score)::NUMERIC, 2)                  AS avg_demo,
  ROUND(AVG(s.weighted_score)::NUMERIC, 2)              AS avg_weighted_score,
  RANK() OVER (ORDER BY AVG(s.weighted_score) DESC NULLS LAST) AS rank

FROM participants p
LEFT JOIN scores s ON s.participant_id = p.id
GROUP BY p.id, p.full_name, p.organization, p.track, p.project_title,
         p.demo_url, p.repo_url, p.status, p.created_at
ORDER BY avg_weighted_score DESC NULLS LAST;

-- 6. 重新创建 participant_details_view 视图，包含 track 字段
CREATE VIEW participant_details_view AS
SELECT
  p.*,
  s.id               AS score_id,
  s.judge_id,
  j.name             AS judge_name,
  s.innovation_score,
  s.technical_score,
  s.market_score,
  s.demo_score,
  s.weighted_score,
  s.comments,
  s.created_at       AS scored_at
FROM participants p
LEFT JOIN scores s ON s.participant_id = p.id
LEFT JOIN judges j ON j.id = s.judge_id;

-- ============================================================
-- 完成
-- ============================================================
