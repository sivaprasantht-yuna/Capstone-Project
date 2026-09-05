import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Users, FolderKanban, AlertTriangle, Award, TrendingUp, UserCheck, Download, FileSpreadsheet } from 'lucide-react'
import toast from 'react-hot-toast'
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
  const [exporting, setExporting] = useState(false)

  const handleExportGradeSheet = async () => {
    setExporting(true)
    try {
      const res = await api.get('/admin/grades/export', { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `capstone_cohort_grades_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Cohort grade sheet exported successfully!')
    } catch (err: any) {
      toast.error('Failed to export grade sheet.')
    } finally {
      setExporting(false)
    }
  }

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
          <div className="w-10 h-10 border-2 border-primary-500/30 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Overview</h1>
          <p className="text-slate-500 text-sm mt-0.5">Semester-wide capstone project analytics & records</p>
        </div>
        <button
          onClick={handleExportGradeSheet}
          disabled={exporting}
          className="btn-primary flex items-center gap-2 text-xs py-2 px-3.5 shadow-xs font-semibold"
        >
          <Download size={15} />
          {exporting ? 'Generating CSV...' : 'Export Grade Sheet (CSV)'}
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card p-4 flex flex-col gap-3 shadow-xs hover:border-slate-300 transition-all"
          >
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center text-white shadow-xs`}>
              {kpi.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{kpi.value}</div>
              <div className="text-xs text-slate-500 font-medium">{kpi.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Domain Distribution Pie */}
        <div className="card p-6 shadow-xs">
          <h2 className="font-semibold text-slate-800 mb-4">Project Domain Distribution</h2>
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
                  contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#1e293b' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">No domain data yet</div>
          )}
        </div>

        {/* Department Participation Bar */}
        <div className="card p-6 shadow-xs">
          <h2 className="font-semibold text-slate-800 mb-4">Department Participation</h2>
          {deptChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="dept" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#1e293b' }}
                  cursor={{ fill: 'rgba(26,95,180,0.06)' }}
                />
                <Bar dataKey="count" fill="#1a5fb4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">No participation data yet</div>
          )}
        </div>
      </div>

      {/* Mentor Load Distribution */}
      {stats && stats.mentorLoadDistribution.length > 0 && (
        <div className="card p-6 shadow-xs">
          <h2 className="font-semibold text-slate-800 mb-4">Mentor Workload Distribution</h2>
          <div className="space-y-3">
            {stats.mentorLoadDistribution.map((mentor, i) => (
              <motion.div
                key={mentor.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-4"
              >
                <div className="w-36 text-sm text-slate-700 font-medium text-right flex-shrink-0 truncate">{mentor.name}</div>
                <div className="flex-1 match-bar bg-slate-100">
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
                <div className="text-xs text-slate-500 w-20 flex-shrink-0">
                  {mentor.currentLoad}/{mentor.maxCapacity} teams
                </div>
                <span className={`badge ${mentor.utilizationPct > 80 ? 'badge-danger' : mentor.utilizationPct > 50 ? 'badge-warning' : 'badge-teal'}`}>
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
