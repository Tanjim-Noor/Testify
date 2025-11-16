import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface Props {
  children: React.ReactNode
  requiredRole?: 'admin' | 'student'
  redirectTo?: string
}

const ProtectedRoute: React.FC<Props> = ({ children, requiredRole, redirectTo = '/login' }) => {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)

  if (isLoading) return null // optionally a loading spinner

  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} replace />
  }

  if (requiredRole && user.role !== requiredRole) {
    return <div>Access Denied</div>
  }

  return <>{children}</>
}

export default ProtectedRoute
