import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const SCORE_DIMS = [
  { key: 'innovation', label: '创新性', weight: '30%' },
  { key: 'technical',  label: '技术实现', weight: '30%' },
  { key: 'market',     label: '市场价值', weight: '20%' },
  { key: 'demo',       label: 'Demo 演示', weight: '20%' },
]

export default function JudgeScoring() {
  const { teamId } = useParams()
  const navigate = useNavigate()
  const [participant, setParticipant] = useState(null)
  const [scores, setScores] = useState({ innovation: 5, technical: 5, market: 5, demo: 5 })
  const [comments, setComments] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // AI analysis state
  const [aiPanel, setAiPanel] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiData, setAiData] = useState(null)
  const [aiError, setAiError] = useState(null)

  useEffect(() => {
    fetchParticipant()
  }, [teamId])

  const fetchParticipant = async () => {
    try {
      const res = await axios.get(`/api/judges/participants/${teamId}`)
      setParticipant(res.data.data)
    } catch {
      // demo fallback
      setParticipant({
        id: teamId,
        full_name: '演示参赛者',
        organization: '示例机构',
        project_title: '演示项目',
        project_description: '这是一个演示项目，用于展示评分界面效果。',
        demo_url: null,
        repo_url: null,
        github: null,
      })
    }
  }

  const handleAiAnalyze = async () => {
    setAiPanel(true)
    setAiLoading(true)
    setAiError(null)
    setAiData(null)
    try {
      const res = await axios.get(`/api/judges/ai-analyze/${teamId}`)
      setAiData(res.data.data)
    } catch (e) {
      setAiError(e.response?.data?.detail || 'AI 分析失败，请稍后重试')
    } finally {
      setAiLoading(false)
    }
  }

  const adoptAiScores = () => {
    if (!aiData?.suggested_scores) return
    setScores({
      innovation: aiData.suggested_scores.innovation ?? scores.innovation,
      technical:  aiData.suggested_scores.technical  ?? scores.technical,
      market:     aiData.suggested_scores.market     ?? scores.market,
      demo:       aiData.suggested_scores.demo       ?? scores.demo,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('participant_id', teamId)
      Object.entries(scores).forEach(([k, v]) => fd.append(k, v))
      fd.append('comments', comments)
      await axios.post('/api/judges/score', fd)
    } catch {
      // demo mode — silent
    } finally {
      setSubmitting(false)
      navigate('/judge/dashboard')
    }
  }

  const weightedScore = (
    scores.innovation * 0.3 +
    scores.technical  * 0.3 +
    scores.market     * 0.2 +
    scores.demo       * 0.2
  ).toFixed(1)

  if (!participant) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="flex items-center gap-3 text-primary">
          <svg className="animate-spin size-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm font-bold">加载中…</span>
        </div>
      </div>
    )
  }

  const recommendationColor = {
    '进入决赛': 'text-green-400 bg-green-400/10 border-green-400/30',
    '建议淘汰': 'text-red-400 bg-red-400/10 border-red-400/30',
    '待进一步了解': 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark text-slate-100">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 border-b border-primary/20 px-6 lg:px-20 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/judge/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors text-sm font-bold"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            返回列表
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:block">
              当前评审：<span className="text-slate-200 font-bold">{participant.project_title}</span>
            </span>
            <div className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20 flex items-baseline gap-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase">加权评分</span>
              <span className="text-primary font-black text-lg">{weightedScore}</span>
              <span className="text-slate-500 text-xs">/10</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 lg:px-12 py-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── 左栏：项目详情 ── */}
          <div className="lg:col-span-5 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-2xl p-6 space-y-4"
            >
              <div>
                <p className="text-[10px] uppercase tracking-widest text-primary/60 font-bold mb-1">项目名称</p>
                <h1 className="text-2xl font-black leading-tight">{participant.project_title}</h1>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">{participant.project_description}</p>

              <div className="border-t border-border-dark pt-4 space-y-2.5">
                <InfoRow icon="person" value={participant.full_name} />
                <InfoRow icon="business" value={participant.organization} />
                {participant.github && <InfoRow icon="code" value={`@${participant.github}`} />}
                {participant.demo_url && (
                  <a href={participant.demo_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <span className="material-symbols-outlined text-primary text-base">link</span>
                    Demo 演示地址
                  </a>
                )}
                {participant.repo_url && (
                  <a href={participant.repo_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <span className="material-symbols-outlined text-primary text-base">terminal</span>
                    代码仓库
                  </a>
                )}
              </div>
            </motion.div>

            {/* AI 分析按钮 */}
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              onClick={handleAiAnalyze}
              disabled={aiLoading}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl
                bg-gradient-to-r from-violet-600/20 to-primary/20
                border border-violet-500/30 hover:border-violet-400/60
                text-violet-300 font-bold text-sm transition-all
                hover:from-violet-600/30 hover:to-primary/30
                disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              {aiLoading ? (
                <>
                  <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  AI 分析中…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">
                    auto_awesome
                  </span>
                  AI 辅助评分分析
                </>
              )}
            </motion.button>

            {/* AI 分析面板 */}
            <AnimatePresence>
              {aiPanel && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="glass-panel rounded-2xl p-5 border border-violet-500/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-violet-400 text-lg">psychology</span>
                        <span className="text-sm font-bold text-violet-300">AI 分析结果</span>
                      </div>
                      <button
                        onClick={() => setAiPanel(false)}
                        className="text-slate-600 hover:text-slate-400 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>

                    {aiLoading && (
                      <div className="space-y-2 animate-pulse">
                        {[80, 60, 70, 50].map((w, i) => (
                          <div key={i} className="h-3 bg-slate-700 rounded-full" style={{ width: `${w}%` }} />
                        ))}
                      </div>
                    )}

                    {aiError && (
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <span className="material-symbols-outlined text-base">error</span>
                        {aiError}
                      </div>
                    )}

                    {aiData && (
                      <>
                        {/* 推荐结论 */}
                        {aiData.recommendation && (
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${recommendationColor[aiData.recommendation] || 'text-slate-400 bg-slate-400/10 border-slate-400/30'}`}>
                            <span className="material-symbols-outlined text-[14px]">flag</span>
                            AI 建议：{aiData.recommendation}
                          </div>
                        )}

                        {/* 综合评述 */}
                        {aiData.summary && (
                          <p className="text-slate-300 text-xs leading-relaxed">{aiData.summary}</p>
                        )}

                        {/* 建议评分 */}
                        {aiData.suggested_scores && (
                          <div className="space-y-2">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">AI 建议评分</p>
                            <div className="grid grid-cols-2 gap-2">
                              {SCORE_DIMS.map(d => (
                                <div key={d.key} className="flex items-center justify-between bg-white/3 rounded-lg px-3 py-2">
                                  <span className="text-xs text-slate-400">{d.label}</span>
                                  <span className="text-sm font-black text-violet-300">
                                    {aiData.suggested_scores[d.key]?.toFixed(1) ?? '—'}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={adoptAiScores}
                              className="w-full mt-1 py-2 rounded-xl bg-violet-500/20 border border-violet-500/30
                                text-violet-300 text-xs font-bold hover:bg-violet-500/30 transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm align-middle mr-1">download</span>
                              一键采纳 AI 建议分
                            </button>
                          </div>
                        )}

                        {/* 亮点与问题 */}
                        <div className="grid grid-cols-1 gap-3">
                          {aiData.strengths?.length > 0 && (
                            <div>
                              <p className="text-[10px] text-green-500/70 uppercase tracking-wider font-bold mb-1.5">项目亮点</p>
                              <ul className="space-y-1">
                                {aiData.strengths.map((s, i) => (
                                  <li key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                                    <span className="material-symbols-outlined text-green-500 text-[12px] mt-0.5 flex-shrink-0">check</span>
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {aiData.concerns?.length > 0 && (
                            <div>
                              <p className="text-[10px] text-amber-500/70 uppercase tracking-wider font-bold mb-1.5">关注点</p>
                              <ul className="space-y-1">
                                {aiData.concerns.map((c, i) => (
                                  <li key={i} className="flex items-start gap-1.5 text-xs text-slate-400">
                                    <span className="material-symbols-outlined text-amber-500 text-[12px] mt-0.5 flex-shrink-0">warning</span>
                                    {c}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── 右栏：评分表单 ── */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-panel rounded-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="size-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">rate_review</span>
                </div>
                <div>
                  <h2 className="text-xl font-black">评委评分</h2>
                  <p className="text-slate-500 text-sm">拖动滑块给出各维度评分</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* 评分滑块 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {SCORE_DIMS.map(({ key, label, weight }) => (
                    <div key={key} className="space-y-3">
                      <div className="flex justify-between items-end">
                        <label className="text-sm font-bold text-slate-300">
                          {label}
                          <span className="text-[10px] text-slate-500 font-normal ml-1">({weight})</span>
                        </label>
                        <motion.span
                          key={scores[key]}
                          initial={{ scale: 0.8, opacity: 0.6 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-2xl font-black text-primary tabular-nums"
                        >
                          {scores[key].toFixed(1)}
                        </motion.span>
                      </div>
                      <input
                        type="range" min="0" max="10" step="0.5"
                        value={scores[key]}
                        onChange={e => setScores(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-600 font-bold select-none">
                        <span>0</span><span>5</span><span>10</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 评语 */}
                <div>
                  <label className="text-sm font-bold text-slate-300 mb-2 block flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-500 text-base">edit_note</span>
                    评审评语（选填）
                  </label>
                  <textarea
                    className="w-full bg-surface-dark/50 border border-border-dark rounded-xl p-4
                      text-slate-100 placeholder:text-slate-600 text-sm resize-none
                      focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                    placeholder="请输入对该项目的详细评价，包括技术亮点、改进建议等…"
                    rows={4}
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                  />
                </div>

                {/* 提交按钮 */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/judge/dashboard')}
                    className="px-7 py-3 rounded-xl border border-border-dark text-slate-400 font-bold
                      hover:bg-surface-dark transition-colors text-sm"
                  >
                    取消
                  </button>
                  <motion.button
                    type="submit"
                    disabled={submitting}
                    whileHover={!submitting ? { scale: 1.02 } : {}}
                    whileTap={!submitting ? { scale: 0.98 } : {}}
                    className="px-10 py-3 rounded-xl bg-primary text-white font-black glow-accent
                      uppercase tracking-wider text-sm transition-all
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        提交中…
                      </span>
                    ) : '确认提交评分'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}

function InfoRow({ icon, value }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-300">
      <span className="material-symbols-outlined text-primary/60 text-base">{icon}</span>
      {value}
    </div>
  )
}
