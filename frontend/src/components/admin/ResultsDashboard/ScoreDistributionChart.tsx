import { Paper, Typography, Box } from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface ScoreDistributionChartProps {
  studentResults: Array<{
    student_exam_id: string
    percentage: number
  }>
}

/**
 * Score Distribution Chart Component
 * Displays a histogram of score ranges using Recharts
 */
export default function ScoreDistributionChart({ studentResults }: ScoreDistributionChartProps) {
  // Calculate score distribution
  const scoreRanges = [
    { range: '0-20', min: 0, max: 20, count: 0, color: '#f44336' },
    { range: '21-40', min: 21, max: 40, count: 0, color: '#ff9800' },
    { range: '41-60', min: 41, max: 60, count: 0, color: '#ffc107' },
    { range: '61-80', min: 61, max: 80, count: 0, color: '#4caf50' },
    { range: '81-100', min: 81, max: 100, count: 0, color: '#2196f3' },
  ]

  // Count students in each range
  studentResults.forEach((result) => {
    const percentage = result.percentage
    for (const range of scoreRanges) {
      if (percentage >= range.min && percentage <= range.max) {
        range.count++
        break
      }
    }
  })

  // Don't render if no data
  if (studentResults.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Score Distribution
        </Typography>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            No submission data available yet
          </Typography>
        </Box>
      </Paper>
    )
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Score Distribution
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
        Number of students in each score range
      </Typography>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={scoreRanges}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="range"
            label={{ value: 'Score Range (%)', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            label={{ value: 'Number of Students', angle: -90, position: 'insideLeft' }}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value: number) => [`${value} student${value !== 1 ? 's' : ''}`, 'Count']}
            labelFormatter={(label) => `Score Range: ${label}%`}
          />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {scoreRanges.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  )
}
