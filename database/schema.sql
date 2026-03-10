-- ============================================================
-- OpenClaw Hackathon 数据库 Schema
-- 在 Supabase SQL Editor 中执行此文件
-- ============================================================

-- ============================================================
-- 1. 参赛者表 participants
--    存储注册信息、项目材料、状态
-- ============================================================
CREATE TABLE IF NOT EXISTS participants (
  id            BIGSERIAL PRIMARY KEY,

  -- 个人信息
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  organization  TEXT NOT NULL,
  github        TEXT,

  -- 项目信息
  project_title       TEXT NOT NULL,
  project_description TEXT NOT NULL,
  demo_url            TEXT,
  repo_url            TEXT,

  -- 上传文件
  pdf_path    TEXT,           -- 本地存储路径
  video_path  TEXT,           -- 本地存储路径
  poster_path TEXT,           -- 宣传海报图片路径（可选，JPG/PNG/WebP）
  pdf_text    TEXT,           -- PyPDF2 提取的正文（供搜索/AI分析）

  -- 状态流转: pending → reviewing → scored
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewing', 'scored', 'rejected')),

  -- 时间戳
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE participants IS '参赛者注册信息';
COMMENT ON COLUMN participants.pdf_text IS 'PDF全文，用于搜索和AI辅助评分';
COMMENT ON COLUMN participants.status IS 'pending=待审, reviewing=评审中, scored=已评分, rejected=已拒绝';

-- ============================================================
-- 2. 评委表 judges
--    支持多评委管理（当前后端仅用单密码，预留扩展）
-- ============================================================
CREATE TABLE IF NOT EXISTS judges (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE,
  password_hash TEXT NOT NULL,            -- bcrypt hash
  role          TEXT NOT NULL DEFAULT 'judge'
    CHECK (role IN ('judge', 'admin')),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE judges IS '评委账户，支持多评委和管理员角色';

-- ============================================================
-- 3. 评分表 scores
--    每位评委对每个参赛项目打一次分
-- ============================================================
CREATE TABLE IF NOT EXISTS scores (
  id             BIGSERIAL PRIMARY KEY,
  participant_id BIGINT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  judge_id       BIGINT REFERENCES judges(id) ON DELETE SET NULL,  -- NULL = 当前单密码模式

  -- 四维评分 (0.0 ~ 10.0)
  innovation_score DECIMAL(4,1) NOT NULL CHECK (innovation_score BETWEEN 0 AND 10),
  technical_score  DECIMAL(4,1) NOT NULL CHECK (technical_score BETWEEN 0 AND 10),
  market_score     DECIMAL(4,1) NOT NULL CHECK (market_score BETWEEN 0 AND 10),
  demo_score       DECIMAL(4,1) NOT NULL CHECK (demo_score BETWEEN 0 AND 10),

  -- 加权总分 = 创新×0.3 + 技术×0.3 + 市场×0.2 + Demo×0.2
  weighted_score DECIMAL(5,2) NOT NULL,

  comments   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 同一评委只能对同一参赛者评一次分
  UNIQUE (participant_id, judge_id)
);

COMMENT ON TABLE scores IS '评委对参赛项目的评分记录';
COMMENT ON COLUMN scores.weighted_score IS '加权总分 = 创新×0.3 + 技术×0.3 + 市场×0.2 + Demo×0.2';

-- ============================================================
-- 4. 索引
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_participants_status    ON participants(status);
CREATE INDEX IF NOT EXISTS idx_participants_email     ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_created   ON participants(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scores_participant     ON scores(participant_id);
CREATE INDEX IF NOT EXISTS idx_scores_judge           ON scores(judge_id);
CREATE INDEX IF NOT EXISTS idx_scores_weighted        ON scores(weighted_score DESC);

-- ============================================================
-- 5. 自动更新 updated_at 的触发器函数
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_participants_updated
  BEFORE UPDATE ON participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_scores_updated
  BEFORE UPDATE ON scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 6. 排行榜视图 leaderboard_view
--    聚合每个参赛者的平均分（支持多评委）
-- ============================================================
CREATE OR REPLACE VIEW leaderboard_view AS
SELECT
  p.id,
  p.full_name        AS team_name,
  p.organization,
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
GROUP BY p.id, p.full_name, p.organization, p.project_title,
         p.demo_url, p.repo_url, p.status, p.created_at
ORDER BY avg_weighted_score DESC NULLS LAST;

COMMENT ON VIEW leaderboard_view IS '实时排行榜，自动聚合多评委平均分并排名';

-- ============================================================
-- 7. 参赛者详情视图 participant_details_view
--    参赛者信息 + 历次评分记录
-- ============================================================
CREATE OR REPLACE VIEW participant_details_view AS
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

COMMENT ON VIEW participant_details_view IS '参赛者完整信息 + 各评委评分';

-- ============================================================
-- 8. 统计摘要视图 stats_view
--    用于评委 Dashboard 顶部统计卡片
-- ============================================================
CREATE OR REPLACE VIEW stats_view AS
SELECT
  COUNT(*)                                        AS total_participants,
  COUNT(*) FILTER (WHERE status = 'pending')      AS pending_count,
  COUNT(*) FILTER (WHERE status = 'reviewing')    AS reviewing_count,
  COUNT(*) FILTER (WHERE status = 'scored')       AS scored_count,
  COUNT(*) FILTER (WHERE status = 'rejected')     AS rejected_count,
  COUNT(*) FILTER (WHERE pdf_path IS NOT NULL)    AS has_pdf_count,
  COUNT(*) FILTER (WHERE video_path IS NOT NULL)  AS has_video_count
FROM participants;

COMMENT ON VIEW stats_view IS '仪表盘统计摘要';

-- ============================================================
-- 增量迁移（如果表已存在，单独执行此段添加海报字段）
-- ============================================================
-- ALTER TABLE participants ADD COLUMN IF NOT EXISTS poster_path TEXT;

-- ============================================================
-- 完成
-- ============================================================
