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
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Users className="text-emerald-600" size={24} /> Active Teams</h1>
      <div className="space-y-4">
        {teams.map(team => (
          <div key={team.id} className="card p-5 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-slate-800">{team.teamName}</div>
                <div className="text-sm text-slate-500 mt-0.5">{team.project?.title}</div>
              </div>
              <span className={`badge ${team.isAtRisk ? 'badge-danger' : 'badge-teal'}`}>
                {team.isAtRisk ? <><AlertTriangle size={10} /> At Risk</> : <><CheckCircle size={10} /> Active</>}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
              <span>Score: <span className="text-slate-800 font-semibold">{team.totalScore}</span> pts</span>
              <span>Members: <span className="text-slate-800 font-semibold">{team.members?.length || '—'}</span></span>
            </div>
          </div>
        ))}
        {teams.length === 0 && <div className="card p-10 text-center text-slate-400">No active mentorships yet.</div>}
      </div>
    </div>
  )
}
