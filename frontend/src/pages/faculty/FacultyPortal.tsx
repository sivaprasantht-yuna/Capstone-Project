import { Routes, Route, Navigate } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, Users, Star, BookOpen } from 'lucide-react'
import PortalLayout from '../../components/PortalLayout'
import FacultyDashboard from './FacultyDashboard'
import MentorshipRequests from './MentorshipRequests'
import ActiveTeams from './ActiveTeams'
import FacultyProfile from './FacultyProfile'
import GradingPage from './GradingPage'

const NAV_ITEMS = [
  { label: 'Dashboard',       href: '/faculty/dashboard',  icon: <LayoutDashboard size={18} /> },
  { label: 'Mentor Requests', href: '/faculty/requests',   icon: <ClipboardList size={18} /> },
  { label: 'Active Teams',    href: '/faculty/teams',      icon: <Users size={18} /> },
  { label: 'Grading',         href: '/faculty/grading',    icon: <Star size={18} /> },
  { label: 'My Profile',      href: '/faculty/profile',    icon: <BookOpen size={18} /> },
]

export default function FacultyPortal() {
  return (
    <PortalLayout
      navItems={NAV_ITEMS}
      portalTitle="Faculty Portal"
      portalColor="from-emerald-400 to-teal-400"
    >
      <Routes>
        <Route path="/"          element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"  element={<FacultyDashboard />} />
        <Route path="requests"   element={<MentorshipRequests />} />
        <Route path="teams"      element={<ActiveTeams />} />
        <Route path="grading"    element={<GradingPage />} />
        <Route path="profile"    element={<FacultyProfile />} />
      </Routes>
    </PortalLayout>
  )
}
