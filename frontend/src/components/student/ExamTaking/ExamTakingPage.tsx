import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Box,
  Container,
  Paper,
  Button,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
  Skeleton,
  Alert,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import { ArrowBack, ArrowForward, Menu as MenuIcon, Send } from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import { useExamStore } from '@/store/examStore'
import { getExamSession } from '@/api/studentExams'
import { useAutoSave } from '@/hooks/useAutoSave'
import { log, error as logError } from '@/utils/logger'
import { notify } from '@/utils/notifier'
import type { AnswerValue } from '@/types/studentExam.types'
import Timer from './Timer.tsx'
import SaveIndicator from './SaveIndicator.tsx'
import QuestionNavigator from './QuestionNavigator.tsx'
import QuestionDisplay from './QuestionDisplay.tsx'
import AnswerRenderer from './AnswerRenderer.tsx'
import SubmitDialog from './SubmitDialog.tsx'

/**
 * Exam taking page - main component for taking exams
 * Features: timer, auto-save, question navigation, answer components
 */
const ExamTakingPage: React.FC = () => {
  const { studentExamId } = useParams<{ studentExamId: string }>()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Store state
  const {
    sessionData,
    currentQuestionIndex,
    answers,
    timeRemaining,
    isSubmitting,
    setSession,
    setCurrentQuestionIndex,
    setAnswer,
    submitExam,
    clearSession,
    loadFromLocalStorage,
  } = useExamStore()

  // Local state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [navigatorOpen, setNavigatorOpen] = useState(!isMobile)
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)

  // Auto-save hook
  useAutoSave(studentExamId || null)

  // Fetch exam session on mount
  useEffect(() => {
    const fetchSession = async () => {
      if (!studentExamId || studentExamId === 'undefined') {
        setError('Invalid exam session ID. Please start an exam from the exam list.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        log('ExamTakingPage', 'Fetching exam session', studentExamId)
        
        const session = await getExamSession(studentExamId)
        setSession(session)
        
        // Load from localStorage as backup
        loadFromLocalStorage(studentExamId)
        
        setLoading(false)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load exam'
        logError('ExamTakingPage', 'Failed to fetch exam session', err)
        setError(message)
        notify(message, 'error')
        setLoading(false)
      }
    }

    void fetchSession()
  }, [studentExamId, setSession, loadFromLocalStorage])

  // Prevent accidental page refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Handle timer expiry
  const handleTimeExpire = useCallback(async () => {
    if (!studentExamId) return

    try {
      notify('Time expired. Exam auto-submitted.', 'warning')
      await submitExam(studentExamId)
      navigate(`/student/exams/${studentExamId}/results`)
    } catch (err) {
      logError('ExamTakingPage', 'Auto-submit failed', err)
      notify('Failed to submit exam', 'error')
    }
  }, [studentExamId, submitExam, navigate])

  // Handle answer change
  const handleAnswerChange = useCallback(
    (questionId: string, value: AnswerValue) => {
      setAnswer(questionId, value)
    },
    [setAnswer]
  )

  // Navigate questions
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleNext = () => {
    if (sessionData && currentQuestionIndex < sessionData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleNavigateToQuestion = (index: number) => {
    setCurrentQuestionIndex(index)
    if (isMobile) {
      setNavigatorOpen(false)
    }
  }

  // Submit exam
  const handleSubmitClick = () => {
    setSubmitDialogOpen(true)
  }

  const handleSubmitConfirm = async () => {
    if (!studentExamId) return

    try {
      await submitExam(studentExamId)
      notify('Exam submitted successfully', 'success')
      clearSession()
      navigate(`/student/exams/${studentExamId}/results`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit exam'
      logError('ExamTakingPage', 'Submit failed', err)
      notify(message, 'error')
    }
  }

  // Calculate answered questions
  const answeredQuestions = useMemo(() => {
    const answered = new Set<string>()
    Object.entries(answers).forEach(([questionId, value]) => {
      if (value && Object.keys(value).length > 0) {
        answered.add(questionId)
      }
    })
    return answered
  }, [answers])

  // Get current question and answer
  const currentQuestion = sessionData?.questions[currentQuestionIndex]
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] || {} : {}

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Skeleton variant="rectangular" height={80} sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
          <Grid item xs={12} md={9}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
        </Grid>
      </Container>
    )
  }

  // Error state
  if (error || !sessionData) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          {error || 'Failed to load exam session'}
        </Alert>
        <Button onClick={() => navigate('/student/exams')} sx={{ mt: 2 }}>
          Back to Exams
        </Button>
      </Container>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top Bar */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" onClick={() => setNavigatorOpen(true)} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {sessionData.exam_details.title}
          </Typography>
          <SaveIndicator />
          {timeRemaining !== null && (
            <Box sx={{ ml: 2 }}>
              <Timer initialSeconds={timeRemaining} onExpire={handleTimeExpire} />
            </Box>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<Send />}
            onClick={handleSubmitClick}
            sx={{ ml: 2 }}
            disabled={isSubmitting}
          >
            Submit
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3, bgcolor: 'background.default' }}>
        <Grid container spacing={3}>
          {/* Question Navigator */}
          {!isMobile && (
            <Grid item xs={12} md={3}>
              <Box sx={{ position: 'sticky', top: 24 }}>
                <QuestionNavigator
                  questions={sessionData.questions}
                  currentIndex={currentQuestionIndex}
                  answeredQuestions={answeredQuestions}
                  onNavigate={handleNavigateToQuestion}
                />
              </Box>
            </Grid>
          )}

          {/* Question and Answer Area */}
          <Grid item xs={12} md={isMobile ? 12 : 9}>
            <Paper sx={{ p: 3 }}>
              {currentQuestion && (
                <>
                  <QuestionDisplay
                    question={currentQuestion}
                    questionNumber={currentQuestionIndex + 1}
                  />

                  <Box sx={{ mt: 4 }}>
                    <AnswerRenderer
                      question={currentQuestion}
                      currentAnswer={currentAnswer}
                      onAnswerChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                    />
                  </Box>

                  {/* Navigation Buttons */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mt: 4,
                      pt: 3,
                      borderTop: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<ArrowBack />}
                      onClick={handlePrevious}
                      disabled={currentQuestionIndex === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="contained"
                      endIcon={<ArrowForward />}
                      onClick={handleNext}
                      disabled={currentQuestionIndex === sessionData.questions.length - 1}
                    >
                      Next
                    </Button>
                  </Box>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Mobile Question Navigator */}
      {isMobile && (
        <QuestionNavigator
          questions={sessionData.questions}
          currentIndex={currentQuestionIndex}
          answeredQuestions={answeredQuestions}
          onNavigate={handleNavigateToQuestion}
          open={navigatorOpen}
          onClose={() => setNavigatorOpen(false)}
        />
      )}

      {/* Submit Dialog */}
      <SubmitDialog
        open={submitDialogOpen}
        onClose={() => setSubmitDialogOpen(false)}
        onConfirm={handleSubmitConfirm}
        answeredCount={answeredQuestions.size}
        totalQuestions={sessionData.questions.length}
        isSubmitting={isSubmitting}
      />
    </Box>
  )
}

export default ExamTakingPage
