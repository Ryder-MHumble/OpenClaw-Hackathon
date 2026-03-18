import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import apiClient from "../../config/apiClient";
import { API_BASE_URL } from "../../config/api";

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
    message: "钉钉文档请确保已开启「所有人可查看」分享权限，否则评委将无法打开",
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
    return {
      level: "error",
      message: "链接格式不正确，请输入完整 URL（以 http:// 或 https:// 开头）",
    };
  }
  for (const { pattern, message } of BLOCKED_PATTERNS) {
    if (pattern.test(url)) return { level: "error", message };
  }
  for (const { pattern, message } of WARNING_PATTERNS) {
    if (pattern.test(url)) return { level: "warning", message };
  }
  return null;
}

// 检测 URL 类型
function detectUrlType(url) {
  if (!url) return null;

  // 图片
  if (
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url) ||
    /imgur\.com|imgbb\.com|postimg\.cc/i.test(url)
  ) {
    return "image";
  }

  // 视频
  if (/youtube\.com|youtu\.be|bilibili\.com|vimeo\.com/i.test(url)) {
    return "video";
  }

  // PDF/文档
  if (
    /\.(pdf)$/i.test(url) ||
    /drive\.google\.com|docs\.google\.com|feishu\.cn|notion\.so|docs\.qq\.com/i.test(
      url,
    )
  ) {
    return "document";
  }

  return "link";
}

// 获取视频嵌入 URL
function getVideoEmbedUrl(url) {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Bilibili
  const bvMatch = url.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
  if (bvMatch)
    return `https://player.bilibili.com/player.html?bvid=${bvMatch[1]}`;

  return null;
}

