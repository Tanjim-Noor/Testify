import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as apiLogin, register as apiRegister } from '@/api/auth'
import { success as notifySuccess, error as notifyError } from '@/utils/notifier'
import { parseAxiosError } from '@/utils/errorParser'
import { useAuthStore } from '@/store/authStore'
import { log, error } from '@/utils/logger'

export const useAuth = () => {
  const navigate = useNavigate()
  const { setUser, clearAuth, setLoading } = useAuthStore()
  // Use store checkAuth for validation — keep auth API centralized in store.
  const checkAuth = useAuthStore((s) => s.checkAuth)

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const res = await apiLogin({ email, password })
      setUser(res.user, res.access_token)
      notifySuccess('Logged in successfully')
      log('useAuth', 'Login success', res.user.email)
      return { ok: true, user: res.user }
    } catch (err) {
      const message = parseAxiosError(err)
      notifyError(message)
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
      notifySuccess('Registration successful')
      log('useAuth', 'Register success', res.user.email)
      return { ok: true, user: res.user }
    } catch (err) {
      const message = parseAxiosError(err)
      notifyError(message)
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

  // No local checkAuth — use store implementation for stability

  return { login, register, logout, checkAuth }
}
