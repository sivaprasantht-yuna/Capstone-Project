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
import { useDropzone } from 'react-dropzone'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'

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
  const [loading, setLoading] = useState(true)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [referenceMarkdown, setReferenceMarkdown] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamsRes] = await Promise.all([api.get('/teams/my')])
        setTeams(teamsRes.data)
        if (teamsRes.data.length > 0) {
          const team = teamsRes.data[0]
          setStats({
            teamName: team.teamName,
            projectTitle: team.project?.title,
            totalPoints: team.totalScore,
          })
          if (team.project?.referenceSummary) {
            setReferenceMarkdown(team.project.referenceSummary)
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || !teams[0]?.project?.id) return
    const file = acceptedFiles[0]
    
    setUploadingPdf(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await api.post(`/projects/${teams[0].project.id}/sanitize`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setReferenceMarkdown(res.data.document)
      toast.success('Document converted successfully!')
    } catch (error) {
      console.error(error)
      toast.error('Failed to convert document.')
    } finally {
      setUploadingPdf(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  })

  const kpis = [
    { label: 'Team Status', value: teams.length > 0 ? teams[0].status : 'No Team', icon: <Users size={20} />, color: 'from-primary-600 to-violet-600', link: '/student/team' },
    { label: 'Team Points', value: stats.totalPoints ?? '—', icon: <TrendingUp size={20} />, color: 'from-amber-600 to-orange-600', link: '/student/leaderboard' },
    { label: 'Milestones', value: teams.length > 0 ? '3 Phases' : '—', icon: <CheckCircle2 size={20} />, color: 'from-emerald-600 to-teal-600', link: '/student/workspace' },
    { label: 'Ideas Posted', value: '—', icon: <Lightbulb size={20} />, color: 'from-pink-600 to-rose-600', link: '/student/ideas' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-white/50 mt-1 text-sm">Here's what's happening with your capstone project.</p>
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
            <Link to={kpi.link} className="glass-card-hover p-5 flex flex-col gap-3 block">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center text-white`}>
                {kpi.icon}
              </div>
              <div>
                <div className="text-xl font-bold text-white">{kpi.value}</div>
                <div className="text-xs text-white/50">{kpi.label}</div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Overview */}
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">My Team</h2>
            <Link to="/student/team" className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
              View <ArrowRight size={14} />
            </Link>
          </div>
          {teams.length === 0 ? (
            <div className="text-center py-10">
              <Users size={40} className="mx-auto text-white/20 mb-3" />
              <p className="text-white/40 text-sm">You haven't joined a team yet.</p>
              <Link to="/student/team" className="btn-primary text-sm mt-4 inline-flex">Find Teammates</Link>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-600/20 border border-primary-500/30 rounded-xl flex items-center justify-center text-primary-400 font-bold">
                  {teams[0].teamName?.[0]}
                </div>
                <div>
                  <div className="font-semibold text-white">{teams[0].teamName}</div>
                  <div className="text-xs text-white/50">{teams[0].project?.title}</div>
                </div>
                <span className={`badge ml-auto ${teams[0].isAtRisk ? 'badge-danger' : 'badge-accent'}`}>
                  {teams[0].isAtRisk ? '⚠️ At Risk' : teams[0].status}
                </span>
              </div>

              {/* Milestone mini-progress */}
              <div className="space-y-2">
                {['Review 1', 'Review 2', 'Final Submission'].map((m, i) => (
                  <div key={m} className="flex items-center gap-3 text-sm">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-accent text-white' : 'bg-surface-100 text-white/40'
                    }`}>
                      {i + 1}
                    </div>
                    <span className="text-white/70 flex-1">{m}</span>
                    <span className={`badge ${i === 0 ? 'badge-accent' : 'badge-primary'}`}>
                      {i === 0 ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Browse Project Ideas', href: '/student/ideas', icon: <Lightbulb size={16} />, color: 'text-amber-400' },
              { label: 'Find Teammates',        href: '/student/team',    icon: <Users size={16} />,     color: 'text-primary-400' },
              { label: 'Request a Mentor',      href: '/student/mentors', icon: <BookOpen size={16} />,  color: 'text-emerald-400' },
              { label: 'View Leaderboard',      href: '/student/leaderboard', icon: <Award size={16} />, color: 'text-pink-400' },
            ].map(action => (
              <Link key={action.href} to={action.href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                <span className={action.color}>{action.icon}</span>
                <span className="text-sm text-white/70 group-hover:text-white transition-colors">{action.label}</span>
                <ArrowRight size={14} className="ml-auto text-white/20 group-hover:text-white/50 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Senior Reference Document Section */}
      {teams.length > 0 && teams[0].project && (
        <div className="glass-card p-6 animate-fade-in mt-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-primary-400" />
            Convert Project to Senior Reference Document
          </h2>
          
          {!referenceMarkdown ? (
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary-500 bg-primary-500/10' : 'border-white/20 hover:border-white/40 hover:bg-white/5'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center space-y-3">
                <BookOpen size={32} className={isDragActive ? 'text-primary-400' : 'text-white/40'} />
                {uploadingPdf ? (
                  <p className="text-white/70">Analyzing document with AI...</p>
                ) : isDragActive ? (
                  <p className="text-primary-300">Drop the PDF here...</p>
                ) : (
                  <>
                    <p className="text-white/70">Drag & drop your project PDF here, or click to select</p>
                    <p className="text-xs text-white/40">Only .pdf files are supported</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-surface-100 rounded-xl p-6 border border-white/10">
              <div className="prose prose-invert max-w-none prose-h2:text-primary-400 prose-a:text-accent-400">
                <ReactMarkdown>{referenceMarkdown}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
