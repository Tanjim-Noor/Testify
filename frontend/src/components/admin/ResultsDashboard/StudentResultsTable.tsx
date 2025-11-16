import { useState, useMemo } from 'react'
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  TextField,
  InputAdornment,
  Box,
  Chip,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
} from '@mui/material'
import { Search as SearchIcon, Visibility as ViewIcon } from '@mui/icons-material'
import type { StudentResultSummary } from '@/types/result.types'

interface StudentResultsTableProps {
  studentResults: StudentResultSummary[]
  onViewDetails: (studentExamId: string) => void
}

type SortField = 'student_name' | 'percentage' | 'submitted_at'
type SortDirection = 'asc' | 'desc'
type StatusFilter = 'all' | 'not_started' | 'in_progress' | 'submitted' | 'graded'

/**
 * Student Results Table Component
 * Displays student results with sorting, filtering, and pagination
 */
export default function StudentResultsTable({
  studentResults,
  onViewDetails,
}: StudentResultsTableProps) {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sortField, setSortField] = useState<SortField>('student_name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Handle sort
  const handleSort = (field: SortField) => {
    const isAsc = sortField === field && sortDirection === 'asc'
    setSortDirection(isAsc ? 'desc' : 'asc')
    setSortField(field)
  }

  // Filter and sort data
  const filteredAndSortedResults = useMemo(() => {
    let results = [...studentResults]

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      results = results.filter(
        (result) =>
          result.student_name.toLowerCase().includes(query) ||
          result.student_email.toLowerCase().includes(query)
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      results = results.filter((result) => result.status === statusFilter)
    }

    // Sort
    results.sort((a, b) => {
      let aValue: string | number = a[sortField] as string | number
      let bValue: string | number = b[sortField] as string | number

      if (sortField === 'submitted_at') {
        aValue = a.submitted_at ? new Date(a.submitted_at).getTime() : 0
        bValue = b.submitted_at ? new Date(b.submitted_at).getTime() : 0
      } else if (sortField === 'percentage') {
        aValue = a.percentage
        bValue = b.percentage
      } else if (sortField === 'student_name') {
        aValue = a.student_name.toLowerCase()
        bValue = b.student_name.toLowerCase()
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return results
  }, [studentResults, searchQuery, statusFilter, sortField, sortDirection])

  // Paginate
  const paginatedResults = useMemo(() => {
    const startIndex = page * rowsPerPage
    return filteredAndSortedResults.slice(startIndex, startIndex + rowsPerPage)
  }, [filteredAndSortedResults, page, rowsPerPage])

  // Handle pagination
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // Get status chip
  const getStatusChip = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' }
    > = {
      not_started: { label: 'Not Started', color: 'default' },
      in_progress: { label: 'In Progress', color: 'info' },
      submitted: { label: 'Submitted', color: 'warning' },
      graded: { label: 'Graded', color: 'success' },
    }
    const config = statusConfig[status] || { label: status, color: 'default' }
    return <Chip label={config.label} color={config.color} size="small" />
  }

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Paper elevation={2} sx={{ mt: 3 }}>
      {/* Filters */}
      <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ minWidth: 250, flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="not_started">Not Started</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="submitted">Submitted</MenuItem>
            <MenuItem value="graded">Graded</MenuItem>
          </Select>
        </FormControl>
        {(searchQuery || statusFilter !== 'all') && (
          <Button
            size="small"
            onClick={() => {
              setSearchQuery('')
              setStatusFilter('all')
            }}
          >
            Clear Filters
          </Button>
        )}
      </Box>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'student_name'}
                  direction={sortField === 'student_name' ? sortDirection : 'asc'}
                  onClick={() => handleSort('student_name')}
                >
                  Student Name
                </TableSortLabel>
              </TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={sortField === 'percentage'}
                  direction={sortField === 'percentage' ? sortDirection : 'asc'}
                  onClick={() => handleSort('percentage')}
                >
                  Score
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Percentage</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={sortField === 'submitted_at'}
                  direction={sortField === 'submitted_at' ? sortDirection : 'asc'}
                  onClick={() => handleSort('submitted_at')}
                >
                  Submitted At
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedResults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No results found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedResults.map((result) => (
                <TableRow key={result.student_exam_id} hover>
                  <TableCell>{result.student_name}</TableCell>
                  <TableCell>{result.student_email}</TableCell>
                  <TableCell align="center">
                    {result.status === 'not_started' || result.status === 'in_progress'
                      ? 'N/A'
                      : `${result.total_score}/${result.max_possible_score}`}
                  </TableCell>
                  <TableCell align="center">
                    {result.status === 'not_started' || result.status === 'in_progress'
                      ? 'N/A'
                      : `${result.percentage.toFixed(1)}%`}
                  </TableCell>
                  <TableCell align="center">{getStatusChip(result.status)}</TableCell>
                  <TableCell align="center">{formatDate(result.submitted_at)}</TableCell>
                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => onViewDetails(result.student_exam_id)}
                      disabled={result.status === 'not_started'}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredAndSortedResults.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  )
}
