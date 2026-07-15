import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, TrendingUp, ExternalLink, Users, Lightbulb } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import api from '../../lib/api'

export default function IndustryDashboard() {
  const { user } = useSelector((s: RootState) => s.auth)
  const [myProjects, setMyProjects] = useState<any[]>([])

  useEffect(() => {
    api.get('/projects').then(r => {
      // Filter projects posted by this user
      setMyProjects(r.data.filter((p: any) => p.postedBy?.id === user?.userId))
    }).catch(() => {})
  }, [user?.userId])

  const kpis = [
    { label: 'Problems Posted', value: myProjects.length, icon: <Lightbulb size={20} />, color: 'from-pink-600 to-rose-600' },
    { label: 'Teams Working',   value: myProjects.filter(p => p.status === 'IN_PROGRESS').length, icon: <Users size={20} />, color: 'from-primary-600 to-violet-600' },
    { label: 'Completed',       value: myProjects.filter(p => p.status === 'COMPLETED').length, icon: <TrendingUp size={20} />, color: 'from-emerald-600 to-teal-600' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome, <span className="gradient-text">{user?.name}</span>
        </h1>
        <p className="text-white/50 text-sm mt-1">Post real-world problem statements for student teams to solve.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass-card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center text-white flex-shrink-0`}>{kpi.icon}</div>
            <div>
              <div className="text-2xl font-bold text-white">{kpi.value}</div>
              <div className="text-sm text-white/50">{kpi.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">My Problem Statements</h2>
          <Link to="/industry/post" className="btn-primary text-sm py-2 px-4">+ Post New</Link>
        </div>
        {myProjects.length === 0 ? (
          <div className="text-center py-10">
            <Briefcase size={40} className="mx-auto text-white/20 mb-3" />
            <p className="text-white/40 text-sm">No problems posted yet.</p>
            <Link to="/industry/post" className="btn-primary text-sm mt-4 inline-block">Post Your First Problem</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myProjects.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div>
                  <div className="font-medium text-white">{p.title}</div>
                  <div className="text-xs text-white/40 mt-0.5">{p.domain} · {p.upvoteCount || 0} upvotes</div>
                </div>
                <span className={`badge ${p.status === 'APPROVED' ? 'badge-accent' : p.status === 'OPEN' ? 'badge-warning' : 'badge-primary'}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
