import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Clock, Users, Star, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'

export default function MentorshipRequests() {
  const { user } = useSelector((s: RootState) => s.auth)
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState<number | null>(null)

  useEffect(() => {
    api.get('/mentorships/pending')
      .then(r => setRequests(r.data))
      .finally(() => setLoading(false))
  }, [])

  const respond = async (id: number, accept: boolean) => {
    setResponding(id)
    try {
      await api.patch(`/mentorships/${id}/respond?accept=${accept}`)
      setRequests(prev => prev.filter(r => r.id !== id))
      toast.success(accept ? '✅ Mentorship accepted!' : 'Request declined.')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to respond.')
    } finally { setResponding(null) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Clock className="text-emerald-400" size={24} /> Mentorship Requests
        </h1>
        <p className="text-white/50 text-sm">Teams that have requested you as their mentor</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary-400" size={32} /></div>
      ) : requests.length === 0 ? (
        <div className="glass-card p-10 text-center text-white/40">No pending requests.</div>
      ) : (
        <div className="space-y-4">
          {requests.map((req, i) => (
            <motion.div key={req.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }} className="glass-card p-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-600/20 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400">
                    <Users size={22} />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{req.team?.teamName}</div>
                    <div className="text-sm text-white/50">{req.team?.project?.title}</div>
                  </div>
                </div>

                {req.matchScore && (
                  <div className="text-right">
                    <div className="text-lg font-bold gradient-text-accent">
                      {Math.round(req.matchScore * 100)}% match
                    </div>
                    {req.matchingSkillsJson && (
                      <div className="flex flex-wrap gap-1 mt-1 justify-end">
                        {JSON.parse(req.matchingSkillsJson).map((s: string) => (
                          <span key={s} className="badge badge-accent text-xs">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={() => respond(req.id, false)} disabled={responding === req.id}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm">
                  <XCircle size={16} className="text-danger" /> Decline
                </button>
                <button onClick={() => respond(req.id, true)} disabled={responding === req.id}
                  className="btn-accent flex-1 flex items-center justify-center gap-2 text-sm">
                  {responding === req.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={16} />}
                  Accept
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
