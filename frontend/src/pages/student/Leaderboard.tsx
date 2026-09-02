import { useEffect, useState } from 'react'
import { Trophy, Medal, Crown } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../../lib/api'

export default function Leaderboard() {
  const [teams, setTeams] = useState<any[]>([])

  useEffect(() => { api.get('/teams/leaderboard').then(r => setTeams(r.data)).catch(() => {}) }, [])

  const rankIcons = [
    <Crown size={20} className="text-amber-400" />,
    <Medal size={20} className="text-slate-300" />,
    <Medal size={20} className="text-amber-600" />,
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Trophy className="text-amber-500" size={24} /> Leaderboard
        </h1>
        <p className="text-slate-500 text-sm">Teams ranked by total gamification points</p>
      </div>

      <div className="space-y-3">
        {teams.map((team, i) => (
          <motion.div key={team.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`card p-4 flex items-center gap-4 ${i === 0 ? 'border-amber-300 bg-amber-50/20' : ''}`}>
            <div className="w-8 flex-shrink-0 flex items-center justify-center">
              {rankIcons[i] || <span className="text-slate-400 font-bold text-sm">#{i + 1}</span>}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-slate-800">{team.teamName}</div>
              <div className="text-xs text-slate-500">{team.project?.title} · {team.status}</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-primary-600">{team.totalScore}</div>
              <div className="text-xs text-slate-400">points</div>
            </div>
          </motion.div>
        ))}
        {teams.length === 0 && (
          <div className="card p-8 text-center text-slate-400">No teams on the board yet.</div>
        )}
      </div>
    </div>
  )
}
