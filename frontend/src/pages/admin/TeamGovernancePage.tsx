import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldAlert, UserMinus, AlertTriangle, CheckCircle2,
  XCircle, Clock, Search, RefreshCw, MessageSquare
} from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

interface GovernanceRequest {
  id: number
  teamId: number
  teamName: string
  userId: number
  userName: string
  userRoleInTeam: string
  userDepartment: string
  requestType: 'DISMANTLE_TEAM' | 'LEAVE_TEAM'
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  adminNotes?: string
  createdAt?: string
  reviewedAt?: string
}

export default function TeamGovernancePage() {
  const [requests, setRequests] = useState<GovernanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [search, setSearch] = useState('')
  const [reviewingId, setReviewingId] = useState<number | null>(null)
  const [adminNote, setAdminNote] = useState('')

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/governance-requests')
      setRequests(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      console.error(e)
      toast.error('Failed to load team governance requests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleReview = async (requestId: number, action: 'APPROVE' | 'REJECT') => {
    try {
      await api.post(`/admin/governance-requests/${requestId}/review`, {
        action,
        adminNotes: adminNote.trim() || undefined
      })
      toast.success(`Request ${action === 'APPROVE' ? 'Approved' : 'Rejected'} successfully!`)
      setReviewingId(null)
      setAdminNote('')
      fetchRequests()
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to review request.')
    }
  }

  const filtered = requests.filter(r => {
    if (filter !== 'ALL' && r.status !== filter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.teamName?.toLowerCase().includes(q) ||
      r.userName?.toLowerCase().includes(q) ||
      r.reason?.toLowerCase().includes(q) ||
      r.userDepartment?.toLowerCase().includes(q)
    )
  })

  const pendingCount = requests.filter(r => r.status === 'PENDING').length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="section-subhead mb-1">Administrative Oversight</p>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Team Governance & Requests
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Review and adjudicate team dissolution and member departure requests submitted by students.
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="btn-secondary text-sm flex items-center gap-2 self-start"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar max-w-full">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all flex items-center gap-1.5 ${
                filter === tab
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'PENDING' && <Clock size={13} className="text-amber-500" />}
              {tab === 'APPROVED' && <CheckCircle2 size={13} className="text-emerald-500" />}
              {tab === 'REJECTED' && <XCircle size={13} className="text-rose-500" />}
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
              {tab === 'PENDING' && pendingCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search requests..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="card p-12 text-center text-slate-400">Loading governance requests...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <ShieldAlert size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="font-semibold text-slate-700">No {filter !== 'ALL' ? filter.toLowerCase() : ''} requests found</h3>
          <p className="text-slate-500 text-xs mt-1">There are no team dismantle or member leave requests matching your filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(req => {
            const isDismantle = req.requestType === 'DISMANTLE_TEAM'
            const isPending = req.status === 'PENDING'

            return (
              <motion.div
                key={req.id}
                layout
                className="card p-5 border border-slate-200 hover:shadow-md transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                        isDismantle
                          ? 'bg-rose-50 border border-rose-200 text-rose-700'
                          : 'bg-amber-50 border border-amber-200 text-amber-700'
                      }`}>
                        {isDismantle ? <AlertTriangle size={13} /> : <UserMinus size={13} />}
                        {isDismantle ? 'Team Dismantle Request' : 'Member Leave Request'}
                      </span>

                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        req.status === 'APPROVED' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
                        req.status === 'REJECTED' ? 'bg-slate-100 border border-slate-200 text-slate-500' :
                        'bg-amber-50 border border-amber-200 text-amber-700 animate-pulse'
                      }`}>
                        {req.status}
                      </span>

                      <span className="text-xs text-slate-400">
                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>

                    <div className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <span>{req.teamName}</span>
                      <span className="text-xs font-medium text-slate-400">• Team ID #{req.teamId}</span>
                    </div>

                    <div className="text-xs text-slate-600">
                      Requested by <span className="font-semibold text-slate-800">{req.userName}</span> ({req.userRoleInTeam}) — <span className="text-slate-500">{req.userDepartment}</span>
                    </div>

                    {/* Stated Reason */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs leading-relaxed mt-2">
                      <span className="font-semibold text-slate-900 block mb-1 flex items-center gap-1.5">
                        <MessageSquare size={13} className="text-slate-500" /> Stated Justification & Reason:
                      </span>
                      "{req.reason}"
                    </div>

                    {req.adminNotes && (
                      <div className="text-xs text-slate-500 mt-1 pl-1">
                        <span className="font-semibold">Admin Notes:</span> {req.adminNotes}
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  {isPending && (
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto lg:min-w-[200px] justify-center">
                      {reviewingId === req.id ? (
                        <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl animate-fade-in">
                          <input
                            type="text"
                            placeholder="Optional Admin Note..."
                            value={adminNote}
                            onChange={e => setAdminNote(e.target.value)}
                            className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReview(req.id, 'APPROVE')}
                              className="flex-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-1 shadow-2xs"
                            >
                              <CheckCircle2 size={13} /> Confirm Approve
                            </button>
                            <button
                              onClick={() => handleReview(req.id, 'REJECT')}
                              className="flex-1 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-all flex items-center justify-center gap-1 shadow-2xs"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </div>
                          <button
                            onClick={() => { setReviewingId(null); setAdminNote('') }}
                            className="w-full text-[11px] text-slate-400 hover:text-slate-600 text-center"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReviewingId(req.id)}
                          className="px-4 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2"
                        >
                          <ShieldAlert size={14} className="text-amber-400" /> Review Request
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
