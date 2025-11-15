/**
 * The roles currently supported by the exam management system.
 */
export type UserRole = 'admin' | 'student'

/**
 * Represents a user record coming from the backend.
 */
export interface User {
  id: string
  email: string
  role: UserRole
  created_at: string
}

/**
 * Authentication related state that can be held inside Zustand stores.
 */
export interface AuthState {
  user: User | null
  token?: string
  isAuthenticated: boolean
}