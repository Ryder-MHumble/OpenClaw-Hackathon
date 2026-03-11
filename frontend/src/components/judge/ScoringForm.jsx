import { SCORING_DIMENSIONS } from "../../constants/scoring";

export function ScoringForm({ scores, setScores, comments, setComments, weightedScore, submitting }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-2xl">
          star
        </span>
        <div>
          <h2 className="text-2xl font-bold">评委评价与打分</h2>
          <p className="text-sm text-slate-400">
            请据演示内容进行多维度评估，系统将自动计算加权总分
          </p>
        </div>
      </div>

      {/* 评分维度 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SCORING_DIMENSIONS.map((dim) => (
          <div
            key={dim.key}
            className="p-5 rounded-xl bg-background-dark border border-primary/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary">
                {dim.icon}
              </span>
              <div className="flex-1">
                <h3 className="font-bold text-sm">{dim.label}</h3>
                <p className="text-xs text-slate-500">{dim.desc}</p>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {dim.weight}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={scores[dim.key]}
                onChange={(e) =>
                  setScores((prev) => ({
                    ...prev,
                    [dim.key]: parseFloat(e.target.value),
                  }))
                }
                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="text-2xl font-black text-primary w-12 text-right">
                {scores[dim.key]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 加权总分 */}
      <div className="p-6 bg-primary/10 rounded-xl border-2 border-primary/30 flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-slate-400 block mb-1">
            加权总分
          </span>
          <span className="text-xs text-slate-500">
            创新30% + 技术30% + 市场20% + 演示20%
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-black text-primary">
            {weightedScore}
          </span>
          <span className="text-slate-400">/ 10</span>
        </div>
      </div>

      {/* 评委意见 */}
      <div>
        <label className="block text-sm font-medium mb-2">
          评委意见（必填）
        </label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-background-dark border border-primary/20 text-slate-100 placeholder:text-slate-600 text-sm resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 outline-none"
          rows="5"
          placeholder="请输入对该项目的评价和建议..."
          required
        />
      </div>

      {/* 提交按钮 */}
      <button
        type="submit"
        disabled={submitting || !comments.trim()}
        className="w-full py-4 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-lg"
      >
        {submitting ? (
          <>
            <svg
              className="animate-spin size-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            提交中...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined">send</span>
            提交评分
          </>
        )}
      </button>
    </div>
  );
}
