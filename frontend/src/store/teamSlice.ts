import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface TeamMember {
  id: string
  name: string
  role: string        // e.g. "LEADER" | "MEMBER"
  department: string
  rollNumber?: string
  contactNumber?: string
  techRole?: string   // e.g. "Frontend Developer"
  skills?: string[]
  avatarInitial?: string
}

export interface TeamState {
  teamId: string | null
  teamName: string | null
  projectDomain: string[]
  projectFocus: string | null
  isLeader: boolean
  leaderId: string | null
  members: TeamMember[]
  memberLimit: number
  currentMemberCount: number
  status: 'RECRUITING' | 'FULL' | 'LOCKED' | null
  requiredSkills: string[]
}

function getUserStorageKey(): string | null {
  try {
    const authRaw = localStorage.getItem('capstone_auth')
    if (authRaw) {
      const auth = JSON.parse(authRaw)
      if (auth && auth.userId) return `skill_sync_team_${auth.userId}`
    }
  } catch {}
  return null
}

function loadFromStorage(): TeamState {
  try {
    const key = getUserStorageKey()
    if (key) {
      const raw = localStorage.getItem(key)
      if (raw) return JSON.parse(raw)
    }
  } catch {}
  return {
    teamId: null,
    teamName: null,
    projectDomain: [],
    projectFocus: null,
    isLeader: false,
    leaderId: null,
    members: [],
    memberLimit: 4,
    currentMemberCount: 0,
    status: null,
    requiredSkills: [],
  }
}

function saveToStorage(state: TeamState) {
  try {
    const key = getUserStorageKey()
    if (key) {
      localStorage.setItem(key, JSON.stringify(state))
    }
  } catch {}
}

const teamSlice = createSlice({
  name: 'team',
  initialState: loadFromStorage(),
  reducers: {
    setTeam(state, action: PayloadAction<Partial<TeamState>>) {
      Object.assign(state, action.payload)
      saveToStorage(state as TeamState)
    },
    updateTeam(state, action: PayloadAction<Partial<TeamState>>) {
      Object.assign(state, action.payload)
      saveToStorage(state as TeamState)
    },
    addMember(state, action: PayloadAction<TeamMember>) {
      const exists = state.members.find(m => m.id === action.payload.id)
      if (!exists) {
        state.members.push(action.payload)
        state.currentMemberCount = state.members.length
      }
      saveToStorage(state as TeamState)
    },
    removeMember(state, action: PayloadAction<string>) {
      state.members = state.members.filter(m => m.id !== action.payload)
      state.currentMemberCount = state.members.length
      saveToStorage(state as TeamState)
    },
    clearTeam(state) {
      Object.assign(state, {
        teamId: null,
        teamName: null,
        projectDomain: [],
        projectFocus: null,
        isLeader: false,
        leaderId: null,
        members: [],
        memberLimit: 4,
        currentMemberCount: 0,
        status: null,
        requiredSkills: [],
      })
      const key = getUserStorageKey()
      if (key) localStorage.removeItem(key)
      localStorage.removeItem('skill_sync_team')
    },
  },
})

export const { setTeam, updateTeam, addMember, removeMember, clearTeam } = teamSlice.actions
export default teamSlice.reducer
