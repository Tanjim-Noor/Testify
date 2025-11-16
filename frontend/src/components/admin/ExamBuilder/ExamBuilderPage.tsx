import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon
} from '@mui/icons-material'
import { getExamById, assignQuestions } from '@/api/exams'
import type { ExamDetail } from '@/types/exam.types'
import type { Question } from '@/types/question.types'
import QuestionSelector from './QuestionSelector'
import SelectedQuestions from './SelectedQuestions'
import { log, error } from '@/utils/logger'

const ExamBuilderPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()

  const [exam, setExam] = useState<ExamDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (examId) {
      void fetchExam(examId)
    }
  }, [examId])

  const fetchExam = async (id: string) => {
    try {
      setLoading(true)
      log('ExamBuilderPage', 'Fetching exam', id)
      const examData = await getExamById(id)
      setExam(examData)

      // Load existing questions if any
      if (examData.questions && examData.questions.length > 0) {
        // Convert ExamQuestion to Question format
        const existingQuestions = examData.questions.map((eq) => ({
          id: eq.id,
          title: eq.title,
          type: eq.type as Question['type'],
          complexity: eq.complexity,
          max_score: eq.max_score,
          tags: eq.tags,
          correct_answers: [],
          created_at: ''
        }))
        setSelectedQuestions(existingQuestions)
      }
    } catch (err) {
      error('ExamBuilderPage', 'Failed to fetch exam', err)
      setErrorMessage('Failed to load exam details')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectQuestion = (question: Question) => {
    log('ExamBuilderPage', 'Select question', question.id)
    setSelectedQuestions((prev) => [...prev, question])
    setHasChanges(true)
  }

  const handleDeselectQuestion = (questionId: string) => {
    log('ExamBuilderPage', 'Deselect question', questionId)
    setSelectedQuestions((prev) => prev.filter((q) => q.id !== questionId))
    setHasChanges(true)
  }

  const handleReorderQuestions = (newOrder: Question[]) => {
    log('ExamBuilderPage', 'Reorder questions')
    setSelectedQuestions(newOrder)
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!examId) return

    try {
      setSaving(true)
      log('ExamBuilderPage', 'Saving assignments', selectedQuestions.length)

      // Build assignment payload
      const assignments = selectedQuestions.map((q, index) => ({
        question_id: q.id,
        order_index: index
      }))

      await assignQuestions(examId, assignments)

      log('ExamBuilderPage', 'Saved successfully')
      setHasChanges(false)
      
      // Optionally navigate back
      navigate('/admin/exams')
    } catch (err) {
      error('ExamBuilderPage', 'Failed to save assignments', err)
      setErrorMessage('Failed to save question assignments')
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    if (hasChanges) {
      setConfirmDialogOpen(true)
    } else {
      navigate('/admin/exams')
    }
  }

  const handleConfirmLeave = () => {
    setConfirmDialogOpen(false)
    navigate('/admin/exams')
  }

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (!exam) {
    return (
      <Container>
        <Box py={4}>
          <Alert severity="error">Exam not found</Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/admin/exams')}
            sx={{ mt: 2 }}
          >
            Back to Exams
          </Button>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={handleBack} aria-label="Back">
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Build Exam: {exam.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Assign and order questions for this exam
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            color="primary"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={!hasChanges || saving || selectedQuestions.length === 0}
          >
            {saving ? 'Saving...' : 'Save Questions'}
          </Button>
        </Box>
      </Paper>

      {/* Error Alert */}
      {errorMessage && (
        <Alert severity="error" onClose={() => setErrorMessage('')} sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {/* Main Content - Two Columns */}
      <Grid container spacing={3}>
        {/* Left: Available Questions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <QuestionSelector
              selectedQuestionIds={selectedQuestions.map((q) => q.id)}
              onSelect={handleSelectQuestion}
              onDeselect={handleDeselectQuestion}
            />
          </Paper>
        </Grid>

        {/* Right: Selected Questions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <SelectedQuestions
              questions={selectedQuestions}
              onReorder={handleReorderQuestions}
              onRemove={handleDeselectQuestion}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Unsaved Changes</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved changes. Are you sure you want to leave without saving?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirmLeave} color="error" autoFocus>
            Leave Without Saving
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default ExamBuilderPage
