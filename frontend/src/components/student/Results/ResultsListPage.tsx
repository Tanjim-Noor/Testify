import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material'
import { Assessment, CalendarToday, TrendingUp } from '@mui/icons-material'
import { getAvailableExams } from '@/api/studentExams'
import { log, error as logError } from '@/utils/logger'
import type { AvailableExam } from '@/types/studentExam.types'

/**
 * Results List Page
 * Shows all past exam submissions with scores and links to detailed results
 */
const ResultsListPage: React.FC = () => {
  const navigate = useNavigate()
  const [exams, setExams] = useState<AvailableExam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchExams = async () => {
      try {
        log('ResultsListPage', 'Fetching exams for results list')
        const data = await getAvailableExams()
        // Filter only submitted exams
        const submittedExams = data.filter((exam) => exam.submission_status === 'submitted')
        setExams(submittedExams)
        setError(null)
      } catch (err) {
        logError('ResultsListPage', 'Failed to fetch exams', err)
        setError('Failed to load results. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchExams()
  }, [])

  const handleViewResults = (studentExamId: string) => {
    navigate(`/student/exams/${studentExamId}/results`)
  }

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  if (exams.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box textAlign="center" py={8}>
          <Assessment sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No Results Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You haven't submitted any exams yet. Complete an exam to see your results here.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/student/exams')}>
            Browse Available Exams
          </Button>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Results
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View your exam results and performance
        </Typography>
      </Box>

      {/* Results Grid */}
      <Box display="flex" flexDirection="column" gap={3}>
        {exams.map((exam) => (
          <Card
            key={exam.exam_id}
            sx={{
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              },
            }}
          >
              <CardContent sx={{ flexGrow: 1 }}>
                {/* Exam Title */}
                <Typography variant="h6" component="h2" gutterBottom>
                  {exam.title}
                </Typography>

                {/* Description */}
                {exam.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {exam.description}
                  </Typography>
                )}

                {/* Submission Status */}
                <Box sx={{ mb: 2 }}>
                  <Chip
                    label="Submitted"
                    color="success"
                    size="small"
                    icon={<Assessment />}
                  />
                </Box>

                {/* Submission Date */}
                <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
                  <CalendarToday fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Submitted: {formatDate(exam.end_time)}
                  </Typography>
                </Box>

                {/* Placeholder for score - we'll need to fetch this from results API */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Click "View Results" to see your score
                  </Typography>
                </Box>
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<TrendingUp />}
                  onClick={() => handleViewResults(exam.student_exam_id!)}
                >
                  View Results
                </Button>
              </CardActions>
            </Card>
        ))}
      </Box>
    </Container>
  )
}

export default ResultsListPage
