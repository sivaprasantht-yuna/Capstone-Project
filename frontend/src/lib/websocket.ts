import { Client, IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { store } from '../store'
import { addNotification } from '../store/notificationSlice'

let stompClient: Client | null = null
let connectAttempts   = 0
let retryTimer: ReturnType<typeof setTimeout> | null = null

const MAX_ATTEMPTS    = 6          // give up after 6 failures (avoids infinite log spam)
const BASE_DELAY_MS   = 3000       // 3s first retry
const MAX_DELAY_MS    = 60_000     // cap at 60s

function getBackoffDelay(): number {
  // Exponential: 3s, 6s, 12s, 24s, 48s, 60s…
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
  // Avoid duplicate clients
  if (stompClient?.active) return

  const { user } = store.getState().auth

  stompClient = new Client({
    webSocketFactory: () =>
      new SockJS('/ws', null, { transports: ['websocket', 'xhr-streaming', 'xhr-polling'] }),
    connectHeaders: {
      Authorization: `Bearer ${user?.accessToken || ''}`,
    },
    // Disable built-in reconnect — we handle it manually with backoff
    reconnectDelay: 0,

    onConnect: () => {
      connectAttempts = 0  // reset on success
      console.log('[WS] Connected to STOMP broker')

      // Subscribe to user-specific notifications
      stompClient?.subscribe(
        `/user/${userId}/queue/notifications`,
        (message: IMessage) => {
          try {
            const notification = JSON.parse(message.body)
            store.dispatch(addNotification(notification))
          } catch { /* malformed message */ }
        }
      )
    },

    onStompError: (frame) => {
      console.warn('[WS] STOMP error:', frame.headers?.message || frame)
      connectAttempts++
      scheduleReconnect(userId)
    },

    onWebSocketError: () => {
      // This fires on ECONNREFUSED / ECONNRESET — suppress the full stack
      connectAttempts++
      scheduleReconnect(userId)
    },

    onDisconnect: () => {
      console.log('[WS] Disconnected')
    },
  })

  stompClient.activate()
}

export async function connectWebSocket(userId: number): Promise<void> {
  // Reset state on fresh connect call (e.g. new login)
  connectAttempts = 0
  if (retryTimer) { clearTimeout(retryTimer); retryTimer = null }
  if (stompClient?.active) { stompClient.deactivate(); stompClient = null }

  // Only attempt if backend is up — silently skip if not
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
  if (!stompClient?.connected) return () => {}

  const subscription = stompClient.subscribe(
    `/topic/team/${teamId}`,
    (message: IMessage) => {
      try {
        const payload: ChatMessage = JSON.parse(message.body)
        onMessage(payload)
      } catch { /* malformed */ }
    }
  )

  return () => subscription.unsubscribe()
}

export function sendChatMessage(teamId: number, content: string): void {
  stompClient?.publish({
    destination: `/app/chat/${teamId}`,
    body: JSON.stringify({ content }),
  })
}

export function disconnectWebSocket(): void {
  if (retryTimer) { clearTimeout(retryTimer); retryTimer = null }
  stompClient?.deactivate()
  stompClient = null
  connectAttempts = 0
}

export interface ChatMessage {
  senderId: number
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: string
}
