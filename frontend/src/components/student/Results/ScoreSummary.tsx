import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  useTheme,
} from '@mui/material'
import { CheckCircle, Warning, Schedule } from '@mui/icons-material'
import type { StudentResult } from '@/types/result.types'

interface ScoreSummaryProps {
  result: StudentResult
}

/**
 * Score Summary Card
 * Displays overall score, percentage, and submission info
 */
const ScoreSummary: React.FC<ScoreSummaryProps> = ({ result }) => {
  const theme = useTheme()

  // Calculate status and color
  const percentage = result.percentage
  const isPassing = percentage >= 50 // Simple threshold
  const isExcellent = percentage >= 75

  const statusColor = isExcellent
    ? theme.palette.success.main
    : isPassing
      ? theme.palette.warning.main
      : theme.palette.error.main

  const statusIcon = isExcellent ? (
    <CheckCircle sx={{ fontSize: 60, color: statusColor }} />
  ) : isPassing ? (
    <Warning sx={{ fontSize: 60, color: statusColor }} />
  ) : (
    <Schedule sx={{ fontSize: 60, color: statusColor }} />
  )

  const statusText = isExcellent
    ? 'Excellent!'
    : isPassing
      ? 'Pass'
      : 'Needs Improvement'

  // Format submission date
  const submittedDate = result.submitted_at
    ? new Date(result.submitted_at).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not submitted'

  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${statusColor}15 0%, ${statusColor}05 100%)`,
        border: `2px solid ${statusColor}40`,
      }}
    >
      <CardContent>
        {/* Exam Title */}
        <Typography variant="h5" gutterBottom fontWeight="bold">
          {result.exam_title}
        </Typography>
        {result.exam_description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {result.exam_description}
          </Typography>
        )}

        {/* Main Score Display */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'space-around',
            gap: 4,
            py: 3,
          }}
        >
          {/* Score */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h2" fontWeight="bold" color={statusColor}>
              {result.total_score}
              <Typography component="span" variant="h4" color="text.secondary">
                /{result.max_possible_score}
              </Typography>
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Total Score
            </Typography>
          </Box>

          {/* Percentage Gauge */}
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={percentage}
              size={150}
              thickness={6}
              sx={{
                color: statusColor,
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                },
              }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {statusIcon}
              <Typography variant="h4" component="div" fontWeight="bold" color={statusColor}>
                {percentage.toFixed(0)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {statusText}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Submission Info */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            justifyContent: 'center',
            alignItems: 'center',
            mt: 2,
          }}
        >
          <Chip
            label={`Submitted: ${submittedDate}`}
            variant="outlined"
            size="medium"
          />
          <Chip
            label={result.status === 'graded' ? 'Graded' : 'Partially Graded'}
            color={result.status === 'graded' ? 'success' : 'warning'}
            size="medium"
          />
        </Box>
      </CardContent>
    </Card>
  )
}

export default ScoreSummary
