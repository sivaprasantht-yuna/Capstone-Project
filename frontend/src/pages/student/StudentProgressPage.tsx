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
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    IN_PROGRESS: 'bg-sky-50 text-sky-700 border-sky-200',
    PENDING: 'bg-slate-50 text-slate-500 border-slate-200',
    OVERDUE: 'bg-red-50 text-red-700 border-red-200',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${c[status] || c.PENDING}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function MembershipBadge({ status }: { status: string }) {
  const c: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    FORMER_MEMBER: 'bg-amber-50 text-amber-700 border-amber-200',
    REMOVED: 'bg-red-50 text-red-700 border-red-200',
    REMOVAL_REQUESTED: 'bg-orange-50 text-orange-700 border-orange-200',
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
    ACTIVE: 'bg-emerald-500', FORMING: 'bg-sky-500', DISSOLVED: 'bg-red-500',
    COMPLETED: 'bg-purple-500', MENTOR_ASSIGNED: 'bg-teal-500',
  }
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status] || 'bg-slate-300'}`} />
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
      const raw = progressRes.data || {}
      const normalized: ProgressData = {
        studentId: raw.studentId || resolvedStudentId,
        studentName: raw.studentName || user?.name || 'Student',
        department: raw.department || user?.department || 'General',
        email: raw.email || user?.email || '',
        membershipStatus: raw.membershipStatus || 'ACTIVE',
        personalProgress: raw.personalProgress ?? (raw.contributionPercentage ?? 0),
        tasksCompleted: raw.tasksCompleted ?? 0,
        tasksInProgress: raw.tasksInProgress ?? 0,
        tasksPending: raw.tasksPending ?? 0,
        tasksOverdue: raw.tasksOverdue ?? 0,
        tasksTotal: raw.tasksTotal ?? 0,
        contributionPercentage: raw.contributionPercentage ?? 0,
        taskHistory: Array.isArray(raw.taskHistory) ? raw.taskHistory : [],
        evidence: Array.isArray(raw.evidence) ? raw.evidence : []
      }
      setData(normalized)
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : [])
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
        <div className="w-16 h-16 bg-primary-50 border border-primary-100 rounded-2xl flex items-center justify-center">
          <User size={32} className="text-primary-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">No Team Context</h2>
        <p className="text-slate-500 text-sm">Join a team to view your progress</p>
      </div>
    )
  }

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-primary-600" size={36} /></div>
  }

  if (error || !data) {
    return (
      <div className="card p-10 text-center">
        <AlertTriangle className="mx-auto mb-3 text-red-500" size={32} />
        <p className="text-slate-600">{error || 'No data available.'}</p>
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
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <User className="text-teal-600" size={26} />
            {isOwnProfile ? 'My Progress' : `${data.studentName}'s Progress`}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{data.department}</p>
        </div>
        <MembershipBadge status={data.membershipStatus} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tasks Done', val: data.tasksCompleted, icon: <CheckCircle2 size={18} className="text-emerald-600" />, sub: `of ${data.tasksTotal}` },
          { label: 'In Progress', val: data.tasksInProgress, icon: <Activity size={18} className="text-sky-600" /> },
          { label: 'Overdue', val: data.tasksOverdue, icon: <AlertTriangle size={18} className="text-red-600" /> },
          { label: 'Contribution', val: `${data.contributionPercentage.toFixed(1)}%`, icon: <BarChart3 size={18} className="text-purple-600" /> },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }} className="card p-4">
            <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs text-slate-500 font-medium">{s.label}</span></div>
            <p className="text-2xl font-bold text-slate-800">{s.val}</p>
            {s.sub && <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>}
          </motion.div>
        ))}
      </div>

      {/* Personal Progress Bar */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-slate-600">Personal Completion</span>
          <span className="text-sm font-bold text-slate-800">{data.personalProgress}%</span>
        </div>
        <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: 'linear-gradient(90deg, #0d9488, #1a5fb4)' }}
            initial={{ width: 0 }}
            animate={{ width: `${data.personalProgress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar max-w-full">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all ${
              activeTab === t.id ? 'bg-white text-primary-700 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
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
            {(!data?.taskHistory || data.taskHistory.length === 0) ? (
              <div className="card p-8 text-center text-slate-400">No tasks assigned yet.</div>
            ) : (data.taskHistory || []).map((task, i) => (
              <motion.div key={task.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }} className="card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-800 text-sm">{task.title}</span>
                      <TaskStatusBadge status={task.status} />
                    </div>
                    {task.description && <p className="text-xs text-slate-600 mt-1 line-clamp-1">{task.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span>Team: {task.teamName}</span>
                      {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                      {task.completedAt && <span>Completed: {new Date(task.completedAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 text-right">
                    <span className="text-amber-600 font-semibold">{task.pointValue} pts</span>
                  </div>
                </div>
                {task.status === 'IN_PROGRESS' && isOwnProfile && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={async () => {
                        try {
                          await api.patch(`/teams/${task.teamId}/tasks/${task.id}`,
                            { status: 'COMPLETED', completionNote: 'Marked as done from progress page' })
                          load()
                        } catch { /* ignore */ }
                      }}
                      className="text-xs btn-teal py-1 px-3">
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
            {(!data?.evidence || data.evidence.length === 0) ? (
              <div className="card p-8 text-center text-slate-400">
                <FileText className="mx-auto mb-3 opacity-30" size={32} />
                <p>No evidence uploaded yet.</p>
                <p className="text-xs mt-1">Submit evidence through your task details.</p>
              </div>
            ) : (data.evidence || []).map((ev, i) => (
              <motion.div key={ev.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-800 text-sm">{ev.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
                        {ev.evidenceType}
                      </span>
                      {ev.verificationStatus === 'VERIFIED' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    {ev.description && <p className="text-xs text-slate-600 mt-1">{ev.description}</p>}
                    {ev.taskTitle && <p className="text-xs text-slate-400 mt-1">Task: {ev.taskTitle}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-slate-400">
                        {new Date(ev.submittedAt).toLocaleDateString()}
                      </span>
                      {ev.fileUrl && (
                        <a href={ev.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium">
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
            <p className="text-xs text-slate-500 px-1">All teams this student has participated in — past and present.</p>
            {(!history || history.length === 0) ? (
              <div className="card p-8 text-center text-slate-400">No team history found.</div>
            ) : (history || []).map((h, i) => (
              <motion.div key={h.teamId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }} className="card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <TeamStatusDot status={h.teamStatus} />
                      <span className="font-medium text-slate-800 text-sm">{h.teamName}</span>
                      <MembershipBadge status={h.membershipStatus} />
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{h.projectTitle}</p>
                    {h.projectDomain && <p className="text-xs text-slate-500">{h.projectDomain}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      {h.roleInTeam && <span>Role: {h.roleInTeam}</span>}
                      <span>Joined: {h.joinedAt ? new Date(h.joinedAt).toLocaleDateString() : '—'}</span>
                      {h.removedAt && <span>Left: {new Date(h.removedAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-800">{h.contributionPercentage.toFixed(1)}%</p>
                    <p className="text-xs text-slate-400">contribution</p>
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
