import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { getStudentExamDetail } from '@/api/results'
import { log, error as logError } from '@/utils/logger'
import type { StudentResult, QuestionResult } from '@/types/result.types'
import ScoreSummary from '@/components/student/Results/ScoreSummary'
import QuestionResultCard from '@/components/student/Results/QuestionResultCard'
import ManualGradeForm from './ManualGradeForm'

interface DetailedReviewProps {
  open: boolean
  studentExamId: string | null
  onClose: () => void
  onGradeUpdated?: () => void
}

/**
 * Detailed Review Dialog Component
 * Shows complete student exam with question-by-question breakdown
 * and manual grading interface for text/image questions
 */
export default function DetailedReview({
  open,
  studentExamId,
  onClose,
  onGradeUpdated,
}: DetailedReviewProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<StudentResult | null>(null)

  // Debug logging
  useEffect(() => {
    log('DetailedReview', 'Component rendered', { open, studentExamId })
  }, [open, studentExamId])

  // Fetch student exam details
  useEffect(() => {
    if (!open || !studentExamId) {
      log('DetailedReview', 'Skipping fetch', { open, studentExamId })
      return
    }

    const fetchDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        log('DetailedReview', 'Fetching student exam detail', studentExamId)
        const data = await getStudentExamDetail(studentExamId)
        log('DetailedReview', 'Received data:', data)
        setResult(data)
      } catch (err) {
        logError('DetailedReview', 'Failed to fetch details', err)
        setError('Failed to load student exam details')
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [open, studentExamId])

  // Handle grade update
  const handleGradeUpdated = async () => {
    if (!studentExamId) return

    try {
      log('DetailedReview', 'Refreshing after grade update')
      const data = await getStudentExamDetail(studentExamId)
      setResult(data)
      onGradeUpdated?.()
    } catch (err) {
      logError('DetailedReview', 'Failed to refresh after grade', err)
    }
  }

  // Count questions requiring manual review
  const pendingReviewCount = result
    ? result.question_results.filter((q) => q.requires_manual_review && q.score === null).length
    : 0

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen
      scroll="paper"
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Detailed Answer Review</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading && (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8}>
            <CircularProgress size={60} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading student exam details...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && !result && (
          <Box display="flex" alignItems="center" justifyContent="center" py={8}>
            <Typography variant="body1" color="text.secondary">
              No data available
            </Typography>
          </Box>
        )}

        {result && !loading && (
          <Box>
            {/* Student Info */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {result.exam_title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {result.exam_description}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Submitted
                    </Typography>
                    <Typography variant="body2">
                      {new Date(result.submitted_at).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Typography variant="body2" textTransform="capitalize">
                      {result.status.replace('_', ' ')}
                    </Typography>
                  </Box>
                  {pendingReviewCount > 0 && (
                    <Box>
                      <Typography variant="caption" color="warning.main">
                        Pending Review
                      </Typography>
                      <Typography variant="body2" color="warning.main">
                        {pendingReviewCount} question{pendingReviewCount !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Score Summary */}
            <ScoreSummary result={result} />

            <Divider sx={{ my: 3 }} />

            {/* Question-by-Question Review */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
              Question-by-Question Review
            </Typography>

            {result.question_results.map((question: QuestionResult, index: number) => (
              <Box key={question.question_id} sx={{ mb: 2 }}>
                {/* Question Result Card */}
                <QuestionResultCard question={question} questionNumber={index + 1} />

                {/* Manual Grading Form for text/image questions */}
                {question.requires_manual_review && (
                  <Box sx={{ mt: 2, pl: 2 }}>
                    <ManualGradeForm
                      questionResult={question}
                      onGradeSubmitted={handleGradeUpdated}
                    />
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
