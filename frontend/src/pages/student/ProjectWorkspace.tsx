import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Github, CheckCircle, Clock, AlertCircle, Send } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import api from '../../lib/api'

export default function ProjectWorkspace() {
  const [team, setTeam] = useState<any>(null)
  const [milestones, setMilestones] = useState<any[]>([])
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null)
  const [githubUrl, setGithubUrl] = useState('')
  const [remarks, setRemarks] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => setFile(files[0]),
    maxFiles: 1,
    accept: { 'application/pdf': ['.pdf'], 'application/zip': ['.zip'], 'application/octet-stream': [] },
  })

  useEffect(() => {
    api.get('/teams/my').then(r => {
      if (r.data.length > 0) {
        const t = r.data[0]
        setTeam(t)
        api.get(`/milestones/team/${t.id}`).then(m => setMilestones(m.data))
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMilestone) { toast.error('Select a milestone'); return }
    setLoading(true)
    try {
      const formData = new FormData()
      if (remarks) formData.append('remarks', remarks)
      if (githubUrl) formData.append('githubUrl', githubUrl)
      if (file) formData.append('file', file)

      await api.post(`/milestones/${selectedMilestone}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Submission successful! 🎉 Points awarded.')
      setFile(null); setGithubUrl(''); setRemarks('')
      // Refresh milestones
      api.get(`/milestones/team/${team.id}`).then(m => setMilestones(m.data))
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Submission failed.')
    } finally { setLoading(false) }
  }

  const statusIcon = (status: string) => {
    if (status === 'APPROVED')  return <CheckCircle size={16} className="text-accent" />
    if (status === 'SUBMITTED') return <Clock size={16} className="text-amber-400" />
    if (status === 'OVERDUE')   return <AlertCircle size={16} className="text-danger" />
    return <Clock size={16} className="text-white/30" />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Project Workspace</h1>
        <p className="text-white/50 text-sm">Milestone tracking and submission management</p>
      </div>

      {!team ? (
        <div className="glass-card p-8 text-center text-white/40">Join a team to access your workspace.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Milestones timeline */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="font-semibold text-white text-sm">Milestones</h2>
            {milestones.map((m, i) => (
              <motion.button key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelectedMilestone(m.id)}
                className={`w-full text-left glass-card p-4 transition-all duration-200 ${
                  selectedMilestone === m.id ? 'border-primary-500/50 bg-primary-500/5' : ''
                }`}>
                <div className="flex items-center gap-2 mb-1">
                  {statusIcon(m.status)}
                  <span className="font-medium text-white text-sm">{m.title}</span>
                </div>
                {m.dueDate && <p className="text-xs text-white/40">Due: {m.dueDate}</p>}
                <div className="flex items-center justify-between mt-2">
                  <span className={`badge text-xs ${
                    m.status === 'APPROVED' ? 'badge-accent' :
                    m.status === 'OVERDUE'  ? 'badge-danger' :
                    m.status === 'SUBMITTED'? 'badge-warning' : 'badge-primary'
                  }`}>{m.status}</span>
                  <span className="text-xs text-amber-400">+{m.pointsReward} pts</span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Submission form */}
          <div className="lg:col-span-2 glass-card p-6">
            <h2 className="font-semibold text-white mb-4">
              {selectedMilestone
                ? `Submit: ${milestones.find(m => m.id === selectedMilestone)?.title}`
                : 'Select a milestone to submit'}
            </h2>

            {selectedMilestone && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Drag & Drop */}
                <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary-500 bg-primary-500/10' : 'border-white/10 hover:border-primary-500/30'
                }`}>
                  <input {...getInputProps()} />
                  <Upload size={28} className="mx-auto text-white/30 mb-2" />
                  {file ? (
                    <p className="text-accent text-sm font-medium">{file.name}</p>
                  ) : (
                    <p className="text-white/40 text-sm">Drag & drop report/zip, or click to select</p>
                  )}
                </div>

                <div className="relative">
                  <Github className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                  <input value={githubUrl} onChange={e => setGithubUrl(e.target.value)}
                    placeholder="GitHub repository URL (optional)"
                    className="input-dark pl-9" />
                </div>

                <textarea value={remarks} onChange={e => setRemarks(e.target.value)}
                  placeholder="Remarks / summary for mentor..." rows={3}
                  className="input-dark resize-none" />

                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
                  Submit Milestone
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
