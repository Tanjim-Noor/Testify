import React, { useMemo } from 'react'
import { Card, CardContent, Typography, Box, useTheme, Stack } from '@mui/material'
import {
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Assignment,
} from '@mui/icons-material'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import type { StudentResult } from '@/types/result.types'

interface PerformanceStatsProps {
  result: StudentResult
}

/**
 * Performance Statistics
 * Shows question counts, correct/incorrect breakdown, and a pie chart
 */
const PerformanceStats: React.FC<PerformanceStatsProps> = ({ result }) => {
  const theme = useTheme()

  // Calculate statistics
  const stats = useMemo(() => {
    const total = result.question_results.length
    const answered = result.question_results.filter((q) => {
      return (
        q.student_answer?.answer !== undefined ||
        q.student_answer?.answers !== undefined ||
        q.student_answer?.text !== undefined ||
        q.student_answer?.file_url !== undefined
      )
    }).length
    const correct = result.question_results.filter((q) => q.is_correct === true).length
    const incorrect = result.question_results.filter((q) => q.is_correct === false).length
    const pending = result.question_results.filter((q) => q.requires_manual_review).length

    return { total, answered, correct, incorrect, pending }
  }, [result.question_results])

  // Pie chart data
  const chartData = [
    { name: 'Correct', value: stats.correct, color: theme.palette.success.main },
    { name: 'Incorrect', value: stats.incorrect, color: theme.palette.error.main },
    { name: 'Pending Review', value: stats.pending, color: theme.palette.warning.main },
  ].filter((item) => item.value > 0) // Only show non-zero segments

  const statCards = [
    {
      label: 'Total Questions',
      value: stats.total,
      icon: <Assignment sx={{ fontSize: 40 }} />,
      color: theme.palette.primary.main,
    },
    {
      label: 'Correct Answers',
      value: stats.correct,
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      color: theme.palette.success.main,
    },
    {
      label: 'Incorrect Answers',
      value: stats.incorrect,
      icon: <Cancel sx={{ fontSize: 40 }} />,
      color: theme.palette.error.main,
    },
    {
      label: 'Pending Review',
      value: stats.pending,
      icon: <HourglassEmpty sx={{ fontSize: 40 }} />,
      color: theme.palette.warning.main,
    },
  ]

  return (
    <Box sx={{ mt: 3 }}>
      {/* Stat Cards */}
      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
        {statCards.map((stat, index) => (
          <Card
            key={index}
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' },
              minWidth: 200,
              background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`,
              border: `1px solid ${stat.color}30`,
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold" color={stat.color}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
                <Box sx={{ color: stat.color, opacity: 0.7 }}>{stat.icon}</Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Pie Chart */}
      {chartData.length > 0 && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Performance Breakdown
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default PerformanceStats
