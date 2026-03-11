import { motion, AnimatePresence } from "framer-motion";

export function AssetUrlRow({
  badge,
  badgeColor,
  placeholder,
  optional,
  value,
  onChange,
}) {
  return (
    <div className="flex items-center gap-0 rounded-lg border-2 border-[rgba(100,80,75,0.4)] focus-within:border-primary/50 transition-colors overflow-hidden bg-[rgba(255,255,255,0.02)]">
      <span
        className={`font-mono text-xs font-bold px-3 py-3 border-r-2 border-[rgba(100,80,75,0.4)] flex-shrink-0 tracking-widest ${badgeColor}`}
      >
        {badge}
      </span>
      <input
        className="bg-transparent border-none focus:ring-0 text-slate-200 flex-1 placeholder:text-slate-500 text-sm font-mono px-3 py-3 min-w-0"
        placeholder={placeholder}
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={!optional}
      />
      {value && (
        <span className="flex-shrink-0 size-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50 mr-3" />
      )}
      {optional && !value && (
        <span className="flex-shrink-0 font-mono text-[10px] text-slate-500 mr-3 tracking-wide hidden sm:block">
          opt
        </span>
      )}
    </div>
  );
}

export function TerminalInput({ prefix, placeholder, value, onChange, required }) {
  return (
    <div className="flex items-center gap-0 rounded-lg border-2 border-[rgba(100,80,75,0.4)] focus-within:border-primary/50 transition-colors overflow-hidden bg-[rgba(255,255,255,0.02)]">
      <span className="font-mono text-xs text-slate-400 px-3 py-3 bg-surface-dark/60 border-r-2 border-[rgba(100,80,75,0.4)] flex-shrink-0 select-none font-semibold">
        {prefix}
      </span>
      <input
        className="bg-transparent border-none focus:ring-0 text-slate-200 flex-1 placeholder:text-slate-500 text-sm font-mono px-3 py-3 min-w-0"
        placeholder={placeholder}
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}

export function PanelHeader({ label, ready }) {
  return (
    <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4 border-b border-border-dark bg-surface-dark/50">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex gap-1 sm:gap-1.5">
          <span className="size-2 sm:size-2.5 rounded-full bg-slate-600/80" />
          <span className="size-2 sm:size-2.5 rounded-full bg-slate-600/80" />
          <span className="size-2 sm:size-2.5 rounded-full bg-slate-600/80" />
        </div>
        <span className="font-mono text-[10px] sm:text-xs text-slate-400 tracking-widest select-none font-semibold">
          // {label}
        </span>
      </div>
      <AnimatePresence>
        {ready && (
          <motion.span
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            className="font-mono text-[10px] sm:text-xs text-green-500 tracking-widest font-bold"
          >
            ✓ READY
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MonoField({ label, required, children }) {
  return (
    <div className="space-y-2">
      <label className="font-mono text-[10px] sm:text-xs text-slate-400 tracking-widest uppercase block font-semibold">
        {label}
        {required && <span className="text-primary ml-1.5">*</span>}
      </label>
      {children}
    </div>
  );
}
