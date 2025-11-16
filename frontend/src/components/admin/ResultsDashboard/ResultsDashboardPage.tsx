import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Paper,
  Button,
} from '@mui/material'
import { Refresh as RefreshIcon } from '@mui/icons-material'
import { getExamResults } from '@/api/results'
import { log, error as logError } from '@/utils/logger'
import type { AdminExamResults } from '@/types/result.types'
import ExamSelector from './ExamSelector'
import StatisticsCards from './StatisticsCards'
import ScoreDistributionChart from './ScoreDistributionChart'
import StudentResultsTable from './StudentResultsTable'
import DetailedReview from './DetailedReview'

/**
 * Results Dashboard Page Component
 * Main admin page for viewing exam results and grading
 */
export default function ResultsDashboardPage() {
  const { examId: routeExamId } = useParams<{ examId?: string }>()
  const [selectedExamId, setSelectedExamId] = useState<string | null>(routeExamId || null)
  const [results, setResults] = useState<AdminExamResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedStudentExamId, setSelectedStudentExamId] = useState<string | null>(null)

  // Fetch results when exam selection changes
  useEffect(() => {
    if (!selectedExamId) return

    fetchResults()
  }, [selectedExamId]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchResults = async () => {
    if (!selectedExamId) return

    try {
      setLoading(true)
      setError(null)
      log('ResultsDashboard', 'Fetching exam results', selectedExamId)
      const data = await getExamResults(selectedExamId)
      setResults(data)
    } catch (err) {
      logError('ResultsDashboard', 'Failed to fetch results', err)
      setError('Failed to load exam results')
    } finally {
      setLoading(false)
    }
  }

  // Handle view details
  const handleViewDetails = (studentExamId: string) => {
    setSelectedStudentExamId(studentExamId)
    setDetailsDialogOpen(true)
  }

  // Handle details dialog close
  const handleDetailsClose = () => {
    setDetailsDialogOpen(false)
    setSelectedStudentExamId(null)
  }

  // Handle grade update
  const handleGradeUpdated = () => {
    // Refresh results after grading
    fetchResults()
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Results Dashboard
        </Typography>
        {results && (
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchResults}
            disabled={loading}
          >
            Refresh
          </Button>
        )}
      </Box>

      {/* Exam Selector (only if not coming from route with specific exam) */}
      {!routeExamId && (
        <ExamSelector selectedExamId={selectedExamId} onExamChange={setSelectedExamId} />
      )}

      {/* Loading State */}
      {loading && (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress size={60} />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Results Content */}
      {results && !loading && (
        <Box>
          {/* Exam Title */}
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              {results.exam_summary.exam_title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Exam ID: {results.exam_summary.exam_id}
            </Typography>
          </Paper>

          {/* Statistics Cards */}
          <StatisticsCards statistics={results.exam_summary} />

          {/* Score Distribution Chart */}
          <ScoreDistributionChart
            studentResults={results.student_results.map((r) => ({
              student_exam_id: r.student_exam_id,
              percentage: r.percentage,
            }))}
          />

          {/* Student Results Table */}
          <StudentResultsTable
            studentResults={results.student_results}
            onViewDetails={handleViewDetails}
          />
        </Box>
      )}

      {/* No Exam Selected */}
      {!selectedExamId && !loading && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            Please select an exam to view results
          </Typography>
        </Box>
      )}

      {/* Detailed Review Dialog */}
      <DetailedReview
        open={detailsDialogOpen}
        studentExamId={selectedStudentExamId}
        onClose={handleDetailsClose}
        onGradeUpdated={handleGradeUpdated}
      />
    </Container>
  )
}
