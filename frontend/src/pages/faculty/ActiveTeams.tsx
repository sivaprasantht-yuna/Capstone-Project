import { useEffect, useState } from 'react'
import { Users, CheckCircle, AlertTriangle } from 'lucide-react'
import api from '../../lib/api'

export default function ActiveTeams() {
  const [teams, setTeams] = useState<any[]>([])

  useEffect(() => {
    api.get('/mentorships/active').then(r => {
      setTeams(r.data.map((m: any) => ({ ...m.team, mentor: m })))
    })
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Users className="text-emerald-400" size={24} /> Active Teams</h1>
      <div className="space-y-4">
        {teams.map(team => (
          <div key={team.id} className="glass-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-white">{team.teamName}</div>
                <div className="text-sm text-white/50 mt-0.5">{team.project?.title}</div>
              </div>
              <span className={`badge ${team.isAtRisk ? 'badge-danger' : 'badge-accent'}`}>
                {team.isAtRisk ? <><AlertTriangle size={10} /> At Risk</> : <><CheckCircle size={10} /> Active</>}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm text-white/50">
              <span>Score: <span className="text-white font-medium">{team.totalScore}</span> pts</span>
              <span>Members: <span className="text-white font-medium">{team.members?.length || '—'}</span></span>
            </div>
          </div>
        ))}
        {teams.length === 0 && <div className="glass-card p-10 text-center text-white/40">No active mentorships yet.</div>}
      </div>
    </div>
  )
}
