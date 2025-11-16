import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import ROUTES from '@/utils/routes'

const RoleBasedRedirect: React.FC = () => {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)

  if (isLoading) return null

  if (!isAuthenticated || !user) return <Navigate to={ROUTES.LOGIN} replace />

  if (user.role === 'admin') return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />
  return <Navigate to={ROUTES.STUDENT.DASHBOARD} replace />
}

export default RoleBasedRedirect
