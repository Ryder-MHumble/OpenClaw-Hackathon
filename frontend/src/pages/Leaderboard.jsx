import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get('/api/judges/leaderboard')
      setLeaderboard(response.data.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const getPodiumPosition = (index) => {
    const positions = {
      0: { color: 'bg-primary', height: 'h-64', ring: 'ring-primary/40', icon: '🏆' },
      1: { color: 'bg-slate-400', height: 'h-48', ring: 'ring-slate-400/40', icon: '🥈' },
      2: { color: 'bg-amber-700', height: 'h-36', ring: 'ring-amber-700/40', icon: '🥉' }
    }
    return positions[index]
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark text-slate-100">
      <header className="flex items-center justify-between border-b border-primary/20 px-6 md:px-20 py-4 bg-background-dark/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4 text-primary">
          <div className="size-8">
            <span className="material-symbols-outlined text-3xl">pets</span>
          </div>
          <h2 className="text-xl font-bold">OpenClaw <span className="text-primary">Hackathon</span></h2>
        </div>
        <div className="flex gap-4">
          <button onClick={() => navigate('/judge/dashboard')} className="text-slate-400 hover:text-primary text-sm font-medium">控制面板</button>
          <button onClick={() => fetchLeaderboard()} className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-primary/30 text-primary font-bold hover:bg-primary/10">
            <span className="material-symbols-outlined">refresh</span> 刷新
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs font-bold uppercase">Internal Only</span>
              <h1 className="text-4xl font-black">评审实时排行榜</h1>
            </div>
            <p className="text-slate-400 text-lg">共 {leaderboard.length} 支参赛团队</p>
          </div>
        </div>

        {/* Podium */}
        {leaderboard.length >= 3 && (
          <div className="relative w-full mb-20 pt-20">
            <div className="flex justify-center items-end gap-4 md:gap-12 relative z-10">
              {[1, 0, 2].map((idx) => {
                const team = leaderboard[idx]
                const pos = getPodiumPosition(idx)
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.2 }}
                    className="flex flex-col items-center group w-32 md:w-48"
                  >
                    <div className="mb-4 text-center">
                      <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-${pos.color} bg-slate-800 flex items-center justify-center overflow-hidden mb-2 mx-auto shadow-[0_0_30px_rgba(255,88,51,0.4)]`}>
                        <span className="text-4xl">{pos.icon}</span>
                      </div>
                      <p className="text-slate-300 font-bold text-sm md:text-base">{team.team_name}</p>
                      <p className="text-primary text-xl md:text-2xl font-black">{team.weighted_score}</p>
                    </div>
                    <div className={`w-full ${pos.height} bg-gradient-to-b from-${pos.color}/60 to-${pos.color}/20 rounded-t-xl flex items-center justify-center relative overflow-hidden`}>
                      <span className="text-5xl md:text-7xl font-black text-white/20">{idx + 1}</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-slate-900/40 border border-primary/10 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 border-b border-primary/10 bg-primary/5">
            <h3 className="text-xl font-bold">全队排名详情</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-primary/5 text-slate-400 text-xs uppercase tracking-wider font-bold">
                  <th className="px-6 py-4">排名</th>
                  <th className="px-6 py-4">团队名称</th>
                  <th className="px-6 py-4">参赛作品</th>
                  <th className="px-6 py-4 text-center">创新性 (30%)</th>
                  <th className="px-6 py-4 text-center">技术难度 (30%)</th>
                  <th className="px-6 py-4 text-center">应用前景 (20%)</th>
                  <th className="px-6 py-4 text-center">路演表现 (20%)</th>
                  <th className="px-6 py-4 text-right">加权总分</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {leaderboard.map((team, index) => (
                  <motion.tr
                    key={team.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-primary/5 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <span className={`flex items-center justify-center w-8 h-8 rounded-full ${index < 3 ? 'bg-primary text-white' : 'border border-slate-700 text-slate-400'} font-bold text-sm`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-bold text-white">{team.team_name}</td>
                    <td className="px-6 py-5 text-slate-400">{team.project_title}</td>
                    <td className="px-6 py-5 text-center font-medium">{team.innovation}</td>
                    <td className="px-6 py-5 text-center font-medium">{team.technical}</td>
                    <td className="px-6 py-5 text-center font-medium">{team.market}</td>
                    <td className="px-6 py-5 text-center font-medium">{team.demo}</td>
                    <td className="px-6 py-5 text-right font-black text-primary text-lg">{team.weighted_score}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="mt-12 py-8 border-t border-primary/10 text-center">
          <p className="text-slate-500 text-sm">© 2024 OpenClaw Hackathon Judge Dashboard</p>
        </footer>
      </main>
    </div>
  )
}
