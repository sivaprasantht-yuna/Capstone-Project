import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AuthUser {
  userId: number
  name: string
  email: string
  role: 'STUDENT' | 'FACULTY' | 'ADMIN'
  department?: string
  avatarUrl?: string
  rollNumber?: string
  yearOfStudy?: number
  bio?: string
  domain?: string
  linkedinLink?: string
  githubLink?: string
  skills?: string[]
  tenantId?: string
  institutionName?: string
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
    updateUserProfile(state, action: PayloadAction<Partial<AuthUser>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
        localStorage.setItem('capstone_auth', JSON.stringify(state.user))
      }
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

export const { setUser, updateUserProfile, logout, setLoading, updateAccessToken } = authSlice.actions
export default authSlice.reducer
