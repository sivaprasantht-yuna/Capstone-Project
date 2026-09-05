import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  LayoutDashboard, Lightbulb, Users, UserCheck,
  FolderKanban, MessageSquare, TrendingUp, Shield, User
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
import StudentProgressPage from './StudentProgressPage'
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

            // Map server team members
            const mappedMembers: TeamMember[] = (myTeam.members || [])
              .filter((m: any) => m.inviteStatus === 'ACCEPTED' || !m.inviteStatus)
              .map((m: any) => {
                const memberName = m.name || m.user?.name || 'Student'
                return {
                  id: (m.userId || m.user?.id || m.id)?.toString(),
                  name: memberName,
                  role: (m.roleInTeam === 'Team Lead' || m.roleInTeam === 'LEADER') ? 'LEADER' : 'MEMBER',
                  department: m.department || m.user?.department || 'Computer Science and Engineering',
                  rollNumber: m.rollNumber || m.user?.studentProfile?.rollNumber || `22CS${m.userId || m.user?.id || 1}`,
                  techRole: m.techRole || m.roleInTeam || 'Developer',
                  bio: m.bio || m.user?.studentProfile?.bio || '',
                  githubLink: m.githubLink || m.user?.studentProfile?.githubLink || '',
                  linkedinLink: m.linkedinLink || m.user?.studentProfile?.linkedinLink || '',
                  skills: Array.isArray(m.skills) && m.skills.length > 0
                    ? m.skills
                    : (m.user?.userSkills?.map((s: any) => s.skill?.skillName).filter(Boolean) || []),
                  avatarInitial: (memberName[0] || 'S').toUpperCase()
                }
              })

            const hasLeader = mappedMembers.some(m => m.role === 'LEADER')
            if (myTeam.status === 'DISSOLVED' || !hasLeader) {
              // Team leader went off or team dissolved -> remove team from state
              if (team.teamId) dispatch(clearTeam())
            } else {
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
            }
          } else {
            // User does not belong to any team
            if (team.teamId) dispatch(clearTeam())
          }
        })
        .catch(err => {
          if ((err.response?.status === 404 || err.response?.status === 400) && team.teamId) {
            dispatch(clearTeam())
          }
        })
    }
  }, [user?.userId, team.teamId, dispatch])

  // Build phase-grouped navigation matching concern-based architecture
  const NAV_ITEMS = [
    // ── Overview / Main ──
    { label: 'Dashboard',       href: '/student/dashboard',   icon: <LayoutDashboard size={18} /> },
    { label: 'Idea Repository', href: '/student/ideas',       icon: <Lightbulb size={18} /> },

    // ── Phase 1: SETUP ──
    {
      section: 'SETUP',
      label: team.teamId ? (team.teamName ?? 'My Team') : 'Team Formation',
      href: team.teamId ? '/student/team-portal' : '/student/team',
      icon: team.teamId ? <Shield size={18} /> : <Users size={18} />
    },
    {
      label: 'Mentor Matching',
      href: '/student/mentors',
      icon: <UserCheck size={18} />
    },

    // ── Phase 2: ACTIVE PROJECT ──
    {
      section: 'ACTIVE PROJECT',
      label: 'Workspace',
      href: '/student/workspace',
      icon: <FolderKanban size={18} />,
      badge: 'chat inside'
    },
    {
      label: 'Progress',
      href: '/student/progress',
      icon: <TrendingUp size={18} />
    },

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
        {/* Fold chat route seamlessly into workspace */}
        <Route path="chat"           element={<Navigate to="/student/workspace?tab=chat" replace />} />
        <Route path="progress"       element={<ProgressPortal />} />
        <Route path="progress/student/:studentId?" element={<StudentProgressPage />} />
      </Routes>
    </PortalLayout>
  )
}
