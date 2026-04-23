import { create } from 'zustand'
import type { User } from '@/types/auth'

type AuthState = {
  accessToken: string
  user: User | null
  hydrated: boolean
  setSession: (payload: { accessToken: string; user: User }) => void
  setAccessToken: (token: string) => void
  setUser: (user: User | null) => void
  logout: () => void
  hydrateFromStorage: () => void
}

const TOKEN_KEY = 'taskforce.accessToken'

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: '',
  user: null,
  hydrated: false,
  setSession: ({ accessToken, user }) => {
    localStorage.setItem(TOKEN_KEY, accessToken)
    set({ accessToken, user })
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
  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    set({ accessToken: '', user: null })
  },
  hydrateFromStorage: () => {
    const accessToken = localStorage.getItem(TOKEN_KEY) || ''
    set({ accessToken, hydrated: true })
  },
}))
