import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as apiLogin, register as apiRegister, getCurrentUser } from '@/api/auth'
import { getToken } from '@/utils/storage'
import { useAuthStore } from '@/store/authStore'
import { log, error } from '@/utils/logger'

export const useAuth = () => {
  const navigate = useNavigate()
  const { setUser, clearAuth, setLoading } = useAuthStore()

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const res = await apiLogin({ email, password })
      setUser(res.user, res.access_token)
      log('useAuth', 'Login success', res.user.email)
      return { ok: true, user: res.user }
    } catch (err) {
      // Try to extract a user-friendly message from backend
      const detail = (err as any)?.response?.data?.detail
      const message = Array.isArray(detail)
        ? detail.map((d: any) => d.msg || d.detail || JSON.stringify(d)).join(', ')
        : detail?.msg || detail || err
      error('useAuth', 'Login failed', err)
      return { ok: false, error: err }
    } finally {
      setLoading(false)
    }
  }, [setUser, setLoading])

  const register = useCallback(async (email: string, password: string, role: 'admin' | 'student') => {
    setLoading(true)
    try {
      const res = await apiRegister({ email, password, role })
      // Optionally auto-login
      setUser(res.user, res.access_token)
      log('useAuth', 'Register success', res.user.email)
      return { ok: true, user: res.user }
    } catch (err) {
      error('useAuth', 'Register failed', err)
      return { ok: false, error: err }
    } finally {
      setLoading(false)
    }
  }, [setUser, setLoading])

  const logout = useCallback(() => {
    clearAuth()
    log('useAuth', 'Logged out')
    navigate('/login')
  }, [clearAuth, navigate])

  const checkAuth = useCallback(async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        log('useAuth', 'checkAuth: no token present')
        setLoading(false)
        return { ok: false }
      }
      const user = await getCurrentUser()
      // API returns user, but token will be read from localStorage by store init
      if (user) {
        // If the store isn't initialized we rely on initAuth elsewhere
        log('useAuth', 'checkAuth: token valid')
        return { ok: true, user }
      }
      log('useAuth', 'checkAuth: not authenticated')
      clearAuth()
      return { ok: false }
    } catch (err) {
      error('useAuth', 'checkAuth failed', err)
      clearAuth()
      return { ok: false, error: err }
    } finally {
      setLoading(false)
    }
  }, [clearAuth, setLoading])

  return { login, register, logout, checkAuth }
}
