import { Routes, Route, Navigate } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, Eye } from 'lucide-react'
import PortalLayout from '../../components/PortalLayout'
import IndustryDashboard from './IndustryDashboard'
import PostProblem from './PostProblem'
import ViewSubmissions from './ViewSubmissions'

const NAV_ITEMS = [
  { label: 'Dashboard',        href: '/industry/dashboard',    icon: <LayoutDashboard size={18} /> },
  { label: 'Post Problem',     href: '/industry/post',         icon: <PlusCircle size={18} /> },
  { label: 'View Submissions', href: '/industry/submissions',  icon: <Eye size={18} /> },
]

export default function IndustryPortal() {
  return (
    <PortalLayout
      navItems={NAV_ITEMS}
      portalTitle="Industry Portal"
      portalColor="from-pink-400 to-rose-400"
    >
      <Routes>
        <Route path="/"           element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"   element={<IndustryDashboard />} />
        <Route path="post"        element={<PostProblem />} />
        <Route path="submissions" element={<ViewSubmissions />} />
      </Routes>
    </PortalLayout>
  )
}
