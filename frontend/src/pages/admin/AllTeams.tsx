import { useEffect, useState } from 'react'
import { FolderKanban } from 'lucide-react'
import api from '../../lib/api'

export default function AllTeams() {
  const [teams, setTeams] = useState<any[]>([])
  useEffect(() => { api.get('/admin/teams').then(r => setTeams(r.data)).catch(() => {}) }, [])

  const statusColor: Record<string, string> = {
    FORMING: 'badge-primary',
    ACTIVE: 'badge-teal',
    COMPLETED: 'badge-warning',
    DISBANDED: 'badge-danger',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FolderKanban className="text-amber-500" size={24} /> All Teams
        </h1>
        <p className="text-slate-500 text-sm mt-1">{teams.length} teams registered this semester</p>
      </div>

      <div className="card overflow-hidden shadow-xs border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-left">
                <th className="px-5 py-3 text-slate-600 font-semibold">#</th>
                <th className="px-5 py-3 text-slate-600 font-semibold">Team</th>
                <th className="px-5 py-3 text-slate-600 font-semibold">Project</th>
                <th className="px-5 py-3 text-slate-600 font-semibold">Status</th>
                <th className="px-5 py-3 text-slate-600 font-semibold">Score</th>
                <th className="px-5 py-3 text-slate-600 font-semibold">At Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teams.map((t, i) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">{i + 1}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800">{t.teamName}</td>
                  <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">{t.project?.title || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`badge ${statusColor[t.status] || 'badge-primary'}`}>{t.status}</span>
                  </td>
                  <td className="px-5 py-3.5 text-amber-600 font-semibold">{t.totalScore}</td>
                  <td className="px-5 py-3.5">
                    {t.isAtRisk ? (
                      <span className="badge badge-danger">⚠️ Yes</span>
                    ) : (
                      <span className="text-slate-400 text-xs">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {teams.length === 0 && (
          <div className="text-center py-12 text-slate-400">No teams found.</div>
        )}
      </div>
    </div>
  )
}
