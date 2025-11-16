import type { User } from './user.types'

/** Request payload for login action */
export interface LoginRequest {
  email: string
  password: string
}

/** Request payload for registration */
export interface RegisterRequest {
  email: string
  password: string
  role: 'admin' | 'student'
}

/** Typical shape for authentication responses that include an access token */
export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export type { User }
