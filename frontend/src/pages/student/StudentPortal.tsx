import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  LayoutDashboard, Lightbulb, Users, UserCheck,
  FolderKanban, MessageSquare, TrendingUp, Award, Shield, User
} from 'lucide-react'
import PortalLayout from '../../components/PortalLayout'
import StudentDashboard from './StudentDashboard'
import StudentProfilePage from './StudentProfilePage'
import IdeaRepository from './IdeaRepository'
import TeamFormation from './TeamFormation'
import CreateTeamPage from './CreateTeamPage'
import JoinTeamPage from './JoinTeamPage'
import TeamPortal from './TeamPortal'
import MentorMatching from './MentorMatching'
import ProjectWorkspace from './ProjectWorkspace'
import TeamChat from './TeamChat'
import ProgressPortal from './ProgressPortal'
import CertificatePage from './CertificatePage'
import { RootState } from '../../store'
import { setTeam, clearTeam, TeamMember } from '../../store/teamSlice'
import api from '../../lib/api'

export default function StudentPortal() {
  const dispatch = useDispatch()
  const team = useSelector((s: RootState) => s.team)
  const { user } = useSelector((s: RootState) => s.auth)

  // Verify and sync team membership directly from backend database
  useEffect(() => {
    if (user?.userId) {
      api.get('/teams/my')
        .then(res => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            const myTeam = res.data[0]
            const isLead = myTeam.members?.some(
              (m: any) => m.user?.id === user.userId && (m.roleInTeam === 'Team Lead' || m.roleInTeam === 'LEADER')
            ) || (myTeam.project?.postedBy?.id === user.userId)

            let domainList: string[] = []
            if (myTeam.project?.domain) {
              try {
                domainList = myTeam.project.domain.startsWith('[')
                  ? JSON.parse(myTeam.project.domain)
                  : [myTeam.project.domain]
              } catch {
                domainList = [myTeam.project.domain]
              }
            }

            let skillList: string[] = []
            if (myTeam.project?.techStack) {
              try {
                skillList = myTeam.project.techStack.startsWith('[')
                  ? JSON.parse(myTeam.project.techStack)
                  : myTeam.project.techStack.split(',').map((s: string) => s.trim())
              } catch {
                skillList = [myTeam.project.techStack]
              }
            }

            const mappedMembers: TeamMember[] = (myTeam.members || [])
              .filter((m: any) => m.inviteStatus === 'ACCEPTED' || !m.inviteStatus)
              .map((m: any) => ({
                id: m.user?.id?.toString() || m.id?.toString(),
                name: m.user?.name || 'Member',
                role: (m.roleInTeam === 'Team Lead' || m.roleInTeam === 'LEADER') ? 'LEADER' : 'MEMBER',
                department: m.user?.department || 'Engineering',
                rollNumber: m.user?.studentProfile?.rollNumber || `22CS${m.user?.id || 1}`,
                techRole: m.roleInTeam || 'Developer',
                skills: m.user?.userSkills?.map((s: any) => s.skill?.skillName).filter(Boolean) || [],
                avatarInitial: (m.user?.name?.[0] || 'U').toUpperCase()
              }))

            dispatch(setTeam({
              teamId: myTeam.id.toString(),
              teamName: myTeam.teamName,
              projectDomain: domainList,
              projectFocus: myTeam.project?.description || '',
              isLeader: !!isLead,
              leaderId: myTeam.project?.postedBy?.id?.toString() || null,
              members: mappedMembers,
              memberLimit: myTeam.project?.maxTeamSize || 4,
              currentMemberCount: mappedMembers.length,
              status: myTeam.status || 'RECRUITING',
              requiredSkills: skillList
            }))
          } else {
            // User does not belong to any team
            dispatch(clearTeam())
          }
        })
        .catch(() => {
          // If error occurs, keep local state
        })
    }
  }, [user?.userId, dispatch])

  // Build nav items dynamically based on team membership
  const NAV_ITEMS = [
    { label: 'Dashboard',       href: '/student/dashboard',   icon: <LayoutDashboard size={18} /> },
    { label: 'My Profile',      href: '/student/profile',     icon: <User size={18} /> },
    { label: 'Idea Repository', href: '/student/ideas',       icon: <Lightbulb size={18} /> },

    // ← Dynamic: Team Formation ↔ Team Name
    team.teamId
      ? { label: team.teamName ?? 'My Team', href: '/student/team-portal', icon: <Shield size={18} /> }
      : { label: 'Team Formation',           href: '/student/team',        icon: <Users size={18} /> },

    { label: 'Mentor Matching', href: '/student/mentors',    icon: <UserCheck size={18} /> },
    { label: 'Workspace',       href: '/student/workspace',  icon: <FolderKanban size={18} /> },
    { label: 'Team Chat',       href: '/student/chat',       icon: <MessageSquare size={18} /> },
    { label: 'Progress Portal', href: '/student/progress',   icon: <TrendingUp size={18} /> },
    { label: 'Certificate',     href: '/student/certificate',icon: <Award size={18} /> },
  ]

  return (
    <PortalLayout
      navItems={NAV_ITEMS}
      portalTitle="Student Portal"
      portalColor="from-primary-400 to-violet-400"
    >
      <Routes>
        <Route path="/"              element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"      element={<StudentDashboard />} />
        <Route path="profile"        element={<StudentProfilePage />} />
        <Route path="ideas"          element={<IdeaRepository />} />

        {/* Team Formation flow */}
        <Route path="team"           element={<TeamFormation />} />
        <Route path="team/create"    element={<CreateTeamPage />} />
        <Route path="team/join"      element={<JoinTeamPage />} />

        {/* Team Portal — private workspace */}
        <Route path="team-portal"    element={<TeamPortal />} />

        <Route path="mentors"        element={<MentorMatching />} />
        <Route path="workspace"      element={<ProjectWorkspace />} />
        <Route path="chat"           element={<TeamChat />} />
        <Route path="progress"       element={<ProgressPortal />} />
        <Route path="certificate"    element={<CertificatePage />} />
      </Routes>
    </PortalLayout>
  )
}
