import { useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import LobsterLogo from '../components/LobsterLogo'

// Floating code symbols background
function FloatingSymbols() {
  const symbols = ['{', '}', '<>', '/>', '[]', '()', '=>', '**', '&&', '||', '++', '::']
  const items = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    symbol: symbols[i % symbols.length],
    left: `${(i * 5.5 + 2) % 95}%`,
    delay: `${(i * 1.3) % 12}s`,
    duration: `${12 + (i * 2.1) % 8}s`,
    size: i % 3 === 0 ? 'text-lg' : i % 3 === 1 ? 'text-sm' : 'text-xs',
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map((item) => (
        <div
          key={item.id}
          className={`absolute bottom-0 font-mono font-bold text-primary/20 select-none`}
          style={{
            left: item.left,
            animation: `float-symbol ${item.duration} linear ${item.delay} infinite`,
            fontSize: item.size === 'text-lg' ? '1.125rem' : item.size === 'text-sm' ? '0.875rem' : '0.75rem',
          }}
        >
          {item.symbol}
        </div>
      ))}
    </div>
  )
}

// 3D tilt card
function TiltCard({ role, onClick, index }) {
  const cardRef = useRef(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 30 })
  const glowX = useTransform(mouseX, [-0.5, 0.5], ['0%', '100%'])
  const glowY = useTransform(mouseY, [-0.5, 0.5], ['0%', '100%'])

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const isParticipant = role.id === 'participant'
  const accentColor = isParticipant ? 'rgba(255,88,51,' : 'rgba(96,165,250,'
  const cardClass = isParticipant ? 'role-card-gradient' : 'judge-card-gradient'
  const iconBg = isParticipant ? 'bg-primary/10 group-hover:bg-primary/20' : 'bg-blue-400/10 group-hover:bg-blue-400/20'
  const iconColor = isParticipant ? 'text-primary' : 'text-blue-400'
  const subtitleColor = isParticipant ? 'text-primary' : 'text-blue-400'
  const ctaColor = isParticipant ? 'text-primary' : 'text-blue-400'
  const dotColor = isParticipant ? 'bg-primary' : 'bg-blue-400'

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.4 + index * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1000 }}
    >
      <motion.div
        ref={cardRef}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className={`group relative cursor-pointer rounded-2xl p-8 lg:p-10 ${cardClass} backdrop-blur-sm overflow-hidden`}
      >
        {/* Mouse-follow glow */}
        <motion.div
          className="absolute w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${accentColor}0.12) 0%, transparent 70%)`,
            left: glowX,
            top: glowY,
            transform: 'translate(-50%, -50%)',
            filter: 'blur(20px)',
          }}
        />

        {/* Top accent line */}
        <div
          className={`absolute top-0 left-8 right-8 h-px`}
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}0.6), transparent)` }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Icon */}
          <div className={`size-16 rounded-2xl ${iconBg} flex items-center justify-center mb-6 transition-all duration-300 border border-current/10`}>
            <span className={`material-symbols-outlined text-4xl ${iconColor}`}>{role.icon}</span>
          </div>

          {/* Label */}
          <p className={`text-xs ${subtitleColor} font-bold uppercase tracking-[0.2em] mb-2`}>
            {role.subtitle}
          </p>

          {/* Title */}
          <h3 className="text-3xl font-black mb-4 text-white tracking-tight">{role.title}</h3>

          {/* Description */}
          <p className="text-slate-400 leading-relaxed text-sm mb-8">{role.description}</p>

          {/* Features */}
          <div className="space-y-2.5 mb-8">
            {role.features.map((f, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className={`size-1.5 rounded-full ${dotColor} flex-shrink-0`} />
                <span className="text-slate-400 text-xs">{f}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className={`flex items-center gap-2 ${ctaColor} font-bold text-sm`}>
            <span>立即进入</span>
            <motion.span
              className="material-symbols-outlined text-base"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              arrow_forward
            </motion.span>
          </div>
        </div>

        {/* Corner decoration */}
        <div
          className="absolute bottom-0 right-0 w-32 h-32 rounded-tl-full opacity-30 pointer-events-none"
          style={{ background: `radial-gradient(circle at bottom right, ${accentColor}0.2), transparent 70%)` }}
        />
      </motion.div>
    </motion.div>
  )
}

export default function RoleSelection() {
  const navigate = useNavigate()
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const roles = [
    {
      id: 'participant',
      title: '参赛者',
      subtitle: 'Participant',
      description: '上传项目资料、演示视频及链接，展示你的创意与技术实力，赢得评委青睐',
      icon: 'code_blocks',
      features: ['填写项目信息与团队资料', '上传 PDF 材料与演示视频', '提交 Demo 链接与代码仓库'],
      path: '/participant/register',
    },
    {
      id: 'judge',
      title: '评委',
      subtitle: 'Judge',
      description: '浏览所有参赛作品、在线预览资料，并对项目进行初筛与全维度评分',
      icon: 'balance',
      features: ['查看全部参赛项目详情', '在线评阅 PDF 与视频材料', '多维度评分并生成排行榜'],
      path: '/judge/login',
    },
  ]

  return (
    <div className="min-h-screen bg-[#0c0a09] font-display text-slate-100 relative overflow-hidden">

      {/* ── 背景层 ── */}
      {/* 动态渐变光晕 */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at ${20 + mousePos.x * 10}% ${20 + mousePos.y * 10}%, rgba(255,88,51,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 70% 50% at ${80 - mousePos.x * 10}% ${80 - mousePos.y * 10}%, rgba(255,88,51,0.05) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 50% 50%, rgba(255,88,51,0.03) 0%, transparent 50%)
          `,
          transition: 'background 0.5s ease',
        }}
      />

      {/* 点阵网格 */}
      <div className="fixed inset-0 dot-grid opacity-100 pointer-events-none" />

      {/* 顶部光带 */}
      <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none" />

      {/* 浮动代码符号 */}
      <FloatingSymbols />

      {/* 大型背景光球 */}
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-[100px] pointer-events-none animate-blob-1" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-[80px] pointer-events-none animate-blob-2" />
      <div className="fixed top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-blue-500/[0.03] blur-[60px] pointer-events-none animate-blob-3" />

      {/* ── 导航 ── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-20 border-b border-white/[0.06] backdrop-blur-md bg-black/20">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div className="size-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
            <LobsterLogo size={22} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            OpenClaw <span className="text-primary">虾王争霸赛</span>
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 text-xs text-slate-500"
        >
          <span className="hidden sm:inline">由</span>
          <span className="hidden sm:inline text-slate-400 font-medium">中关村综合产业创新研究院</span>
          <span className="hidden sm:inline">主办</span>
        </motion.div>
      </header>

      {/* ── 主体内容 ── */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-73px)] px-6 py-16">

        {/* 标题区 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16 max-w-3xl"
        >
          {/* Logo 圆环 */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.6, type: 'spring', bounce: 0.3 }}
            className="inline-flex items-center justify-center mb-8"
          >
            <div className="relative">
              {/* 外圈脉冲 */}
              <div className="absolute inset-0 rounded-full bg-primary/10 scale-[1.8] animate-pulse-ring" />
              <div className="absolute inset-0 rounded-full bg-primary/15 scale-[1.4] animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
              {/* 主圆 */}
              <div className="relative size-24 bg-primary/10 rounded-full border border-primary/25 flex items-center justify-center backdrop-blur-sm shadow-[0_0_40px_rgba(255,88,51,0.2)]">
                <LobsterLogo size={52} className="text-primary" />
              </div>
            </div>
          </motion.div>

          {/* 标签 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest mb-6"
          >
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Hackathon 2026
          </motion.div>

          {/* 主标题 */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight mb-5 leading-[1.05]">
            <span className="text-white">欢迎来到</span>
            <br />
            <span className="text-gradient-primary">OpenClaw</span>
          </h1>

          {/* 副标题 */}
          <p className="text-lg text-slate-400 leading-relaxed max-w-xl mx-auto">
            龙虾黑客松大赛 · 创新无界，代码有力
          </p>
        </motion.div>

        {/* 角色卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl w-full">
          {roles.map((role, i) => (
            <TiltCard
              key={role.id}
              role={role}
              index={i}
              onClick={() => navigate(role.path)}
            />
          ))}
        </div>

        {/* 状态徽章 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.5 }}
          className="mt-12 flex items-center gap-6"
        >
          <div className="flex items-center gap-2 px-5 py-2.5 bg-primary/8 rounded-full border border-primary/15 backdrop-blur-sm">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-primary" />
            </span>
            <span className="text-sm text-primary font-medium">报名通道开放中</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-slate-600 text-sm">
            <span className="material-symbols-outlined text-base">schedule</span>
            <span>距截止还有 14 天</span>
          </div>
        </motion.div>

        {/* 装饰数字 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mt-16 flex items-center gap-12 text-center"
        >
          {[
            { num: '120+', label: '注册参赛者' },
            { num: '48h', label: '大赛时长' },
            { num: '¥50K', label: '奖金池' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-2xl font-black text-white/80">{stat.num}</span>
              <span className="text-xs text-slate-600 mt-1">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </main>

      {/* ── 页脚 ── */}
      <footer className="relative z-10 border-t border-white/[0.05] py-5 px-6 text-center">
        <p className="text-slate-700 text-xs">
          © 2026 OpenClaw 龙虾黑客松大赛组委会 · 中关村综合产业创新研究院 · 保留所有权利
        </p>
      </footer>
    </div>
  )
}
