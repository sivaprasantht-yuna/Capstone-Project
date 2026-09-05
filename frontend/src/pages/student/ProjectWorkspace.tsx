import { useEffect, useState, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Github, CheckCircle, Clock, AlertCircle, Send,
  MessageSquare, FolderKanban, BookOpen, Layers, Sparkles,
  CheckCheck, Check
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { subscribeToTeamChat, sendChatMessage, ChatMessage } from '../../lib/websocket'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import ProjectDocumentationViewer from '../../components/ProjectDocumentationViewer'

export default function ProjectWorkspace() {
  const { user } = useSelector((s: RootState) => s.auth)
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'chat' ? 'chat' : searchParams.get('tab') === 'docs' ? 'docs' : 'milestones'
  const [activeTab, setActiveTab] = useState<'milestones' | 'chat' | 'docs'>(initialTab)

  // Team & Milestones state
  const [team, setTeam] = useState<any>(null)
  const [milestones, setMilestones] = useState<any[]>([])
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null)
  const [githubUrl, setGithubUrl] = useState('')
  const [remarks, setRemarks] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Unread message tracking (WhatsApp style)
  const [lastReadTime, setLastReadTime] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('workspace_chat_last_read')
      return stored ? Number(stored) : Date.now()
    } catch {
      return Date.now()
    }
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => setFile(files[0]),
    maxFiles: 1,
    accept: { 'application/pdf': ['.pdf'], 'application/zip': ['.zip'], 'application/octet-stream': [] },
  })

  // Synchronize tab change with URL query parameter & mark as read
  const handleTabChange = (tab: 'milestones' | 'chat' | 'docs') => {
    setActiveTab(tab)
    setSearchParams({ tab })
    if (tab === 'chat') {
      const now = Date.now()
      setLastReadTime(now)
      try {
        localStorage.setItem('workspace_chat_last_read', now.toString())
      } catch {}
    }
  }

  // Clear unread count and mark messages as read on server while viewing chat tab
  useEffect(() => {
    if (activeTab === 'chat' && team?.id) {
      const now = Date.now()
      setLastReadTime(now)
      try {
        localStorage.setItem('workspace_chat_last_read', now.toString())
      } catch {}

      // Tell backend to mark unread messages as read
      api.post(`/messages/team/${team.id}/read`).catch(() => {})
    }
  }, [activeTab, messages.length, team?.id])

  // Calculate unread count (only messages sent by OTHER teammates while not viewing chat)
  const unreadChatCount = useMemo(() => {
    if (activeTab === 'chat') return 0
    const currentUserId = user?.userId ? Number(user.userId) : null
    return messages.filter(m => {
      const isFromOther = currentUserId ? m.senderId !== currentUserId : true
      const msgTime = m.timestamp ? new Date(m.timestamp).getTime() : 0
      return isFromOther && msgTime > lastReadTime
    }).length
  }, [messages, activeTab, lastReadTime, user?.userId])

  useEffect(() => {
    api.get('/teams/my').then(r => {
      if (r.data.length > 0) {
        const t = r.data[0]
        setTeam(t)
        api.get(`/milestones/team/${t.id}`).then(m => setMilestones(m.data))
      }
    }).catch(() => {})
  }, [])

  // Load & poll chat messages
  useEffect(() => {
    if (!team?.id) return

    const loadMessages = () => {
      api.get(`/messages/team/${team.id}`)
        .then(m => {
          if (Array.isArray(m.data)) {
            setMessages(m.data.map((msg: any) => ({
              id: msg.id,
              senderId: msg.sender?.id ?? msg.senderId,
              senderName: msg.sender?.name ?? msg.senderName ?? 'Member',
              content: msg.content,
              isRead: Boolean(msg.isRead),
              timestamp: msg.timestamp,
            })))
          }
        })
        .catch(() => {})
    }

    loadMessages()
    const interval = setInterval(loadMessages, 4000)

    // Subscribe to live WebSocket STOMP chat
    const unsubscribe = subscribeToTeamChat(team.id, (msg: any) => {
      if (msg.type === 'READ_RECEIPT') {
        // All previous messages marked as read by teammates
        setMessages(prev => prev.map(p => ({ ...p, isRead: true })))
        return
      }

      setMessages(prev => {
        // Prevent duplicate append if message already exists
        const exists = prev.some(p => p.content === msg.content && p.senderId === msg.senderId && Math.abs(new Date(p.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 3000)
        return exists ? prev : [...prev, { ...msg, isRead: Boolean(msg.isRead) }]
      })
    })

    return () => {
      clearInterval(interval)
      unsubscribe()
    }
  }, [team?.id])

  // Auto-scroll chat to bottom on new message
  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, activeTab])

  const handleSubmitMilestone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMilestone) { toast.error('Select a milestone'); return }
    setLoading(true)
    try {
      const formData = new FormData()
      if (remarks) formData.append('remarks', remarks)
      if (githubUrl) formData.append('githubUrl', githubUrl)
      if (file) formData.append('file', file)

      await api.post(`/milestones/${selectedMilestone}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Submission successful! 🎉 Points awarded.')
      setFile(null); setGithubUrl(''); setRemarks('')
      // Refresh milestones
      api.get(`/milestones/team/${team.id}`).then(m => setMilestones(m.data))
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Submission failed.')
    } finally { setLoading(false) }
  }

  const handleSendChatMessage = async () => {
    const text = chatInput.trim()
    if (!text || !team?.id) return

    setChatInput('')

    // Optimistic local display
    const optimisticMsg: ChatMessage = {
      senderId: user?.userId ? Number(user.userId) : 0,
      senderName: user?.name || 'You',
      content: text,
      isRead: false,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, optimisticMsg])

    try {
      // Primary: REST API endpoint
      const res = await api.post(`/messages/team/${team.id}`, { content: text })
      if (res.data) {
        setMessages(prev => prev.map(m => m === optimisticMsg ? { ...m, id: res.data.id, isRead: res.data.isRead ?? false } : m))
      }
      // Secondary: WebSocket publish
      sendChatMessage(team.id, text)
    } catch (err: any) {
      console.warn('REST message send warning:', err)
      // Fallback via WebSocket
      try {
        sendChatMessage(team.id, text)
      } catch {}
    }
  }

  const handleChatKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendChatMessage()
    }
  }

  const statusIcon = (status: string) => {
    if (status === 'APPROVED')  return <CheckCircle size={16} className="text-emerald-600" />
    if (status === 'SUBMITTED') return <Clock size={16} className="text-amber-500" />
    if (status === 'OVERDUE')   return <AlertCircle size={16} className="text-rose-500" />
    return <Clock size={16} className="text-slate-400" />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <FolderKanban className="text-primary-600" size={24} /> Project Workspace
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Central execution hub for milestone submissions, live team chat, and project documentation.
          </p>
        </div>

        {team && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs text-xs">
            <span className="font-semibold text-slate-500">Team:</span>
            <span className="font-bold text-primary-700 font-mono">{team.teamName}</span>
          </div>
        )}
      </div>

      {!team ? (
        <div className="card p-12 text-center text-slate-500 bg-white border border-slate-200">
          <FolderKanban className="mx-auto text-slate-300 mb-3 opacity-60" size={40} />
          <h3 className="text-slate-700 font-semibold">No Team Workspace Found</h3>
          <p className="text-sm text-slate-400 mt-1">Create or join a team under "Team Formation" to access your project workspace.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* ── Workspace Tab Switcher ── */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200 max-w-full overflow-x-auto no-scrollbar scroll-smooth">
            <button
              onClick={() => handleTabChange('milestones')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                activeTab === 'milestones'
                  ? 'bg-white text-primary-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Layers size={15} /> Milestones & Submissions ({milestones.length})
            </button>

            <button
              onClick={() => handleTabChange('chat')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                activeTab === 'chat'
                  ? 'bg-white text-primary-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <MessageSquare size={15} />
              <span>Team Chat</span>
              {unreadChatCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary-600 text-white font-bold animate-pulse">
                  {unreadChatCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('docs')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                activeTab === 'docs'
                  ? 'bg-white text-primary-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BookOpen size={15} /> Documentation & README
            </button>
          </div>

          {/* ── TAB 1: Milestones & Submissions ── */}
          {activeTab === 'milestones' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Milestones Timeline */}
              <div className="lg:col-span-1 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-800 text-sm">Project Milestones</h2>
                  <span className="text-xs text-slate-400 font-mono">
                    {milestones.filter(m => m.status === 'APPROVED').length}/{milestones.length} Completed
                  </span>
                </div>

                {milestones.length === 0 ? (
                  <div className="card p-6 text-center text-slate-400 text-xs bg-white border border-slate-200">
                    No milestones assigned to this project yet.
                  </div>
                ) : (
                  milestones.map((m, i) => (
                    <motion.button
                      key={m.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedMilestone(m.id)}
                      className={`w-full text-left card p-4 transition-all duration-200 bg-white border cursor-pointer ${
                        selectedMilestone === m.id
                          ? 'border-primary-500 ring-2 ring-primary-500/10 bg-primary-50/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {statusIcon(m.status)}
                        <span className="font-medium text-slate-800 text-sm leading-tight">{m.title}</span>
                      </div>
                      {m.dueDate && <p className="text-xs text-slate-500 ml-6">Due: {m.dueDate}</p>}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                        <span className={`badge text-[11px] ${
                          m.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          m.status === 'OVERDUE'  ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          m.status === 'SUBMITTED'? 'bg-amber-50 text-amber-700 border border-amber-200' : 'badge-primary'
                        }`}>
                          {m.status}
                        </span>
                        <span className="text-xs text-amber-600 font-semibold">+{m.pointsReward} pts</span>
                      </div>
                    </motion.button>
                  ))
                )}
              </div>

              {/* Right Column: Submission Form */}
              <div className="lg:col-span-2 card p-6 bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="font-semibold text-slate-800 mb-1 text-base" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {selectedMilestone
                      ? `Submit Milestone: ${milestones.find(m => m.id === selectedMilestone)?.title}`
                      : 'Select a milestone from the list to submit work'}
                  </h2>
                  <p className="text-xs text-slate-500 mb-5">
                    {selectedMilestone
                      ? milestones.find(m => m.id === selectedMilestone)?.description || 'Upload your deliverables, code repositories, or reports for mentor review.'
                      : 'Choose an active milestone on the left panel to upload reports or provide repository links.'}
                  </p>

                  {selectedMilestone ? (
                    <form onSubmit={handleSubmitMilestone} className="space-y-4">
                      {/* Drag & Drop File Upload */}
                      <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-2xl p-5 sm:p-8 text-center cursor-pointer transition-colors ${
                          isDragActive ? 'border-primary-500 bg-primary-50/50' : 'border-slate-200 hover:border-primary-400 hover:bg-slate-50'
                        }`}
                      >
                        <input {...getInputProps()} />
                        <Upload size={28} className="mx-auto text-slate-400 mb-2" />
                        {file ? (
                          <div className="space-y-1">
                            <p className="text-primary-600 text-sm font-semibold">{file.name}</p>
                            <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready to upload</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-slate-700 text-sm font-medium">Drag & drop deliverables (PDF, ZIP), or click to browse</p>
                            <p className="text-xs text-slate-400 mt-1">Maximum file size: 25MB</p>
                          </div>
                        )}
                      </div>

                      {/* GitHub Deliverable Repo URL */}
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">GitHub Branch / PR Link (Optional)</label>
                        <div className="relative">
                          <Github className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input
                            value={githubUrl}
                            onChange={e => setGithubUrl(e.target.value)}
                            placeholder="https://github.com/owner/repo/pull/1"
                            className="input pl-10 text-sm py-2 bg-white"
                          />
                        </div>
                      </div>

                      {/* Remarks */}
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Remarks & Execution Summary</label>
                        <textarea
                          value={remarks}
                          onChange={e => setRemarks(e.target.value)}
                          placeholder="Summarize key completed deliverables, test outcomes, or questions for your mentor..."
                          rows={3}
                          className="input text-sm py-2 bg-white resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full flex items-center justify-center gap-2 text-sm shadow-xs"
                      >
                        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
                        Submit Milestone Deliverables
                      </button>
                    </form>
                  ) : (
                    <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                      <Layers size={36} className="mx-auto text-slate-300 mb-2 opacity-50" />
                      <p className="text-sm font-medium text-slate-600">No milestone selected</p>
                      <p className="text-xs text-slate-400 mt-1">Click on any milestone from the list on the left to submit deliverables.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── TAB 2: Embedded Live Team Chat ── */}
          {activeTab === 'chat' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-0 overflow-hidden bg-white border border-slate-200 shadow-sm flex flex-col h-[620px]">
              {/* Chat Header */}
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 bg-primary-600 text-white rounded-lg inline-flex">
                    <MessageSquare className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {team.teamName} — Live Team Channel
                    </h3>
                    <p className="text-[11px] text-slate-400">WebSocket / STOMP real-time messaging</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connected
                </span>
              </div>

              {/* Chat Messages Log */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-slate-50/40 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 text-sm">
                    <MessageSquare size={36} className="mx-auto mb-2 text-slate-300 opacity-60" />
                    <p className="font-medium text-slate-600">No messages in team chat yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Start collaborating with your teammates here.</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.senderId === user?.userId
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-xs">
                          {msg.senderName?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className={`max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                          <span className="text-[11px] text-slate-500 mb-1 font-medium">{msg.senderName}</span>
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm shadow-xs ${
                              isMe
                                ? 'bg-primary-600 text-white rounded-tr-xs'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                            }`}
                          >
                            {msg.content}
                          </div>
                          <div className={`flex items-center gap-1 mt-1 text-[10px] text-slate-400 font-mono ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <span>
                              {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                            {isMe && (
                              <span
                                title={msg.isRead ? 'Seen by team' : 'Delivered to team'}
                                className="inline-flex items-center"
                              >
                                <CheckCheck
                                  size={14}
                                  className={`stroke-[2.2] ${msg.isRead ? 'text-sky-500' : 'text-slate-400'}`}
                                />
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3.5 border-t border-slate-200 bg-white flex gap-2.5 items-center">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={handleChatKey}
                  placeholder="Type a message to your team... (Press Enter to send)"
                  className="w-full flex-1 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 text-sm outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all"
                />
                <button
                  type="button"
                  onClick={handleSendChatMessage}
                  disabled={!chatInput.trim()}
                  className="btn-primary px-4 py-2.5 text-xs flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Send size={15} />
                  <span>Send</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ── TAB 3: Project Documentation & Live README ── */}
          {activeTab === 'docs' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <ProjectDocumentationViewer
                projectId={team.project?.id || team.id}
                sourceType={team.project?.sourceType}
                githubRepoUrl={team.project?.githubRepoUrl || team.project?.githubUrl}
                githubReadmeHtml={team.project?.githubReadmeHtml}
                githubLastSyncedAt={team.project?.githubLastSyncedAt}
                generatedReadmeMd={team.project?.generatedReadmeMd || team.project?.projectOverviewDoc}
                projectOverviewDoc={team.project?.projectOverviewDoc}
              />
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
