import { Routes, Route, Navigate } from 'react-router-dom'
import { LayoutDashboard, BarChart3, AlertTriangle, FolderCheck, Users } from 'lucide-react'
import PortalLayout from '../../components/PortalLayout'
import AdminDashboard from './AdminDashboard'
import AnalyticsPage from './AnalyticsPage'
import AtRiskTeams from './AtRiskTeams'
import ProjectApprovals from './ProjectApprovals'
import AllTeams from './AllTeams'

const NAV_ITEMS = [
  { label: 'Overview',         href: '/admin/dashboard',   icon: <LayoutDashboard size={18} /> },
  { label: 'Analytics',        href: '/admin/analytics',   icon: <BarChart3 size={18} /> },
  { label: 'At-Risk Teams',    href: '/admin/atrisk',      icon: <AlertTriangle size={18} /> },
  { label: 'Project Approvals',href: '/admin/approvals',   icon: <FolderCheck size={18} /> },
  { label: 'All Teams',        href: '/admin/teams',       icon: <Users size={18} /> },
]

export default function AdminPortal() {
  return (
    <PortalLayout
      navItems={NAV_ITEMS}
      portalTitle="Admin Dashboard"
      portalColor="from-amber-400 to-orange-400"
    >
      <Routes>
        <Route path="/"          element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"  element={<AdminDashboard />} />
        <Route path="analytics"  element={<AnalyticsPage />} />
        <Route path="atrisk"     element={<AtRiskTeams />} />
        <Route path="approvals"  element={<ProjectApprovals />} />
        <Route path="teams"      element={<AllTeams />} />
      </Routes>
    </PortalLayout>
  )
}
