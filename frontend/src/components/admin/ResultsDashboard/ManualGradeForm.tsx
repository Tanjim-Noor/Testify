import { useState } from 'react'
import {
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material'
import { Save as SaveIcon } from '@mui/icons-material'
import { gradeAnswer } from '@/api/results'
import { log, error as logError } from '@/utils/logger'
import type { QuestionResult } from '@/types/result.types'

interface ManualGradeFormProps {
  questionResult: QuestionResult
  onGradeSubmitted: () => void
}

/**
 * Manual Grading Form Component
 * Allows admin to manually grade text and image_upload questions
 */
export default function ManualGradeForm({
  questionResult,
  onGradeSubmitted,
}: ManualGradeFormProps) {
  const [score, setScore] = useState<string>(
    questionResult.score !== null ? questionResult.score.toString() : ''
  )
  const [feedback, setFeedback] = useState<string>(questionResult.feedback || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isAlreadyGraded = questionResult.score !== null

  // Handle submit
  const handleSubmit = async () => {
    // Validate score
    const scoreNum = parseFloat(score)
    if (isNaN(scoreNum)) {
      setError('Please enter a valid score')
      return
    }
    if (scoreNum < 0 || scoreNum > questionResult.max_score) {
      setError(`Score must be between 0 and ${questionResult.max_score}`)
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      log('ManualGradeForm', 'Submitting grade', {
        answerId: questionResult.answer_id,
        questionId: questionResult.question_id,
        score: scoreNum,
        feedback,
      })

      if (!questionResult.answer_id) {
        throw new Error('Answer ID is required for grading')
      }

      await gradeAnswer(questionResult.answer_id, {
        score: scoreNum,
        feedback: feedback.trim() || undefined,
      })

      setSuccess(true)
      onGradeSubmitted()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      logError('ManualGradeForm', 'Failed to submit grade', err)
      setError('Failed to submit grade. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card variant="outlined" sx={{ bgcolor: '#fff3e0' }}>
      <CardContent>
        <Typography variant="subtitle2" gutterBottom color="warning.dark">
          Manual Grading Required
        </Typography>

        {/* Student's Answer */}
        <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Student's Answer:
          </Typography>
          {questionResult.type === 'text' && questionResult.student_answer?.text && (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {questionResult.student_answer.text}
            </Typography>
          )}
          {questionResult.type === 'image_upload' && questionResult.student_answer?.file_url && (
            <Box>
              <Typography variant="body2" gutterBottom>
                Image submitted
              </Typography>
              <Box
                component="img"
                src={questionResult.student_answer.file_url}
                alt="Student's answer"
                sx={{
                  maxWidth: '100%',
                  maxHeight: 300,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              />
            </Box>
          )}
          {!questionResult.student_answer && (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              No answer submitted
            </Typography>
          )}
        </Box>

        {/* Grading Form */}
        <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
          <TextField
            label="Score"
            type="number"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            size="small"
            fullWidth
            inputProps={{
              min: 0,
              max: questionResult.max_score,
              step: 0.5,
            }}
            helperText={`Out of ${questionResult.max_score} points`}
          />

          <TextField
            label="Feedback (Optional)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            size="small"
            fullWidth
            multiline
            rows={3}
            placeholder="Add comments or explanation for the student..."
          />

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success">Grade saved successfully!</Alert>
          )}

          <Button
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSubmit}
            disabled={loading || !score}
          >
            {isAlreadyGraded ? 'Update Grade' : 'Save Grade'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}
