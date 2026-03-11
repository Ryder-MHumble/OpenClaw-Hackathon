export function PreliminaryReview({ comments, setComments, onSubmit, submitting }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-2xl">
          rate_review
        </span>
        <div>
          <h2 className="text-2xl font-bold">初筛评审</h2>
          <p className="text-sm text-slate-400">
            请根据项目材料判断是否通过初筛
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => onSubmit("approved")}
          disabled={submitting}
          className="py-6 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 text-lg"
        >
          <span className="material-symbols-outlined text-2xl">
            check_circle
          </span>
          通过初筛（进入评审）
        </button>

        <button
          onClick={() => onSubmit("rejected")}
          disabled={submitting}
          className="py-6 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 text-lg"
        >
          <span className="material-symbols-outlined text-2xl">
            cancel
          </span>
          不通过（淘汰）
        </button>
      </div>

      <div className="pt-4 border-t border-white/10">
        <label className="block text-sm font-medium mb-2">
          备注（可选）
        </label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-background-dark border border-primary/20 text-slate-100 placeholder:text-slate-600 text-sm resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 outline-none"
          rows="4"
          placeholder="记录初筛意见..."
        />
      </div>
    </div>
  );
}
