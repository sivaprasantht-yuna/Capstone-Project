import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Clock, Users, Loader2, AlertTriangle, UserMinus, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

export default function MentorshipRequests() {
  const [activeTab, setActiveTab] = useState<'mentorships' | 'dismantles' | 'removals'>('mentorships')

  const [mentorships, setMentorships] = useState<any[]>([])
  const [dismantles, setDismantles] = useState<any[]>([])
  const [removals, setRemovals] = useState<any[]>([])

  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [mRes, govRes] = await Promise.all([
        api.get('/mentorships/pending'),
        api.get('/teams/pending-actions')
      ])
      setMentorships(mRes.data)
      setDismantles(govRes.data.dismantleRequests || [])
      setRemovals(govRes.data.removalRequests || [])
    } catch {
      toast.error('Failed to load pending requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const respondMentorship = async (id: number, accept: boolean) => {
    setResponding(`m-${id}`)
    try {
      await api.patch(`/mentorships/${id}/respond?accept=${accept}`)
      setMentorships(prev => prev.filter(r => r.id !== id))
      toast.success(accept ? '✅ Mentorship accepted!' : 'Request declined.')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to respond.')
    } finally { setResponding(null) }
  }

  const respondDismantle = async (teamId: number, reqId: number, accept: boolean) => {
    setResponding(`d-${reqId}`)
    try {
      const action = accept ? 'approve' : 'reject'
      await api.post(`/teams/${teamId}/dismantle-request/${reqId}/${action}`, { comment: accept ? "Approved by mentor" : "Rejected by mentor" })
      setDismantles(prev => prev.filter(r => r.id !== reqId))
      toast.success(accept ? 'Team dismantled.' : 'Dismantle request rejected.')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to respond.')
    } finally { setResponding(null) }
  }

  const respondRemoval = async (teamId: number, reqId: number, accept: boolean) => {
    setResponding(`r-${reqId}`)
    try {
      const action = accept ? 'approve' : 'reject'
      await api.post(`/teams/${teamId}/removal-request/${reqId}/${action}`, { comment: accept ? "Approved by mentor" : "Rejected by mentor" })
      setRemovals(prev => prev.filter(r => r.id !== reqId))
      toast.success(accept ? 'Member removed.' : 'Removal request rejected.')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to respond.')
    } finally { setResponding(null) }
  }

  const tabs = [
    { id: 'mentorships', label: 'Mentorships', count: mentorships.length, icon: <Users size={15} /> },
    { id: 'dismantles', label: 'Dismantles', count: dismantles.length, icon: <AlertTriangle size={15} /> },
    { id: 'removals', label: 'Member Removals', count: removals.length, icon: <UserMinus size={15} /> },
  ] as const

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Shield className="text-teal-600" size={26} /> Governance & Requests
        </h1>
        <p className="text-slate-500 text-sm mt-1">Manage mentorship offers and team governance requests.</p>
      </div>

      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === t.id ? 'bg-white text-primary-700 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}>
            {t.icon} {t.label}
            {t.count > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === t.id ? 'bg-primary-100 text-primary-800' : 'bg-slate-200 text-slate-700'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'mentorships' && (
            <motion.div key="m" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {mentorships.length === 0 ? (
                <div className="card p-12 text-center text-slate-400">No pending mentorship requests.</div>
              ) : mentorships.map((req, i) => (
                <motion.div key={req.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="card p-5 shadow-xs">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center text-emerald-600">
                        <Users size={22} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{req.team?.teamName}</div>
                        <div className="text-sm text-slate-500 mt-0.5">{req.team?.project?.title}</div>
                      </div>
                    </div>
                    {req.matchScore && (
                      <div className="text-right">
                        <div className="text-sm font-bold text-teal-600">{Math.round(req.matchScore * 100)}% match</div>
                        {req.matchingSkillsJson && (
                          <div className="flex flex-wrap gap-1 mt-1.5 justify-end">
                            {JSON.parse(req.matchingSkillsJson).map((s: string) => (
                              <span key={s} className="badge badge-teal text-[10px]">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                    <button onClick={() => respondMentorship(req.id, false)} disabled={responding === `m-${req.id}`} className="btn-secondary flex-1 text-xs py-2">Decline</button>
                    <button onClick={() => respondMentorship(req.id, true)} disabled={responding === `m-${req.id}`} className="btn-teal flex-1 text-xs py-2 flex items-center justify-center gap-2">
                      {responding === `m-${req.id}` ? <Loader2 size={14} className="animate-spin" /> : 'Accept'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'dismantles' && (
            <motion.div key="d" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {dismantles.length === 0 ? (
                <div className="card p-12 text-center text-slate-400">No pending dismantle requests.</div>
              ) : dismantles.map((req, i) => (
                <motion.div key={req.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="card p-5 border-red-200 bg-red-50/20 shadow-xs">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center text-red-600">
                      <AlertTriangle size={22} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800">Team Dismantle Request</div>
                      <div className="text-sm text-slate-600 mt-0.5">Team: <span className="text-slate-900 font-semibold">{req.team?.teamName}</span></div>
                      <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                        <p className="text-[10px] uppercase text-slate-400 mb-1 font-semibold">Reason Provided</p>
                        <p className="text-sm text-slate-700">{req.reason}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4 pt-4 border-t border-slate-200">
                    <button onClick={() => respondDismantle(req.team.id, req.id, false)} disabled={responding === `d-${req.id}`} className="btn-secondary flex-1 text-xs py-2">Reject Request</button>
                    <button onClick={() => respondDismantle(req.team.id, req.id, true)} disabled={responding === `d-${req.id}`} className="btn-danger flex-1 text-xs py-2 flex items-center justify-center gap-2">
                      {responding === `d-${req.id}` ? <Loader2 size={14} className="animate-spin" /> : 'Approve Dismantle'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'removals' && (
            <motion.div key="r" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {removals.length === 0 ? (
                <div className="card p-12 text-center text-slate-400">No pending removal requests.</div>
              ) : removals.map((req, i) => (
                <motion.div key={req.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="card p-5 border-orange-200 bg-orange-50/20 shadow-xs">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-center text-orange-600">
                      <UserMinus size={22} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800">Member Removal Request</div>
                      <div className="text-sm text-slate-600 mt-0.5">
                        Team: <span className="text-slate-900 font-semibold">{req.team?.teamName}</span>
                      </div>
                      <div className="text-sm text-slate-600 mt-0.5">
                        Target Member: <span className="text-slate-900 font-semibold">{req.targetMember?.user?.name || `ID ${req.targetMember?.id}`}</span>
                      </div>
                      <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                        <p className="text-[10px] uppercase text-slate-400 mb-1 font-semibold">Reason Provided</p>
                        <p className="text-sm text-slate-700">{req.reason}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4 pt-4 border-t border-slate-200">
                    <button onClick={() => respondRemoval(req.team.id, req.id, false)} disabled={responding === `r-${req.id}`} className="btn-secondary flex-1 text-xs py-2">Reject Request</button>
                    <button onClick={() => respondRemoval(req.team.id, req.id, true)} disabled={responding === `r-${req.id}`} className="btn-danger flex-1 text-xs py-2 flex items-center justify-center gap-2">
                      {responding === `r-${req.id}` ? <Loader2 size={14} className="animate-spin" /> : 'Approve Removal'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
