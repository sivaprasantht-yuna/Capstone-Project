import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import {
  Users, Lightbulb, Clock, Award, TrendingUp,
  ArrowRight, AlertTriangle, CheckCircle2, BookOpen
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { RootState } from '../../store'
import api from '../../lib/api'

interface DashboardStats {
  teamName?: string
  projectTitle?: string
  milestones?: { title: string; status: string; dueDate: string }[]
  totalPoints?: number
  badges?: string[]
}

export default function StudentDashboard() {
  const { user } = useSelector((s: RootState) => s.auth)
  const [stats, setStats] = useState<DashboardStats>({})
  const [teams, setTeams] = useState<any[]>([])
  const [milestones, setMilestones] = useState<any[]>([])
  const [progressPercent, setProgressPercent] = useState<number>(0)
  const [myIdeasCount, setMyIdeasCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamsRes, ideasRes] = await Promise.all([
          api.get('/teams/my').catch(() => ({ data: [] })),
          api.get('/projects/my').catch(() => ({ data: [] }))
        ])

        setTeams(teamsRes.data)
        setMyIdeasCount(Array.isArray(ideasRes.data) ? ideasRes.data.length : 0)

        if (teamsRes.data.length > 0) {
          const team = teamsRes.data[0]
          setStats({
            teamName: team.teamName,
            projectTitle: team.project?.title,
            totalPoints: team.totalScore,
          })

          // Fetch real team milestones & progress
          try {
            const [milestonesRes, progressRes] = await Promise.all([
              api.get(`/milestones/team/${team.id}`).catch(() => ({ data: [] })),
              api.get(`/progress/team/${team.id}`).catch(() => ({ data: null }))
            ])

            const msList = Array.isArray(milestonesRes.data) ? milestonesRes.data : []
            setMilestones(msList)

            if (progressRes.data && typeof progressRes.data.overallProgress === 'number') {
              setProgressPercent(progressRes.data.overallProgress)
            } else if (msList.length > 0) {
              const approved = msList.filter((m: any) => m.status === 'APPROVED').length
              setProgressPercent(Math.round((approved / msList.length) * 100))
            } else {
              setProgressPercent(0)
            }
          } catch {
            setProgressPercent(0)
          }
        } else {
          setProgressPercent(0)
          setMilestones([])
        }
      } catch (e) {
        console.error('Error loading student dashboard data', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const approvedCount = milestones.filter(m => m.status === 'APPROVED').length

  const kpis = [
    {
      label: 'Team Status',
      value: teams.length > 0 ? (teams[0].status || 'ACTIVE') : 'No Team',
      icon: <Users size={20} />,
      color: 'from-primary-600 to-violet-600',
      link: teams.length > 0 ? '/student/team-portal' : '/student/team'
    },
    {
      label: 'Progress Track',
      value: `${progressPercent}%`,
      icon: <TrendingUp size={20} />,
      color: 'from-teal-600 to-emerald-600',
      link: '/student/progress'
    },
    {
      label: 'Milestones',
      value: teams.length > 0 ? (milestones.length > 0 ? `${approvedCount}/${milestones.length} Done` : '0 Phases') : '—',
      icon: <CheckCircle2 size={20} />,
      color: 'from-amber-600 to-orange-600',
      link: '/student/workspace'
    },
    {
      label: 'Ideas Posted',
      value: myIdeasCount > 0 ? `${myIdeasCount} Idea${myIdeasCount > 1 ? 's' : ''}` : '0 Posted',
      icon: <Lightbulb size={20} />,
      color: 'from-pink-600 to-rose-600',
      link: '/student/ideas'
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div>
        <p className="section-subhead mb-1">Student Dashboard</p>
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          <span className="gradient-text-primary">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Here's what's happening with your capstone project.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Link to={kpi.link} className="stat-card card-hover block">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center text-white mb-2 shadow-xs`}>
                {kpi.icon}
              </div>
              <div className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>{kpi.value}</div>
              <div className="text-xs text-slate-500">{kpi.label}</div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Overview */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>My Team</h2>
            <Link to={teams.length > 0 ? '/student/team-portal' : '/student/team'} className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1">
              View <ArrowRight size={14} />
            </Link>
          </div>
          {teams.length === 0 ? (
            <div className="text-center py-10">
              <Users size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">You haven't joined a team yet.</p>
              <Link to="/student/team" className="btn-primary text-sm mt-4 inline-flex">Find Teammates</Link>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-50 border border-primary-200 rounded-xl flex items-center justify-center text-primary-600 font-bold">
                  {teams[0].teamName?.[0]}
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{teams[0].teamName}</div>
                  <div className="text-xs text-slate-500">{teams[0].project?.title || 'No project assigned yet'}</div>
                </div>
                <span className={`badge ml-auto ${teams[0].isAtRisk ? 'badge-danger' : 'badge-accent'}`}>
                  {teams[0].isAtRisk ? '⚠️ At Risk' : teams[0].status}
                </span>
              </div>

              {/* Real Milestone Progress */}
              <div className="space-y-2.5 mt-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Milestone Breakdown</div>
                {milestones.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No milestones assigned to this project yet.</p>
                ) : (
                  milestones.map((m, i) => (
                    <div key={m.id || i} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        m.status === 'APPROVED' ? 'bg-emerald-600 text-white' :
                        m.status === 'SUBMITTED' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {i + 1}
                      </div>
                      <span className="text-slate-700 font-medium flex-1 truncate">{m.title}</span>
                      <span className={`badge text-[11px] ${
                        m.status === 'APPROVED' ? 'badge-accent' :
                        m.status === 'SUBMITTED' ? 'badge-warning' : 'badge-primary'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Browse & Propose Ideas', href: '/student/ideas', icon: <Lightbulb size={16} />, color: 'text-amber-500' },
              { label: 'NeuroSync Team Portal',   href: '/student/team-portal', icon: <Users size={16} />,     color: 'text-primary-600' },
              { label: 'Request a Mentor',      href: '/student/mentors', icon: <BookOpen size={16} />,  color: 'text-emerald-600' },
              { label: 'Progress Portal',      href: '/student/progress', icon: <TrendingUp size={16} />, color: 'text-teal-600' },
            ].map(action => (
              <Link key={action.href} to={action.href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors group">
                <span className={action.color}>{action.icon}</span>
                <span className="text-sm text-slate-700 group-hover:text-slate-900 font-medium transition-colors">{action.label}</span>
                <ArrowRight size={14} className="ml-auto text-slate-300 group-hover:text-slate-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
