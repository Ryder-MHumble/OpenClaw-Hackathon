import { motion } from "framer-motion";

export function Step3Submit({
  selectedTrack,
  agreed,
  setAgreed,
  setTermsOpen,
  submitting,
  submitError,
  navigate
}) {
  return (
    <>
      {/* Error message */}
      {submitError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium"
        >
          {submitError}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4 px-1 sm:px-2"
      >
        {/* Selected track summary */}
        {selectedTrack && (
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl ${selectedTrack.bg} border ${selectedTrack.border}`}
          >
            <span className="text-xl">{selectedTrack.emoji}</span>
            <div>
              <p className={`text-xs font-bold ${selectedTrack.color}`}>
                {selectedTrack.title}
              </p>
              <p className="text-xs text-slate-500">
                {selectedTrack.subtitle}
              </p>
            </div>
          </div>
        )}

        {/* Agreement - Enhanced visibility */}
        <div className="glass-panel rounded-2xl overflow-hidden border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
          <div className="p-5 sm:p-6 space-y-4">
            {/* Warning banner */}
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-500/40">
              <div className="flex-1">
                <p className="text-amber-200 text-sm font-bold mb-1">
                  安全与责任使用声明
                </p>
                <p className="text-amber-300/80 text-xs leading-relaxed">
                  参赛作品须严格遵守安全原则，组委会保留取消违规作品参赛资格的权利
                </p>
              </div>
            </div>

            {/* Agreement checkbox */}
            <label className="flex items-start gap-3 sm:gap-4 cursor-pointer group">
              <div className="mt-0.5 sm:mt-1 flex-shrink-0">
                <input
                  type="checkbox"
                  required
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="size-4 sm:size-5 rounded-md bg-surface-dark border-2 border-amber-500/50 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-dark transition-all"
                />
              </div>
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  我已阅读并同意{" "}
                  <button
                    type="button"
                    className="inline-flex items-center gap-0.5 sm:gap-1 text-primary hover:text-primary/80 font-bold underline decoration-2 underline-offset-2 transition-colors"
                    onClick={() => setTermsOpen(true)}
                  >
                    《参赛协议 & 安全声明》
                  </button>
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1.5 sm:mt-2 leading-relaxed">
                  承诺遵守数据安全、合规使用、透明可控、知识产权保护等原则，并授权组委会展示本项目参赛资料
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Submit buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full pt-2">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="order-2 sm:order-1 flex-shrink-0 px-5 sm:px-8 py-3 sm:py-4 border-2 border-slate-600 rounded-xl text-slate-300 font-bold hover:bg-slate-800 hover:border-slate-500 transition-all text-xs sm:text-sm"
          >
            返回首页
          </button>
          <motion.button
            type="submit"
            disabled={submitting || !agreed}
            whileHover={!submitting && agreed ? { scale: 1.02 } : {}}
            whileTap={!submitting && agreed ? { scale: 0.97 } : {}}
            className="order-1 sm:order-2 flex-1 relative py-4 sm:py-5 bg-primary text-white font-black rounded-xl
              uppercase tracking-wider text-sm sm:text-base transition-all overflow-hidden
              disabled:opacity-40 disabled:cursor-not-allowed
              shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40"
            style={{
              background:
                agreed && !submitting
                  ? "linear-gradient(135deg, #ff5833 0%, #ff7849 100%)"
                  : undefined,
            }}
          >
            {/* Shimmer effect when enabled */}
            {agreed && !submitting && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)",
                }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              />
            )}
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
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
                提交中…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2 relative z-10">
                提交参赛作品
              </span>
            )}
          </motion.button>
        </div>

        {/* Helper text */}
        {!agreed && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-amber-400/80 text-center"
          >
            请先勾选同意参赛协议
          </motion.p>
        )}
      </motion.div>
    </>
  );
}
