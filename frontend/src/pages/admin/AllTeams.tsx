import { useEffect, useState } from 'react'
import { Users, FolderKanban } from 'lucide-react'
import api from '../../lib/api'

export default function AllTeams() {
  const [teams, setTeams] = useState<any[]>([])
  useEffect(() => { api.get('/admin/teams').then(r => setTeams(r.data)).catch(() => {}) }, [])

  const statusColor: Record<string, string> = {
    FORMING: 'badge-primary',
    ACTIVE: 'badge-accent',
    COMPLETED: 'badge-warning',
    DISBANDED: 'badge-danger',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <FolderKanban className="text-amber-400" size={24} /> All Teams
      </h1>
      <p className="text-white/50 text-sm">{teams.length} teams registered this semester</p>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left">
              <th className="px-5 py-3 text-white/50 font-medium">#</th>
              <th className="px-5 py-3 text-white/50 font-medium">Team</th>
              <th className="px-5 py-3 text-white/50 font-medium">Project</th>
              <th className="px-5 py-3 text-white/50 font-medium">Status</th>
              <th className="px-5 py-3 text-white/50 font-medium">Score</th>
              <th className="px-5 py-3 text-white/50 font-medium">At Risk</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t, i) => (
              <tr key={t.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                <td className="px-5 py-3 text-white/30">{i + 1}</td>
                <td className="px-5 py-3 font-medium text-white">{t.teamName}</td>
                <td className="px-5 py-3 text-white/60 max-w-xs truncate">{t.project?.title || '—'}</td>
                <td className="px-5 py-3">
                  <span className={`badge ${statusColor[t.status] || 'badge-primary'}`}>{t.status}</span>
                </td>
                <td className="px-5 py-3 text-amber-400 font-semibold">{t.totalScore}</td>
                <td className="px-5 py-3">
                  {t.isAtRisk ? (
                    <span className="badge badge-danger">⚠️ Yes</span>
                  ) : (
                    <span className="text-white/30 text-xs">No</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {teams.length === 0 && (
          <div className="text-center py-12 text-white/40">No teams found.</div>
        )}
      </div>
    </div>
  )
}
