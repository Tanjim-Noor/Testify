import React from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Drawer,
  useMediaQuery,
  useTheme,
  IconButton,
} from '@mui/material'
import { CheckCircle, RadioButtonUnchecked, Close } from '@mui/icons-material'
import type { ExamQuestion } from '@/types/studentExam.types'

interface QuestionNavigatorProps {
  questions: ExamQuestion[]
  currentIndex: number
  answeredQuestions: Set<string>
  onNavigate: (index: number) => void
  open?: boolean
  onClose?: () => void
}

/**
 * Question navigator component
 * Shows all questions with status indicators
 */
const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  questions,
  currentIndex,
  answeredQuestions,
  onNavigate,
  open = true,
  onClose,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const content = (
    <Box sx={{ p: 2, width: isMobile ? '80vw' : 250 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Questions</Typography>
        {isMobile && onClose && (
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        )}
      </Box>

      <Typography variant="body2" color="text.secondary" gutterBottom>
        Answered {answeredQuestions.size} of {questions.length}
      </Typography>

      <Stack spacing={1} mt={2}>
        {questions.map((question, index) => {
          const isAnswered = answeredQuestions.has(question.id)
          const isCurrent = index === currentIndex

          return (
            <Button
              key={question.id}
              onClick={() => onNavigate(index)}
              variant={isCurrent ? 'contained' : 'outlined'}
              color={isCurrent ? 'primary' : 'inherit'}
              startIcon={isAnswered ? <CheckCircle /> : <RadioButtonUnchecked />}
              sx={{
                justifyContent: 'flex-start',
                textAlign: 'left',
                borderWidth: isCurrent ? 2 : 1,
                bgcolor: isAnswered && !isCurrent ? 'success.light' : undefined,
                '&:hover': {
                  bgcolor: isAnswered && !isCurrent ? 'success.main' : undefined,
                },
              }}
            >
              Q{index + 1}
            </Button>
          )
        })}
      </Stack>
    </Box>
  )

  if (isMobile) {
    return (
      <Drawer anchor="left" open={open} onClose={onClose}>
        {content}
      </Drawer>
    )
  }

  return <Paper sx={{ height: '100%', overflow: 'auto' }}>{content}</Paper>
}

export default QuestionNavigator
