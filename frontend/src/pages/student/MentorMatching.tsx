import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Star, Users, CheckCircle, Loader2, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

interface MentorMatch {
  faculty_id: string
  match_score: number
  matching_skills: string[]
  workload: number
  recommendation_rank: number
  name?: string
  designation?: string
  department?: string
  mentorRating?: number
  maxTeamCapacity?: number
}

const rankLabels = ['🥇 Best Match', '🥈 Good Match', '🥉 Alternative']
const rankColors = [
  'border-amber-500/30 bg-amber-500/5',
  'border-primary-500/30 bg-primary-500/5',
  'border-surface-100/50',
]

export default function MentorMatching() {
  const [mentors, setMentors] = useState<MentorMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [requesting, setRequesting] = useState<string | null>(null)
  const [teamId, setTeamId] = useState<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const teamsRes = await api.get('/teams/my')
        if (teamsRes.data.length === 0) { setLoading(false); return }
        const team = teamsRes.data[0]
        setTeamId(team.id)
        const matchRes = await api.get(`/matching/mentors/${team.id}?topN=3`)
        setMentors(matchRes.data)
      } catch (e) {
        toast.error('Could not load mentor suggestions.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const requestMentor = async (mentor: MentorMatch) => {
    if (!teamId) { toast.error('Join a team first.'); return }
    setRequesting(mentor.faculty_id)
    try {
      await api.post('/mentorships/request', {
        teamId,
        facultyId: parseInt(mentor.faculty_id),
        matchScore: mentor.match_score,
        matchingSkillsJson: JSON.stringify(mentor.matching_skills),
      })
      toast.success(`Mentorship request sent to ${mentor.name || 'Faculty'}!`)
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to send request.')
    } finally {
      setRequesting(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen className="text-emerald-400" size={24} />
          Mentor Matching
        </h1>
        <p className="text-white/50 text-sm mt-1">
          Faculty recommendations ranked by <span className="text-emerald-400">expertise overlap</span> + workload fairness
        </p>
      </div>

      {/* Algorithm explanation */}
      <div className="glass-card p-4 border-l-4 border-emerald-500">
        <p className="text-white/70 text-sm">
          🎓 <span className="text-white font-medium">Matching logic:</span> Your team's combined skill vector is compared 
          to each faculty's expertise using <strong>cosine similarity</strong>. A workload penalty (up to −40%) 
          ensures mentors with many teams are ranked lower, promoting fairness.
        </p>
      </div>

      {!teamId && !loading && (
        <div className="glass-card p-8 text-center">
          <Users className="mx-auto text-white/20 mb-3" size={40} />
          <p className="text-white/50">Form a team first to see mentor recommendations.</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="animate-spin text-emerald-400 mx-auto mb-3" size={32} />
            <p className="text-white/50 text-sm">Computing expertise overlap...</p>
          </div>
        </div>
      )}

      {!loading && mentors.length > 0 && (
        <div className="space-y-4">
          {mentors.map((mentor, i) => (
            <motion.div
              key={mentor.faculty_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card p-6 border ${rankColors[i] || 'border-white/5'}`}
            >
              <div className="flex items-start gap-4">
                {/* Rank badge */}
                <div className="text-2xl flex-shrink-0 mt-1">{['🥇', '🥈', '🥉'][i]}</div>

                {/* Faculty info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{mentor.name || `Faculty #${mentor.faculty_id}`}</span>
                        <span className="badge badge-accent text-xs">{rankLabels[i]}</span>
                      </div>
                      <div className="text-sm text-white/50 mt-0.5">
                        {mentor.designation} · {mentor.department}
                      </div>
                    </div>

                    {/* Match score */}
                    <div className="text-right">
                      <div className="text-2xl font-bold gradient-text-accent">
                        {Math.round(mentor.match_score * 100)}%
                      </div>
                      <div className="text-xs text-white/40">Match Score</div>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="my-3">
                    <div className="match-bar">
                      <motion.div
                        className="match-bar-fill"
                        style={{ background: 'linear-gradient(90deg, #10b981, #06b6d4)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${mentor.match_score * 100}%` }}
                        transition={{ delay: i * 0.1 + 0.4, duration: 0.7 }}
                      />
                    </div>
                  </div>

                  {/* Details row */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {/* Matching skills */}
                    <div>
                      <span className="text-white/40 text-xs block mb-1">Matching Expertise:</span>
                      <div className="flex flex-wrap gap-1">
                        {mentor.matching_skills.map(s => (
                          <span key={s} className="badge badge-accent">{s}</span>
                        ))}
                        {mentor.matching_skills.length === 0 && <span className="text-white/30 text-xs">No direct overlap found</span>}
                      </div>
                    </div>

                    {/* Workload */}
                    <div className="ml-auto text-right">
                      <span className="text-white/40 text-xs block mb-1">Current Teams:</span>
                      <div className="flex items-center gap-1">
                        <Users size={12} className="text-white/40" />
                        <span className="text-white font-medium">{mentor.workload}</span>
                        <span className="text-white/40">/ {mentor.maxTeamCapacity || 5}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Request button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => requestMentor(mentor)}
                  disabled={requesting === mentor.faculty_id}
                  className="btn-accent text-sm py-2 px-5 flex items-center gap-2"
                >
                  {requesting === mentor.faculty_id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  Request as Mentor
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
