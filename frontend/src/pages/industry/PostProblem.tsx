import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Briefcase, Send, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

const DOMAINS = ['IoT', 'ML/AI', 'Web', 'Embedded Systems', 'Data Science', 'Robotics', 'Blockchain', 'AR/VR', 'Cybersecurity', 'Cloud']

export default function PostProblem() {
  const [form, setForm] = useState({
    title: '', description: '', domain: '', techStack: '', maxTeamSize: '4',
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/projects', { ...form, maxTeamSize: parseInt(form.maxTeamSize) })
      toast.success('Problem statement posted! Awaiting admin approval.')
      navigate('/industry/dashboard')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to post problem.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Briefcase className="text-pink-400" size={24} /> Post a Problem Statement
        </h1>
        <p className="text-white/50 text-sm mt-1">
          Define a real-world challenge for student teams to solve as their capstone project.
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-white/70 text-sm font-medium block mb-1.5">Problem Title *</label>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Smart Inventory Management using IoT & ML"
              required
              className="input-dark"
            />
          </div>

          <div>
            <label className="text-white/70 text-sm font-medium block mb-1.5">Detailed Problem Description *</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the business problem, expected outcomes, constraints, and evaluation criteria..."
              required
              rows={6}
              className="input-dark resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/70 text-sm font-medium block mb-1.5">Domain *</label>
              <select
                value={form.domain}
                onChange={e => setForm({ ...form, domain: e.target.value })}
                required
                className="input-dark"
              >
                <option value="">Select domain</option>
                {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="text-white/70 text-sm font-medium block mb-1.5">Max Team Size</label>
              <select
                value={form.maxTeamSize}
                onChange={e => setForm({ ...form, maxTeamSize: e.target.value })}
                className="input-dark"
              >
                {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} members</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-white/70 text-sm font-medium block mb-1.5">Preferred Tech Stack</label>
            <input
              value={form.techStack}
              onChange={e => setForm({ ...form, techStack: e.target.value })}
              placeholder="e.g. Python, TensorFlow, React, PostgreSQL"
              className="input-dark"
            />
            <p className="text-white/30 text-xs mt-1">Comma-separated technologies (helps match the right team)</p>
          </div>

          <div className="glass-card p-4 border-l-4 border-pink-500 mt-2">
            <p className="text-white/60 text-sm">
              🏢 Your problem statement will be reviewed by the admin before appearing in the student idea repository.
              Approved problems are marked with an <span className="text-pink-400 font-medium">Industry</span> badge.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : <Send size={16} />
              }
              Post Problem Statement
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
