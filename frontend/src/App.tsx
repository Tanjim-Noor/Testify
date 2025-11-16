import { ThemeProvider } from '@mui/material/styles'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { Box, Button, Chip, Container, CssBaseline, Paper, Stack, Typography } from '@mui/material'
import { ErrorBoundary } from '@/components/common'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from '@/components/auth/Login'
import Register from '@/components/auth/Register'
import RoleBasedRedirect from '@/components/common/RoleBasedRedirect'
import { AdminLayout, StudentLayout } from '@/components/common/Layout'
import NotFound from '@/components/common/NotFound'
import AdminDashboard from '@/components/admin/AdminDashboard'
import StudentDashboard from '@/components/student/StudentDashboard'
import QuestionBank from '@/components/admin/QuestionBank'
import ExamManagement from '@/components/admin/ExamManagement'
import AdminResults from '@/components/admin/AdminResults'
import ExamBuilderPlaceholder from '@/components/admin/ExamBuilder/ExamBuilderPlaceholder'
import ExamList from '@/components/student/ExamList'
import StudentResults from '@/components/student/StudentResults'
import LoadingOverlay from '@/components/common/Layout/Loading'
import RouteLoader from '@/components/common/Layout/RouteLoader'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
// useAuth hook is used by components where needed; App uses the store directly
import NotificationProvider from '@/components/common/NotificationProvider'
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

// Auth initialization component - defined outside App to prevent recreation
const AuthInit: React.FC = () => {
  useEffect(() => {
    // Initialize auth from storage first
    useAuthStore.getState().initAuth()
    // Then validate the token with the server
    void useAuthStore.getState().checkAuth()
  }, [])
  return null
}

const App = () => {
  const isLoading = useAuthStore((s) => s.isLoading)

  return (
    <ThemeProvider theme={theme}>
    <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ErrorBoundary>
        <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </ErrorBoundary>
      </LocalizationProvider>
      <BrowserRouter>
        <AuthInit />
        <Routes>
          <Route path="/" element={<RoleBasedRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Admin routes (protected with AdminLayout) */}
          <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="questions" element={<QuestionBank />} />
            <Route path="exams" element={<ExamManagement />} />
            <Route path="exams/:examId/builder" element={<ExamBuilderPlaceholder />} />
            <Route path="results" element={<AdminResults />} />
          </Route>
          {/* Student routes (protected with StudentLayout) */}
          <Route path="/student" element={<ProtectedRoute requiredRole="student"><StudentLayout /></ProtectedRoute>}>
            <Route index element={<StudentDashboard />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="exams" element={<ExamList />} />
            <Route path="results" element={<StudentResults />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <RouteLoader />
        {/* show loading overlay while auth is checking */}
        {isLoading && <LoadingOverlay open message="Checking authentication..." />}
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
