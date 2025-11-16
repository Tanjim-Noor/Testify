import React from 'react'
import { Chip, type ChipProps } from '@mui/material'
import { AccessTime, CheckCircle, Cancel } from '@mui/icons-material'
import { formatDistanceToNow, parseISO, isBefore } from 'date-fns'
import type { ExamStatus } from '@/types/studentExam.types'

interface StatusBadgeProps {
  status: ExamStatus
  startTime: string
  endTime: string
}

/**
 * Status badge component for exam cards
 * Shows color-coded status with appropriate icons
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({ status, startTime, endTime }) => {
  const getChipProps = (): ChipProps => {
    const now = new Date()
    const start = parseISO(startTime)
    const end = parseISO(endTime)

    switch (status) {
      case 'available': {
        // Check if exam is actually still available
        if (isBefore(end, now)) {
          return {
            label: 'Ended',
            color: 'default',
            icon: <Cancel />,
          }
        }
        return {
          label: 'Available Now',
          color: 'success',
          icon: <CheckCircle />,
        }
      }

      case 'upcoming': {
        // Calculate time until start
        const distance = formatDistanceToNow(start, { addSuffix: true })
        return {
          label: `Starts ${distance}`,
          color: 'info',
          icon: <AccessTime />,
        }
      }

      case 'ended': {
        return {
          label: 'Ended',
          color: 'default',
          icon: <Cancel />,
        }
      }

      default:
        return {
          label: 'Unknown',
          color: 'default',
        }
    }
  }

  return <Chip {...getChipProps()} size="small" />
}

export default StatusBadge
