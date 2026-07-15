import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Loader2, MessageSquare } from 'lucide-react'
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
        // Load history
        api.get(`/messages/team/${id}`).then(m => setMessages(m.data.map((msg: any) => ({
          senderId: msg.sender.id, senderName: msg.sender.name,
          content: msg.content, timestamp: msg.timestamp,
        })))).catch(() => {})
        // Subscribe to live chat
        return subscribeToTeamChat(id, (msg) => setMessages(prev => [...prev, msg]))
      }
    }).catch(() => {})
  }, [])

  const handleSend = () => {
    if (!input.trim() || !teamId) return
    sendChatMessage(teamId, input.trim())
    setInput('')
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-140px)] animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="text-primary-400" size={24} /> Team Chat
        </h1>
        <p className="text-white/50 text-sm">Real-time team communication via WebSocket/STOMP</p>
      </div>

      {!teamId ? (
        <div className="glass-card flex-1 flex items-center justify-center">
          <p className="text-white/40">Join a team to access team chat.</p>
        </div>
      ) : (
        <div className="glass-card flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => {
              const isMe = msg.senderId === user?.userId
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {msg.senderName?.[0]}
                  </div>
                  <div className={`max-w-xs ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    <span className="text-xs text-white/40 mb-1">{msg.senderName}</span>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                      isMe ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-surface-50 text-white/80 rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-xs text-white/20 mt-1">
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </motion.div>
              )
            })}
            {messages.length === 0 && (
              <div className="text-center py-12 text-white/30 text-sm">
                No messages yet. Start the conversation!
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/5 flex gap-3">
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
