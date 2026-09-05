/**
 * Native WebSocket client for the Unified FastAPI backend with Heartbeats & Auto-Reconnection.
 *
 * Protocol:
 *   Connect to  ws://host/ws/chat/{teamId}?token=JWT (or ws://host/ws)
 *   Keep-alive: Ping / Pong heartbeat every 20s
 *   Auto-reconnect on visibility change (laptop wake) or online event
 *   Send/receive JSON messages:
 *     { type: "CHAT_MESSAGE", content: "...", senderId: N, senderName: "..." }
 *     { type: "PING" } / { type: "PONG" }
 */

import { store } from '../store'
import { addNotification } from '../store/notificationSlice'

let socket: WebSocket | null = null
let connectAttempts = 0
let retryTimer: ReturnType<typeof setTimeout> | null = null
let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let missedHeartbeats = 0
let currentTeamId: number | null = null
let messageHandlers: ((msg: ChatMessage) => void)[] = []
let listenersAttached = false

const BASE_DELAY_MS = 2000
const MAX_DELAY_MS  = 30_000
const HEARTBEAT_INTERVAL_MS = 20_000

function getBackoffDelay(): number {
  return Math.min(BASE_DELAY_MS * Math.pow(1.5, connectAttempts), MAX_DELAY_MS) + (Math.random() * 800)
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

function startHeartbeat() {
  stopHeartbeat()
  missedHeartbeats = 0
  heartbeatTimer = setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      missedHeartbeats++
      if (missedHeartbeats > 3) {
        console.warn('[WS] Heartbeat timeout. Reconnecting...')
        socket.close()
        return
      }
      try {
        socket.send(JSON.stringify({ type: 'PING' }))
      } catch (err) {
        console.warn('[WS] Heartbeat send failed:', err)
      }
    }
  }, HEARTBEAT_INTERVAL_MS)
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
  missedHeartbeats = 0
}

function scheduleReconnect(userId: number) {
  if (retryTimer) clearTimeout(retryTimer)
  const delay = getBackoffDelay()
  console.log(`[WS] Reconnecting in ${(delay / 1000).toFixed(1)}s (attempt ${connectAttempts + 1})…`)
  retryTimer = setTimeout(() => doConnect(userId), delay)
}

function setupWindowListeners(userId: number) {
  if (listenersAttached || typeof window === 'undefined') return
  listenersAttached = true

  window.addEventListener('online', () => {
    console.log('[WS] Network online detected. Reconnecting...')
    connectAttempts = 0
    if (socket?.readyState !== WebSocket.OPEN) {
      doConnect(userId)
    }
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (!socket || socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
        console.log('[WS] Tab active & socket closed. Reconnecting...')
        connectAttempts = 0
        doConnect(userId)
      }
    }
  })
}

function doConnect(userId: number) {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return

  setupWindowListeners(userId)

  const { user } = store.getState().auth
  const token = user?.accessToken || ''

  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsHost = window.location.host
  const teamPath = currentTeamId ? `/ws/chat/${currentTeamId}` : '/ws'
  const wsUrl = `${wsProtocol}//${wsHost}${teamPath}?token=${encodeURIComponent(token)}`

  socket = new WebSocket(wsUrl)

  socket.onopen = () => {
    connectAttempts = 0
    startHeartbeat()
    console.log('[WS] Connected to FastAPI WebSocket')
  }

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      missedHeartbeats = 0

      if (data.type === 'PONG') {
        return
      }

      if (data.type === 'NOTIFICATION') {
        store.dispatch(addNotification(data))
      } else {
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
    stopHeartbeat()
    connectAttempts++
    scheduleReconnect(userId)
  }

  socket.onerror = () => {
    // Handled by onclose
  }
}

export async function connectWebSocket(userId: number): Promise<void> {
  connectAttempts = 0
  if (retryTimer) { clearTimeout(retryTimer); retryTimer = null }
  stopHeartbeat()
  if (socket) { socket.close(); socket = null }

  const reachable = await isBackendReachable()
  if (!reachable) {
    console.warn('[WS] Backend not reachable — will retry.')
    scheduleReconnect(userId)
    return
  }

  doConnect(userId)
}

export function subscribeToTeamChat(
  teamId: number,
  onMessage: (msg: ChatMessage) => void
): () => void {
  currentTeamId = teamId
  messageHandlers.push(onMessage)

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
  stopHeartbeat()
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
