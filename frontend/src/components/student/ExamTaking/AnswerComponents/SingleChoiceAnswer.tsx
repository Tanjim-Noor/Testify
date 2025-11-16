import React from 'react'
import { RadioGroup, FormControlLabel, Radio, FormControl, FormLabel } from '@mui/material'
import type { AnswerValue } from '@/types/studentExam.types'

interface SingleChoiceAnswerProps {
  options: string[]
  value: AnswerValue
  onChange: (value: AnswerValue) => void
}

/**
 * Single choice answer component (radio buttons)
 */
const SingleChoiceAnswer: React.FC<SingleChoiceAnswerProps> = ({ options, value, onChange }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ answer: event.target.value })
  }

  return (
    <FormControl component="fieldset" fullWidth>
      <FormLabel component="legend">Select one answer:</FormLabel>
      <RadioGroup value={value.answer || ''} onChange={handleChange}>
        {options.map((option, index) => (
          <FormControlLabel
            key={index}
            value={option}
            control={<Radio />}
            label={option}
          />
        ))}
      </RadioGroup>
    </FormControl>
  )
}

export default SingleChoiceAnswer
