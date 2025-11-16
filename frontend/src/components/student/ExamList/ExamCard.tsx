import React from 'react'
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Stack,
} from '@mui/material'
import { Schedule, CalendarToday, PlayArrow, Visibility } from '@mui/icons-material'
import { format, parseISO } from 'date-fns'
import type { AvailableExam } from '@/types/studentExam.types'
import StatusBadge from './StatusBadge'

interface ExamCardProps {
  exam: AvailableExam
  onStartExam: (examId: string) => void
}

/**
 * Exam card component for displaying exam information
 * Shows exam details, status, and action buttons
 */
const ExamCard: React.FC<ExamCardProps> = ({ exam, onStartExam }) => {
  const { exam_id, title, description, start_time, end_time, duration_minutes, status } = exam

  const handleAction = () => {
    if (status === 'available') {
      onStartExam(exam_id)
    }
  }

  const getActionButton = () => {
    switch (status) {
      case 'available':
        return (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrow />}
            onClick={handleAction}
          >
            Start Exam
          </Button>
        )
      case 'upcoming':
        return (
          <Button variant="outlined" disabled>
            Not Yet Available
          </Button>
        )
      case 'ended':
        return (
          <Button variant="outlined" disabled startIcon={<Visibility />}>
            Exam Ended
          </Button>
        )
      default:
        return null
    }
  }

  const formatDateTime = (dateString: string): string => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy, h:mm a')
    } catch {
      return dateString
    }
  }

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={2}>
          {/* Title and Status Badge */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
            <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
            <StatusBadge status={status} startTime={start_time} endTime={end_time} />
          </Box>

          {/* Description */}
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}

          {/* Date and Time Information */}
          <Stack spacing={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <CalendarToday fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                <strong>Start:</strong> {formatDateTime(start_time)}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <CalendarToday fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                <strong>End:</strong> {formatDateTime(end_time)}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Schedule fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                <strong>Duration:</strong> {duration_minutes} minutes
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        {getActionButton()}
      </CardActions>
    </Card>
  )
}

export default ExamCard
