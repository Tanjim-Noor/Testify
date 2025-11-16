import React from 'react'
import { FormGroup, FormControlLabel, Checkbox, FormControl, FormLabel } from '@mui/material'
import type { AnswerValue } from '@/types/studentExam.types'

interface MultiChoiceAnswerProps {
  options: string[]
  value: AnswerValue
  onChange: (value: AnswerValue) => void
}

/**
 * Multiple choice answer component (checkboxes)
 */
const MultiChoiceAnswer: React.FC<MultiChoiceAnswerProps> = ({ options, value, onChange }) => {
  const selectedAnswers = value.answers || []

  const handleChange = (option: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const newAnswers = event.target.checked
      ? [...selectedAnswers, option]
      : selectedAnswers.filter((a) => a !== option)

    onChange({ answers: newAnswers })
  }

  return (
    <FormControl component="fieldset" fullWidth>
      <FormLabel component="legend">Select all that apply:</FormLabel>
      <FormGroup>
        {options.map((option, index) => (
          <FormControlLabel
            key={index}
            control={
              <Checkbox
                checked={selectedAnswers.includes(option)}
                onChange={handleChange(option)}
              />
            }
            label={option}
          />
        ))}
      </FormGroup>
    </FormControl>
  )
}

export default MultiChoiceAnswer
