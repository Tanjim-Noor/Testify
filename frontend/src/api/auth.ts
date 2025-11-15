import apiClient from '@/utils/axios'
import { log, error } from '@/utils/logger'
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types/auth.types'

/**
 * POST /api/auth/register
 */
export const register = async (payload: RegisterRequest) => {
  try {
    log('Auth API', 'Register', payload.email)
    const { data } = await apiClient.post<AuthResponse>('/api/auth/register', payload)
    return data
  } catch (err) {
    error('Auth API', 'Register error', err)
    throw err
  }
}

/**
 * POST /api/auth/login
 */
export const login = async (payload: LoginRequest) => {
  try {
    log('Auth API', 'Login', payload.email)
    // OAuth2PasswordRequestForm expects form data with "username" and "password"
    const body = new URLSearchParams()
    body.append('username', payload.email)
    body.append('password', payload.password)

    const { data } = await apiClient.post<AuthResponse>('/api/auth/login', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return data
  } catch (err) {
    error('Auth API', 'Login error', err)
    throw err
  }
}

/**
 * GET /api/auth/me
 */
export const getCurrentUser = async () => {
  try {
    log('Auth API', 'Me')
    const { data } = await apiClient.get('/api/auth/me')
    return data
  } catch (err) {
    error('Auth API', 'Me error', err)
    throw err
  }
}

/**
 * Logout client-side only (clears local token). Backend logout endpoint is optional.
 */
export const logout = async () => {
  try {
    log('Auth API', 'Logout')
    // No backend call by default; client-side only.
    return true
  } catch (err) {
    error('Auth API', 'Logout error', err)
    return false
  }
}
