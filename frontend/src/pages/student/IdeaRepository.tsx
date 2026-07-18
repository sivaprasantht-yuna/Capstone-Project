import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Lightbulb, Search, Filter, TrendingUp, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

export default function IdeaRepository() {
  const [projects, setProjects] = useState<any[]>([])
  const [domains, setDomains] = useState<string[]>([])
  const [selectedDomain, setSelectedDomain] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', domain: '', techStack: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([api.get('/projects'), api.get('/projects/domains')])
      .then(([pRes, dRes]) => {
        setProjects(pRes.data)
        setDomains(dRes.data)
      })
  }, [])

  const filtered = projects.filter(p =>
    (!selectedDomain || p.domain === selectedDomain) &&
    (!search || p.title.toLowerCase().includes(search.toLowerCase()))
  )

  const submitIdea = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/projects', form)
      setProjects(prev => [res.data, ...prev])
      setShowForm(false)
      setForm({ title: '', description: '', domain: '', techStack: '' })
      toast.success('Idea posted successfully!')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to post idea.')
    } finally { setLoading(false) }
  }

  const upvote = async (id: number) => {
    await api.post(`/projects/${id}/upvote`)
    setProjects(prev => prev.map(p => p.id === id ? { ...p, upvoteCount: p.upvoteCount + 1 } : p))
  }

  const domainColors: Record<string, string> = {
    'IoT': 'from-emerald-600 to-teal-600', 'ML/AI': 'from-violet-600 to-purple-600',
    'Web': 'from-primary-600 to-blue-600', 'Embedded': 'from-amber-600 to-orange-600',
    'Data Science': 'from-pink-600 to-rose-600',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Lightbulb className="text-amber-400" size={24} /> Idea Repository
          </h1>
          <p className="text-white/50 text-sm mt-1">Browse and post capstone project ideas</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm flex items-center gap-2">
          <Plus size={16} /> Post Idea
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search ideas..." className="input-dark pl-9" />
        </div>
        <select value={selectedDomain} onChange={e => setSelectedDomain(e.target.value)}
          className="input-dark w-auto">
          <option value="">All Domains</option>
          {domains.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Idea Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p, i) => (
          <motion.div key={p.id || i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }} className="glass-card-hover p-5">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="font-semibold text-white leading-tight">{p.title}</h3>
              <div className="flex flex-col gap-1 items-end">
                {p.domain && (
                  <span className="badge badge-primary flex-shrink-0">{p.domain}</span>
                )}
                {p.status && (
                  <span className={`badge flex-shrink-0 ${
                    p.status === 'REJECTED' ? 'badge-danger' : 
                    p.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                    'badge-accent'
                  }`}>
                    {p.status === 'OPEN' || p.status === 'PENDING_REVIEW' ? 'PENDING' : p.status}
                  </span>
                )}
              </div>
            </div>
            <p className="text-white/50 text-sm line-clamp-3 mb-4">{p.description}</p>
            {p.techStack && (
              <div className="flex flex-wrap gap-1 mb-4">
                {p.techStack.split(',').map((t: string, idx: number) => (
                  <span key={`${t.trim()}-${idx}`} className="badge badge-accent text-xs">{t.trim()}</span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <span className="text-xs text-white/40">by {p.postedBy?.name || 'Unknown'}</span>
              <button onClick={() => upvote(p.id)}
                className="flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-300 transition-colors">
                <TrendingUp size={14} /> {p.upvoteCount || 0}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Post Idea Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="glass-card w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white text-lg">Post a Project Idea</h2>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={submitIdea} className="space-y-4">
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                placeholder="Project title *" required className="input-dark" />
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Project description *" required rows={4} className="input-dark resize-none" />
              <select value={form.domain} onChange={e => setForm({...form, domain: e.target.value})}
                className="input-dark">
                <option value="">Select domain</option>
                {['IoT', 'ML/AI', 'Web', 'Embedded Systems', 'Data Science', 'Robotics', 'Blockchain', 'AR/VR'].map(d =>
                  <option key={d} value={d}>{d}</option>)}
              </select>
              <input value={form.techStack} onChange={e => setForm({...form, techStack: e.target.value})}
                placeholder="Tech stack (comma-separated)" className="input-dark" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Posting...' : 'Post Idea'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
