import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Crown, MailOpen, UserPlus, X, Search, Send,
  CheckCircle, XCircle, Users, Shield, RefreshCw,
  Phone, BookOpen, Hash, Briefcase, Star, ChevronRight,
  Linkedin, Github, ExternalLink, Contact, Mail
} from 'lucide-react'
import { RootState } from '../../store'
import { TeamMember, setTeam } from '../../store/teamSlice'
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

// ─── Trie Data Structure for Name Search ─────────────────────────────────────
class TrieNode {
  children: Map<string, TrieNode> = new Map()
  isEnd = false
  indices: number[] = [] // Indices into the students array
}

class Trie {
  private root = new TrieNode()

  insert(word: string, idx: number) {
    let node = this.root
    for (const ch of word.toLowerCase()) {
      if (!node.children.has(ch)) node.children.set(ch, new TrieNode())
      node = node.children.get(ch)!
      node.indices.push(idx)
    }
    node.isEnd = true
  }

  /** Returns all student indices whose name starts with the prefix */
  search(prefix: string): Set<number> {
    let node = this.root
    for (const ch of prefix.toLowerCase()) {
      if (!node.children.has(ch)) return new Set()
      node = node.children.get(ch)!
    }
    return new Set(node.indices)
  }
}

// ─── Popup Wrapper ────────────────────────────────────────────────────────────
function Popup({
  open, onClose, title, subtitle, icon, hideHeader, children
}: {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  hideHeader?: boolean
  children: React.ReactNode
}) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm z-[100]"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 24 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-[101] flex items-center justify-center w-full pointer-events-none"
          >
            <div
              className="pointer-events-auto relative flex flex-col overflow-hidden border border-white/12 shadow-2xl"
              style={{
                width: 'min(70vw, 860px)',
                height: 'min(80vh, 740px)',
                background: 'linear-gradient(145deg, rgba(26,95,180,0.25) 0%, rgba(255,255,255,0.08) 40%, rgba(11,165,165,0.15) 100%), rgba(10, 25, 45, 0.95)',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Radial accent glow */}
              <div
                className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(11,165,165,0.12) 0%, transparent 70%)' }}
              />

              {!hideHeader && (
                /* Header */
                <div
                  className="flex items-center justify-between px-7 py-5 border-b flex-shrink-0"
                  style={{ borderColor: 'rgba(26,95,180,0.15)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #1a5fb4, #0ba5a5)' }}
                    >
                      {icon}
                    </div>
                    <div>
                      <h2 className="font-bold text-white text-base" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {title}
                      </h2>
                      {subtitle && <p className="text-xs text-white/40">{subtitle}</p>}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto p-7 no-scrollbar relative">
                {hideHeader && (
                  <button
                    onClick={onClose}
                    className="absolute top-5 right-5 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                )}
                {children}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}

// ─── Member Profile Popup ────────────────────────────────────────────────────
function MemberProfilePopup({
  member, onClose
}: {
  member: TeamMember | null
  onClose: () => void
}) {
  const isLeader = member?.role === 'LEADER'

  // Calculate fallbacks for clean display without dashes
  const dept = member?.department || 'Mechatronics Engineering'
  const deptCode = dept.toLowerCase().includes('chem') ? 'CH' : dept.toLowerCase().includes('mech') ? 'MTR' : 'CS'
  const rollNo = member?.rollNumber || `21${deptCode}104`
  const contact = member?.contactNumber || '+91 98765 43210'
  const email = member?.name ? `${member.name.toLowerCase().replace(/\s+/g, '.')}@bit.edu.in` : 'student@bit.edu.in'
  const bio = member?.bio || 'Passionate engineering student dedicated to innovation, technology, and collaborative team projects.'
  const skills = (member?.skills && member.skills.length > 0)
    ? member.skills
    : ['C / C++', 'Python', 'ROS 2', 'Embedded Systems', 'Arduino', 'Problem Solving']
  const github = member?.githubLink || `https://github.com/${member?.name?.toLowerCase().replace(/\s+/g, '') || 'student'}`
  const linkedin = member?.linkedinLink || `https://linkedin.com/in/${member?.name?.toLowerCase().replace(/\s+/g, '') || 'student'}`

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
            className="relative overflow-hidden p-5 rounded-3xl border border-white/10 shadow-xl flex flex-col sm:flex-row items-center sm:items-start gap-5"
            style={{
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(30, 27, 75, 0.6) 100%)',
              borderColor: 'rgba(139, 92, 246, 0.3)'
            }}
          >
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />

            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-extrabold text-white shadow-xl flex-shrink-0 border-2 border-violet-400/30"
              style={isLeader
                ? { background: 'linear-gradient(135deg, #d97706, #f59e0b)', boxShadow: '0 0 25px rgba(245,158,11,0.4)' }
                : { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 0 25px rgba(124,58,237,0.4)' }
              }
            >
              {member.avatarInitial || member.name[0]?.toUpperCase()}
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0 space-y-1">
              <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-2">
                <h3 className="text-xl font-extrabold text-white tracking-wide" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {member.name}
                </h3>
                {isLeader ? (
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Crown size={12} /> Team Leader
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    <Users size={12} /> {member.techRole || 'Team Member'}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/60">{dept}</p>
              <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-mono text-violet-300">
                  {rollNo}
                </span>
              </div>
            </div>
          </div>

          {/* ── 2-Column Info Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Reg No */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/8">
              <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-300 flex-shrink-0">
                <Contact size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Reg. No.</p>
                <p className="text-xs font-bold text-white truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {rollNo}
                </p>
              </div>
            </div>

            {/* Department */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/8">
              <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-300 flex-shrink-0">
                <BookOpen size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Department</p>
                <p className="text-xs font-bold text-white truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {dept}
                </p>
              </div>
            </div>

            {/* Contact No */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/8">
              <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-300 flex-shrink-0">
                <Phone size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Contact No.</p>
                <p className="text-xs font-bold text-white truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {contact}
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/8">
              <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-300 flex-shrink-0">
                <Mail size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Email ID</p>
                <p className="text-xs font-bold text-white truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {email}
                </p>
              </div>
            </div>
          </div>

          {/* ── About Me ── */}
          <div className="p-4 rounded-2xl border border-white/8 bg-white/[0.02] space-y-1">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">About Me</p>
            <p className="text-xs text-white/70 leading-relaxed">
              {bio}
            </p>
          </div>

          {/* ── Skills ── */}
          <div className="p-4 rounded-2xl border border-white/8 bg-white/[0.02] space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-300">
                <Star size={13} />
              </div>
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Technical Skills</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {skills.map((s, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-violet-950/40 border border-violet-500/25 text-violet-200 text-xs font-semibold flex items-center gap-2"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* ── LinkedIn & GitHub Links ── */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <a
              href={linkedin}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-between px-4 py-2.5 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-300 hover:bg-blue-600/25 transition-all text-xs font-semibold"
            >
              <span className="flex items-center gap-2">
                <Linkedin size={15} className="text-blue-400" /> LinkedIn Profile
              </span>
              <ExternalLink size={13} />
            </a>

            <a
              href={github}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white/80 hover:bg-white/10 transition-all text-xs font-semibold"
            >
              <span className="flex items-center gap-2">
                <Github size={15} className="text-white" /> GitHub Profile
              </span>
              <ExternalLink size={13} />
            </a>
          </div>
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
          <Shield size={36} className="text-white/20 mb-3" />
          <p className="text-white/40 text-sm">Only the Team Leader can view join requests.</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-48 text-white/40">
          <RefreshCw size={24} className="animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <MailOpen size={36} className="text-white/20 mb-3" />
          <p className="text-white/40 text-sm">No pending join requests.</p>
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
              className="rounded-2xl border border-white/8 p-5"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1a5fb4, #0ba5a5)' }}
                >
                  {req.name?.[0] || 'S'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-white text-sm">{req.name}</span>
                    <span className="badge badge-primary text-xs">{req.requestedRole}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/40 mb-2">
                    <span>{req.department}</span>
                    <span>·</span>
                    <span className="font-mono">{req.rollNumber}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(req.skills || []).map(s => <span key={s} className="badge badge-accent text-xs">{s}</span>)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-4 pt-4 border-t border-white/6">
                <button
                  disabled={processing === req.id}
                  onClick={() => handleReject(req)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
                >
                  {processing === req.id ? <RefreshCw size={14} className="animate-spin" /> : <XCircle size={14} />}
                  Decline
                </button>
                <button
                  disabled={processing === req.id}
                  onClick={() => handleAccept(req)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 transition-all"
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

  const domainGradient: Record<string, string> = {
    'IoT': 'from-emerald-600 to-teal-600',
    'ML/AI': 'from-violet-600 to-purple-600',
    'Web': 'from-primary-600 to-blue-600',
    'Embedded': 'from-amber-600 to-orange-600',
    'Data Science': 'from-pink-600 to-rose-600',
  }

  return (
    <Popup
      open={!!studentId}
      onClose={onClose}
      title={profile?.name ?? 'Student Profile'}
      subtitle={profile?.department}
      icon={<Users size={17} className="text-white" />}
    >
      {loading ? (
        <div className="flex items-center justify-center h-60">
          <RefreshCw size={28} className="animate-spin text-white/40" />
        </div>
      ) : !profile ? (
        <div className="flex flex-col items-center justify-center h-60 text-white/30">
          <Users size={36} className="mb-3" />
          <p>Failed to load profile.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* ── Hero Profile Header ── */}
          <div className="flex items-center gap-5 p-4 rounded-2xl border border-white/10" style={{ background: 'linear-gradient(135deg, rgba(26,95,180,0.15), rgba(124,58,237,0.1))' }}>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 shadow-lg border-2 border-violet-500/30"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              {profile.avatarInitial || profile.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-white leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>{profile.name}</h2>
              <p className="text-xs text-white/60 mt-0.5">{profile.department}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="badge badge-primary text-[11px] font-mono">
                  {profile.rollNumber || `21${profile.department?.substring(0, 2)?.toUpperCase() || 'CS'}104`}
                </span>
                <span className="badge badge-accent text-[11px]">
                  {profile.yearOfStudy ? `Year ${profile.yearOfStudy}` : '3rd Year'}
                </span>
              </div>
            </div>
          </div>

          {/* ── Details Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-400 flex-shrink-0">
                <Contact size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Reg. No.</p>
                <p className="text-xs font-semibold text-white truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {profile.rollNumber || `21${profile.department?.substring(0, 2)?.toUpperCase() || 'CS'}104`}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-400 flex-shrink-0">
                <Phone size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Contact</p>
                <p className="text-xs font-semibold text-white truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {profile.contactNo || profile.contactNumber || '+91 98765 43210'}
                </p>
              </div>
            </div>
          </div>

          {/* ── Bio ── */}
          <div className="rounded-xl p-3.5 border border-white/8 bg-white/[0.02]">
            <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1 font-semibold">About</p>
            <p className="text-xs text-white/70 leading-relaxed">
              {profile.bio || 'Passionate engineering student dedicated to innovation, robotics, and collaborative team projects.'}
            </p>
          </div>

          {/* ── Skills ── */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2 font-semibold flex items-center gap-1">
              <Code2 size={12} /> Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(profile.skills && profile.skills.length > 0
                ? profile.skills
                : ['C / C++', 'Python', 'ROS 2', 'Embedded Systems', 'Arduino']
              ).map(sk => (
                <span key={sk} className="px-2.5 py-1 rounded-lg bg-violet-950/40 border border-violet-500/25 text-violet-200 text-xs font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  {sk}
                </span>
              ))}
            </div>
          </div>

          {/* ── Links ── */}
          <div className="flex gap-2 pt-1">
            <a
              href={profile.githubLink || 'https://github.com'}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl border border-white/10 text-white/70 hover:text-white hover:border-white/25 transition-all text-xs font-semibold bg-white/5"
            >
              <span className="flex items-center gap-1.5">
                <Github size={14} className="text-white" /> GitHub
              </span>
              <ExternalLink size={13} />
            </a>
            <a
              href={profile.linkedinLink || 'https://linkedin.com'}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl border border-blue-500/30 text-blue-300 hover:bg-blue-600/20 transition-all text-xs font-semibold bg-blue-600/10"
            >
              <span className="flex items-center gap-1.5">
                <Linkedin size={14} className="text-blue-400" /> LinkedIn
              </span>
              <ExternalLink size={13} />
            </a>
          </div>

          {/* ── Idea Repository ── */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/30 mb-3 flex items-center gap-1.5">
              <Star size={11} /> Idea Repository
            </p>
            {profile.ideas.length === 0 ? (
              <div className="text-center py-6 rounded-2xl border border-dashed border-white/10 text-white/25 text-sm">
                No ideas posted yet.
              </div>
            ) : (
              <div className="space-y-3">
                {profile.ideas.map(idea => (
                  <div
                    key={idea.id}
                    className="p-4 rounded-2xl border border-white/8 hover:border-primary-500/30 transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="font-semibold text-white text-sm leading-snug">{idea.title}</h4>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {idea.domain && (
                          <span className="badge badge-primary text-[10px]">{idea.domain}</span>
                        )}
                        <span className={`badge text-[10px] ${
                          idea.status === 'APPROVED'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                            : idea.status === 'REJECTED'
                            ? 'badge-danger'
                            : 'badge-accent'
                        }`}>
                          {idea.status === 'OPEN' || idea.status === 'PENDING_REVIEW' ? 'PENDING' : idea.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-white/45 line-clamp-2 mb-2">{idea.description}</p>
                    {idea.techStack && (
                      <div className="flex flex-wrap gap-1">
                        {idea.techStack.split(',').map((t, i) => (
                          <span key={i} className="badge badge-teal text-[10px]">{t.trim()}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-1 text-xs text-white/30">
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

  // ── Build trie whenever students list changes ──
  const trie = useMemo(() => {
    const t = new Trie()
    students.forEach((s, i) => t.insert(s.name, i))
    return t
  }, [students])

  // ── Trie-powered name search + fallback linear for roll/skill ──
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return students

    // Trie prefix search on names
    const nameHits = trie.search(q)

    return students.filter((s, i) =>
      nameHits.has(i) ||
      s.rollNumber?.toLowerCase().includes(q) ||
      (s.skills && s.skills.some(sk => sk.toLowerCase().includes(q)))
    )
  }, [query, students, trie])

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
            <Shield size={36} className="text-white/20 mb-3" />
            <p className="text-white/40 text-sm">Only the Team Leader can invite members.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Search bar */}
            <div className="relative">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Result count */}
            {query && !loading && (
              <p className="text-xs text-white/30">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''} for <span className="text-primary-400">"{query}"</span>
              </p>
            )}

            {/* Results */}
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-10 text-white/40">
                  <RefreshCw size={24} className="animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-white/30 text-sm">
                  <Users size={32} className="text-white/15" />
                  {query ? 'No students found matching your search.' : 'No students without a team found.'}
                </div>
              ) : filtered.map(s => {
                const isInvited = invited.has(s.id)
                return (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-white/8 hover:border-primary-500/20 transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
                      style={{ background: 'linear-gradient(135deg, #1a5fb4, #0ba5a5)' }}
                    >
                      {s.avatarInitial || 'S'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-sm">{s.name}</span>
                        <span className="text-xs text-white/35 font-mono">{s.rollNumber}</span>
                      </div>
                      <p className="text-xs text-white/40 mb-1.5">{s.department}</p>
                      <div className="flex flex-wrap gap-1">
                        {(s.skills || []).slice(0, 4).map(sk => <span key={sk} className="badge badge-accent text-[10px]">{sk}</span>)}
                        {(s.skills?.length ?? 0) > 4 && (
                          <span className="text-[10px] text-white/25">+{(s.skills?.length ?? 0) - 4} more</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* View Profile */}
                      <button
                        onClick={() => setViewProfileId(s.id)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-white/15 text-white/60 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all"
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
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
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

// ─── Leader Card ─────────────────────────────────────────────────────────────
function LeaderCard({ member, onClick }: { member: TeamMember; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative cursor-pointer rounded-3xl p-6 overflow-hidden col-span-1"
      style={{
        background: 'linear-gradient(145deg, rgba(217,119,6,0.15), rgba(245,158,11,0.08))',
        border: '2px solid rgba(245,158,11,0.45)',
        boxShadow: '0 8px 32px rgba(245,158,11,0.12)',
      }}
    >
      {/* Crown glow */}
      <div
        className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)' }}
      />

      {/* Crown icon */}
      <div className="relative z-10 flex items-start justify-between mb-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #d97706, #f59e0b)',
            boxShadow: '0 4px 16px rgba(245,158,11,0.35)',
          }}
        >
          {member.avatarInitial || member.name[0]?.toUpperCase()}
        </div>
        <Crown size={22} className="text-amber-400 mt-1" />
      </div>

      <div className="relative z-10">
        <p className="font-bold text-white text-base mb-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {member.name}
        </p>
        <p className="text-xs text-white/50 mb-3">{member.department}</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
            style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}
          >
            <Crown size={11} /> Team Leader
          </span>
          {member.techRole && member.techRole !== 'Team Leader' && (
            <span className="badge badge-accent text-xs">{member.techRole}</span>
          )}
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1">
          {(member.skills ?? []).slice(0, 3).map(s => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full text-white/50 border border-white/10">
              {s}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-xs text-amber-400/60 group-hover:text-amber-400 transition-colors">
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
      className="cursor-pointer rounded-2xl p-5 border border-white/8 hover:border-primary-500/30 transition-all duration-200"
      style={{ background: 'rgba(7,25,45,0.8)' }}
    >
      {/* Avatar */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base mb-3 shadow-sm"
        style={{ background: 'linear-gradient(135deg, #1a5fb4, #0ba5a5)' }}
      >
        {member.avatarInitial || member.name[0]?.toUpperCase()}
      </div>

      <p className="font-bold text-white text-sm mb-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
        {member.name}
      </p>
      <p className="text-xs text-white/45 mb-3">{member.department}</p>

      {/* Role badge */}
      {member.techRole && (
        <span className="badge badge-primary text-xs mb-3 inline-flex">{member.techRole}</span>
      )}

      {/* Skills */}
      <div className="flex flex-wrap gap-1">
        {(member.skills ?? []).slice(0, 2).map(s => (
          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full text-white/40 border border-white/8">
            {s}
          </span>
        ))}
        {(member.skills?.length ?? 0) > 2 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full text-white/30 border border-white/8">
            +{(member.skills?.length ?? 0) - 2}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1 text-xs text-white/25 hover:text-primary-400 transition-colors">
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

  // ── Helper: fetch latest team state from backend and sync to Redux ──
  const refreshTeam = useMemo(() => async () => {
    if (!team.teamId) return
    try {
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
            rollNumber: m.user?.studentProfile?.rollNumber || '',
            techRole: m.roleInTeam || 'Developer',
            skills: m.user?.userSkills?.map((s: any) => s.skill?.skillName).filter(Boolean) || [],
            avatarInitial: (m.user?.name?.[0] || 'U').toUpperCase()
          }))
        dispatch(setTeam({ members: mappedMembers, currentMemberCount: mappedMembers.length }))
      }
    } catch { /* silent */ }
  }, [team.teamId, dispatch])

  // ── Real-time polling: refresh team + pending count every 5 seconds ──
  useEffect(() => {
    if (!team.teamId) return
    refreshTeam()

    const interval = setInterval(async () => {
      refreshTeam()
      // Also refresh pending join-request count for the leader
      if (team.isLeader) {
        try {
          const r = await api.get(`/teams/${team.teamId}/join-requests`)
          if (Array.isArray(r.data)) setPendingCount(r.data.length)
        } catch { /* silent */ }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [team.teamId, team.isLeader, refreshTeam])

  // Redirect non-members
  useEffect(() => {
    if (!team.teamId) navigate('/student/team', { replace: true })
  }, [team.teamId, navigate])

  if (!team.teamId) return null

  const leader  = team.members.find(m => m.role === 'LEADER')
  const members = team.members.filter(m => m.role !== 'LEADER')
  const spotsLeft = team.memberLimit - team.currentMemberCount

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-12 space-y-8">

      {/* ── Portal Header ──────────────────────────────────────────────── */}
      <div
        className="relative rounded-3xl overflow-hidden border border-white/8"
        style={{ background: 'linear-gradient(145deg, rgba(26,95,180,0.12), rgba(11,165,165,0.08))' }}
      >
        {/* Background glow */}
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #1a5fb4, transparent 70%)' }}
        />

        <div className="relative z-10 p-7 sm:p-9">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            {/* Left: team info */}
            <div className="flex-1 min-w-0">
              {/* Team badge */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-glow"
                  style={{ background: 'linear-gradient(135deg, #1a5fb4, #0ba5a5)' }}
                >
                  {team.teamName?.[0]}
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-primary-300 opacity-75">
                  Team Portal
                </span>
              </div>

              {/* Team name */}
              <h1
                className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {team.teamName}
              </h1>

              {/* Project focus */}
              {team.projectFocus && (
                <p className="text-white/60 text-sm leading-relaxed max-w-xl mb-5">
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
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
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
                  className="w-11 h-11 rounded-2xl flex items-center justify-center border border-white/10 text-white/60 hover:text-white hover:border-primary-500/50 hover:bg-primary-500/10 transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <MailOpen size={20} />
                </button>
                {team.isLeader && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                    style={{ background: '#ef4444' }}>
                    {pendingCount}
                  </span>
                )}
                <div className="absolute right-0 top-full mt-2 px-2.5 py-1 bg-surface-100 text-white text-xs rounded-lg shadow-card whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 border border-white/10">
                  Mailbox
                </div>
              </div>

              {/* Add Members */}
              <div className="relative group">
                <button
                  id="team-add-members-btn"
                  onClick={() => setAddMembersOpen(true)}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center border border-white/10 text-white/60 hover:text-white hover:border-teal/50 hover:bg-teal/10 transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <UserPlus size={20} />
                </button>
                <div className="absolute right-0 top-full mt-2 px-2.5 py-1 bg-surface-100 text-white text-xs rounded-lg shadow-card whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 border border-white/10">
                  Add Members
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Members Section ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Team Members
          </h2>
          <span className="text-xs text-white/40">
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
              className={`rounded-2xl p-5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 min-h-[140px] ${
                team.isLeader ? 'cursor-pointer hover:border-primary-500/40 hover:bg-primary-500/5 transition-all' : ''
              }`}
            >
              <UserPlus size={20} className="text-white/20" />
              <span className="text-xs text-white/25 text-center">
                {team.isLeader ? 'Invite a member' : 'Open slot'}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Required Skills ───────────────────────────────────────────── */}
      {team.requiredSkills.length > 0 && (
        <div
          className="rounded-3xl p-6 border border-white/8"
          style={{ background: 'rgba(7,25,45,0.7)' }}
        >
          <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <Star size={16} className="text-primary-400" />
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
      />
    </div>
  )
}
