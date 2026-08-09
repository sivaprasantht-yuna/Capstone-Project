import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  UserPlus, CheckCircle2, Search,
  Users, RefreshCw, ChevronLeft, Send, Filter, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { setTeam } from '../../store/teamSlice'
import { RootState } from '../../store'

interface OpenTeam {
  id: string
  teamName: string
  leaderName: string
  domains: string[]
  requiredSkills: string[]
  currentMemberCount: number
  maxTeamCount: number
  projectFocus?: string
}

export default function JoinTeamPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user }   = useSelector((s: RootState) => s.auth)
  const { teamId } = useSelector((s: RootState) => s.team)

  // Redirect if already in a team
  useEffect(() => {
    if (teamId) navigate('/student/team-portal', { replace: true })
  }, [teamId, navigate])

  const [teams, setTeams]         = useState<OpenTeam[]>([])
  const [loading, setLoading]     = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [domainFilter, setDomainFilter] = useState('')
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set())
  const [requestedTeam, setRequestedTeam] = useState<OpenTeam | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [joining, setJoining]     = useState<string | null>(null)

  const fetchTeams = async () => {
    setLoading(true)
    try {
      const res = await api.get('/teams/open')
      if (Array.isArray(res?.data)) {
        setTeams(res.data.map((t: any) => ({
          id: t.id.toString(),
          teamName: t.teamName,
          leaderName: t.leaderName ?? 'Unknown Leader',
          domains: Array.isArray(t.domains) ? t.domains : (t.domains ? [t.domains] : []),
          requiredSkills: Array.isArray(t.requiredSkills) ? t.requiredSkills : [],
          currentMemberCount: t.currentMemberCount ?? 1,
          maxTeamCount: t.maxTeamCount ?? 4,
          projectFocus: t.projectFocus ?? '',
        })))
      }
    } catch (err) {
      console.error('Failed to load open teams:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  const allDomains = Array.from(new Set(teams.flatMap(t => t.domains).filter(Boolean)))

  const filtered = teams.filter(t => {
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch = !q ||
      t.teamName.toLowerCase().includes(q) ||
      t.requiredSkills.some(s => s.toLowerCase().includes(q)) ||
      t.domains.some(d => d.toLowerCase().includes(q)) ||
      t.leaderName.toLowerCase().includes(q) ||
      (t.projectFocus && t.projectFocus.toLowerCase().includes(q))
    const matchesDomain = !domainFilter || t.domains.includes(domainFilter)
    return matchesSearch && matchesDomain
  })

  const handleSendRequest = async (team: OpenTeam) => {
    setRequestedTeam(team)
    setShowConfirm(true)
  }

  const handleConfirmJoin = async () => {
    if (!requestedTeam) return
    setJoining(requestedTeam.id)
    setShowConfirm(false)

    try {
      await api.post(`/teams/${requestedTeam.id}/join-request`).catch(() => null)

      setSentRequests(prev => new Set([...prev, requestedTeam.id]))

      // Optimistic: register as joined (in real flow, wait for leader acceptance)
      dispatch(setTeam({
        teamId:             requestedTeam.id,
        teamName:           requestedTeam.teamName,
        projectDomain:      requestedTeam.domains,
        projectFocus:       requestedTeam.projectFocus ?? '',
        isLeader:           false,
        leaderId:           '0',
        memberLimit:        requestedTeam.maxTeamCount,
        currentMemberCount: requestedTeam.currentMemberCount + 1,
        status:             'RECRUITING',
        requiredSkills:     requestedTeam.requiredSkills,
        members: [
          {
            id:           '0',
            name:         requestedTeam.leaderName,
            role:         'LEADER',
            department:   '',
            rollNumber:   '',
            contactNumber:'',
            techRole:     'Team Leader',
            skills:       [],
            avatarInitial: requestedTeam.leaderName[0]?.toUpperCase() ?? 'L',
          },
          {
            id:           user?.userId?.toString() ?? 'me',
            name:         user?.name ?? 'You',
            role:         'MEMBER',
            department:   user?.department ?? '',
            rollNumber:   '',
            contactNumber:'',
            techRole:     'Member',
            skills:       [],
            avatarInitial: user?.name?.[0]?.toUpperCase() ?? 'Y',
          },
        ],
      }))

      toast.success(`Join request sent to "${requestedTeam.teamName}"! 🎉`)
      navigate('/student/team-portal', { replace: true })
    } catch {
      toast.error('Failed to send join request.')
    } finally {
      setJoining(null)
    }
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-12">
      {/* ── Breadcrumb ───────────────────────────────────────────────── */}
      <button
        onClick={() => navigate('/student/team')}
        className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors group"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Team Formation
      </button>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-glow"
          style={{ background: 'linear-gradient(135deg, #0ba5a5, #077878)' }}
        >
          <UserPlus size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Join a Team
          </h1>
          <p className="text-xs text-white/45">Browse open teams and send a join request</p>
        </div>
      </div>

      {/* ── Search & Filter Bar ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search teams, skills or leader name..."
            className="input-dark pl-9"
          />
        </div>

        <div className="relative sm:w-56">
          <Filter size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <select
            value={domainFilter}
            onChange={e => setDomainFilter(e.target.value)}
            className="input-dark pl-9 cursor-pointer"
          >
            <option value="">All Domains</option>
            {allDomains.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <button
          onClick={fetchTeams}
          disabled={loading}
          className="btn-secondary text-sm flex items-center gap-2 flex-shrink-0"
          title="Refresh team list"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-primary-400" : ""} /> Refresh
        </button>

        {(searchQuery || domainFilter) && (
          <button
            onClick={() => { setSearchQuery(''); setDomainFilter('') }}
            className="btn-secondary text-sm flex items-center gap-2 flex-shrink-0"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* ── Team Cards Grid ─────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="animate-spin text-primary-400" size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users size={40} className="mx-auto text-white/20 mb-3" />
          <p className="text-white/40 text-sm">No open teams match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((team, i) => {
            const spotsLeft = team.maxTeamCount - team.currentMemberCount
            const isSent    = sentRequests.has(team.id)
            const isFull    = spotsLeft <= 0

            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-white/8 p-5 flex flex-col gap-4 hover:border-white/20 transition-all"
                style={{ background: 'rgba(7,25,45,0.7)' }}
              >
                {/* Team header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #1a5fb4, #0ba5a5)' }}
                    >
                      {team.teamName[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {team.teamName}
                      </div>
                      <div className="text-xs text-white/40 truncate">Leader: {team.leaderName}</div>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold border ${
                    isFull
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {isFull ? 'Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
                  </span>
                </div>

                {/* Project focus */}
                {team.projectFocus && (
                  <p className="text-xs text-white/50 leading-relaxed line-clamp-2">{team.projectFocus}</p>
                )}

                {/* Domains */}
                <div className="flex flex-wrap gap-1.5">
                  {team.domains.map(d => (
                    <span key={d} className="badge badge-teal text-xs">{d}</span>
                  ))}
                </div>

                {/* Skills */}
                <div>
                  <p className="text-[11px] text-white/35 uppercase tracking-wider mb-1.5">Looking for</p>
                  <div className="flex flex-wrap gap-1">
                    {team.requiredSkills.slice(0, 5).map(s => (
                      <span key={s} className="badge badge-accent text-xs">{s}</span>
                    ))}
                    {team.requiredSkills.length > 5 && (
                      <span className="badge text-xs text-white/40">+{team.requiredSkills.length - 5} more</span>
                    )}
                  </div>
                </div>

                {/* Capacity bar */}
                <div>
                  <div className="flex justify-between text-[11px] text-white/35 mb-1">
                    <span>Team capacity</span>
                    <span>{team.currentMemberCount} / {team.maxTeamCount}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(team.currentMemberCount / team.maxTeamCount) * 100}%`,
                        background: isFull ? '#ef4444' : 'linear-gradient(90deg, #1a5fb4, #0ba5a5)',
                      }}
                    />
                  </div>
                </div>

                {/* CTA */}
                <button
                  disabled={isFull || isSent || joining === team.id}
                  onClick={() => handleSendRequest(team)}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    isSent
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                      : isFull
                      ? 'bg-white/5 text-white/25 cursor-not-allowed'
                      : 'btn-primary'
                  }`}
                >
                  {joining === team.id ? (
                    <><RefreshCw size={14} className="animate-spin" /> Sending...</>
                  ) : isSent ? (
                    <><CheckCircle2 size={14} /> Request Sent</>
                  ) : isFull ? (
                    'Team Full'
                  ) : (
                    <><Send size={14} /> Send Join Request</>
                  )}
                </button>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── Confirm Popup ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showConfirm && requestedTeam && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className="fixed inset-0 bg-transparent z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="pointer-events-auto w-full max-w-md rounded-3xl border border-white/12 p-8 shadow-2xl"
                style={{ background: 'rgba(10, 25, 45, 0.92)' }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #1a5fb4, #0ba5a5)' }}
                  >
                    <Send size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      Confirm Join Request
                    </h3>
                    <p className="text-xs text-white/40">Send request to {requestedTeam.teamName}</p>
                  </div>
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-6">
                  You're about to send a join request to <strong className="text-white">{requestedTeam.teamName}</strong>. The team leader will review and accept or decline your request.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="btn-secondary flex-1 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmJoin}
                    className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
                  >
                    <Send size={14} /> Send Request
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
