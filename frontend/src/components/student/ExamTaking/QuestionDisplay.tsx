import React from 'react'
import { Box, Typography, Chip } from '@mui/material'
import type { StudentExamQuestion } from '@/types/studentExam.types'

interface QuestionDisplayProps {
  question: StudentExamQuestion
  questionNumber: number
}

/**
 * Question display component
 * Shows question details without answer components
 */
const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ question, questionNumber }) => {
  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Typography variant="h5" component="h2">
          Question {questionNumber}
        </Typography>
        <Chip label={question.type.replace('_', ' ')} size="small" color="primary" />
        <Chip label={`${question.max_score} points`} size="small" color="default" />
      </Box>

      <Typography variant="h6" gutterBottom>
        {question.title}
      </Typography>

      {question.description && (
        <Typography variant="body1" color="text.secondary" paragraph>
          {question.description}
        </Typography>
      )}
    </Box>
  )
}

export default QuestionDisplay
