import { Card, CardContent, Typography, Box } from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  TrendingDown as TrendingDownIcon,
  AssignmentTurnedIn as SubmissionIcon,
  CheckCircle as PassIcon,
} from '@mui/icons-material'
import type { ExamResultsSummary } from '@/types/result.types'

interface StatisticsCardsProps {
  statistics: ExamResultsSummary
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  subtitle?: string
}

/**
 * Individual stat card component
 */
function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              backgroundColor: `${color}15`,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ color, fontSize: 32 }}>{icon}</Box>
          </Box>
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

/**
 * Statistics Cards Component
 * Displays exam statistics in a grid of cards
 */
export default function StatisticsCards({ statistics }: StatisticsCardsProps) {
  const submissionRate =
    statistics.total_students > 0
      ? Math.round((statistics.submitted_count / statistics.total_students) * 100)
      : 0

  return (
    <Grid container spacing={3}>
      {/* Total Students */}
      <Grid item xs={12} sm={6} md={4}>
        <StatCard
          title="Total Students"
          value={statistics.total_students}
          icon={<PeopleIcon />}
          color="#2196f3"
          subtitle={`${statistics.submitted_count} submitted`}
        />
      </Grid>

      {/* Average Score */}
      <Grid item xs={12} sm={6} md={4}>
        <StatCard
          title="Average Score"
          value={statistics.average_score !== null ? `${statistics.average_score.toFixed(1)}%` : 'N/A'}
          icon={<TrendingUpIcon />}
          color="#ff9800"
        />
      </Grid>

      {/* Highest Score */}
      <Grid item xs={12} sm={6} md={4}>
        <StatCard
          title="Highest Score"
          value={statistics.highest_score !== null ? `${statistics.highest_score.toFixed(1)}%` : 'N/A'}
          icon={<TrophyIcon />}
          color="#4caf50"
        />
      </Grid>

      {/* Lowest Score */}
      <Grid item xs={12} sm={6} md={4}>
        <StatCard
          title="Lowest Score"
          value={statistics.lowest_score !== null && statistics.lowest_score >= 0 ? `${statistics.lowest_score.toFixed(1)}%` : 'N/A'}
          icon={<TrendingDownIcon />}
          color="#f44336"
        />
      </Grid>

      {/* Submission Rate */}
      <Grid item xs={12} sm={6} md={4}>
        <StatCard
          title="Submission Rate"
          value={`${submissionRate}%`}
          icon={<SubmissionIcon />}
          color="#9c27b0"
          subtitle={`${statistics.submitted_count} of ${statistics.total_students}`}
        />
      </Grid>

      {/* Pass Rate */}
      {statistics.pass_rate !== undefined && statistics.pass_rate !== null && (
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Pass Rate"
            value={`${statistics.pass_rate.toFixed(1)}%`}
            icon={<PassIcon />}
            color="#00bcd4"
          />
        </Grid>
      )}
    </Grid>
  )
}
