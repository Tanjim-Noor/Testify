import React, { useEffect, useState } from 'react'
import { Box, CircularProgress, Chip } from '@mui/material'
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material'
import { useExamStore } from '@/store/examStore'

/**
 * Save indicator component
 * Shows the current save status of answers
 */
const SaveIndicator: React.FC = () => {
  const isAutoSaving = useExamStore((s) => s.isAutoSaving)
  const lastSavedAt = useExamStore((s) => s.lastSavedAt)
  const saveError = useExamStore((s) => s.saveError)
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => {
    if (lastSavedAt) {
      setShowSaved(true)
      const timer = setTimeout(() => setShowSaved(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [lastSavedAt])

  if (isAutoSaving) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={20} />
        <Chip label="Saving..." size="small" color="default" />
      </Box>
    )
  }

  if (saveError) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <ErrorIcon color="error" />
        <Chip label="Save failed" size="small" color="error" />
      </Box>
    )
  }

  if (showSaved && lastSavedAt) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CheckCircle color="success" />
        <Chip label="Saved" size="small" color="success" />
      </Box>
    )
  }

  return null
}

export default SaveIndicator
