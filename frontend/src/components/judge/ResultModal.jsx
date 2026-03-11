import { motion, AnimatePresence } from "framer-motion";

export function ResultModal({ show, type, title, message, onNext, onBack }) {
  if (!show) return null;

  const isSuccess = type === "success";
  const isApproved = type === "approved";
  const isRejected = type === "rejected";
  const iconName = isApproved ? "check_circle" : isRejected ? "cancel" : "star";
  const iconColor = isApproved
    ? "text-green-400"
    : isRejected
      ? "text-red-400"
      : "text-primary";
  const bgColor = isApproved
    ? "border-green-500/30"
    : isRejected
      ? "border-red-500/30"
      : "border-primary/30";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          className={`relative bg-background-dark border-2 ${bgColor} rounded-2xl p-10 flex flex-col items-center gap-6 shadow-2xl max-w-md w-full mx-4`}
        >
          <span className={`material-symbols-outlined text-7xl ${iconColor}`}>
            {iconName}
          </span>
          <div className="text-center">
            <h2 className="text-2xl font-black mb-2">{title}</h2>
            <p className="text-slate-400 text-sm">{message}</p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={onBack}
              className="flex-1 py-3 rounded-xl border border-primary/30 text-slate-300 font-bold hover:bg-primary/10 transition-all"
            >
              返回列表
            </button>
            {onNext && (
              <button
                onClick={onNext}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">
                  arrow_forward
                </span>
                下一个项目
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
