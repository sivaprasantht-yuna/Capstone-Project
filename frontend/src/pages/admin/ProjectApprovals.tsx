import { useEffect, useState } from 'react'
import { FolderCheck, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

export default function ProjectApprovals() {
  const [projects, setProjects] = useState<any[]>([])
  useEffect(() => { api.get('/projects?status=OPEN').then(r => setProjects(r.data)).catch(() => {}) }, [])

  const approve = async (id: number) => {
    await api.patch(`/projects/${id}`, { status: 'APPROVED' })
    setProjects(p => p.filter(x => x.id !== id))
    toast.success('Project approved!')
  }
  const reject = async (id: number) => {
    await api.patch(`/projects/${id}`, { status: 'CLOSED' })
    setProjects(p => p.filter(x => x.id !== id))
    toast.success('Project rejected.')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><FolderCheck className="text-amber-500" size={24} /> Project Approvals</h1>
      {projects.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">No pending project approvals.</div>
      ) : projects.map(p => (
        <div key={p.id} className="card p-5 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-800">{p.title}</div>
              <div className="text-sm text-slate-500 mt-1 line-clamp-2">{p.description}</div>
              <div className="mt-2 flex gap-2">
                {p.domain && <span className="badge badge-primary">{p.domain}</span>}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => reject(p.id)} className="btn-secondary py-2 px-3 text-sm flex items-center gap-1"><X size={14} /> Reject</button>
              <button onClick={() => approve(p.id)} className="btn-teal py-2 px-3 text-sm flex items-center gap-1"><Check size={14} /> Approve</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
