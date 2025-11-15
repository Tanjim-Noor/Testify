import { ThemeProvider } from '@mui/material/styles'
import { Box, Button, Chip, Container, CssBaseline, Paper, Stack, Typography } from '@mui/material'
import { ErrorBoundary } from '@/components/common'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from '@/components/auth/Login'
import Register from '@/components/auth/Register'
import RoleBasedRedirect from '@/components/common/RoleBasedRedirect'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import theme from '@/theme'

const AppContent = () => (
  <Container maxWidth="md" sx={{ py: 8 }}>
    <Stack spacing={4}>
      <Paper
        elevation={3}
        sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <Typography variant="h3" component="h1">
          Welcome to {import.meta.env.VITE_APP_NAME ?? 'Exam Management System'}
        </Typography>
        <Typography color="text.secondary">
          This is the foundation for the Admin and Student portals. Explore the
          left-hand navigation and start wiring up the domain-specific pages.
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label="Material UI" color="primary" />
          <Chip label="Zustand" color="secondary" />
          <Chip label="React Router" />
        </Stack>
        <Box>
          <Button variant="contained" sx={{ mr: 2 }}>
            View Admin Plan
          </Button>
          <Button variant="outlined">View Student Plan</Button>
        </Box>
      </Paper>
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Runtime Details
        </Typography>
        <Typography variant="body2">
          API Base URL: {import.meta.env.VITE_API_BASE_URL ?? 'Not configured'}
        </Typography>
        <Typography variant="body2">Vite Mode: {import.meta.env.MODE}</Typography>
      </Paper>
    </Stack>
  </Container>
)

const App = () => {
  const initAuth = useAuthStore.getState().initAuth

  // Initialize auth on app load (read token + user from storage)
  useEffect(() => {
    initAuth()
  }, [initAuth])

  // Run auth validation that uses React Router only after Router is mounted
  const AuthInit: React.FC = () => {
    const { checkAuth } = useAuth()
    useEffect(() => { void checkAuth() }, [checkAuth])
    return null
  }

  return (
    <ThemeProvider theme={theme}>
    <CssBaseline />
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
      <BrowserRouter>
        <AuthInit />
        <Routes>
          <Route path="/" element={<RoleBasedRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Protected placeholder route */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requiredRole="admin"><AppContent /></ProtectedRoute>
          } />
          <Route path="/student/dashboard" element={
            <ProtectedRoute requiredRole="student"><AppContent /></ProtectedRoute>
          } />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
