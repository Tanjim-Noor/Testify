import { create } from 'zustand'
import type { User } from '@/types/user.types'
import { log } from '@/utils/logger'
import { getToken, getUser, saveToken, saveUser, clearAuth } from '@/utils/storage'
import type { AuthResponse } from '@/types/auth.types'

interface AuthStoreState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User, token: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
  initAuth: () => void
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  setUser: (user, token) => {
    saveToken(token)
    saveUser(user)
    log('AuthStore', 'Set user')
    set({ user, token, isAuthenticated: true })
  },
  clearAuth: () => {
    clearAuth()
    log('AuthStore', 'Cleared auth')
    set({ user: null, token: null, isAuthenticated: false })
  },
  setLoading: (loading) => set({ isLoading: loading }),
  initAuth: () => {
    log('AuthStore', 'Initializing from storage')
    const token = getToken()
    const user = getUser()
    if (token && user) {
      set({ user, token, isAuthenticated: true })
    } else {
      set({ user: null, token: null, isAuthenticated: false })
    }
  },
}))
