import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, CheckCircle2, Clock, AlertTriangle, Activity, Target,
  Users, FileText, Calendar, Zap, Heart, Award, ChevronRight,
  Loader2, RefreshCcw, BarChart3, BookOpen
} from 'lucide-react'
import api from '../../lib/api'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Milestone {
  id: number; title: string; description: string;
  status: string; dueDate: string | null; sequenceOrder: number; submittedAt: string | null
}
interface Contribution {
  studentId: number; studentName: string; avatarInitial: string;
  contributionPercentage: number; tasksCompleted: number; tasksTotal: number; membershipStatus: string
}
interface TimelineEntry {
  id: number; eventType: string; createdAt: string; userName: string; eventData: Record<string, any>
}
interface TeamProgressData {
  teamId: number; teamName: string; teamStatus: string; projectTitle: string
  overallProgress: number; currentPhase: string; teamHealth: string
  totalTasks: number; completedTasks: number; inProgressTasks: number
  pendingTasks: number; overdueTasks: number
  totalMilestones: number; completedMilestones: number; evidenceSubmitted: number
  milestones: Milestone[]; contributions: Contribution[]; hasMentor: boolean; createdAt: string
}

// ─── Health Badge ─────────────────────────────────────────────────────────────
function HealthBadge({ health }: { health: string }) {
  const cfg = {
    ON_TRACK: { label: 'On Track', icon: '🟢', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    NEEDS_ATTENTION: { label: 'Needs Attention', icon: '🟡', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    AT_RISK: { label: 'At Risk', icon: '🔴', cls: 'bg-red-50 text-red-700 border-red-200' },
  }
  const c = cfg[health as keyof typeof cfg] || cfg.NEEDS_ATTENTION
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${c.cls}`}>
      <span>{c.icon}</span>{c.label}
    </span>
  )
}

// ─── Milestone Status Colors ───────────────────────────────────────────────────
function milestoneColor(status: string) {
  const m: Record<string, string> = {
    APPROVED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    SUBMITTED: 'text-sky-700 bg-sky-50 border-sky-200',
    UNDER_REVIEW: 'text-amber-700 bg-amber-50 border-amber-200',
    PENDING: 'text-slate-500 bg-slate-50 border-slate-200',
    OVERDUE: 'text-red-700 bg-red-50 border-red-200',
    NEEDS_REVISION: 'text-orange-700 bg-orange-50 border-orange-200',
  }
  return m[status] || m.PENDING
}

function milestoneIcon(status: string) {
  const m: Record<string, JSX.Element> = {
    APPROVED: <CheckCircle2 size={16} className="text-emerald-600" />,
    SUBMITTED: <Clock size={16} className="text-sky-600" />,
    UNDER_REVIEW: <Activity size={16} className="text-amber-600" />,
    PENDING: <Target size={16} className="text-slate-400" />,
    OVERDUE: <AlertTriangle size={16} className="text-red-600" />,
    NEEDS_REVISION: <RefreshCcw size={16} className="text-orange-600" />,
  }
  return m[status] || m.PENDING
}

// ─── Timeline Entry ───────────────────────────────────────────────────────────
function TimelineItem({ entry }: { entry: TimelineEntry }) {
  const eventLabels: Record<string, { label: string; icon: JSX.Element; color: string }> = {
    TEAM_FORMED: { label: 'Team Formed', icon: <Users size={14} />, color: 'bg-blue-500' },
    MENTOR_MATCHED: { label: 'Mentor Matched', icon: <Award size={14} />, color: 'bg-purple-500' },
    MILESTONE_SUBMITTED: { label: 'Milestone Submitted', icon: <Target size={14} />, color: 'bg-sky-500' },
    TEAM_DISSOLVED: { label: 'Team Dissolved', icon: <AlertTriangle size={14} />, color: 'bg-red-500' },
    MEMBER_REMOVED: { label: 'Member Removed', icon: <Users size={14} />, color: 'bg-orange-500' },
    DISMANTLE_REQUESTED: { label: 'Dismantle Requested', icon: <AlertTriangle size={14} />, color: 'bg-amber-500' },
    REMOVAL_REQUESTED: { label: 'Removal Requested', icon: <Users size={14} />, color: 'bg-amber-500' },
    DISMANTLE_APPROVED: { label: 'Dismantle Approved', icon: <CheckCircle2 size={14} />, color: 'bg-red-500' },
  }
  const cfg = eventLabels[entry.eventType] || { label: entry.eventType, icon: <Zap size={14} />, color: 'bg-primary-500' }
  const date = new Date(entry.createdAt)
  return (
    <div className="flex gap-4 items-start group">
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 ${cfg.color}`}>
          {cfg.icon}
        </div>
        <div className="w-px flex-1 bg-slate-200 mt-1 min-h-[24px]" />
      </div>
      <div className="pb-4 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-800">{cfg.label}</span>
          <span className="text-xs text-slate-500">by {entry.userName}</span>
        </div>
        <span className="text-xs text-slate-400">{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProgressPortal() {
  const team = useSelector((s: RootState) => s.team)
  const [data, setData] = useState<TeamProgressData | null>(null)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'contributions' | 'timeline'>('overview')

  const load = useCallback(async () => {
    if (!team.teamId) { setLoading(false); return }
    setLoading(true); setError('')
    try {
      const [progressRes, timelineRes] = await Promise.all([
        api.get(`/progress/team/${team.teamId}`),
        api.get(`/progress/team/${team.teamId}/timeline`)
      ])
      setData(progressRes.data)
      setTimeline(timelineRes.data)
    } catch {
      setError('Could not load progress data.')
    } finally {
      setLoading(false)
    }
  }, [team.teamId])

  useEffect(() => { load() }, [load])

  if (!team.teamId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 bg-primary-50 border border-primary-100 rounded-2xl flex items-center justify-center">
          <BarChart3 size={32} className="text-primary-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">No Team Yet</h2>
        <p className="text-slate-500 text-sm">Join or create a team to see progress</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="animate-spin text-primary-600" size={36} />
      </div>
    )
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp size={15} /> },
    { id: 'milestones', label: 'Milestones', icon: <Target size={15} /> },
    { id: 'contributions', label: 'Contributions', icon: <Users size={15} /> },
    { id: 'timeline', label: 'Timeline', icon: <Activity size={15} /> },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="text-primary-600" size={26} />
            Team Progress
          </h1>
          <p className="text-slate-500 text-sm mt-1">{data.projectTitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <HealthBadge health={data.teamHealth} />
          <button onClick={load} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors" title="Refresh">
            <RefreshCcw size={16} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* Dissolved Banner */}
      {data.teamStatus === 'DISSOLVED' && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="card border-red-200 bg-red-50 p-4 flex items-center gap-3 text-red-700">
          <AlertTriangle size={18} />
          <span className="text-sm font-medium">This team has been dissolved. History is preserved below.</span>
        </motion.div>
      )}

      {/* Overall Progress Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <p className="text-slate-500 text-sm">Overall Progress</p>
            <p className="text-4xl font-bold text-primary-600">{data.overallProgress}%</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Current Phase</p>
            <p className="text-slate-800 font-semibold">{data.currentPhase}</p>
            {data.hasMentor && (
              <span className="text-xs badge badge-accent mt-1">Mentor Assigned</span>
            )}
          </div>
        </div>
        <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: 'linear-gradient(90deg, #1a5fb4, #0d9488)' }}
            initial={{ width: 0 }}
            animate={{ width: `${data.overallProgress}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tasks Done', val: `${data.completedTasks}/${data.totalTasks}`, icon: <CheckCircle2 size={18} className="text-emerald-600" />, cls: 'border-emerald-200 bg-emerald-50/20' },
          { label: 'In Progress', val: data.inProgressTasks, icon: <Activity size={18} className="text-sky-600" />, cls: 'border-sky-200 bg-sky-50/20' },
          { label: 'Overdue', val: data.overdueTasks, icon: <AlertTriangle size={18} className="text-red-600" />, cls: data.overdueTasks > 0 ? 'border-red-200 bg-red-50/20' : 'border-slate-200' },
          { label: 'Evidence', val: data.evidenceSubmitted, icon: <FileText size={18} className="text-purple-600" />, cls: 'border-purple-200 bg-purple-50/20' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`card p-4 border ${s.cls}`}>
            <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs text-slate-500 font-medium">{s.label}</span></div>
            <p className="text-2xl font-bold text-slate-800">{s.val}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar max-w-full">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all ${
              activeTab === t.id ? 'bg-white text-primary-700 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4">
            <div className="card p-6">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Heart size={16} className="text-pink-500" /> Team Health Summary
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{data.completedMilestones}</p>
                  <p className="text-xs text-slate-500 mt-1">Milestones Done</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-sky-600">{data.totalMilestones - data.completedMilestones}</p>
                  <p className="text-xs text-slate-500 mt-1">Remaining</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{data.overdueTasks}</p>
                  <p className="text-xs text-slate-500 mt-1">Overdue Tasks</p>
                </div>
              </div>
              {data.overdueTasks > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                  <AlertTriangle size={14} /> {data.overdueTasks} task{data.overdueTasks > 1 ? 's are' : ' is'} overdue — team health at risk.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'milestones' && (
          <motion.div key="milestones" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-3">
            {data.milestones.length === 0 ? (
              <div className="card p-8 text-center text-slate-400">No milestones defined yet.</div>
            ) : data.milestones.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`card p-4 border ${milestoneColor(m.status)} flex items-start gap-4`}>
                <div className="mt-0.5">{milestoneIcon(m.status)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-medium text-slate-800 text-sm">{m.sequenceOrder}. {m.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${milestoneColor(m.status)}`}>
                      {m.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {m.description && <p className="text-xs text-slate-600 mt-1">{m.description}</p>}
                  <div className="flex gap-4 mt-2 text-xs text-slate-400">
                    {m.dueDate && <span className="flex items-center gap-1"><Calendar size={11} /> Due: {new Date(m.dueDate).toLocaleDateString()}</span>}
                    {m.submittedAt && <span className="flex items-center gap-1"><CheckCircle2 size={11} /> Submitted: {new Date(m.submittedAt).toLocaleDateString()}</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'contributions' && (
          <motion.div key="contributions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4">
            {data.contributions.length === 0 ? (
              <div className="card p-8 text-center text-slate-400">No contribution data yet.</div>
            ) : data.contributions.map((c, i) => (
              <motion.div key={c.studentId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }} className="card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-700 font-bold text-sm">
                    {c.avatarInitial}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 text-sm">{c.studentName}</span>
                      {c.membershipStatus === 'FORMER' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">Former</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{c.tasksCompleted}/{c.tasksTotal} tasks</span>
                  </div>
                  <span className="text-lg font-bold text-slate-800">{c.contributionPercentage.toFixed(1)}%</span>
                </div>
                <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ background: c.membershipStatus === 'FORMER'
                      ? 'linear-gradient(90deg, #92400e, #d97706)'
                      : 'linear-gradient(90deg, #1a5fb4, #0d9488)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(c.contributionPercentage, 100)}%` }}
                    transition={{ duration: 0.9, delay: i * 0.1, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'timeline' && (
          <motion.div key="timeline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="card p-6">
            {timeline.length === 0 ? (
              <div className="text-center text-slate-400 py-8">No events recorded yet.</div>
            ) : (
              <div>
                {timeline.map(entry => <TimelineItem key={entry.id} entry={entry} />)}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
