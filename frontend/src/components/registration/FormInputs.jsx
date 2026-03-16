import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// URL 问题分类
const BLOCKED_PATTERNS = [
  {
    pattern: /github\.com\/[^/]+\/[^/]+\/(blob|tree)\//,
    message:
      "GitHub 文件预览页无法直接访问 ——请改用仓库主页链接（去掉 /blob/... 部分），或确认仓库已设为 Public",
  },
];

const WARNING_PATTERNS = [
  {
    pattern: /feishu\.cn|larksuite\.com/,
    message:
      "飞书文档请确保已开启「互联网上获得链接的人可查看」，否则评委将无法打开",
  },
  {
    pattern: /alidocs\.dingtalk\.com|ding\.ding/,
    message:
      "钉钉文档请确保已开启「所有人可查看」分享权限，否则评委将无法打开",
  },
  {
    pattern: /notion\.so/,
    message: "Notion 页面请确保已在 Share 设置中开启「Share to web」",
  },
  {
    pattern: /docs\.qq\.com/,
    message: "腾讯文档请确保已设置为「任何人可查看」",
  },
  {
    pattern: /drive\.google\.com/,
    message: "Google Drive 请确保共享设置为「任何知道链接的人均可查看」",
  },
];

function checkUrl(url) {
  if (!url) return null;
  try {
    new URL(url);
  } catch {
    return { level: "error", message: "链接格式不正确，请输入完整 URL（以 http:// 或 https:// 开头）" };
  }
  for (const { pattern, message } of BLOCKED_PATTERNS) {
    if (pattern.test(url)) return { level: "error", message };
  }
  for (const { pattern, message } of WARNING_PATTERNS) {
    if (pattern.test(url)) return { level: "warning", message };
  }
  return null;
}

export function AssetUrlRow({
  badge,
  badgeColor,
  placeholder,
  optional,
  value,
  onChange,
}) {
  const [hint, setHint] = useState(null);

  const handleBlur = useCallback(() => {
    setHint(checkUrl(value));
  }, [value]);

  return (
    <div className="space-y-1">
      <div
        className={`flex items-center gap-0 rounded-lg border-2 transition-colors overflow-hidden bg-[rgba(255,255,255,0.02)]
          ${hint?.level === "error" ? "border-red-500/60" : hint?.level === "warning" ? "border-amber-400/50" : "border-[rgba(100,80,75,0.4)] focus-within:border-primary/50"}`}
      >
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
          onChange={(e) => { onChange(e.target.value); setHint(null); }}
          onBlur={handleBlur}
          required={!optional}
        />
        {value && !hint && (
          <span className="flex-shrink-0 size-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50 mr-3" />
        )}
        {value && hint?.level === "error" && (
          <span className="flex-shrink-0 size-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50 mr-3" />
        )}
        {value && hint?.level === "warning" && (
          <span className="flex-shrink-0 size-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50 mr-3" />
        )}
        {optional && !value && (
          <span className="flex-shrink-0 font-mono text-[10px] text-slate-500 mr-3 tracking-wide hidden sm:block">
            opt
          </span>
        )}
      </div>
      <AnimatePresence>
        {hint && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={`text-[11px] font-mono px-1 flex items-start gap-1.5 leading-relaxed
              ${hint.level === "error" ? "text-red-400" : "text-amber-400"}`}
          >
            <span className="mt-0.5 shrink-0">{hint.level === "error" ? "✗" : "⚠"}</span>
            {hint.message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TerminalInput({ prefix, placeholder, value, onChange, required }) {
  const [hint, setHint] = useState(null);

  const handleBlur = useCallback(() => {
    setHint(checkUrl(value));
  }, [value]);

  return (
    <div className="space-y-1">
      <div
        className={`flex items-center gap-0 rounded-lg border-2 transition-colors overflow-hidden bg-[rgba(255,255,255,0.02)]
          ${hint?.level === "error" ? "border-red-500/60" : hint?.level === "warning" ? "border-amber-400/50" : "border-[rgba(100,80,75,0.4)] focus-within:border-primary/50"}`}
      >
        <span className="font-mono text-xs text-slate-400 px-3 py-3 bg-surface-dark/60 border-r-2 border-[rgba(100,80,75,0.4)] flex-shrink-0 select-none font-semibold">
          {prefix}
        </span>
        <input
          className="bg-transparent border-none focus:ring-0 text-slate-200 flex-1 placeholder:text-slate-500 text-sm font-mono px-3 py-3 min-w-0"
          placeholder={placeholder}
          type="url"
          value={value}
          onChange={(e) => { onChange(e.target.value); setHint(null); }}
          onBlur={handleBlur}
          required={required}
        />
      </div>
      <AnimatePresence>
        {hint && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={`text-[11px] font-mono px-1 flex items-start gap-1.5 leading-relaxed
              ${hint.level === "error" ? "text-red-400" : "text-amber-400"}`}
          >
            <span className="mt-0.5 shrink-0">{hint.level === "error" ? "✗" : "⚠"}</span>
            {hint.message}
          </motion.p>
        )}
      </AnimatePresence>
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
