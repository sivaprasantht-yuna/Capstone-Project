import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Notification {
  id: number
  message: string
  notificationType: string
  referenceId?: number
  referenceType?: string
  isRead: boolean
  createdAt: string
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
}

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications(state, action: PayloadAction<Notification[]>) {
      state.notifications = action.payload
      state.unreadCount = action.payload.filter(n => !n.isRead).length
    },
    addNotification(state, action: PayloadAction<Notification>) {
      state.notifications.unshift(action.payload)
      if (!action.payload.isRead) state.unreadCount += 1
    },
    markAllRead(state) {
      state.notifications = state.notifications.map(n => ({ ...n, isRead: true }))
      state.unreadCount = 0
    },
  },
})

export const { setNotifications, addNotification, markAllRead } = notificationSlice.actions
export default notificationSlice.reducer
