import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { BookOpen, Star, Users, CheckCircle, Loader2, TrendingUp, Sparkles, AlertCircle } from 'lucide-react'
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
  'border-amber-300 bg-amber-50/30',
  'border-primary-200 bg-primary-50/20',
  'border-slate-200 bg-white',
]

export default function MentorMatching() {
  const reduxTeam = useSelector((s: any) => s.team)
  const [mentors, setMentors] = useState<MentorMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [requesting, setRequesting] = useState<string | null>(null)
  const [teamId, setTeamId] = useState<number | null>(reduxTeam?.teamId ? Number(reduxTeam.teamId) : null)
  const [activeMentorship, setActiveMentorship] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const teamsRes = await api.get('/teams/my')
        let currentTeamId = reduxTeam?.teamId ? Number(reduxTeam.teamId) : null

        if (Array.isArray(teamsRes.data) && teamsRes.data.length > 0) {
          const t = teamsRes.data[0]
          currentTeamId = t.id
          setTeamId(t.id)
        }

        if (!currentTeamId) {
          setLoading(false)
          return
        }

        // Fetch recommendations
        const matchRes = await api.get(`/matching/mentors/${currentTeamId}?topN=3`)
        if (Array.isArray(matchRes.data)) {
          setMentors(matchRes.data)
        }
      } catch (e) {
        console.error('Error fetching mentor matching:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [reduxTeam?.teamId])

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
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="text-teal-600" size={24} />
          Mentor Matching
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Faculty recommendations ranked by <span className="text-teal-600 font-semibold">expertise overlap</span> + workload fairness
        </p>
      </div>

      {/* Algorithm explanation */}
      <div className="card p-4 border-l-4 border-teal-500 bg-teal-50/30">
        <p className="text-slate-700 text-sm">
          🎓 <span className="text-slate-900 font-semibold">Matching logic:</span> Your team's combined skill vector is compared 
          to each faculty's expertise using <strong>cosine similarity</strong>. A workload penalty (up to −40%) 
          ensures mentors with many teams are ranked lower, promoting fairness.
        </p>
      </div>

      {!teamId && !loading && (
        <div className="card p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
          <Users className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="text-slate-700 font-semibold text-base mb-1">No Active Team Found</p>
          <p className="text-slate-500 text-sm">Form or join a team first to see AI-ranked faculty mentor recommendations.</p>
        </div>
      )}

      {teamId && !loading && mentors.length === 0 && (
        <div className="card p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
          <AlertCircle className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="text-slate-700 font-semibold text-base mb-1">No Available Mentors Found</p>
          <p className="text-slate-500 text-sm">All faculty mentors in your department are currently at capacity. Please check back later or contact your department coordinator.</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="animate-spin text-teal-600 mx-auto mb-3" size={32} />
            <p className="text-slate-500 text-sm">Computing expertise overlap...</p>
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
              className={`card p-6 border ${rankColors[i] || 'border-slate-200'}`}
            >
              <div className="flex items-start gap-4">
                {/* Rank badge */}
                <div className="text-2xl flex-shrink-0 mt-1">{['🥇', '🥈', '🥉'][i]}</div>

                {/* Faculty info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{mentor.name || `Faculty #${mentor.faculty_id}`}</span>
                        <span className="badge badge-accent text-xs">{rankLabels[i]}</span>
                      </div>
                      <div className="text-sm text-slate-500 mt-0.5">
                        {mentor.designation} · {mentor.department}
                      </div>
                    </div>

                    {/* Match score */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-teal-600">
                        {Math.round(mentor.match_score * 100)}%
                      </div>
                      <div className="text-xs text-slate-400">Match Score</div>
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
                      <span className="text-slate-500 text-xs block mb-1 font-medium">Matching Expertise:</span>
                      <div className="flex flex-wrap gap-1">
                        {mentor.matching_skills.map(s => (
                          <span key={s} className="badge badge-accent">{s}</span>
                        ))}
                        {mentor.matching_skills.length === 0 && <span className="text-slate-400 text-xs">No direct overlap found</span>}
                      </div>
                    </div>

                    {/* Workload */}
                    <div className="ml-auto text-right">
                      <span className="text-slate-500 text-xs block mb-1 font-medium">Current Teams:</span>
                      <div className="flex items-center gap-1">
                        <Users size={12} className="text-slate-400" />
                        <span className="text-slate-800 font-semibold">{mentor.workload}</span>
                        <span className="text-slate-400">/ {mentor.maxTeamCapacity || 5}</span>
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
                  className="btn-teal text-sm py-2 px-5 flex items-center gap-2"
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
