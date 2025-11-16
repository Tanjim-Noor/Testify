import React, { useEffect, useState, useCallback } from 'react'
import { Box, Typography, Chip } from '@mui/material'
import { Timer as TimerIcon, Warning } from '@mui/icons-material'

interface TimerProps {
  initialSeconds: number
  onExpire: () => void
}

/**
 * Countdown timer component for exam taking
 * Shows warning when time is running out
 * Auto-triggers onExpire when time reaches zero
 */
const Timer: React.FC<TimerProps> = ({ initialSeconds, onExpire }) => {
  const [seconds, setSeconds] = useState(initialSeconds)

  useEffect(() => {
    setSeconds(initialSeconds)
  }, [initialSeconds])

  useEffect(() => {
    if (seconds <= 0) {
      onExpire()
      return
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [seconds, onExpire])

  const formatTime = useCallback((totalSeconds: number): string => {
    if (totalSeconds < 0) return '00:00'
    
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  const isWarning = seconds < 300 // Less than 5 minutes
  const isExpired = seconds <= 0

  return (
    <Box display="flex" alignItems="center" gap={1}>
      {isWarning && !isExpired && <Warning color="error" />}
      <TimerIcon color={isExpired ? 'error' : isWarning ? 'warning' : 'primary'} />
      <Chip
        label={
          <Typography
            variant="h6"
            component="span"
            sx={{
              fontWeight: 'bold',
              fontFamily: 'monospace',
              color: isExpired ? 'error.main' : isWarning ? 'warning.main' : 'text.primary',
            }}
          >
            {formatTime(seconds)}
          </Typography>
        }
        color={isExpired ? 'error' : isWarning ? 'warning' : 'default'}
        sx={{
          fontSize: '1.2rem',
          p: 1,
        }}
      />
    </Box>
  )
}

export default Timer
