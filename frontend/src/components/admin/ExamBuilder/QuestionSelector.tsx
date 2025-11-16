import React, { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Pagination,
  Stack,
  Checkbox,
  Autocomplete,
  Chip,
  CircularProgress
} from '@mui/material'
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material'
import { getQuestions } from '@/api/questions'
import type { Question } from '@/types/question.types'
import QuestionCard from './QuestionCard'
import { log, error } from '@/utils/logger'

interface QuestionSelectorProps {
  selectedQuestionIds: string[]
  onSelect: (question: Question) => void
  onDeselect: (questionId: string) => void
}

const QUESTION_TYPES = [
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'multi_choice', label: 'Multi Choice' },
  { value: 'text', label: 'Text' },
  { value: 'image_upload', label: 'Image Upload' }
]

const QuestionSelector: React.FC<QuestionSelectorProps> = ({
  selectedQuestionIds,
  onSelect,
  onDeselect
}) => {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [complexityFilter, setComplexityFilter] = useState('')
  const [tagsFilter, setTagsFilter] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [availableComplexities, setAvailableComplexities] = useState<string[]>([])

  const limit = 10

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1) // Reset to page 1 on filter change
      void fetchQuestions()
    }, 500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, typeFilter, complexityFilter, tagsFilter])

  // Fetch on page change
  useEffect(() => {
    void fetchQuestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      log('QuestionSelector', 'Fetching questions', { page, searchTerm })

      const filters = {
        page,
        limit,
        ...(searchTerm && { search: searchTerm }),
        ...(typeFilter && { type: typeFilter }),
        ...(complexityFilter && { complexity: complexityFilter }),
        ...(tagsFilter.length > 0 && { tags: tagsFilter })
      }

      const result = await getQuestions(filters)
      setQuestions(result.data)
      setTotal(result.total)
      setTotalPages(Math.ceil(result.total / limit))

      // Extract unique tags and complexities for filters
      const tags = new Set<string>()
      const complexities = new Set<string>()
      result.data.forEach((q) => {
        q.tags?.forEach((tag) => tags.add(tag))
        complexities.add(q.complexity)
      })
      setAvailableTags(Array.from(tags))
      setAvailableComplexities(Array.from(complexities))
    } catch (err) {
      error('QuestionSelector', 'Failed to fetch questions', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setTypeFilter('')
    setComplexityFilter('')
    setTagsFilter([])
    setPage(1)
  }

  const activeFilterCount = [
    searchTerm,
    typeFilter,
    complexityFilter,
    tagsFilter.length > 0
  ].filter(Boolean).length

  const isQuestionSelected = (questionId: string) =>
    selectedQuestionIds.includes(questionId)

  const handleToggleQuestion = (question: Question) => {
    if (isQuestionSelected(question.id)) {
      onDeselect(question.id)
    } else {
      onSelect(question)
    }
  }

  return (
    <Box>
      {/* Header */}
      <Typography variant="h6" gutterBottom>
        Available Questions
      </Typography>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search questions..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        slotProps={{
          input: {
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
          }
        }}
        sx={{ mb: 2 }}
      />

      {/* Filters */}
      <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={typeFilter}
            label="Type"
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {QUESTION_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Complexity</InputLabel>
          <Select
            value={complexityFilter}
            label="Complexity"
            onChange={(e) => setComplexityFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {availableComplexities.map((complexity) => (
              <MenuItem key={complexity} value={complexity}>
                {complexity}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Autocomplete
          multiple
          size="small"
          options={availableTags}
          value={tagsFilter}
          onChange={(_, newValue) => setTagsFilter(newValue)}
          renderInput={(params) => (
            <TextField {...params} label="Tags" placeholder="Select tags" />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index })
              return <Chip key={key} label={option} size="small" {...tagProps} />
            })
          }
          sx={{ minWidth: 200 }}
        />

        {activeFilterCount > 0 && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<ClearIcon />}
            onClick={handleClearFilters}
          >
            Clear Filters ({activeFilterCount})
          </Button>
        )}
      </Stack>

      {/* Question Count */}
      <Typography variant="body2" color="text.secondary" mb={2}>
        {total} questions found • {selectedQuestionIds.length} selected
      </Typography>

      {/* Questions List */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : questions.length === 0 ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={6}
          px={2}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No questions found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your filters
          </Typography>
        </Box>
      ) : (
        <Box>
          {questions.map((question) => (
            <Box key={question.id} display="flex" alignItems="center" gap={1} mb={1}>
              <Checkbox
                checked={isQuestionSelected(question.id)}
                onChange={() => handleToggleQuestion(question)}
              />
              <Box flex={1}>
                <QuestionCard
                  question={question}
                  isSelected={isQuestionSelected(question.id)}
                  onAdd={onSelect}
                />
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  )
}

export default QuestionSelector
