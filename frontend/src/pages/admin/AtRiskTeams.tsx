import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../../lib/api'

export default function AtRiskTeams() {
  const [teams, setTeams] = useState<any[]>([])
  useEffect(() => { api.get('/admin/at-risk-teams').then(r => setTeams(r.data)).catch(() => {}) }, [])
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><AlertTriangle className="text-amber-500" size={24} /> At-Risk Teams</h1>
        <p className="text-slate-500 text-sm mt-1">Teams flagged by the nightly detection cron (no activity for 7+ days)</p>
      </div>
      {teams.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">🎉 No at-risk teams right now!</div>
      ) : teams.map((t, i) => (
        <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}
          className="card p-5 border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-800">{t.teamName}</div>
              <div className="text-sm text-slate-500 mt-0.5">{t.project?.title}</div>
            </div>
            <span className="badge badge-danger">⚠️ At Risk</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Last active: {t.lastActivityAt ? new Date(t.lastActivityAt).toLocaleString() : 'Unknown'}</p>
        </motion.div>
      ))}
    </div>
  )
}
