import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Star, Send, Loader2, CheckSquare, FileText, Download,
  ExternalLink, Github, Sliders, CheckCircle2, Award
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

export default function GradingPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const [milestones, setMilestones] = useState<any[]>([])
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null)

  // Capstone Rubric States (Sum to 100)
  const [rubricLiterature, setRubricLiterature] = useState<number>(16) // Max 20
  const [rubricArchitecture, setRubricArchitecture] = useState<number>(34) // Max 40
  const [rubricViva, setRubricViva] = useState<number>(35) // Max 40
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)

  const totalScore = Math.min(100, Math.max(0, rubricLiterature + rubricArchitecture + rubricViva))

  useEffect(() => {
    api.get('/mentorships/active')
      .then(r => {
        if (Array.isArray(r.data)) {
          const myTeams = r.data.map((m: any) => ({
            id: m.teamId || m.id,
            teamName: m.teamName || m.team?.teamName || `Team #${m.teamId || m.id}`,
            projectTitle: m.projectTitle || m.team?.project?.title || 'Capstone Project',
            matchScore: m.matchScore
          }))
          setTeams(myTeams)
          if (myTeams.length > 0) {
            loadMilestones(myTeams[0])
          }
        }
      })
      .catch(() => setTeams([]))
  }, [])

  const loadMilestones = async (team: any) => {
    if (!team) return
    setSelectedTeam(team)
    const teamId = team.id || team.teamId
    try {
      const res = await api.get(`/milestones/team/${teamId}`)
      if (Array.isArray(res.data)) {
        setMilestones(res.data)
        if (res.data.length > 0) {
          handleSelectMilestone(res.data[0])
        }
      } else {
        setMilestones([])
      }
    } catch {
      setMilestones([])
    }
  }

  const handleSelectMilestone = (m: any) => {
    setSelectedMilestone(m.id)
    if (m.pointsReward !== null && m.pointsReward !== undefined) {
      // Decompose existing points proportionally into rubrics
      const ratio = m.pointsReward / 100.0
      setRubricLiterature(Math.round(20 * ratio))
      setRubricArchitecture(Math.round(40 * ratio))
      setRubricViva(Math.round(40 * ratio))
    } else {
      setRubricLiterature(16)
      setRubricArchitecture(34)
      setRubricViva(35)
    }
    setFeedback('')
  }

  const activeMilestone = milestones.find(m => m.id === selectedMilestone)

  const submitGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMilestone) { toast.error('Select a milestone to grade'); return }
    setLoading(true)
    try {
      await api.post(`/milestones/${selectedMilestone}/evaluate`, {
        marks: totalScore,
        pointsReward: totalScore,
        feedback: feedback.trim() || `Evaluated with total score: ${totalScore}/100`,
        feedbackData: {
          literatureReview: rubricLiterature,
          architectureImplementation: rubricArchitecture,
          vivaDefense: rubricViva,
          totalScore
        },
        status: 'APPROVED'
      })
      toast.success(`Milestone graded: ${totalScore}/100 points awarded! 🎉`)
      if (selectedTeam) {
        // Reload milestones to update badges
        const res = await api.get(`/milestones/team/${selectedTeam.id}`)
        if (Array.isArray(res.data)) {
          setMilestones(res.data)
        }
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.response?.data?.detail || 'Failed to submit grade.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 font-display">
          <Star className="text-amber-500" size={24} /> Structured Grading & Evaluation
        </h1>
        <p className="text-slate-500 text-sm">Review submitted student deliverables and apply university capstone rubrics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Teams List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Your Mentored Teams</h2>
          {teams.map((t, idx) => {
            const teamKey = t.id || `team-${idx}`
            const isSelected = selectedTeam?.id === t.id
            return (
              <button
                key={teamKey}
                onClick={() => loadMilestones(t)}
                className={`w-full text-left card p-4 transition-all shadow-xs hover:border-slate-300 ${
                  isSelected ? 'border-primary-500 ring-2 ring-primary-100 bg-primary-50/20' : 'bg-white'
                }`}
              >
                <div className="font-semibold text-slate-800 text-sm">{t.teamName}</div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">{t.projectTitle}</div>
              </button>
            )
          })}
          {teams.length === 0 && <p className="text-slate-400 text-sm text-center py-6">No active mentorships yet.</p>}
        </div>

        {/* Right Column: Milestones & Rubric Form */}
        <div className="lg:col-span-2 space-y-4">
          {milestones.length > 0 ? (
            <>
              <h2 className="text-sm font-semibold text-slate-700">Select Milestone to Grade</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {milestones.map(m => {
                  const isSelected = selectedMilestone === m.id
                  const isApproved = m.status === 'APPROVED'
                  const isSubmitted = m.status === 'SUBMITTED'

                  return (
                    <motion.button
                      key={m.id}
                      onClick={() => handleSelectMilestone(m)}
                      className={`text-left card p-3.5 transition-all shadow-xs border ${
                        isSelected
                          ? 'border-primary-500 ring-2 ring-primary-100 bg-primary-50/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <CheckSquare size={16} className={isApproved ? 'text-emerald-500' : isSubmitted ? 'text-amber-500' : 'text-slate-400'} />
                        <span className="font-semibold text-slate-800 text-sm truncate flex-1">{m.title}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          isApproved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          isSubmitted ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {isApproved ? `Graded (${m.pointsReward || 100} pts)` : isSubmitted ? 'Deliverable Submitted' : m.status}
                        </span>
                        {m.deliverableUrl && <span className="text-[11px] text-primary-600 font-medium">1 File</span>}
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {activeMilestone && (
                <div className="card p-5 space-y-5 shadow-xs border border-slate-200 bg-white mt-4 animate-fade-in">
                  {/* Milestone Details & Deliverables Evidence */}
                  <div className="border-b border-slate-100 pb-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                        <Award className="text-primary-600" size={18} />
                        {activeMilestone.title}
                      </h3>
                      {activeMilestone.submittedAt && (
                        <span className="text-xs text-slate-400">
                          Submitted: {new Date(activeMilestone.submittedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {activeMilestone.description && (
                      <p className="text-xs text-slate-500 mt-1">{activeMilestone.description}</p>
                    )}

                    {/* Student Deliverables Links */}
                    {(activeMilestone.deliverableUrl || activeMilestone.githubUrl || activeMilestone.submissionRemarks) ? (
                      <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                        <span className="text-xs font-semibold text-slate-700 block">Student Submission Evidence:</span>

                        {activeMilestone.submissionRemarks && (
                          <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200">
                            "{activeMilestone.submissionRemarks}"
                          </p>
                        )}

                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          {activeMilestone.deliverableUrl && (
                            <a
                              href={activeMilestone.deliverableUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs font-semibold border border-primary-200 transition-colors"
                            >
                              <Download size={14} /> Download Submitted Deliverable
                            </a>
                          )}

                          {activeMilestone.githubUrl && (
                            <a
                              href={activeMilestone.githubUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 text-xs font-semibold border border-slate-300 transition-colors"
                            >
                              <Github size={14} /> View Repository / PR
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 p-3 bg-amber-50/50 rounded-xl border border-amber-200 text-xs text-amber-800">
                        No deliverable files uploaded yet for this milestone.
                      </div>
                    )}
                  </div>

                  {/* Rubric Evaluation Form */}
                  <form onSubmit={submitGrade} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sliders size={18} className="text-primary-600" />
                        <h4 className="font-semibold text-slate-800 text-sm">Structured Evaluation Rubrics</h4>
                      </div>
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-primary-50 text-primary-700 border border-primary-200 shadow-2xs">
                        Total: {totalScore} / 100 Points
                      </span>
                    </div>

                    {/* Criterion 1: Literature Survey */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>1. Literature Review & Problem Formulation</span>
                        <span className="text-primary-700">{rubricLiterature} / 20 pts</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={rubricLiterature}
                        onChange={e => setRubricLiterature(Number(e.target.value))}
                        className="w-full accent-primary-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Inadequate (0)</span>
                        <span>Satisfactory (12)</span>
                        <span>Exemplary (20)</span>
                      </div>
                    </div>

                    {/* Criterion 2: Architecture & Implementation */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>2. Technical Architecture, Coding & Implementation</span>
                        <span className="text-primary-700">{rubricArchitecture} / 40 pts</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        value={rubricArchitecture}
                        onChange={e => setRubricArchitecture(Number(e.target.value))}
                        className="w-full accent-primary-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Needs Rework (0)</span>
                        <span>Functional (24)</span>
                        <span>Production Quality (40)</span>
                      </div>
                    </div>

                    {/* Criterion 3: Testing & Viva Defense */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>3. Test Coverage, Documentation & Viva Defense</span>
                        <span className="text-primary-700">{rubricViva} / 40 pts</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        value={rubricViva}
                        onChange={e => setRubricViva(Number(e.target.value))}
                        className="w-full accent-primary-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Incomplete (0)</span>
                        <span>Well Documented (25)</span>
                        <span>Defended with Distinction (40)</span>
                      </div>
                    </div>

                    {/* Qualitative Feedback */}
                    <div>
                      <label className="text-slate-700 text-xs block mb-1 font-semibold">
                        Qualitative Evaluator Feedback & Action Items
                      </label>
                      <textarea
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                        rows={3}
                        placeholder="Detail strengths, technical trade-offs, and next milestones to address..."
                        className="input text-sm resize-none bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm shadow-xs"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Submit Rubric Evaluation ({totalScore} Points)
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : selectedTeam ? (
            <div className="card p-10 text-center text-slate-400 bg-white border border-slate-200">
              No milestones found for {selectedTeam.teamName}.
            </div>
          ) : (
            <div className="card p-10 text-center text-slate-400 bg-white border border-slate-200">
              Select a team on the left to review and grade milestones.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
