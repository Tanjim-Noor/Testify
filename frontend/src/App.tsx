import { ThemeProvider } from '@mui/material/styles'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { CssBaseline } from '@mui/material'
import { ErrorBoundary, GlobalLoader, OfflineIndicator } from '@/components/common'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from '@/components/auth/Login'
import Register from '@/components/auth/Register'
import RoleBasedRedirect from '@/components/common/RoleBasedRedirect'
import { AdminLayout, StudentLayout } from '@/components/common/Layout'
import NotFound from '@/components/common/NotFound'
import ServerError from '@/components/common/ServerError'
import AccessDenied from '@/components/common/AccessDenied'
import AdminDashboard from '@/components/admin/AdminDashboard'
import StudentDashboard from '@/components/student/StudentDashboard'
import QuestionBank from '@/components/admin/QuestionBank'
import ExamManagement from '@/components/admin/ExamManagement'
import { ExamBuilderPage } from '@/components/admin/ExamBuilder'
import { ResultsDashboardPage } from '@/components/admin/ResultsDashboard'
import { ExamTakingPage } from '@/components/student/ExamTaking'
import ExamListPage from '@/components/student/ExamList/ExamListPage'
import { ResultsPage, ResultsListPage } from '@/components/student/Results'
import LoadingOverlay from '@/components/common/Layout/Loading'
import RouteLoader from '@/components/common/Layout/RouteLoader'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
// useAuth hook is used by components where needed; App uses the store directly
import NotificationProvider from '@/components/common/NotificationProvider'
import theme from '@/theme'

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
            <OfflineIndicator />
            <GlobalLoader />
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
                  <Route path="exams/:examId/builder" element={<ExamBuilderPage />} />
                  <Route path="exams/:examId/results" element={<ResultsDashboardPage />} />
                  <Route path="results" element={<ResultsDashboardPage />} />
                </Route>
                {/* Student routes (protected with StudentLayout) */}
                <Route path="/student" element={<ProtectedRoute requiredRole="student"><StudentLayout /></ProtectedRoute>}>
                  <Route index element={<StudentDashboard />} />
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="exams" element={<ExamListPage />} />
                  <Route path="exams/:studentExamId/results" element={<ResultsPage />} />
                  <Route path="results" element={<ResultsListPage />} />
                </Route>
                {/* Exam taking page - standalone (outside layout for custom header) */}
                <Route path="/student/exams/:studentExamId/take" element={<ProtectedRoute requiredRole="student"><ExamTakingPage /></ProtectedRoute>} />
                {/* Error pages */}
                <Route path="/500" element={<ServerError />} />
                <Route path="/403" element={<AccessDenied />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <RouteLoader />
              {/* show loading overlay while auth is checking */}
              {isLoading && <LoadingOverlay open message="Checking authentication..." />}
            </BrowserRouter>
          </NotificationProvider>
        </ErrorBoundary>
      </LocalizationProvider>
    </ThemeProvider>
  )
}

export default App
