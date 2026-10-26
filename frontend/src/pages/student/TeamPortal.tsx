import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Crown, MailOpen, UserPlus, X, Search, Send,
  CheckCircle, XCircle, Users, Shield, RefreshCw,
  BookOpen, Hash, Briefcase, Star, ChevronRight,
  Linkedin, Github, ExternalLink, Contact, Mail, AlertTriangle, Code2,
  LogOut, UserMinus, ShieldAlert
} from 'lucide-react'
import { RootState } from '../../store'
import { TeamMember, setTeam, clearTeam } from '../../store/teamSlice'
import toast from 'react-hot-toast'
import api from '../../lib/api'

// ─── Types ───────────────────────────────────────────────────────────────────
interface JoinRequest {
  id: string
  name: string
  department: string
  rollNumber: string
  skills: string[]
  requestedRole: string
  appliedAt: string
}

interface StudentSearchResult {
  id: string
  name: string
  department: string
  skills: string[]
  rollNumber: string
  avatarInitial: string
  bio?: string
  yearOfStudy?: number
  githubLink?: string
  linkedinLink?: string
}

interface StudentProfileFull extends StudentSearchResult {
  email?: string
  ideas: Array<{
    id: number
    title: string
    description: string
    domain: string
    techStack: string
    upvoteCount: number
    status: string
  }>
}

// ─── Popup Wrapper ────────────────────────────────────────────────────────────
function Popup({
  open, onClose, title, subtitle, icon, hideHeader, zIndex = 100, children
}: {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  hideHeader?: boolean
  zIndex?: number
  children: React.ReactNode
}) {
  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex }}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
        style={{ zIndex }}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex items-center justify-center w-full"
        style={{ zIndex: zIndex + 1 }}
      >
        <div
          className="relative flex flex-col overflow-hidden border border-slate-200 bg-white shadow-2xl rounded-3xl"
          style={{
            width: 'min(calc(100vw - 2rem), 860px)',
            height: 'min(80vh, 740px)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {!hideHeader && (
            /* Header */
            <div
              className="flex items-center justify-between px-4 sm:px-7 py-4 sm:py-5 border-b border-slate-200 flex-shrink-0 bg-slate-50/50"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs"
                  style={{ background: 'linear-gradient(135deg, #1a5fb4, #0d9488)' }}
                >
                  {icon}
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-base" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {title}
                  </h2>
                  {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClose()
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-7 no-scrollbar relative bg-white">
            {hideHeader && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClose()
                }}
                className="absolute top-5 right-5 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              >
                <X size={18} />
              </button>
            )}
            {children}
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}

