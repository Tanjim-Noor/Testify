import React from 'react'
import { Box, Typography, Alert } from '@mui/material'
import { CloudUpload } from '@mui/icons-material'
import type { AnswerValue } from '@/types/studentExam.types'

interface ImageUploadAnswerProps {
  value: AnswerValue
  onChange: (value: AnswerValue) => void
}

/**
 * Image upload answer component (placeholder)
 * Basic implementation for future enhancement
 */
const ImageUploadAnswer: React.FC<ImageUploadAnswerProps> = () => {
  return (
    <Box>
      <Alert severity="info" icon={<CloudUpload />}>
        <Typography variant="body2">
          Image upload functionality is not yet supported.
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Please contact your instructor if you need to submit an image for this question.
        </Typography>
      </Alert>
    </Box>
  )
}

export default ImageUploadAnswer
