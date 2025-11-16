import React, { useMemo } from 'react'
import { Box, TextField, MenuItem, Chip, Stack, IconButton } from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear'
import useDebounce from '@/hooks/useDebounce'

interface Props {
  search: string
  onSearch: (v: string) => void
  type?: string
  onTypeChange: (v?: string) => void
  complexity?: string
  onComplexityChange: (v?: string) => void
  tags?: string[]
  onTagsChange: (v: string[]) => void
  onClear: () => void
}

const QuestionFilters: React.FC<Props> = ({ search, onSearch, type, onTypeChange, complexity, onComplexityChange, tags = [], onClear }) => {
  const debounced = useDebounce(search, 500)

  React.useEffect(() => {
    onSearch(debounced)
  }, [debounced])

  const typeOptions = useMemo(() => [
    { value: 'single_choice', label: 'Single Choice' },
    { value: 'multi_choice', label: 'Multiple Choice' },
    { value: 'text', label: 'Text' },
    { value: 'image_upload', label: 'Image Upload' },
  ], [])

  const complexities = useMemo(() => ['easy', 'medium', 'hard'], [])

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
      <TextField size="small" placeholder="Search titles or descriptions" defaultValue={search} onChange={(e) => onSearch(e.target.value)} sx={{ minWidth: 240 }} />
      <TextField select size="small" value={type ?? ''} onChange={(e) => onTypeChange(e.target.value || undefined)} label="Type" sx={{ minWidth: 160 }}>
        <MenuItem value=''>All</MenuItem>
        {typeOptions.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
      </TextField>
      <TextField select size="small" value={complexity ?? ''} onChange={(e) => onComplexityChange(e.target.value || undefined)} label="Complexity" sx={{ minWidth: 160 }}>
        <MenuItem value=''>All</MenuItem>
        {complexities.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
      </TextField>
      <Stack direction="row" spacing={1} alignItems="center">
        {tags.map((t) => <Chip key={t} label={t} size="small" />)}
      </Stack>
      <IconButton aria-label="clear-filters" onClick={onClear}><ClearIcon /></IconButton>
    </Box>
  )
}

export default QuestionFilters
