import React from 'react'
import { TextField, Typography, Box } from '@mui/material'
import type { AnswerValue } from '@/types/studentExam.types'

interface TextAnswerProps {
  value: AnswerValue
  onChange: (value: AnswerValue) => void
}

/**
 * Text answer component (multiline textarea)
 */
const TextAnswer: React.FC<TextAnswerProps> = ({ value, onChange }) => {
  const text = value.text || ''

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ text: event.target.value })
  }

  return (
    <Box>
      <TextField
        fullWidth
        multiline
        rows={10}
        variant="outlined"
        label="Your answer"
        value={text}
        onChange={handleChange}
        placeholder="Type your answer here..."
      />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
        {text.length} characters
      </Typography>
    </Box>
  )
}

export default TextAnswer
