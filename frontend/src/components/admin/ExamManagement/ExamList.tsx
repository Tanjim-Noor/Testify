import React from 'react'
import { Container, Typography, Button, Paper, Box, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Chip, Stack, TableFooter, TablePagination, CircularProgress, Switch, Tooltip, Badge } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SettingsIcon from '@mui/icons-material/Settings'
import AssessmentIcon from '@mui/icons-material/Assessment'
import { getExams, deleteExam, publishExam } from '@/api/exams'
import type { Exam } from '@/types/exam.types'
import EmptyState from '@/components/common/EmptyState'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { log, error } from '@/utils/logger'
import ExamFormDialog from './ExamFormDialog'
import { success as notifySuccess, error as notifyError } from '@/utils/notifier'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

const ExamList: React.FC = () => {
  const [exams, setExams] = React.useState<Exam[]>([])
  const [loading, setLoading] = React.useState(false)
  const [filter, setFilter] = React.useState<'all' | 'published' | 'draft'>('all')
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)
  const [total, setTotal] = React.useState(0)

  const [formOpen, setFormOpen] = React.useState(false)
  const [editExam, setEditExam] = React.useState<Exam | undefined>()
  const [deleteTarget, setDeleteTarget] = React.useState<Exam | null>(null)
  const [publishTarget, setPublishTarget] = React.useState<Exam | null>(null)
  const [publishLoading, setPublishLoading] = React.useState(false)

  const navigate = useNavigate()

  React.useEffect(() => { void fetchExams() }, [filter, page, limit])

  async function fetchExams() {
    setLoading(true)
    try {
      const params: any = {}
      if (filter === 'published') params.is_published = true
      if (filter === 'draft') params.is_published = false
      const res = await getExams(params)
      setExams(res)
      setTotal(res.length)
      log('ExamList', 'Fetched exams', res.length)
    } catch (e) {
      error('ExamList', 'fetchExams failed', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteExam(deleteTarget.id)
      notifySuccess('Exam deleted')
      setDeleteTarget(null)
      void fetchExams()
    } catch (e) {
      error('ExamList', 'delete failed', e)
      notifyError('Failed to delete exam')
    }
  }

  async function togglePublish(exam: Exam, shouldPublish: boolean) {
    setPublishLoading(true)
    try {
      await publishExam(exam.id, shouldPublish)
      notifySuccess(`Exam ${shouldPublish ? 'published' : 'unpublished'}`)
      void fetchExams()
    } catch (e) {
      error('ExamList', 'publish failed', e)
      notifyError('Failed to change publish status')
    } finally {
      setPublishLoading(false)
    }
  }

  return (
    <Container>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Exam Management</Typography>
          <Box>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditExam(undefined); setFormOpen(true) }}>Create Exam</Button>
          </Box>
        </Box>
      </Paper>

      <Paper>
        {loading ? (
          <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box>
        ) : exams.length === 0 ? (
          <EmptyState title="No exams yet" message="Create your first exam" action={<Button variant="contained" onClick={() => setFormOpen(true)}>Create Exam</Button>} />
        ) : (
          <>
            <Box sx={{ display: 'flex', gap: 1, p: 2 }}>
              <Button variant={filter === 'all' ? 'contained' : 'outlined'} onClick={() => setFilter('all')}>All</Button>
              <Button variant={filter === 'published' ? 'contained' : 'outlined'} onClick={() => setFilter('published')}>Published</Button>
              <Button variant={filter === 'draft' ? 'contained' : 'outlined'} onClick={() => setFilter('draft')}>Draft</Button>
            </Box>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Date Range</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Questions</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exams.slice((page - 1) * limit, page * limit).map(ex => (
                  <TableRow key={ex.id}>
                    <TableCell>{ex.title}</TableCell>
                    <TableCell>{dayjs(ex.start_time).format('MMM D, YYYY, h:mm A')} - {dayjs(ex.end_time).format('MMM D, YYYY, h:mm A')}</TableCell>
                    <TableCell>{ex.duration_minutes} minutes</TableCell>
                    <TableCell><Badge badgeContent={ex.question_count} color="primary" showZero>{/* placeholder */}</Badge></TableCell>
                    <TableCell>
                      <Chip label={ex.is_published ? 'Published' : 'Draft'} color={ex.is_published ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Manage Questions"><IconButton onClick={() => navigate(`/admin/exams/${ex.id}/builder`)} aria-label="manage"><SettingsIcon /></IconButton></Tooltip>
                      <Tooltip title="View Results"><IconButton onClick={() => navigate(`/admin/exams/${ex.id}/results`)} aria-label="results"><AssessmentIcon /></IconButton></Tooltip>
                      <Tooltip title="Edit"><IconButton onClick={() => { setEditExam(ex); setFormOpen(true) }} aria-label="edit"><EditIcon /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton onClick={() => setDeleteTarget(ex)} aria-label="delete"><DeleteIcon color="error" /></IconButton></Tooltip>
                      <Tooltip title={ex.is_published ? 'Unpublish' : 'Publish'}>
                        <Switch checked={ex.is_published} onChange={(e) => { if (!e.target.checked) { setPublishTarget(ex); } else { void togglePublish(ex, true) } }} disabled={publishLoading} />
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TablePagination 
                    colSpan={6}
                    count={total} 
                    page={page - 1} 
                    onPageChange={(e, p) => setPage(p + 1)} 
                    rowsPerPage={limit} 
                    onRowsPerPageChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(1)}} 
                    rowsPerPageOptions={[5, 10, 20]} 
                  />
                </TableRow>
              </TableFooter>
            </Table>
          </>
        )}
      </Paper>

      <ExamFormDialog open={formOpen} onClose={() => setFormOpen(false)} exam={editExam} onSuccess={() => void fetchExams()} />

      <ConfirmDialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete exam" message="This will permanently delete the exam. This cannot be undone." />

      <ConfirmDialog open={Boolean(publishTarget)} onClose={() => setPublishTarget(null)} onConfirm={() => { void togglePublish(publishTarget!, false); setPublishTarget(null)}} title="Unpublish exam" message="Are you sure you want to unpublish this exam? Students will not be able to take it." />
    </Container>
  )
}

export default ExamList