// ─── Member Profile Popup ────────────────────────────────────────────────────
function MemberProfilePopup({
  member, onClose, currentUserIsLeader, onRemoveClick
}: {
  member: TeamMember | null
  onClose: () => void
  currentUserIsLeader: boolean
  onRemoveClick?: (member: TeamMember) => void
}) {
  const isLeader = member?.role === 'LEADER'
  const [profileData, setProfileData] = useState<StudentSearchResult & { email?: string; bio?: string } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!member?.id) {
      setProfileData(null)
      return
    }
    setLoading(true)
    api.get(`/teams/students/${member.id}/profile`)
      .then(res => {
        if (res.data) {
          setProfileData(res.data)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [member?.id])

  // Live profile data from backend API with robust fallbacks
  const name = profileData?.name || member?.name || 'Member'
  const dept = profileData?.department || member?.department || 'Engineering'
  const deptCode = dept.toLowerCase().includes('chem') ? 'CH' : dept.toLowerCase().includes('mech') ? 'MTR' : 'CS'
  const rollNo = profileData?.rollNumber || member?.rollNumber || `21${deptCode}104`
  const email = profileData?.email || (name ? `${name.toLowerCase().replace(/\s+/g, '.')}@bit.edu.in` : 'student@bit.edu.in')
  const bio = profileData?.bio || member?.bio || 'Passionate engineering student dedicated to innovation, technology, and collaborative team projects.'
  const rawSkills = (profileData?.skills && profileData.skills.length > 0)
    ? profileData.skills
    : ((member?.skills && member.skills.length > 0) ? member.skills : ['Python', 'FastAPI', 'React', 'PostgreSQL'])
  const skills: string[] = rawSkills
    .map((s: any) => (typeof s === 'string' ? s : s?.skillName || s?.name || 'Skill'))
    .filter(Boolean)
  const rawGithub = profileData?.githubLink?.trim() || member?.githubLink?.trim()
  const rawLinkedin = profileData?.linkedinLink?.trim() || member?.linkedinLink?.trim()
  const github = (rawGithub && rawGithub.length > 5) ? rawGithub : null
  const linkedin = (rawLinkedin && rawLinkedin.length > 5) ? rawLinkedin : null

  return (
    <Popup
      open={!!member}
      onClose={onClose}
      hideHeader={true}
    >
      {member && (
        <div className="space-y-5 animate-fade-in">
          {/* ── Hero Profile Banner ── */}
          <div
            className="relative overflow-hidden p-5 rounded-3xl border border-indigo-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5 bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-slate-50"
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-extrabold text-white shadow-md flex-shrink-0 border-2 border-white"
              style={isLeader
                ? { background: 'linear-gradient(135deg, #d97706, #f59e0b)' }
                : { background: 'linear-gradient(135deg, #1a5fb4, #6366f1)' }
              }
            >
              {member.avatarInitial || name[0]?.toUpperCase()}
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0 space-y-1">
              <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-2">
                <h3 className="text-xl font-extrabold text-slate-800 tracking-wide" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {name}
                </h3>
                {isLeader ? (
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <Crown size={12} /> Team Leader
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                    <Users size={12} /> {member.techRole || 'Team Member'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">{dept}</p>
              <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-mono text-primary-700 shadow-2xs">
                  {rollNo}
                </span>
              </div>
            </div>
          </div>

          {/* ── Info Grid (Reg No, Department, Email) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Reg No */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                <Contact size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Reg. No.</p>
                <p className="text-xs font-bold text-slate-800 truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {rollNo}
                </p>
              </div>
            </div>

            {/* Department */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                <BookOpen size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Department</p>
                <p className="text-xs font-bold text-slate-800 truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {dept}
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                <Mail size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Email ID</p>
                <p className="text-xs font-bold text-slate-800 truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {email}
                </p>
              </div>
            </div>
          </div>

          {/* ── About Me ── */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">About Me</p>
            <p className="text-xs text-slate-700 leading-relaxed">
              {bio}
            </p>
          </div>

          {/* ── Skills ── */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                <Star size={13} />
              </div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Technical Skills</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {skills.map((s, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-primary-50 border border-primary-100 text-primary-800 text-xs font-semibold flex items-center gap-2"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* ── LinkedIn & GitHub Links (Only shown when explicitly provided by user) ── */}
          {(linkedin || github) && (
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              {linkedin && (
                <a
                  href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-between px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-all text-xs font-semibold shadow-2xs"
                >
                  <span className="flex items-center gap-2">
                    <Linkedin size={15} className="text-blue-600" /> LinkedIn Profile
                  </span>
                  <ExternalLink size={13} />
                </a>
              )}

              {github && (
                <a
                  href={github.startsWith('http') ? github : `https://${github}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 hover:bg-slate-200 transition-all text-xs font-semibold shadow-2xs"
                >
                  <span className="flex items-center gap-2">
                    <Github size={15} className="text-slate-900" /> GitHub Profile
                  </span>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          )}

          {/* ── Governance Actions (Remove) ── */}
          {currentUserIsLeader && !isLeader && onRemoveClick && (
            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => {
                  onClose()
                  onRemoveClick(member)
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all"
              >
                <XCircle size={14} /> Remove Member
              </button>
            </div>
          )}
        </div>
      )}
    </Popup>
  )
}

// ─── Mailbox Popup ────────────────────────────────────────────────────────────
function MailboxPopup({
  open,
  onClose,
  isLeader,
  teamId,
  onCountChange,
}: {
  open: boolean
  onClose: () => void
  isLeader: boolean
  teamId: string
  onCountChange?: (n: number) => void
}) {
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !isLeader || !teamId) return

    const fetchRequests = (isInitial = false) => {
      if (isInitial) setLoading(true)
      api
        .get(`/teams/${teamId}/join-requests`)
        .then(res => {
          if (Array.isArray(res.data)) {
            setRequests(res.data)
            onCountChange?.(res.data.length)
          }
        })
        .catch(() => setRequests([]))
        .finally(() => { if (isInitial) setLoading(false) })
    }

    fetchRequests(true)
    const interval = setInterval(() => fetchRequests(false), 5000)
    return () => clearInterval(interval)
  }, [open, isLeader, teamId])


  const dispatch = useDispatch()

  const handleAccept = async (req: JoinRequest) => {
    setProcessing(req.id)
    try {
      await api.patch(`/teams/${teamId}/join-requests/${req.id}/respond?accept=true`)
      toast.success(`${req.name} accepted to the team! 🎉`)
      
      const res = await api.get('/teams/my')
      if (Array.isArray(res.data) && res.data.length > 0) {
        const myTeam = res.data[0]
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
          members: mappedMembers,
          currentMemberCount: mappedMembers.length
        }))
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to accept join request')
    }
    const next = requests.filter(r => r.id !== req.id)
    setRequests(next)
    onCountChange?.(next.length)
    setProcessing(null)
  }

  const handleReject = async (req: JoinRequest) => {
    setProcessing(req.id)
    try {
      await api.patch(`/teams/${teamId}/join-requests/${req.id}/respond?accept=false`)
      toast.error(`${req.name}'s request declined.`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to decline request')
    }
    const next = requests.filter(r => r.id !== req.id)
    setRequests(next)
    onCountChange?.(next.length)
    setProcessing(null)
  }

  return (
    <Popup
      open={open}
      onClose={onClose}
      title="Mailbox"
      subtitle={`${requests.length} pending join request${requests.length !== 1 ? 's' : ''}`}
      icon={<MailOpen size={17} className="text-white" />}
    >
      {!isLeader ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <Shield size={36} className="text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">Only the Team Leader can view join requests.</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <RefreshCw size={24} className="animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <MailOpen size={36} className="text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">No pending join requests.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <motion.div
              key={req.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-2xl border border-slate-200 p-5 bg-slate-50 shadow-2xs"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-xs"
                  style={{ background: 'linear-gradient(135deg, #1a5fb4, #0d9488)' }}
                >
                  {req.name?.[0] || 'S'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-slate-800 text-sm">{req.name}</span>
                    <span className="badge badge-primary text-xs">{req.requestedRole}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                    <span>{req.department}</span>
                    <span>·</span>
                    <span className="font-mono">{req.rollNumber}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(req.skills || []).map(s => <span key={s} className="badge badge-teal text-xs">{s}</span>)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-4 pt-4 border-t border-slate-200">
                <button
                  disabled={processing === req.id}
                  onClick={() => handleReject(req)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 transition-all"
                >
                  {processing === req.id ? <RefreshCw size={14} className="animate-spin" /> : <XCircle size={14} />}
                  Decline
                </button>
                <button
                  disabled={processing === req.id}
                  onClick={() => handleAccept(req)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-all"
                >
                  {processing === req.id ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  Accept
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Popup>
  )
}

// ─── Student Profile Modal ────────────────────────────────────────────────────
function StudentProfileModal({
  studentId,
  onClose,
}: {
  studentId: string | null
  onClose: () => void
}) {
  const [profile, setProfile] = useState<StudentProfileFull | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!studentId) { setProfile(null); return }
    setLoading(true)
    api.get(`/teams/students/${studentId}/profile`)
      .then(res => setProfile({ ...res.data, ideas: res.data.ideas || [] }))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [studentId])

  return (
    <Popup
      open={!!studentId}
      onClose={onClose}
      zIndex={120}
      title={profile?.name ?? 'Student Profile'}
      subtitle={profile?.department}
      icon={<Users size={17} className="text-white" />}
    >
      {loading ? (
        <div className="flex items-center justify-center h-60">
          <RefreshCw size={28} className="animate-spin text-slate-400" />
        </div>
      ) : !profile ? (
        <div className="flex flex-col items-center justify-center h-60 text-slate-400">
          <Users size={36} className="mb-3" />
          <p>Failed to load profile.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* ── Hero Profile Header ── */}
          <div className="flex items-center gap-5 p-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 shadow-2xs">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 shadow-md border-2 border-white"
              style={{ background: 'linear-gradient(135deg, #1a5fb4, #6366f1)' }}
            >
              {profile.avatarInitial || profile.name?.[0]?.toUpperCase() || 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-800 leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>{profile.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{profile.department}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {profile.rollNumber && (
                  <span className="badge badge-primary text-[11px] font-mono">
                    {profile.rollNumber}
                  </span>
                )}
                {profile.yearOfStudy && (
                  <span className="badge badge-teal text-[11px]">
                    Year {profile.yearOfStudy}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Details Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 flex-shrink-0">
                <Contact size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Reg. No.</p>
                <p className="text-xs font-semibold text-slate-800 truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {profile.rollNumber || 'N/A'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 flex-shrink-0">
                <Mail size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Email</p>
                <p className="text-xs font-semibold text-slate-800 truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {profile.email || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* ── Bio ── */}
          {profile.bio && (
            <div className="rounded-xl p-3.5 border border-slate-200 bg-slate-50">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">About</p>
              <p className="text-xs text-slate-700 leading-relaxed">
                {profile.bio}
              </p>
            </div>
          )}

          {/* ── Skills ── */}
          {profile.skills && profile.skills.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-2 font-semibold flex items-center gap-1">
                <Code2 size={12} /> Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((sk: any, idx: number) => {
                  const skillText = typeof sk === 'string' ? sk : sk?.skillName || sk?.name || 'Skill'
                  return (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-primary-50 border border-primary-100 text-primary-800 text-xs font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                      {skillText}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Links ── */}
          {(profile.githubLink || profile.linkedinLink) && (
            <div className="flex gap-2 pt-1">
              {profile.githubLink && (
                <a
                  href={profile.githubLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all text-xs font-semibold bg-slate-50"
                >
                  <span className="flex items-center gap-1.5">
                    <Github size={14} className="text-slate-800" /> GitHub
                  </span>
                  <ExternalLink size={13} />
                </a>
              )}
              {profile.linkedinLink && (
                <a
                  href={profile.linkedinLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-100 transition-all text-xs font-semibold bg-blue-50"
                >
                  <span className="flex items-center gap-1.5">
                    <Linkedin size={14} className="text-blue-600" /> LinkedIn
                  </span>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          )}

          {/* ── Idea Repository ── */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5 font-semibold">
              <Star size={11} /> Idea Repository
            </p>
            {profile.ideas.length === 0 ? (
              <div className="text-center py-6 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
                No ideas posted yet.
              </div>
            ) : (
              <div className="space-y-3">
                {profile.ideas.map(idea => (
                  <div
                    key={idea.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="font-semibold text-slate-800 text-sm leading-snug">{idea.title}</h4>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {idea.domain && (
                          <span className="badge badge-primary text-[10px]">{idea.domain}</span>
                        )}
                        <span className={`badge text-[10px] ${
                          idea.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : idea.status === 'REJECTED'
                            ? 'badge-danger'
                            : 'badge-accent'
                        }`}>
                          {idea.status === 'OPEN' || idea.status === 'PENDING_REVIEW' ? 'PENDING' : idea.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 mb-2">{idea.description}</p>
                    {idea.techStack && (
                      <div className="flex flex-wrap gap-1">
                        {idea.techStack.split(',').map((t, i) => (
                          <span key={i} className="badge badge-teal text-[10px]">{t.trim()}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                      <Star size={10} /> {idea.upvoteCount ?? 0} upvotes
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Popup>
  )
}

// ─── Add Members Popup ───────────────────────────────────────────────────────
function AddMembersPopup({
  open,
  onClose,
  isLeader,
  teamId,
}: {
  open: boolean
  onClose: () => void
  isLeader: boolean
  teamId: string
}) {
  const [query, setQuery]         = useState('')
  const [students, setStudents]   = useState<StudentSearchResult[]>([])
  const [loading, setLoading]     = useState(false)
  const [invited, setInvited]     = useState<Set<string>>(new Set())
  const [inviting, setInviting]   = useState<string | null>(null)
  const [viewProfileId, setViewProfileId] = useState<string | null>(null)

  // ── Standard JavaScript filtering for candidate name, roll, skills, department ──
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return students

    return students.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.rollNumber?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q) ||
      (s.skills && s.skills.some(sk => sk.toLowerCase().includes(q)))
    )
  }, [query, students])

  useEffect(() => {
    if (!open || !isLeader) return

    const fetch = (isInitial = false) => {
      if (isInitial) setLoading(true)
      api
        .get('/teams/available-students')
        .then(res => { if (Array.isArray(res.data)) setStudents(res.data) })
        .catch(() => setStudents([]))
        .finally(() => { if (isInitial) setLoading(false) })
    }

    fetch(true)
    const interval = setInterval(() => fetch(false), 10000) // refresh every 10s
    return () => clearInterval(interval)
  }, [open, isLeader])


  const handleInvite = async (s: StudentSearchResult) => {
    setInviting(s.id)
    try {
      await api.post(`/teams/${teamId}/invite/${s.id}`)
      setInvited(prev => new Set([...prev, s.id]))
      toast.success(`Invitation sent to ${s.name}!`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to send invite to ${s.name}`)
    } finally {
      setInviting(null)
    }
  }

  return (
    <>
      <Popup
        open={open}
        onClose={onClose}
        title="Add Members"
        subtitle={`${students.length} students not yet in a team`}
        icon={<UserPlus size={17} className="text-white" />}
      >
        {!isLeader ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Shield size={36} className="text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">Only the Team Leader can invite members.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Search bar */}
            <div className="relative">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name, roll number or skill..."
                className="input-dark pl-11"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Result count */}
            {query && !loading && (
              <p className="text-xs text-slate-500">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''} for <span className="text-primary-600 font-semibold">"{query}"</span>
              </p>
            )}

            {/* Results */}
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-10 text-slate-400">
                  <RefreshCw size={24} className="animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-slate-400 text-sm">
                  <Users size={32} className="text-slate-300" />
                  {query ? 'No students found matching your search.' : 'No students without a team found.'}
                </div>
              ) : filtered.map((s: StudentSearchResult) => {
                const isInvited = invited.has(s.id)
                return (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:border-slate-300 transition-all shadow-2xs"
                  >
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-xs"
                      style={{ background: 'linear-gradient(135deg, #1a5fb4, #0d9488)' }}
                    >
                      {s.avatarInitial || 'S'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800 text-sm">{s.name}</span>
                        <span className="text-xs text-slate-500 font-mono">{s.rollNumber}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-1.5">{s.department}</p>
                      <div className="flex flex-wrap gap-1">
                        {(s.skills || []).slice(0, 4).map((sk: string) => <span key={sk} className="badge badge-teal text-[10px]">{sk}</span>)}
                        {(s.skills?.length ?? 0) > 4 && (
                          <span className="text-[10px] text-slate-400">+{(s.skills?.length ?? 0) - 4} more</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* View Profile */}
                      <button
                        onClick={() => setViewProfileId(s.id)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all bg-white"
                        title="View student profile and ideas"
                      >
                        <ChevronRight size={13} /> View
                      </button>

                      {/* Invite */}
                      <button
                        disabled={isInvited || inviting === s.id}
                        onClick={() => handleInvite(s)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isInvited
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                            : 'btn-primary'
                        }`}
                      >
                        {inviting === s.id
                          ? <RefreshCw size={12} className="animate-spin" />
                          : isInvited
                          ? <><CheckCircle size={12} /> Invited</>
                          : <><Send size={12} /> Invite</>
                        }
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </Popup>

      {/* Student Profile Modal — opens on top of Add Members popup */}
      <StudentProfileModal
        studentId={viewProfileId}
        onClose={() => setViewProfileId(null)}
      />
    </>
  )
}

// ─── Dismantle Team Popup (Admin-Gated) ─────────────────────────────────────
function DismantleTeamPopup({
  open,
  onClose,
  teamId,
  onSuccess
}: {
  open: boolean
  onClose: () => void
  teamId: string
  onSuccess: () => void
}) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim() || reason.trim().length < 5) {
      toast.error('Please provide a detailed reason for dismantling the team (min 5 characters).')
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/teams/${teamId}/request-dismantle`, { reason: reason.trim() })
      toast.success('Team dismantle request submitted for Institutional Admin approval!')
      setReason('')
      onClose()
      onSuccess()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || err.response?.data?.message || 'Failed to submit dismantle request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Popup
      open={open}
      onClose={onClose}
      title="Request Team Dismantlement"
      subtitle="Requires Institutional Admin review & approval"
      icon={<AlertTriangle size={18} className="text-white" />}
    >
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1.5">
          <div className="font-bold flex items-center gap-1.5 text-rose-900">
            <AlertTriangle size={14} /> Governance Approval Required
          </div>
          <p>
            Dismantling this group requires administrative sign-off. Once approved by the Institutional Admin, the team will be dissolved and all members will be released.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Reason for Dismantling Group <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Please detail why the team should be dismantled (e.g., project change, schedule misalignment)..."
            rows={4}
            className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1 text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting || !reason.trim()}
            onClick={handleSubmit}
            className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {submitting ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
            Send Dismantle Request
          </button>
        </div>
      </div>
    </Popup>
  )
}

// ─── Leave Team Popup (Admin-Gated) ─────────────────────────────────────────
function LeaveTeamPopup({
  open,
  onClose,
  teamId,
  onSuccess
}: {
  open: boolean
  onClose: () => void
  teamId: string
  onSuccess: () => void
}) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim() || reason.trim().length < 5) {
      toast.error('Please provide a reason for leaving the team (min 5 characters).')
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/teams/${teamId}/request-leave`, { reason: reason.trim() })
      toast.success('Leave request submitted for Institutional Admin approval!')
      setReason('')
      onClose()
      onSuccess()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || err.response?.data?.message || 'Failed to submit leave request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Popup
      open={open}
      onClose={onClose}
      title="Request to Leave Team"
      subtitle="Requires Institutional Admin review & approval"
      icon={<LogOut size={18} className="text-white" />}
    >
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1.5">
          <div className="font-bold flex items-center gap-1.5 text-amber-900">
            <UserMinus size={14} /> Member Departure Process
          </div>
          <p>
            Leaving the team requires administrative sign-off. Once approved by the Institutional Admin, you will be removed from this team and free to join another.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Reason for Leaving Team <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Please detail why you wish to leave this team..."
            rows={4}
            className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1 text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting || !reason.trim()}
            onClick={handleSubmit}
            className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {submitting ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
            Send Leave Request
          </button>
        </div>
      </div>
    </Popup>
  )
}

// ─── Leader Card ─────────────────────────────────────────────────────────────
function LeaderCard({ member, onClick }: { member: TeamMember; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative cursor-pointer rounded-3xl p-6 overflow-hidden col-span-1 bg-gradient-to-br from-amber-50/90 via-amber-50/40 to-white border-2 border-amber-300 shadow-sm"
    >
      {/* Crown icon */}
      <div className="relative z-10 flex items-start justify-between mb-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-md"
          style={{
            background: 'linear-gradient(135deg, #d97706, #f59e0b)',
          }}
        >
          {member.avatarInitial || member.name[0]?.toUpperCase()}
        </div>
        <Crown size={22} className="text-amber-500 mt-1" />
      </div>

      <div className="relative z-10">
        <p className="font-bold text-slate-900 text-base mb-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {member.name}
        </p>
        <p className="text-xs text-slate-500 mb-3">{member.department}</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200"
          >
            <Crown size={11} /> Team Leader
          </span>
          {member.techRole && !['Team Leader', 'Team Lead', 'LEADER', 'Leader'].includes(member.techRole) && (
            <span className="badge badge-accent text-xs">{member.techRole}</span>
          )}
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1">
          {(member.skills ?? []).slice(0, 3).map(s => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full text-slate-600 border border-slate-200 bg-white shadow-2xs">
              {s}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-xs text-amber-700 font-semibold group-hover:text-amber-800 transition-colors">
          <span>View Profile</span>
          <ChevronRight size={12} />
        </div>
      </div>
    </motion.div>
  )
}

// ─── Member Card ─────────────────────────────────────────────────────────────
function MemberCard({ member, onClick }: { member: TeamMember; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer rounded-2xl p-5 border border-slate-200 bg-white shadow-xs hover:border-primary-300 hover:shadow-sm transition-all duration-200"
    >
      {/* Avatar */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base mb-3 shadow-xs"
        style={{ background: 'linear-gradient(135deg, #1a5fb4, #0d9488)' }}
      >
        {member.avatarInitial || member.name[0]?.toUpperCase()}
      </div>

      <p className="font-bold text-slate-800 text-sm mb-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
        {member.name}
      </p>
      <p className="text-xs text-slate-500 mb-3">{member.department}</p>

      {/* Role badge */}
      {member.techRole && (
        <span className="badge badge-primary text-xs mb-3 inline-flex">{member.techRole}</span>
      )}

      {/* Skills */}
      <div className="flex flex-wrap gap-1">
        {(member.skills ?? []).slice(0, 2).map(s => (
          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full text-slate-600 border border-slate-200 bg-slate-50">
            {s}
          </span>
        ))}
        {(member.skills?.length ?? 0) > 2 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full text-slate-400 border border-slate-200 bg-slate-50">
            +{(member.skills?.length ?? 0) - 2}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1 text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors">
        <span>View Profile</span>
        <ChevronRight size={11} />
      </div>
    </motion.div>
  )
}

// ─── Team Portal Main ────────────────────────────────────────────────────────
export default function TeamPortal() {
  const navigate  = useNavigate()
  const dispatch  = useDispatch()
  const team      = useSelector((s: RootState) => s.team)

  const [mailboxOpen,    setMailboxOpen]    = useState(false)
  const [addMembersOpen, setAddMembersOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [pendingCount,   setPendingCount]   = useState(0)
  const [dismantleTeamOpen, setDismantleTeamOpen] = useState(false)
  const [leaveTeamOpen, setLeaveTeamOpen] = useState(false)
  const [removeMemberTarget, setRemoveMemberTarget] = useState<TeamMember | null>(null)
  // ── Helper: fetch latest team state from backend and sync to Redux ──
  const refreshTeam = useCallback(async () => {
    try {
      const res = await api.get('/teams/my')
      if (Array.isArray(res.data) && res.data.length > 0) {
        const myTeam = res.data[0]
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
          dispatch(clearTeam())
          navigate('/student/team', { replace: true })
          return
        }

        dispatch(setTeam({
          teamId: myTeam.id.toString(),
          teamName: myTeam.teamName,
          members: mappedMembers,
          currentMemberCount: mappedMembers.length
        }))
      } else {
        dispatch(clearTeam())
        navigate('/student/team', { replace: true })
      }
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.status === 400) {
        dispatch(clearTeam())
        navigate('/student/team', { replace: true })
      }
    }
  }, [dispatch, navigate])

  // ── Initial load & Real-time polling: refresh team + pending count ──
  useEffect(() => {
    refreshTeam()

    const interval = setInterval(() => {
      refreshTeam()
      if (team.isLeader && team.teamId) {
        api.get(`/teams/${team.teamId}/join-requests`)
          .then(r => { if (Array.isArray(r.data)) setPendingCount(r.data.length) })
          .catch(() => {})
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [team.teamId, team.isLeader, refreshTeam])

  // Redirect non-members
  useEffect(() => {
    if (!team.teamId) {
      navigate('/student/team', { replace: true })
    }
  }, [team.teamId, navigate])

  const leader  = team.members.find(m => m.role === 'LEADER')
  const members = team.members.filter(m => m.role !== 'LEADER')

  if (!team.teamId || !leader) return null

  const spotsLeft = team.memberLimit - team.currentMemberCount

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-12 space-y-8">

      {/* ── Portal Header ──────────────────────────────────────────────── */}
      <div
        className="relative rounded-3xl overflow-hidden border border-blue-100 bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-slate-50 shadow-xs"
      >
        <div className="relative z-10 p-7 sm:p-9">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            {/* Left: team info */}
            <div className="flex-1 min-w-0">
              {/* Team badge */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-xs"
                  style={{ background: 'linear-gradient(135deg, #1a5fb4, #0d9488)' }}
                >
                  {team.teamName?.[0]}
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-primary-700">
                  Team Portal
                </span>
              </div>

              {/* Team name */}
              <h1
                className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3 leading-tight"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {team.teamName}
              </h1>

              {/* Project focus */}
              {team.projectFocus && (
                <p className="text-slate-600 text-sm leading-relaxed max-w-xl mb-5">
                  {team.projectFocus}
                </p>
              )}

              {/* Meta chips */}
              <div className="flex flex-wrap gap-2">
                {team.projectDomain.map(d => (
                  <span key={d} className="badge badge-teal">{d}</span>
                ))}
                <span className="badge badge-primary">
                  {team.currentMemberCount} / {team.memberLimit} Members
                </span>
                {team.status && (
                  <span className={`badge ${
                    team.currentMemberCount >= team.memberLimit || team.status === 'FULL' || team.status === 'LOCKED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
                      : 'badge-accent'
                  }`}>
                    {team.currentMemberCount >= team.memberLimit || team.status === 'FULL' ? 'FULL' : team.status}
                  </span>
                )}
              </div>
            </div>

            {/* Right: action buttons */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Mailbox */}
              <div className="relative group">
                <button
                  id="team-mailbox-btn"
                  onClick={() => setMailboxOpen(true)}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-primary-500/50 hover:bg-slate-50 bg-white shadow-2xs transition-all"
                >
                  <MailOpen size={20} />
                </button>
                {team.isLeader && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                    style={{ background: '#ef4444' }}>
                    {pendingCount}
                  </span>
                )}
                <div className="absolute right-0 top-full mt-2 px-2.5 py-1 bg-slate-800 text-white text-xs rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                  Mailbox
                </div>
              </div>

              {/* Add Members */}
              <div className="relative group">
                <button
                  id="team-add-members-btn"
                  onClick={() => setAddMembersOpen(true)}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-teal/50 hover:bg-slate-50 bg-white shadow-2xs transition-all"
                >
                  <UserPlus size={20} />
                </button>
                <div className="absolute right-0 top-full mt-2 px-2.5 py-1 bg-slate-800 text-white text-xs rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                  Add Members
                </div>
              </div>

              {/* Dismantle Team (Leader only) */}
              {team.isLeader ? (
                <div className="relative group">
                  <button
                    id="team-dismantle-btn"
                    onClick={() => setDismantleTeamOpen(true)}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center border border-red-200 text-red-600 hover:text-red-700 hover:border-red-300 hover:bg-red-50 bg-white shadow-2xs transition-all ml-1"
                  >
                    <AlertTriangle size={20} />
                  </button>
                  <div className="absolute right-0 top-full mt-2 px-2.5 py-1 bg-slate-800 text-white text-xs rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                    Request Team Dismantle
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <button
                    id="team-leave-btn"
                    onClick={() => setLeaveTeamOpen(true)}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center border border-amber-200 text-amber-600 hover:text-amber-700 hover:border-amber-300 hover:bg-amber-50 bg-white shadow-2xs transition-all ml-1"
                  >
                    <LogOut size={20} />
                  </button>
                  <div className="absolute right-0 top-full mt-2 px-2.5 py-1 bg-slate-800 text-white text-xs rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                    Request to Leave Team
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Status Banner for Pending Dismantle Request ───────────────── */}
      {team.status === 'DISMANTLE_REQUESTED' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-semibold flex items-center gap-3 animate-pulse">
          <ShieldAlert size={18} className="text-amber-600 flex-shrink-0" />
          <span>A team dissolution request has been submitted and is currently <strong>Pending Institutional Admin Approval</strong>.</span>
        </div>
      )}

      {/* ── Members Section ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Team Members
          </h2>
          <span className="text-xs text-slate-500">
            {team.currentMemberCount} member{team.currentMemberCount !== 1 ? 's' : ''}
            {spotsLeft > 0 && ` · ${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} open`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Leader always first */}
          {leader && (
            <LeaderCard
              member={leader}
              onClick={() => setSelectedMember(leader)}
            />
          )}

          {/* Member cards */}
          {members.map(m => (
            <MemberCard
              key={m.id}
              member={m}
              onClick={() => setSelectedMember(m)}
            />
          ))}

          {/* Open slots — show up to 3 placeholders */}
          {spotsLeft > 0 && Array.from({ length: Math.min(spotsLeft, 3) }).map((_, i) => (
            <motion.div
              key={`slot-${i}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (members.length + i) * 0.05 }}
              onClick={() => team.isLeader && setAddMembersOpen(true)}
              className={`rounded-2xl p-5 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 min-h-[140px] bg-slate-50/50 ${
                team.isLeader ? 'cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all' : ''
              }`}
            >
              <UserPlus size={20} className="text-slate-400" />
              <span className="text-xs text-slate-500 text-center font-medium">
                {team.isLeader ? 'Invite a member' : 'Open slot'}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Required Skills ───────────────────────────────────────────── */}
      {team.requiredSkills.length > 0 && (
        <div
          className="rounded-3xl p-6 border border-slate-200 bg-white shadow-xs"
        >
          <h3 className="font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <Star size={16} className="text-primary-600" />
            Team Required Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {team.requiredSkills.map(s => (
              <span key={s} className="badge badge-accent">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* ─── Popups ───────────────────────────────────────────────────── */}
      <MailboxPopup
        open={mailboxOpen}
        onClose={() => setMailboxOpen(false)}
        isLeader={team.isLeader}
        teamId={team.teamId}
        onCountChange={n => setPendingCount(n)}
      />

      <AddMembersPopup
        open={addMembersOpen}
        onClose={() => setAddMembersOpen(false)}
        isLeader={team.isLeader}
        teamId={team.teamId}
      />

      <MemberProfilePopup
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        currentUserIsLeader={team.isLeader}
        onRemoveClick={(m) => setRemoveMemberTarget(m)}
      />

      <DismantleTeamPopup
        open={dismantleTeamOpen}
        onClose={() => setDismantleTeamOpen(false)}
        teamId={team.teamId}
        onSuccess={refreshTeam}
      />

      <LeaveTeamPopup
        open={leaveTeamOpen}
        onClose={() => setLeaveTeamOpen(false)}
        teamId={team.teamId}
        onSuccess={refreshTeam}
      />
    </div>
  )
}
