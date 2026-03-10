/**
 * LobsterLogo — 矢量龙虾图标
 * size: px 值，默认 32
 * className: 额外 class（可传颜色）
 */
export default function LobsterLogo({ size = 32, className = 'text-primary' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="OpenClaw 龙虾 Logo"
    >
      {/* ── 身体（椭圆形节段） ── */}
      <ellipse cx="32" cy="34" rx="9" ry="14" fill="currentColor" opacity="0.95" />

      {/* 尾扇 */}
      <path d="M23 46 Q18 56 12 58 Q16 50 23 48Z" fill="currentColor" opacity="0.85" />
      <path d="M41 46 Q46 56 52 58 Q48 50 41 48Z" fill="currentColor" opacity="0.85" />
      <path d="M27 47 Q25 57 21 60 Q24 52 27 49Z" fill="currentColor" opacity="0.9" />
      <path d="M37 47 Q39 57 43 60 Q40 52 37 49Z" fill="currentColor" opacity="0.9" />
      <path d="M32 48 L32 62" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

      {/* 头胸甲 */}
      <ellipse cx="32" cy="26" rx="10" ry="9" fill="currentColor" />

      {/* 眼睛 */}
      <circle cx="27.5" cy="21.5" r="2.5" fill="currentColor" />
      <circle cx="36.5" cy="21.5" r="2.5" fill="currentColor" />
      <circle cx="27.5" cy="21.5" r="1.1" fill="#1a0a06" />
      <circle cx="36.5" cy="21.5" r="1.1" fill="#1a0a06" />

      {/* 触角 */}
      <path d="M27 20 Q20 14 14 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M37 20 Q44 14 50 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M27 21 Q22 18 18 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <path d="M37 21 Q42 18 46 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

      {/* 左大螯 */}
      <path
        d="M22 28 Q12 24 8 18 Q6 14 10 12 Q14 10 17 14 Q18 16 22 18"
        stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none"
      />
      {/* 螯钳 */}
      <path d="M10 12 Q6 8 8 4 Q12 6 12 10Z" fill="currentColor" />
      <path d="M10 12 Q4 12 4 16 Q8 16 10 13Z" fill="currentColor" />

      {/* 右大螯 */}
      <path
        d="M42 28 Q52 24 56 18 Q58 14 54 12 Q50 10 47 14 Q46 16 42 18"
        stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none"
      />
      {/* 螯钳 */}
      <path d="M54 12 Q58 8 56 4 Q52 6 52 10Z" fill="currentColor" />
      <path d="M54 12 Q60 12 60 16 Q56 16 54 13Z" fill="currentColor" />

      {/* 步足（左） */}
      <path d="M23 30 Q16 28 13 32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M23 33 Q15 32 12 36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M23 36 Q16 36 14 40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />

      {/* 步足（右） */}
      <path d="M41 30 Q48 28 51 32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M41 33 Q49 32 52 36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M41 36 Q48 36 50 40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
