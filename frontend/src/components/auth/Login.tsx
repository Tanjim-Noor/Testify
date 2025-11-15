import React from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { Box, Button, Container, TextField, Paper, Typography, Alert } from '@mui/material'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import type { LoginRequest } from '@/types/auth.types'

const Login: React.FC = () => {
  const { login } = useAuth()
  const { isLoading } = useAuthStore()
  const { register, handleSubmit, formState } = useForm<LoginRequest>()
  const navigate = useNavigate()

  const onSubmit = async (data: LoginRequest) => {
    const res = await login(data.email, data.password)
    if (res.ok && res.user) {
      if (res.user.role === 'admin') navigate('/admin/dashboard')
      else navigate('/student/dashboard')
    }
  }

  return (
    <Container maxWidth="sm">
      <Paper sx={{ mt: 8, p: 4 }} elevation={4}>
        <Typography variant="h5" gutterBottom>Login</Typography>
        {formState.errors?.email && <Alert severity="error">{formState.errors.email.message}</Alert>}
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Email" {...register('email', { required: 'Email is required' })} />
          <TextField label="Password" type="password" {...register('password', { required: 'Password is required' })} />
          <Button type="submit" variant="contained" disabled={isLoading}>{isLoading ? 'Signing in...' : 'Sign In'}</Button>
          <Typography variant="body2">Don't have an account? <RouterLink to="/register">Register</RouterLink></Typography>
        </Box>
      </Paper>
    </Container>
  )
}

export default Login
