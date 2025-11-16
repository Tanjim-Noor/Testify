import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { getStudentResult } from '@/api/results'
import { log, error as logError } from '@/utils/logger'
import type { StudentResult } from '@/types/result.types'
import ScoreSummary from './ScoreSummary'
import PerformanceStats from './PerformanceStats'
import QuestionResultsList from './QuestionResultsList'

/**
 * Results Page
 * Displays student's exam results with score summary and question breakdown
 */
const ResultsPage: React.FC = () => {
  const { studentExamId } = useParams<{ studentExamId: string }>()
  const navigate = useNavigate()

  const [result, setResult] = useState<StudentResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!studentExamId) {
      setError('Invalid exam session')
      setLoading(false)
      return
    }

    const fetchResult = async () => {
      try {
        log('ResultsPage', 'Fetching result for student exam', studentExamId)
        const data = await getStudentResult(studentExamId)
        setResult(data)
        setError(null)
      } catch (err) {
        logError('ResultsPage', 'Failed to fetch result', err)
        setError('Failed to load results. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchResult()
  }, [studentExamId])

  const handleBackToExams = () => {
    navigate('/student/exams')
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

  if (error || !result) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Results not found'}
        </Alert>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={handleBackToExams}>
          Back to Exams
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={handleBackToExams}>
          Back to Exams
        </Button>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Exam Results
        </Typography>
      </Box>

      {/* Score Summary Card */}
      <ScoreSummary result={result} />

      {/* Performance Statistics */}
      <PerformanceStats result={result} />

      {/* Question-by-Question Breakdown */}
      <Paper sx={{ mt: 3, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Question Breakdown
        </Typography>
        <QuestionResultsList questionResults={result.question_results} />
      </Paper>

      {/* Footer Actions */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button variant="outlined" onClick={handleBackToExams}>
          View All Exams
        </Button>
        {/* Future: Add Print/Download PDF button */}
      </Box>
    </Container>
  )
}

export default ResultsPage
