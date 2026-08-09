import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, CheckCircle2, Clock, AlertCircle, Calendar, FileText, ArrowRight } from 'lucide-react'
import api from '../../lib/api'

interface Milestone {
  id: string
  title: string
  description: string
  dueDate: string
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'
  score?: number
}

const MILESTONES: Milestone[] = [
  {
    id: 'm1',
    title: 'Phase 1: Team Formation & Topic Selection',
    description: 'Finalize team members, register project title, and get coordinator approval.',
    dueDate: '2026-08-15',
    status: 'COMPLETED',
    score: 100,
  },
  {
    id: 'm2',
    title: 'Phase 2: Synopsis & Literature Survey',
    description: 'Submit 5-page project synopsis and review 10+ research papers.',
    dueDate: '2026-09-10',
    status: 'IN_PROGRESS',
    score: 85,
  },
  {
    id: 'm3',
    title: 'Phase 3: System Design & Prototype Review',
    description: 'Demonstrate working module / prototype to faculty mentor.',
    dueDate: '2026-10-20',
    status: 'PENDING',
  },
  {
    id: 'm4',
    title: 'Phase 4: Final Demonstration & Project Report',
    description: 'Final viva examination, code repository submission, and bound report.',
    dueDate: '2026-11-30',
    status: 'PENDING',
  },
]

export default function ProgressPortal() {
  const [team, setTeam] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/teams/my')
      .then(res => {
        if (res.data.length > 0) setTeam(res.data[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const completedCount = MILESTONES.filter(m => m.status === 'COMPLETED').length
  const progressPercent = Math.round((completedCount / MILESTONES.length) * 100) + 25 // 50%

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <TrendingUp className="text-teal-400" size={24} /> Progress Portal
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Track project milestones, review schedules, and overall completion progress
          </p>
        </div>
        <span className="badge badge-accent px-3 py-1 text-sm font-semibold">
          Overall: {progressPercent}% Complete
        </span>
      </div>

      {/* Main Progress Bar */}
      <div className="card p-6 accent-border-l">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-white text-base" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Project Completion Track
            </h2>
            <p className="text-xs text-white/40 mt-0.5">
              {team ? `Team: ${team.teamName} · ${team.project?.title || 'Capstone Project'}` : 'Student Progress Overview'}
            </p>
          </div>
          <span className="text-2xl font-bold gradient-text-primary" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {progressPercent}%
          </span>
        </div>

        <div className="match-bar h-3 bg-surface-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #1a5fb4, #0ba5a5)' }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>

        {/* Phase Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-4 border-t border-white/5 text-xs">
          <div>
            <span className="text-white/40 block">Phase 1</span>
            <span className="text-emerald-400 font-medium">✔ Completed</span>
          </div>
          <div>
            <span className="text-white/40 block">Phase 2</span>
            <span className="text-teal-300 font-medium">⚡ In Progress</span>
          </div>
          <div>
            <span className="text-white/40 block">Phase 3</span>
            <span className="text-white/30 font-medium">⏳ Scheduled</span>
          </div>
          <div>
            <span className="text-white/40 block">Phase 4</span>
            <span className="text-white/30 font-medium">⏳ Scheduled</span>
          </div>
        </div>
      </div>

      {/* Milestones Checklist */}
      <div className="space-y-4">
        <h2 className="section-header">Project Milestones & Deliverables</h2>
        {MILESTONES.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 card-hover"
          >
            <div className="flex items-start gap-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                m.status === 'COMPLETED'
                  ? 'bg-success/20 text-emerald-400 border border-success/30'
                  : m.status === 'IN_PROGRESS'
                  ? 'bg-teal/20 text-teal-300 border border-teal/30'
                  : 'bg-surface-100 text-white/30 border border-white/5'
              }`}>
                {m.status === 'COMPLETED' ? (
                  <CheckCircle2 size={18} />
                ) : m.status === 'IN_PROGRESS' ? (
                  <Clock size={18} className="animate-spin" />
                ) : (
                  <AlertCircle size={18} />
                )}
              </div>

              <div>
                <h3 className="font-semibold text-white text-base" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {m.title}
                </h3>
                <p className="text-sm text-white/50 mt-1 max-w-2xl">{m.description}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} /> Due: {m.dueDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText size={13} /> Submission: Online Portal
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
              <span
                className={`badge ${
                  m.status === 'COMPLETED'
                    ? 'badge-success'
                    : m.status === 'IN_PROGRESS'
                    ? 'badge-teal'
                    : 'badge-primary'
                }`}
              >
                {m.status === 'COMPLETED'
                  ? 'Completed'
                  : m.status === 'IN_PROGRESS'
                  ? 'In Progress'
                  : 'Pending'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
