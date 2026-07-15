import { Routes, Route, Navigate } from 'react-router-dom'
import {
  LayoutDashboard, Lightbulb, Users, UserCheck,
  FolderKanban, MessageSquare, Trophy, Award
} from 'lucide-react'
import PortalLayout from '../../components/PortalLayout'
import StudentDashboard from './StudentDashboard'
import IdeaRepository from './IdeaRepository'
import TeamFormation from './TeamFormation'
import MentorMatching from './MentorMatching'
import ProjectWorkspace from './ProjectWorkspace'
import TeamChat from './TeamChat'
import Leaderboard from './Leaderboard'
import CertificatePage from './CertificatePage'

const NAV_ITEMS = [
  { label: 'Dashboard',        href: '/student/dashboard',   icon: <LayoutDashboard size={18} /> },
  { label: 'Idea Repository',  href: '/student/ideas',       icon: <Lightbulb size={18} /> },
  { label: 'Team Formation',   href: '/student/team',        icon: <Users size={18} /> },
  { label: 'Mentor Matching',  href: '/student/mentors',     icon: <UserCheck size={18} /> },
  { label: 'Workspace',        href: '/student/workspace',   icon: <FolderKanban size={18} /> },
  { label: 'Team Chat',        href: '/student/chat',        icon: <MessageSquare size={18} /> },
  { label: 'Leaderboard',      href: '/student/leaderboard', icon: <Trophy size={18} /> },
  { label: 'Certificate',      href: '/student/certificate', icon: <Award size={18} /> },
]

export default function StudentPortal() {
  return (
    <PortalLayout
      navItems={NAV_ITEMS}
      portalTitle="Student Portal"
      portalColor="from-primary-400 to-violet-400"
    >
      <Routes>
        <Route path="/"            element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"    element={<StudentDashboard />} />
        <Route path="ideas"        element={<IdeaRepository />} />
        <Route path="team"         element={<TeamFormation />} />
        <Route path="mentors"      element={<MentorMatching />} />
        <Route path="workspace"    element={<ProjectWorkspace />} />
        <Route path="chat"         element={<TeamChat />} />
        <Route path="leaderboard"  element={<Leaderboard />} />
        <Route path="certificate"  element={<CertificatePage />} />
      </Routes>
    </PortalLayout>
  )
}
