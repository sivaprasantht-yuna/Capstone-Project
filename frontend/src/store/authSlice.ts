import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AuthUser {
  userId: number
  name: string
  email: string
  role: 'STUDENT' | 'FACULTY' | 'ADMIN' | 'INDUSTRY'
  department?: string
  accessToken: string
  refreshToken: string
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  loading: boolean
}

const stored = localStorage.getItem('capstone_auth')
const initialState: AuthState = {
  user: stored ? JSON.parse(stored) : null,
  isAuthenticated: !!stored,
  loading: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload
      state.isAuthenticated = true
      localStorage.setItem('capstone_auth', JSON.stringify(action.payload))
    },
    logout(state) {
      state.user = null
      state.isAuthenticated = false
      localStorage.removeItem('capstone_auth')
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
    updateAccessToken(state, action: PayloadAction<string>) {
      if (state.user) {
        state.user.accessToken = action.payload
        localStorage.setItem('capstone_auth', JSON.stringify(state.user))
      }
    },
  },
})

export const { setUser, logout, setLoading, updateAccessToken } = authSlice.actions
export default authSlice.reducer
