import { useEffect, useState } from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material'
import { getExams } from '@/api/exams'
import { log, error as logError } from '@/utils/logger'
import type { Exam } from '@/types/exam.types'

interface ExamSelectorProps {
  selectedExamId: string | null
  onExamChange: (examId: string) => void
}

/**
 * Exam Selector Component
 * Dropdown to select an exam for viewing results
 */
export default function ExamSelector({ selectedExamId, onExamChange }: ExamSelectorProps) {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch exams on mount
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true)
        setError(null)
        log('ExamSelector', 'Fetching exams')
        const data = await getExams()
        setExams(data)

        // Auto-select first exam if none selected
        if (!selectedExamId && data.length > 0) {
          onExamChange(data[0].id)
        }
      } catch (err) {
        logError('ExamSelector', 'Failed to fetch exams', err)
        setError('Failed to load exams')
      } finally {
        setLoading(false)
      }
    }

    fetchExams()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (event: SelectChangeEvent<string>) => {
    onExamChange(event.target.value)
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box sx={{ mb: 3 }}>
      <FormControl fullWidth>
        <InputLabel id="exam-selector-label">Select Exam</InputLabel>
        <Select
          labelId="exam-selector-label"
          value={selectedExamId || ''}
          label="Select Exam"
          onChange={handleChange}
          disabled={loading || exams.length === 0}
        >
          {loading ? (
            <MenuItem disabled>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Loading exams...
            </MenuItem>
          ) : exams.length === 0 ? (
            <MenuItem disabled>No exams available</MenuItem>
          ) : (
            exams.map((exam) => (
              <MenuItem key={exam.id} value={exam.id}>
                {exam.title} - {new Date(exam.start_time).toLocaleDateString()}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>
    </Box>
  )
}
