import { useEffect, useState } from 'react'
import { AlertTriangle, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../../lib/api'

export default function AtRiskTeams() {
  const [teams, setTeams] = useState<any[]>([])
  useEffect(() => { api.get('/admin/at-risk-teams').then(r => setTeams(r.data)).catch(() => {}) }, [])
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2"><AlertTriangle className="text-amber-400" size={24} /> At-Risk Teams</h1>
      <p className="text-white/50 text-sm">Teams flagged by the nightly detection cron (no activity for 7+ days)</p>
      {teams.length === 0 ? (
        <div className="glass-card p-10 text-center text-white/40">🎉 No at-risk teams right now!</div>
      ) : teams.map((t, i) => (
        <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}
          className="glass-card p-5 border border-amber-500/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-white">{t.teamName}</div>
              <div className="text-sm text-white/50">{t.project?.title}</div>
            </div>
            <span className="badge badge-danger">⚠️ At Risk</span>
          </div>
          <p className="text-xs text-white/40 mt-2">Last active: {t.lastActivityAt ? new Date(t.lastActivityAt).toLocaleString() : 'Unknown'}</p>
        </motion.div>
      ))}
    </div>
  )
}
