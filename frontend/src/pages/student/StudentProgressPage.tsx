import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, CheckCircle2, Clock, AlertTriangle, FileText, Zap,
  BarChart3, Activity, ChevronRight, Loader2, BookOpen, Award,
  Tag, History
} from 'lucide-react'
import api from '../../lib/api'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Task {
  id: number; title: string; description: string; status: string
  dueDate: string | null; assignedAt: string; completedAt: string | null
  teamId: number; teamName: string; pointValue: number
}
interface Evidence {
  id: number; title: string; description: string; evidenceType: string
  fileUrl: string | null; submittedAt: string; verificationStatus: string; taskTitle: string | null
}
interface TeamHistory {
  teamId: number; teamName: string; teamStatus: string; membershipStatus: string
  projectTitle: string; projectDomain: string; joinedAt: string; removedAt: string | null
  roleInTeam: string | null; contributionPercentage: number
}
interface ProgressData {
  studentId: number; studentName: string; department: string; email: string; membershipStatus: string
  personalProgress: number; tasksCompleted: number; tasksInProgress: number
  tasksPending: number; tasksOverdue: number; tasksTotal: number
  contributionPercentage: number; taskHistory: Task[]; evidence: Evidence[]
}

// ─── Status badge helpers ─────────────────────────────────────────────────────
function TaskStatusBadge({ status }: { status: string }) {
  const c: Record<string, string> = {
    COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    IN_PROGRESS: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    PENDING: 'bg-white/5 text-white/40 border-white/10',
    OVERDUE: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${c[status] || c.PENDING}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function MembershipBadge({ status }: { status: string }) {
  const c: Record<string, string> = {
    ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    FORMER_MEMBER: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    REMOVED: 'bg-red-500/10 text-red-400 border-red-500/20',
    REMOVAL_REQUESTED: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  }
  const label: Record<string, string> = {
    ACTIVE: 'Active',
    FORMER_MEMBER: 'Former Member',
    REMOVED: 'Removed',
    REMOVAL_REQUESTED: 'Removal Requested',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${c[status] || c.FORMER_MEMBER}`}>
      {label[status] || status}
    </span>
  )
}

function TeamStatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-emerald-400', FORMING: 'bg-sky-400', DISSOLVED: 'bg-red-400',
    COMPLETED: 'bg-purple-400', MENTOR_ASSIGNED: 'bg-teal-400',
  }
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status] || 'bg-white/30'}`} />
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentProgressPage() {
  const { studentId } = useParams<{ studentId?: string }>()
  const { user } = useSelector((s: RootState) => s.auth)
  const team = useSelector((s: RootState) => s.team)

  // resolve actual studentId (own profile or viewed profile)
  const resolvedStudentId = studentId || user?.userId

  const [data, setData] = useState<ProgressData | null>(null)
  const [history, setHistory] = useState<TeamHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'tasks' | 'evidence' | 'history'>('tasks')

  const load = useCallback(async () => {
    if (!resolvedStudentId || !team.teamId) { setLoading(false); return }
    setLoading(true); setError('')
    try {
      const [progressRes, historyRes] = await Promise.all([
        api.get(`/progress/student/${resolvedStudentId}/team/${team.teamId}`),
        api.get(`/progress/student/${resolvedStudentId}/history`)
      ])
      setData(progressRes.data)
      setHistory(historyRes.data)
    } catch {
      setError('Could not load student progress.')
    } finally {
      setLoading(false)
    }
  }, [resolvedStudentId, team.teamId])

  useEffect(() => { load() }, [load])

  if (!resolvedStudentId || !team.teamId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 bg-primary-600/20 border border-primary-500/20 rounded-2xl flex items-center justify-center">
          <User size={32} className="text-primary-400" />
        </div>
        <h2 className="text-xl font-semibold text-white">No Team Context</h2>
        <p className="text-white/40 text-sm">Join a team to view your progress</p>
      </div>
    )
  }

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-primary-400" size={36} /></div>
  }

  if (error || !data) {
    return (
      <div className="glass-card p-10 text-center">
        <AlertTriangle className="mx-auto mb-3 text-red-400" size={32} />
        <p className="text-white/60">{error || 'No data available.'}</p>
        <button onClick={load} className="btn-secondary mt-4 text-sm">Retry</button>
      </div>
    )
  }

  const isOwnProfile = !studentId || studentId === String(user?.userId)

  const tabs = [
    { id: 'tasks', label: 'Task History', icon: <CheckCircle2 size={15} /> },
    { id: 'evidence', label: 'Evidence', icon: <FileText size={15} /> },
    { id: 'history', label: 'Team History', icon: <History size={15} /> },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="text-teal-400" size={26} />
            {isOwnProfile ? 'My Progress' : `${data.studentName}'s Progress`}
          </h1>
          <p className="text-white/40 text-sm mt-1">{data.department}</p>
        </div>
        <MembershipBadge status={data.membershipStatus} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tasks Done', val: data.tasksCompleted, icon: <CheckCircle2 size={18} className="text-emerald-400" />, sub: `of ${data.tasksTotal}` },
          { label: 'In Progress', val: data.tasksInProgress, icon: <Activity size={18} className="text-sky-400" /> },
          { label: 'Overdue', val: data.tasksOverdue, icon: <AlertTriangle size={18} className="text-red-400" /> },
          { label: 'Contribution', val: `${data.contributionPercentage.toFixed(1)}%`, icon: <BarChart3 size={18} className="text-purple-400" /> },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs text-white/40">{s.label}</span></div>
            <p className="text-2xl font-bold text-white">{s.val}</p>
            {s.sub && <p className="text-xs text-white/30 mt-0.5">{s.sub}</p>}
          </motion.div>
        ))}
      </div>

      {/* Personal Progress Bar */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-white/60">Personal Completion</span>
          <span className="text-sm font-bold text-white">{data.personalProgress}%</span>
        </div>
        <div className="relative h-2.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: 'linear-gradient(90deg, #0ba5a5, #1a5fb4)' }}
            initial={{ width: 0 }}
            animate={{ width: `${data.personalProgress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.id ? 'bg-primary-600/80 text-white shadow' : 'text-white/50 hover:text-white/80'
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Task History */}
        {activeTab === 'tasks' && (
          <motion.div key="tasks" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-3">
            {data.taskHistory.length === 0 ? (
              <div className="glass-card p-8 text-center text-white/40">No tasks assigned yet.</div>
            ) : data.taskHistory.map((task, i) => (
              <motion.div key={task.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }} className="glass-card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white text-sm">{task.title}</span>
                      <TaskStatusBadge status={task.status} />
                    </div>
                    {task.description && <p className="text-xs text-white/40 mt-1 line-clamp-1">{task.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-white/30">
                      <span>Team: {task.teamName}</span>
                      {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                      {task.completedAt && <span>Completed: {new Date(task.completedAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="text-xs text-white/30 text-right">
                    <span className="text-amber-400 font-semibold">{task.pointValue} pts</span>
                  </div>
                </div>
                {task.status === 'IN_PROGRESS' && isOwnProfile && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <button
                      onClick={async () => {
                        try {
                          await api.patch(`/teams/${task.teamId}/tasks/${task.id}`,
                            { status: 'COMPLETED', completionNote: 'Marked as done from progress page' })
                          load()
                        } catch { /* ignore */ }
                      }}
                      className="text-xs btn-accent py-1 px-3">
                      Mark Complete
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Evidence */}
        {activeTab === 'evidence' && (
          <motion.div key="evidence" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-3">
            {data.evidence.length === 0 ? (
              <div className="glass-card p-8 text-center text-white/40">
                <FileText className="mx-auto mb-3 opacity-30" size={32} />
                <p>No evidence uploaded yet.</p>
                <p className="text-xs mt-1">Submit evidence through your task details.</p>
              </div>
            ) : data.evidence.map((ev, i) => (
              <motion.div key={ev.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }} className="glass-card p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white text-sm">{ev.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40">
                        {ev.evidenceType}
                      </span>
                      {ev.verificationStatus === 'VERIFIED' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    {ev.description && <p className="text-xs text-white/40 mt-1">{ev.description}</p>}
                    {ev.taskTitle && <p className="text-xs text-white/30 mt-1">Task: {ev.taskTitle}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-white/30">
                        {new Date(ev.submittedAt).toLocaleDateString()}
                      </span>
                      {ev.fileUrl && (
                        <a href={ev.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                          View File <ChevronRight size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Team History */}
        {activeTab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-3">
            <p className="text-xs text-white/30 px-1">All teams this student has participated in — past and present.</p>
            {history.length === 0 ? (
              <div className="glass-card p-8 text-center text-white/40">No team history found.</div>
            ) : history.map((h, i) => (
              <motion.div key={h.teamId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }} className="glass-card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <TeamStatusDot status={h.teamStatus} />
                      <span className="font-medium text-white text-sm">{h.teamName}</span>
                      <MembershipBadge status={h.membershipStatus} />
                    </div>
                    <p className="text-xs text-white/40 mt-1">{h.projectTitle}</p>
                    {h.projectDomain && <p className="text-xs text-white/30">{h.projectDomain}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-white/30">
                      {h.roleInTeam && <span>Role: {h.roleInTeam}</span>}
                      <span>Joined: {h.joinedAt ? new Date(h.joinedAt).toLocaleDateString() : '—'}</span>
                      {h.removedAt && <span>Left: {new Date(h.removedAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{h.contributionPercentage.toFixed(1)}%</p>
                    <p className="text-xs text-white/30">contribution</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
