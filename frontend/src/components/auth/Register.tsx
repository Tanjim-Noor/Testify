import React from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { Box, Button, Container, TextField, Paper, Typography, RadioGroup, FormControlLabel, Radio, Alert } from '@mui/material'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import type { RegisterRequest } from '@/types/auth.types'

type LocalRegisterForm = RegisterRequest & { password2?: string }

const Register: React.FC = () => {
  const { register: apiRegister } = useAuth()
  const { isLoading } = useAuthStore()
  const { register, handleSubmit, watch, formState } = useForm<LocalRegisterForm>({ defaultValues: { role: 'student' } as any })
  const navigate = useNavigate()

  const password = watch('password')

  const onSubmit = async (data: RegisterRequest) => {
    const res = await apiRegister(data.email, data.password, data.role)
    if (res.ok && res.user) {
      navigate('/login')
    }
  }

  return (
    <Container maxWidth="sm">
      <Paper sx={{ mt: 8, p: 4 }} elevation={4}>
        <Typography variant="h5" gutterBottom>Register</Typography>
        {formState.isSubmitted && formState.isValid === false && <Alert severity="error">Please fix the validation errors</Alert>}
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Email" {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })} />
          <TextField label="Password" type="password" {...register('password', { required: 'Password required', minLength: { value: 8, message: 'Min 8 characters' } })} />
          <TextField label="Confirm Password" type="password" {...register('password2', { required: 'Confirm password', validate: (v) => v === password || 'Passwords must match' as any })} />
          <RadioGroup row defaultValue="student" {...register('role')}>
            <FormControlLabel value="admin" control={<Radio />} label="Admin" />
            <FormControlLabel value="student" control={<Radio />} label="Student" />
          </RadioGroup>
          <Button type="submit" variant="contained" disabled={isLoading}>{isLoading ? 'Registering...' : 'Register'}</Button>
          <Typography variant="body2">Already have an account? <RouterLink to="/login">Login</RouterLink></Typography>
        </Box>
      </Paper>
    </Container>
  )
}

export default Register
