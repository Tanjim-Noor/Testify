import React, { useState, useEffect, useMemo } from 'react'
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  IconButton,
  Paper,
  Skeleton,
  Alert,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import { Refresh, Assignment } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { getAvailableExams, startExam } from '@/api/studentExams'
import { log, error as logError } from '@/utils/logger'
import { notify } from '@/utils/notifier'
import type { AvailableExam, ExamStatus } from '@/types/studentExam.types'
import ExamCard from './ExamCard'

/**
 * Exam list page for students
 * Shows available, upcoming, and ended exams with filtering
 */
const ExamListPage: React.FC = () => {
  const navigate = useNavigate()
  const [exams, setExams] = useState<AvailableExam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTab, setCurrentTab] = useState<'all' | ExamStatus>('all')

  const fetchExams = async () => {
    try {
      setLoading(true)
      setError(null)
      log('ExamListPage', 'Fetching available exams')
      const data = await getAvailableExams()
      setExams(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load exams'
      logError('ExamListPage', 'Failed to fetch exams', err)
      setError(message)
      notify(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchExams()
  }, [])

  const handleRefresh = () => {
    void fetchExams()
  }

  const handleStartExam = async (examId: string) => {
    try {
      log('ExamListPage', 'Starting exam', examId)
      const response = await startExam(examId)
      notify(response.message || 'Exam started successfully', 'success')
      // Navigate to exam taking page
      navigate(`/student/exams/${response.student_exam_id}/take`)
    } catch (err: unknown) {
      // Extract error message from backend response
      let message = 'Failed to start exam'
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string }
        message = axiosErr.response?.data?.detail || axiosErr.message || message
      } else if (err instanceof Error) {
        message = err.message
      }
      logError('ExamListPage', 'Failed to start exam', err)
      notify(message, 'error')
    }
  }

  // Filter exams based on current tab
  const filteredExams = useMemo(() => {
    if (currentTab === 'all') {
      return exams
    }
    return exams.filter((exam) => exam.status === currentTab)
  }, [exams, currentTab])

  // Count exams by status
  const examCounts = useMemo(() => {
    return {
      all: exams.length,
      available: exams.filter((e) => e.status === 'available').length,
      upcoming: exams.filter((e) => e.status === 'upcoming').length,
      ended: exams.filter((e) => e.status === 'ended').length,
    }
  }, [exams])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'all' | ExamStatus) => {
    setCurrentTab(newValue)
  }

  const getEmptyMessage = (): string => {
    switch (currentTab) {
      case 'all':
        return 'No exams available yet'
      case 'available':
        return 'No exams currently available'
      case 'upcoming':
        return 'No upcoming exams'
      case 'ended':
        return 'No past exams'
      default:
        return 'No exams found'
    }
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <Assignment color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            Available Exams
          </Typography>
        </Box>
        <IconButton
          onClick={handleRefresh}
          disabled={loading}
          color="primary"
          aria-label="Refresh exam list"
        >
          <Refresh />
        </IconButton>
      </Box>

      {/* Filter Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Exam filter tabs"
        >
          <Tab
            label={`All (${examCounts.all})`}
            value="all"
          />
          <Tab
            label={`Available (${examCounts.available})`}
            value="available"
          />
          <Tab
            label={`Upcoming (${examCounts.upcoming})`}
            value="upcoming"
          />
          <Tab
            label={`Ended (${examCounts.ended})`}
            value="ended"
          />
        </Tabs>
      </Paper>

      {/* Error State */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Grid container spacing={3}>
          {[1, 2, 3].map((n) => (
            <Grid item xs={12} sm={6} md={4} key={n}>
              <Skeleton variant="rectangular" height={250} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Exam Cards */}
      {!loading && filteredExams.length > 0 && (
        <Grid container spacing={3}>
          {filteredExams.map((exam) => (
            <Grid item xs={12} sm={6} md={4} key={exam.exam_id}>
              <ExamCard
                exam={exam}
                onStartExam={handleStartExam}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Empty State */}
      {!loading && filteredExams.length === 0 && !error && (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight={300}
          textAlign="center"
        >
          <Assignment sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {getEmptyMessage()}
          </Typography>
          {currentTab !== 'all' && exams.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              Try viewing all exams or refresh the list
            </Typography>
          )}
        </Box>
      )}
    </Container>
  )
}

export default ExamListPage
