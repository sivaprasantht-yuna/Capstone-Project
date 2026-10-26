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

function getWsBaseUrl(): string {
  // 1. Explicit VITE_WS_URL from environment (e.g., wss://capstone-project-khcp.onrender.com/ws)
  const envWs = import.meta.env.VITE_WS_URL
  if (envWs && typeof envWs === 'string' && envWs.trim()) {
    return envWs.trim().replace(/\/ws\/?$/, '').replace(/\/+$/, '')
  }

  // 2. Derive from VITE_API_URL (e.g., https://capstone-project-khcp.onrender.com/api/v1)
  const envApi = import.meta.env.VITE_API_URL
  if (envApi && typeof envApi === 'string' && envApi.startsWith('http')) {
    try {
      const url = new URL(envApi)
      const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
      return `${protocol}//${url.host}`
    } catch {}
  }

  // 3. Fallback to current browser host (used for local Vite dev proxy: /ws -> localhost:8000)
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}`
  }

  return 'ws://localhost:8000'
}

/** Checks if the backend is reachable before opening a socket. */
async function isBackendReachable(): Promise<boolean> {
  try {
    const envApi = import.meta.env.VITE_API_URL
    let checkUrl = '/api/v1/skills'
    if (envApi && typeof envApi === 'string' && envApi.startsWith('http')) {
      const base = envApi.replace(/\/+$/, '')
      checkUrl = `${base.replace(/\/api\/v1\/?$/, '')}/health`
    }
    const res = await fetch(checkUrl, { method: 'GET', signal: AbortSignal.timeout(4000) })
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

  const baseUrl = getWsBaseUrl()
  const teamPath = currentTeamId ? `/ws/chat/${currentTeamId}` : '/ws'
  const wsUrl = `${baseUrl}${teamPath}${token ? `?token=${encodeURIComponent(token)}` : ''}`

  console.log(`[WS] Connecting to ${baseUrl}${teamPath}`)
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
