import { Client, IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { store } from '../store'
import { addNotification } from '../store/notificationSlice'

let stompClient: Client | null = null

export function connectWebSocket(userId: number): Client {
  const { user } = store.getState().auth

  const wsUrl = import.meta.env.VITE_WS_URL || '/ws'

  stompClient = new Client({
    webSocketFactory: () => new SockJS(wsUrl),
    connectHeaders: {
      Authorization: `Bearer ${user?.accessToken || ''}`,
    },
    reconnectDelay: 5000,
    onConnect: () => {
      console.log('[WS] Connected to STOMP broker')

      // Subscribe to user-specific notifications
      stompClient?.subscribe(
        `/user/${userId}/queue/notifications`,
        (message: IMessage) => {
          const notification = JSON.parse(message.body)
          store.dispatch(addNotification(notification))
        }
      )
    },
    onStompError: (frame) => {
      console.error('[WS] STOMP error:', frame)
    },
    onDisconnect: () => {
      console.log('[WS] Disconnected')
    },
  })

  stompClient.activate()
  return stompClient
}

export function subscribeToTeamChat(
  teamId: number,
  onMessage: (msg: ChatMessage) => void
): () => void {
  if (!stompClient?.connected) return () => {}

  const subscription = stompClient.subscribe(
    `/topic/team/${teamId}`,
    (message: IMessage) => {
      const payload: ChatMessage = JSON.parse(message.body)
      onMessage(payload)
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
  stompClient?.deactivate()
  stompClient = null
}

export interface ChatMessage {
  senderId: number
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: string
}
