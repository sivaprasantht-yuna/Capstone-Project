import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Loader2, MessageSquare, CheckCheck, Check } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { subscribeToTeamChat, sendChatMessage, ChatMessage } from '../../lib/websocket'
import api from '../../lib/api'

export default function TeamChat() {
  const { user } = useSelector((s: RootState) => s.auth)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [teamId, setTeamId] = useState<number | null>(null)

  useEffect(() => {
    api.get('/teams/my').then(r => {
      if (r.data.length > 0) {
        const id = r.data[0].id
        setTeamId(id)

        const loadMessages = () => {
          api.get(`/messages/team/${id}`).then(m => {
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
          }).catch(() => {})
        }

        loadMessages()
        api.post(`/messages/team/${id}/read`).catch(() => {})
        const interval = setInterval(loadMessages, 4000)

        // Subscribe to live chat
        const unsub = subscribeToTeamChat(id, (msg: any) => {
          if (msg.type === 'READ_RECEIPT') {
            setMessages(prev => prev.map(p => ({ ...p, isRead: true })))
            return
          }

          setMessages(prev => {
            const exists = prev.some(p => p.content === msg.content && p.senderId === msg.senderId && Math.abs(new Date(p.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 3000)
            return exists ? prev : [...prev, { ...msg, isRead: Boolean(msg.isRead) }]
          })
        })

        return () => {
          clearInterval(interval)
          unsub()
        }
      }
    }).catch(() => {})
  }, [])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !teamId) return
    setInput('')

    const opt: ChatMessage = {
      senderId: user?.userId ? Number(user.userId) : 0,
      senderName: user?.name || 'You',
      content: text,
      isRead: false,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, opt])

    try {
      const res = await api.post(`/messages/team/${teamId}`, { content: text })
      if (res.data) {
        setMessages(prev => prev.map(m => m === opt ? { ...m, id: res.data.id, isRead: res.data.isRead ?? false } : m))
      }
      sendChatMessage(teamId, text)
    } catch (err: any) {
      console.warn('REST message send warning:', err)
      try {
        sendChatMessage(teamId, text)
      } catch {}
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-140px)] animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <MessageSquare className="text-primary-600" size={24} /> Team Chat
        </h1>
        <p className="text-slate-500 text-sm">Real-time team communication via WebSocket/STOMP</p>
      </div>

      {!teamId ? (
        <div className="card flex-1 flex items-center justify-center">
          <p className="text-slate-400">Join a team to access team chat.</p>
        </div>
      ) : (
        <div className="card flex-1 flex flex-col overflow-hidden bg-white">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {messages.map((msg, i) => {
              const isMe = msg.senderId === user?.userId
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-xs">
                    {msg.senderName?.[0]}
                  </div>
                  <div className={`max-w-xs ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    <span className="text-xs text-slate-500 mb-1 font-medium">{msg.senderName}</span>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-xs ${
                      isMe ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    <div className={`flex items-center gap-1 mt-1 text-xs text-slate-400 ${isMe ? 'justify-end' : 'justify-start'}`}>
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
            })}
            {messages.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">
                No messages yet. Start the conversation!
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-200 bg-white flex gap-3">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Type a message... (Enter to send)"
              className="input-dark flex-1" />
            <button onClick={handleSend} disabled={!input.trim()}
              className="btn-primary px-4 py-3 disabled:opacity-40">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
