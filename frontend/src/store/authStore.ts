import { create } from 'zustand'
import type { User } from '@/types/user.types'
import { log } from '@/utils/logger'
import { getToken, getUser, saveToken, saveUser, clearAuth } from '@/utils/storage'
import { getCurrentUser } from '@/api/auth'
// AuthResponse not needed in store

interface AuthStoreState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isChecking: boolean
  setUser: (user: User, token: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
  initAuth: () => void
  checkAuth: () => Promise<{ ok: boolean; user?: User; error?: unknown }>
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isChecking: false,
  
  setUser: (user: User, token: string) => {
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
  
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  checkAuth: async () => {
    const state = get()
    if (state.isChecking) {
      log('AuthStore', 'checkAuth: already checking — skipping')
      return { ok: true }
    }
    
    set({ isChecking: true, isLoading: true })
    log('AuthStore', 'checkAuth: start')
    
    try {
      const token = getToken()
      if (!token) {
        log('AuthStore', 'checkAuth: no token present')
        set({ user: null, token: null, isAuthenticated: false, isChecking: false, isLoading: false })
        return { ok: false }
      }

      const user = await getCurrentUser()
      if (user) {
        log('AuthStore', 'checkAuth: token valid — set user')
        set({ user, token, isAuthenticated: true, isChecking: false, isLoading: false })
        saveUser(user)
        saveToken(token)
        return { ok: true, user }
      }

      clearAuth()
      set({ isChecking: false, isLoading: false })
      return { ok: false }
    } catch (err) {
      log('AuthStore', 'checkAuth: failed')
      clearAuth()
      set({ isChecking: false, isLoading: false })
      return { ok: false, error: err }
    }
  },
  
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
