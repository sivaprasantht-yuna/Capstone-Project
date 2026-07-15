import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Users, FolderKanban, AlertTriangle, Award, TrendingUp, UserCheck } from 'lucide-react'
import api from '../../lib/api'

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#8b5cf6', '#14b8a6']

interface OverviewStats {
  totalStudents: number
  totalFaculty: number
  totalProjects: number
  totalTeams: number
  activeTeams: number
  completedTeams: number
  atRiskTeams: number
  domainDistribution: Record<string, number>
  mentorLoadDistribution: { name: string; currentLoad: number; maxCapacity: number; utilizationPct: number }[]
  departmentParticipation: Record<string, number>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/analytics/overview')
      .then(r => setStats(r.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  const kpis = stats ? [
    { label: 'Total Students',  value: stats.totalStudents,   icon: <Users size={20} />,      color: 'from-primary-600 to-violet-600' },
    { label: 'Active Teams',    value: stats.activeTeams,     icon: <FolderKanban size={20} />, color: 'from-emerald-600 to-teal-600' },
    { label: 'At-Risk Teams',   value: stats.atRiskTeams,     icon: <AlertTriangle size={20} />, color: 'from-amber-600 to-orange-600' },
    { label: 'Completed',       value: stats.completedTeams,  icon: <Award size={20} />,        color: 'from-pink-600 to-rose-600' },
    { label: 'Total Faculty',   value: stats.totalFaculty,    icon: <UserCheck size={20} />,    color: 'from-cyan-600 to-blue-600' },
    { label: 'Total Projects',  value: stats.totalProjects,   icon: <TrendingUp size={20} />,   color: 'from-violet-600 to-purple-600' },
  ] : []

  const domainChartData = stats ? Object.entries(stats.domainDistribution).map(([name, value]) => ({ name, value })) : []
  const deptChartData  = stats ? Object.entries(stats.departmentParticipation).map(([dept, count]) => ({ dept, count })) : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/50 text-sm">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
        <p className="text-white/50 text-sm mt-1">Semester-wide capstone project analytics</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-card p-4 flex flex-col gap-3"
          >
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center text-white`}>
              {kpi.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{kpi.value}</div>
              <div className="text-xs text-white/40">{kpi.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Domain Distribution Pie */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-white mb-4">Project Domain Distribution</h2>
          {domainChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={domainChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value" nameKey="name"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {domainChartData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12 }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-white/30 text-sm">No domain data yet</div>
          )}
        </div>

        {/* Department Participation Bar */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-white mb-4">Department Participation</h2>
          {deptChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="dept" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12 }}
                  itemStyle={{ color: '#f1f5f9' }}
                  cursor={{ fill: 'rgba(99,102,241,0.1)' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-white/30 text-sm">No participation data yet</div>
          )}
        </div>
      </div>

      {/* Mentor Load Distribution */}
      {stats && stats.mentorLoadDistribution.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="font-semibold text-white mb-4">Mentor Workload Distribution</h2>
          <div className="space-y-3">
            {stats.mentorLoadDistribution.map((mentor, i) => (
              <motion.div
                key={mentor.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-4"
              >
                <div className="w-36 text-sm text-white/70 text-right flex-shrink-0 truncate">{mentor.name}</div>
                <div className="flex-1 match-bar">
                  <motion.div
                    className="match-bar-fill h-full rounded-full"
                    style={{
                      background: mentor.utilizationPct > 80 ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                               : mentor.utilizationPct > 50 ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                               : 'linear-gradient(90deg, #10b981, #06b6d4)',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(mentor.utilizationPct, 100)}%` }}
                    transition={{ delay: i * 0.06 + 0.3, duration: 0.6 }}
                  />
                </div>
                <div className="text-xs text-white/50 w-20 flex-shrink-0">
                  {mentor.currentLoad}/{mentor.maxCapacity} teams
                </div>
                <span className={`badge ${mentor.utilizationPct > 80 ? 'badge-danger' : mentor.utilizationPct > 50 ? 'badge-warning' : 'badge-accent'}`}>
                  {mentor.utilizationPct.toFixed(0)}%
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
