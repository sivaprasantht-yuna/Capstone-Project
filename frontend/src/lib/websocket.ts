/**
 * Native WebSocket client for the Unified FastAPI backend.
 * Replaces the previous STOMP/SockJS implementation.
 *
 * Protocol:
 *   Connect to  ws://host/ws/chat/{teamId}?token=JWT
 *   Send/receive JSON messages:
 *     { type: "CHAT_MESSAGE", content: "...", senderId: N, senderName: "..." }
 *     { type: "READ_RECEIPT", teamId: N, userId: N }
 */

import { store } from '../store'
import { addNotification } from '../store/notificationSlice'

let socket: WebSocket | null = null
let connectAttempts = 0
let retryTimer: ReturnType<typeof setTimeout> | null = null
let currentTeamId: number | null = null
let messageHandlers: ((msg: ChatMessage) => void)[] = []

const MAX_ATTEMPTS  = 6
const BASE_DELAY_MS = 3000
const MAX_DELAY_MS  = 60_000

function getBackoffDelay(): number {
  return Math.min(BASE_DELAY_MS * Math.pow(2, connectAttempts), MAX_DELAY_MS)
}

/** Checks if the backend is reachable before opening a socket. */
async function isBackendReachable(): Promise<boolean> {
  try {
    const res = await fetch('/api/v1/skills', { method: 'HEAD', signal: AbortSignal.timeout(2000) })
    return res.ok || res.status < 500
  } catch {
    return false
  }
}

function scheduleReconnect(userId: number) {
  if (connectAttempts >= MAX_ATTEMPTS) {
    console.warn('[WS] Max reconnect attempts reached. Giving up until page reload.')
    return
  }
  const delay = getBackoffDelay()
  console.log(`[WS] Reconnecting in ${delay / 1000}s (attempt ${connectAttempts + 1}/${MAX_ATTEMPTS})…`)
  retryTimer = setTimeout(() => doConnect(userId), delay)
}

function doConnect(userId: number) {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return

  const { user } = store.getState().auth
  const token = user?.accessToken || ''

  // Use the team-specific WebSocket endpoint if we have a teamId, else the generic one
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsHost = window.location.host
  const teamPath = currentTeamId ? `/ws/chat/${currentTeamId}` : '/ws'
  const wsUrl = `${wsProtocol}//${wsHost}${teamPath}?token=${encodeURIComponent(token)}`

  socket = new WebSocket(wsUrl)

  socket.onopen = () => {
    connectAttempts = 0
    console.log('[WS] Connected to FastAPI WebSocket')
  }

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)

      if (data.type === 'NOTIFICATION') {
        store.dispatch(addNotification(data))
      } else {
        // Distribute to all registered message handlers
        const chatMsg: ChatMessage = {
          id: data.id,
          senderId: data.senderId,
          senderName: data.senderName || 'Unknown',
          senderAvatar: data.senderAvatar,
          content: data.content,
          isRead: data.isRead ?? false,
          timestamp: data.timestamp || data.createdAt || new Date().toISOString()
        }
        messageHandlers.forEach(handler => handler(chatMsg))
      }
    } catch {
      /* malformed message — ignore */
    }
  }

  socket.onclose = () => {
    console.log('[WS] Disconnected')
    connectAttempts++
    scheduleReconnect(userId)
  }

  socket.onerror = () => {
    // onclose will fire after onerror — reconnect handled there
  }
}

export async function connectWebSocket(userId: number): Promise<void> {
  connectAttempts = 0
  if (retryTimer) { clearTimeout(retryTimer); retryTimer = null }
  if (socket) { socket.close(); socket = null }

  const reachable = await isBackendReachable()
  if (!reachable) {
    console.warn('[WS] Backend not reachable — skipping WebSocket connection.')
    return
  }

  doConnect(userId)
}

export function subscribeToTeamChat(
  teamId: number,
  onMessage: (msg: ChatMessage) => void
): () => void {
  // Store the team id for reconnection and add the handler
  currentTeamId = teamId
  messageHandlers.push(onMessage)

  // If we're connected to a different team (or generic), reconnect to the correct team
  const { user } = store.getState().auth
  if (user?.userId) {
    if (socket) { socket.close(); socket = null }
    connectAttempts = 0
    doConnect(Number(user.userId))
  }

  return () => {
    messageHandlers = messageHandlers.filter(h => h !== onMessage)
  }
}

export function sendChatMessage(teamId: number, content: string): void {
  if (socket && socket.readyState === WebSocket.OPEN) {
    const { user } = store.getState().auth
    socket.send(JSON.stringify({
      type: 'CHAT_MESSAGE',
      content,
      senderId: user?.userId,
      senderName: user?.name || 'Unknown'
    }))
  }
}

export function disconnectWebSocket(): void {
  if (retryTimer) { clearTimeout(retryTimer); retryTimer = null }
  messageHandlers = []
  currentTeamId = null
  if (socket) { socket.close(); socket = null }
  connectAttempts = 0
}

export interface ChatMessage {
  id?: number
  senderId: number
  senderName: string
  senderAvatar?: string
  content: string
  isRead?: boolean
  timestamp: string
}
