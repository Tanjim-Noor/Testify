import React from 'react'
import { Box, Typography } from '@mui/material'
import type { QuestionResult } from '@/types/result.types'
import QuestionResultCard from './QuestionResultCard'

interface QuestionResultsListProps {
  questionResults: QuestionResult[]
}

/**
 * Question Results List
 * Displays list of all question results with expandable details
 */
const QuestionResultsList: React.FC<QuestionResultsListProps> = ({ questionResults }) => {
  if (!questionResults || questionResults.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No questions found in this exam.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ mt: 2 }}>
      {questionResults.map((question, index) => (
        <QuestionResultCard
          key={question.question_id}
          question={question}
          questionNumber={index + 1}
        />
      ))}
    </Box>
  )
}

export default QuestionResultsList
