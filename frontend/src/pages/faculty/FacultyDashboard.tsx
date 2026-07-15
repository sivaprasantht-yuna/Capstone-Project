// Faculty Dashboard
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, ClipboardList, Star, TrendingUp, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import api from '../../lib/api'

export default function FacultyDashboard() {
  const { user } = useSelector((s: RootState) => s.auth)
  const [pending, setPending] = useState(0)
  const [active, setActive]   = useState(0)

  useEffect(() => {
    api.get('/mentorships/pending').then(r => setPending(r.data.length)).catch(() => {})
    api.get('/mentorships/active').then(r => setActive(r.data.length)).catch(() => {})
  }, [])

  const kpis = [
    { label: 'Pending Requests', value: pending, icon: <ClipboardList size={20} />, color: 'from-amber-600 to-orange-600', href: '/faculty/requests' },
    { label: 'Active Mentorships', value: active, icon: <Users size={20} />, color: 'from-emerald-600 to-teal-600', href: '/faculty/teams' },
    { label: 'Awaiting Grades', value: '—', icon: <Star size={20} />, color: 'from-primary-600 to-violet-600', href: '/faculty/grading' },
    { label: 'Avg. Rating', value: '—/5', icon: <TrendingUp size={20} />, color: 'from-pink-600 to-rose-600', href: '/faculty/profile' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome, <span className="gradient-text">{user?.name}</span>
        </h1>
        <p className="text-white/50 text-sm mt-1">Your mentorship overview for this semester.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Link to={kpi.href} className="glass-card-hover p-5 flex flex-col gap-3 block">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center text-white`}>{kpi.icon}</div>
              <div><div className="text-2xl font-bold text-white">{kpi.value}</div><div className="text-xs text-white/50">{kpi.label}</div></div>
            </Link>
          </motion.div>
        ))}
      </div>
      {pending > 0 && (
        <div className="glass-card p-5 border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <p className="text-amber-400 font-medium">⏳ {pending} pending mentorship {pending === 1 ? 'request' : 'requests'} awaiting your response</p>
            <Link to="/faculty/requests" className="btn-secondary text-sm flex items-center gap-1 py-2">
              Review <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
