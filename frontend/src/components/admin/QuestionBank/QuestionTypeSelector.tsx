import React from 'react'
import { RadioGroup, FormControlLabel, Radio, Box, Typography } from '@mui/material'

interface Props {
  value: string
  onChange: (val: string) => void
}

const QuestionTypeSelector: React.FC<Props> = ({ value, onChange }) => {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Question Type</Typography>
      <RadioGroup row value={value} onChange={(e) => onChange(e.target.value)}>
        <FormControlLabel value="single_choice" control={<Radio />} label="Single Choice" />
        <FormControlLabel value="multi_choice" control={<Radio />} label="Multiple Choice" />
        <FormControlLabel value="text" control={<Radio />} label="Text" />
        <FormControlLabel value="image_upload" control={<Radio />} label="Image Upload" />
      </RadioGroup>
    </Box>
  )
}

export default QuestionTypeSelector
