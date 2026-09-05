import { useEffect, useState } from 'react'
import { Users, CheckCircle, AlertTriangle } from 'lucide-react'
import api from '../../lib/api'

export default function ActiveTeams() {
  const [teams, setTeams] = useState<any[]>([])

  useEffect(() => {
    api.get('/mentorships/active')
      .then(r => {
        if (Array.isArray(r.data)) {
          setTeams(r.data)
        }
      })
      .catch(() => setTeams([]))
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <Users className="text-emerald-600" size={24} /> Active Teams
      </h1>
      <div className="space-y-4">
        {teams.map((item, index) => {
          const teamId = item.teamId || item.id || `team-${index}`
          return (
            <div key={teamId} className="card p-5 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-slate-800 text-base">{item.teamName || 'Team'}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{item.projectTitle || 'No project title'}</div>
                </div>
                <span className={`badge ${item.isAtRisk ? 'badge-danger' : 'badge-teal'}`}>
                  {item.isAtRisk ? <><AlertTriangle size={10} /> At Risk</> : <><CheckCircle size={10} /> Active Mentorship</>}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                <span>Match Score: <span className="text-emerald-700 font-semibold">{Math.round((item.matchScore || 0.9) * 100)}%</span></span>
                {item.createdAt && (
                  <span>Assigned: <span className="text-slate-700">{new Date(item.createdAt).toLocaleDateString()}</span></span>
                )}
              </div>
            </div>
          )
        })}
        {teams.length === 0 && <div className="card p-10 text-center text-slate-400">No active mentorships yet.</div>}
      </div>
    </div>
  )
}
