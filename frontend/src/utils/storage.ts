import { log, error } from './logger'
import type { User } from '@/types/user.types'

const ACCESS_TOKEN_KEY = 'accessToken'
const USER_KEY = 'currentUser'

export const saveToken = (token: string) => {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
    log('Storage', 'Saved access token')
  } catch (err) {
    error('Storage', 'Failed to save token', err)
  }
}

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch (err) {
    error('Storage', 'Failed to read token', err)
    return null
  }
}

export const removeToken = () => {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    log('Storage', 'Removed access token')
  } catch (err) {
    error('Storage', 'Failed to remove token', err)
  }
}

export const saveUser = (user: User) => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    log('Storage', 'Saved user')
  } catch (err) {
    error('Storage', 'Failed to save user', err)
  }
}

export const getUser = (): User | null => {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch (err) {
    error('Storage', 'Failed to parse user', err)
    return null
  }
}

export const removeUser = () => {
  try {
    localStorage.removeItem(USER_KEY)
    log('Storage', 'Removed user')
  } catch (err) {
    error('Storage', 'Failed to remove user', err)
  }
}

export const clearAuth = () => {
  removeToken()
  removeUser()
  log('Storage', 'Cleared auth data')
}
