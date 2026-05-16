import { create } from 'zustand'
import type { User } from '@/types/auth'

type AuthState = {
  accessToken: string
  user: User | null
  pendingVerificationEmail: string
  hydrated: boolean
  setSession: (payload: { accessToken: string; user: User }) => void
  setAccessToken: (token: string) => void
  setUser: (user: User | null) => void
  setPendingVerificationEmail: (email: string) => void
  clearPendingVerificationEmail: () => void
  logout: () => void
  hydrateFromStorage: () => void
}

const TOKEN_KEY = 'taskforce.accessToken'
const PENDING_VERIFICATION_EMAIL_KEY = 'taskforce.pendingVerificationEmail'

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: '',
  user: null,
  pendingVerificationEmail: '',
  hydrated: false,
  setSession: ({ accessToken, user }) => {
    localStorage.setItem(TOKEN_KEY, accessToken)
    localStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY)
    set({ accessToken, user, pendingVerificationEmail: '' })
  },
  setAccessToken: (accessToken) => {
    if (accessToken) {
      localStorage.setItem(TOKEN_KEY, accessToken)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }

    set({ accessToken })
  },
  setUser: (user) => set({ user }),
  setPendingVerificationEmail: (email) => {
    const normalized = email.trim().toLowerCase()
    if (normalized) {
      localStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, normalized)
    } else {
      localStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY)
    }
    set({ pendingVerificationEmail: normalized })
  },
  clearPendingVerificationEmail: () => {
    localStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY)
    set({ pendingVerificationEmail: '' })
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY)
    set({ accessToken: '', user: null, pendingVerificationEmail: '' })
  },
  hydrateFromStorage: () => {
    const accessToken = localStorage.getItem(TOKEN_KEY) || ''
    const pendingVerificationEmail =
      localStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY) || ''
    set({ accessToken, pendingVerificationEmail, hydrated: true })
  },
}))