export function AssetUrlRow({
  badge,
  badgeColor,
  placeholder,
  optional,
  value,
  onChange,
  onValidationChange,
}) {
  const [hint, setHint] = useState(null);
  const [checking, setChecking] = useState(false);
  const [accessible, setAccessible] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const urlType = detectUrlType(value);

  // 自动展开预览：当 URL 有效且验证通过时
  useEffect(() => {
    if (value && accessible === true && !hint) {
      setShowPreview(true);
    } else if (!value) {
      setShowPreview(false);
    }
  }, [value, accessible, hint]);

  const checkAccessibility = useCallback(async (url) => {
    if (!url) return;

    setChecking(true);
    try {
      const response = await apiClient.post("/api/participants/check-url", {
        url,
      });
      const result = response.data;

      if (result.accessible) {
        setAccessible(true);
        setHint(null);
      } else {
        setAccessible(false);
        setHint({
          level: "error",
          message: result.error || "链接无法访问，请检查权限设置或链接是否有效",
        });
      }
    } catch (error) {
      // 如果后端检查失败，只做前端校验
      const localCheck = checkUrl(url);
      setHint(localCheck);
      setAccessible(localCheck?.level !== "error");
    } finally {
      setChecking(false);
    }
  }, []);

  const handleBlur = useCallback(() => {
    const localCheck = checkUrl(value);
    setHint(localCheck);

    // 如果前端校验通过，再做后端可访问性检查
    if (!localCheck || localCheck.level !== "error") {
      checkAccessibility(value);
    }
  }, [value, checkAccessibility]);

  useEffect(() => {
    // 通知父组件验证状态
    if (onValidationChange) {
      const hasError = hint?.level === "error" || accessible === false;
      onValidationChange(!hasError);
    }
  }, [hint, accessible, onValidationChange]);

  return (
    <div className="space-y-2">
      <div
        className={`flex items-center gap-0 rounded-lg border-2 transition-colors overflow-hidden bg-[rgba(255,255,255,0.02)]
          ${hint?.level === "error" || accessible === false ? "border-red-500/60" : hint?.level === "warning" ? "border-amber-400/50" : "border-[rgba(100,80,75,0.4)] focus-within:border-primary/50"}`}
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
          onChange={(e) => {
            onChange(e.target.value);
            setHint(null);
            setAccessible(null);
          }}
          onBlur={handleBlur}
          required={!optional}
        />

        {/* 状态指示器 */}
        {checking && (
          <Loader2 className="size-4 text-slate-400 animate-spin mr-3 flex-shrink-0" />
        )}
        {!checking && value && accessible === true && !hint && (
          <CheckCircle className="size-4 text-green-500 mr-3 flex-shrink-0" />
        )}
        {!checking &&
          value &&
          (hint?.level === "error" || accessible === false) && (
            <XCircle className="size-4 text-red-500 mr-3 flex-shrink-0" />
          )}
        {!checking &&
          value &&
          hint?.level === "warning" &&
          accessible !== false && (
            <AlertTriangle className="size-4 text-amber-400 mr-3 flex-shrink-0" />
          )}

        {/* 预览按钮 */}
        {value && urlType && accessible !== false && (
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex-shrink-0 p-2 hover:bg-white/5 transition-colors mr-1"
            title={showPreview ? "收起预览" : "展开预览"}
          >
            {showPreview ? (
              <EyeOff className="size-4 text-slate-400" />
            ) : (
              <Eye className="size-4 text-slate-400" />
            )}
          </button>
        )}

        {optional && !value && (
          <span className="flex-shrink-0 font-mono text-[10px] text-slate-500 mr-3 tracking-wide hidden sm:block">
            opt
          </span>
        )}
      </div>

      {/* 错误/警告提示 */}
      <AnimatePresence>
        {hint && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={`text-[11px] font-mono px-1 flex items-start gap-1.5 leading-relaxed
              ${hint.level === "error" ? "text-red-400" : "text-amber-400"}`}
          >
            <span className="mt-0.5 shrink-0">
              {hint.level === "error" ? "✗" : "⚠"}
            </span>
            {hint.message}
          </motion.p>
        )}
      </AnimatePresence>

      {/* 预览区域 */}
      <AnimatePresence>
        {showPreview && value && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/[0.02]">
                <span className="text-xs text-slate-400 font-mono">预览</span>
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="size-3" />
                  <span className="hidden sm:inline">在新窗口打开</span>
                  <span className="sm:hidden">打开</span>
                </a>
              </div>

              <div
                className="relative bg-black/5"
                style={{ minHeight: "200px", maxHeight: "600px" }}
              >
                {urlType === "image" && (
                  <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
                    <img
                      src={`${API_BASE_URL}/api/proxy-image?url=${encodeURIComponent(value)}`}
                      alt="预览"
                      className="max-w-full max-h-[300px] sm:max-h-[500px] object-contain rounded"
                      onError={(e) => {
                        // 代理失败，尝试直接加载
                        if (e.target.src.includes("/api/proxy-image")) {
                          e.target.src = value;
                        } else {
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML = `
                            <div class="text-center py-8 sm:py-12 text-red-400 px-4">
                              <p class="text-sm mb-2">⚠️ 图片加载失败</p>
                              <p class="text-xs text-slate-500">请检查链接是否正确或权限设置</p>
                            </div>
                          `;
                        }
                      }}
                    />
                  </div>
                )}

                {urlType === "video" && getVideoEmbedUrl(value) && (
                  <div
                    className="w-full aspect-video sm:aspect-video"
                    style={{ maxHeight: "400px" }}
                  >
                    <iframe
                      src={getVideoEmbedUrl(value)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="视频预览"
                    />
                  </div>
                )}

                {urlType === "document" && (
                  <div
                    className="w-full"
                    style={{ height: "400px", maxHeight: "70vh" }}
                  >
                    <iframe
                      src={value}
                      className="w-full h-full"
                      title="文档预览"
                      onError={(e) => {
                        e.target.style.display = "none";
                        const fallback = document.createElement("div");
                        fallback.className =
                          "flex flex-col items-center justify-center h-full text-slate-400 px-4";
                        fallback.innerHTML = `
                          <p class="text-sm mb-2">📄 文档链接</p>
                          <p class="text-xs text-slate-500 mb-4 text-center">无法在此处预览，请点击上方"打开"按钮查看</p>
                        `;
                        e.target.parentElement.appendChild(fallback);
                      }}
                    />
                  </div>
                )}

                {urlType === "link" && (
                  <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-slate-400 px-4">
                    <p className="text-sm mb-2">🔗 外部链接</p>
                    <p className="text-xs text-slate-500 break-all text-center max-w-full sm:max-w-2xl">
                      {value}
                    </p>
                    <p className="text-xs text-slate-600 mt-3">
                      点击上方"打开"按钮访问
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TerminalInput({
  prefix,
  placeholder,
  value,
  onChange,
  required,
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
        <span className="font-mono text-xs text-slate-400 px-3 py-3 bg-surface-dark/60 border-r-2 border-[rgba(100,80,75,0.4)] flex-shrink-0 select-none font-semibold">
          {prefix}
        </span>
        <input
          className="bg-transparent border-none focus:ring-0 text-slate-200 flex-1 placeholder:text-slate-500 text-sm font-mono px-3 py-3 min-w-0"
          placeholder={placeholder}
          type="url"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setHint(null);
          }}
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
            <span className="mt-0.5 shrink-0">
              {hint.level === "error" ? "✗" : "⚠"}
            </span>
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
