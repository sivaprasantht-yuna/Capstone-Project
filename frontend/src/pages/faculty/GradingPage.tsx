import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Send, Loader2, CheckSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

export default function GradingPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const [milestones, setMilestones] = useState<any[]>([])
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null)
  const [marks, setMarks] = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/mentorships/active').then(r => {
      const myTeams = r.data.map((m: any) => m.team)
      setTeams(myTeams)
    })
  }, [])

  const loadMilestones = async (team: any) => {
    setSelectedTeam(team)
    const res = await api.get(`/milestones/team/${team.id}`)
    setMilestones(res.data.filter((m: any) => m.status === 'SUBMITTED'))
  }

  const submitGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMilestone) { toast.error('Select a milestone'); return }
    setLoading(true)
    try {
      await api.post(`/milestones/${selectedMilestone}/evaluate`, {
        marks: parseFloat(marks), feedback,
        feedbackData: { innovation: 8, presentation: 7, completion: 9 },
      })
      toast.success('Grade submitted and team notified!')
      setMilestones(prev => prev.filter(m => m.id !== selectedMilestone))
      setSelectedMilestone(null); setMarks(''); setFeedback('')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to submit grade.')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Star className="text-amber-400" size={24} /> Grading
        </h1>
        <p className="text-white/50 text-sm">Evaluate submitted milestones for your mentored teams</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams list */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-white/60">Your Teams</h2>
          {teams.map(t => (
            <button key={t.id} onClick={() => loadMilestones(t)}
              className={`w-full text-left glass-card p-4 transition-all ${selectedTeam?.id === t.id ? 'border-emerald-500/50' : ''}`}>
              <div className="font-medium text-white text-sm">{t.teamName}</div>
              <div className="text-xs text-white/40">{t.project?.title}</div>
            </button>
          ))}
          {teams.length === 0 && <p className="text-white/30 text-sm text-center py-6">No active mentorships yet.</p>}
        </div>

        {/* Submissions & grade form */}
        <div className="lg:col-span-2 space-y-4">
          {milestones.length > 0 ? (
            <>
              <h2 className="text-sm font-medium text-white/60">Awaiting Evaluation</h2>
              {milestones.map(m => (
                <motion.button key={m.id} onClick={() => setSelectedMilestone(m.id)}
                  className={`w-full text-left glass-card p-4 ${selectedMilestone === m.id ? 'border-amber-500/30' : ''}`}>
                  <div className="flex items-center gap-2">
                    <CheckSquare size={16} className="text-amber-400" />
                    <span className="font-medium text-white">{m.title}</span>
                    <span className="badge badge-warning ml-auto">Awaiting Grade</span>
                  </div>
                </motion.button>
              ))}

              {selectedMilestone && (
                <form onSubmit={submitGrade} className="glass-card p-5 space-y-4">
                  <h3 className="font-semibold text-white">Submit Evaluation</h3>
                  <div>
                    <label className="text-white/60 text-sm block mb-1">Marks (out of 100)</label>
                    <input type="number" value={marks} onChange={e => setMarks(e.target.value)}
                      min={0} max={100} required placeholder="e.g. 85" className="input-dark" />
                  </div>
                  <div>
                    <label className="text-white/60 text-sm block mb-1">Feedback</label>
                    <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
                      rows={3} required placeholder="Detailed feedback for the team..."
                      className="input-dark resize-none" />
                  </div>
                  <button type="submit" disabled={loading} className="btn-accent w-full flex items-center justify-center gap-2">
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Submit Grade
                  </button>
                </form>
              )}
            </>
          ) : selectedTeam ? (
            <div className="glass-card p-10 text-center text-white/40">
              No pending submissions for {selectedTeam.teamName}.
            </div>
          ) : (
            <div className="glass-card p-10 text-center text-white/40">Select a team to see submissions.</div>
          )}
        </div>
      </div>
    </div>
  )
}
