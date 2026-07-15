import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { UserCheck, Cpu, Code, Palette, BarChart3, Star, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

interface MatchResult {
  user_id: string
  match_score: number
  gap_filled_skills: string[]
  complementarity: 'HIGH' | 'MEDIUM' | 'LOW'
  name?: string
  department?: string
  avatarUrl?: string
}

export default function TeamFormation() {
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [inviting, setInviting] = useState<string | null>(null)

  const fetchMatches = async () => {
    setLoading(true)
    try {
      const res = await api.get('/matching/teammates?topN=8')
      setMatches(res.data)
    } catch (e) {
      toast.error('Could not load teammate suggestions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMatches() }, [])

  const sendInvite = async (userId: string) => {
    // Requires an existing team — guide user to create one first
    try {
      const teamsRes = await api.get('/teams/my')
      if (teamsRes.data.length === 0) {
        toast.error('Create a team first before inviting teammates.')
        return
      }
      const teamId = teamsRes.data[0].id
      setInviting(userId)
      await api.post(`/teams/${teamId}/invite/${userId}`)
      toast.success('Invitation sent!')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to send invite.')
    } finally {
      setInviting(null)
    }
  }

  const complementarityColors = {
    HIGH:   'badge-accent',
    MEDIUM: 'badge-warning',
    LOW:    'badge-primary',
  }

  const getSkillIcon = (skill: string) => {
    const s = skill.toLowerCase()
    if (s.includes('react') || s.includes('js') || s.includes('web')) return <Code size={12} />
    if (s.includes('ml') || s.includes('ai') || s.includes('data')) return <Cpu size={12} />
    if (s.includes('design') || s.includes('ui') || s.includes('figma')) return <Palette size={12} />
    return <BarChart3 size={12} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserCheck className="text-primary-400" size={24} />
            Team Formation
          </h1>
          <p className="text-white/50 text-sm mt-1">
            AI-powered teammate suggestions based on <span className="text-primary-400">complementary skills</span> across departments
          </p>
        </div>
        <button onClick={fetchMatches} className="btn-secondary text-sm">
          Refresh Matches
        </button>
      </div>

      {/* Algorithm explanation banner */}
      <div className="glass-card p-4 border-l-4 border-primary-500">
        <p className="text-white/70 text-sm">
          🧠 <span className="text-white font-medium">How it works:</span> Your skill vector is compared against all students 
          using <strong>cosine similarity</strong>. Students who fill your skill gaps score highest — 
          ensuring your team covers multiple disciplines.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="animate-spin text-primary-400 mx-auto mb-3" size={32} />
            <p className="text-white/50 text-sm">Running matching algorithm...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {matches.map((match, i) => (
            <motion.div
              key={match.user_id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-card-hover p-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {match.name?.[0] || 'S'}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{match.name || `Student #${match.user_id}`}</div>
                    <div className="text-xs text-white/40">{match.department || 'Unknown Dept.'}</div>
                  </div>
                </div>
                <span className={`badge ${complementarityColors[match.complementarity]}`}>
                  {match.complementarity}
                </span>
              </div>

              {/* Match score bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-white/50">Complementarity Score</span>
                  <span className="text-sm font-bold text-primary-400">
                    {Math.round(match.match_score * 100)}%
                  </span>
                </div>
                <div className="match-bar">
                  <motion.div
                    className="match-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${match.match_score * 100}%` }}
                    transition={{ delay: i * 0.06 + 0.3, duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Gap-filling skills */}
              {match.gap_filled_skills.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-white/40 mb-2">Fills your skill gaps in:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {match.gap_filled_skills.map(skill => (
                      <span key={skill} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-emerald-300 text-xs">
                        {getSkillIcon(skill)} {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Invite button */}
              <button
                onClick={() => sendInvite(match.user_id)}
                disabled={inviting === match.user_id}
                className="btn-primary w-full text-sm py-2.5 flex items-center justify-center gap-2"
              >
                {inviting === match.user_id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : '+ Send Team Invite'}
              </button>
            </motion.div>
          ))}

          {matches.length === 0 && !loading && (
            <div className="col-span-3 text-center py-16">
              <Star className="mx-auto text-white/20 mb-3" size={40} />
              <p className="text-white/40">Complete your skill profile to see teammate suggestions.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
