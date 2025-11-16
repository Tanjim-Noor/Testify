import React from 'react'
import { Container, Typography, Button, Paper, Box, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Chip, Stack, TableFooter, TablePagination, CircularProgress } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import UploadIcon from '@mui/icons-material/Upload'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { getQuestions, deleteQuestion } from '@/api/questions'
import ExcelImportDialog from './ExcelImportDialog'
import type { Question } from '@/types/question.types'
import EmptyState from '@/components/common/EmptyState'
import QuestionFilters from './QuestionFilters'
import QuestionFormDialog from './QuestionFormDialog'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { log, error } from '@/utils/logger'

const QuestionList: React.FC = () => {
  const [questions, setQuestions] = React.useState<Question[]>([])
  const [loading, setLoading] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)
  const [total, setTotal] = React.useState(0)
  const [search, setSearch] = React.useState('')
  const [type, setType] = React.useState<string | undefined>(undefined)
  const [complexity, setComplexity] = React.useState<string | undefined>(undefined)
  const [tags, setTags] = React.useState<string[]>([])

  const [editQuestion, setEditQuestion] = React.useState<Question | undefined>()
  const [formOpen, setFormOpen] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<Question | null>(null)

  React.useEffect(() => { void fetchQuestions() }, [page, limit, search, type, complexity, tags])

  React.useEffect(() => {
    log('QuestionList', 'Filters changed', { search, type, complexity, tags })
  }, [search, type, complexity, tags])

  async function fetchQuestions() {
    setLoading(true)
    try {
      const res = await getQuestions({ page, limit, search, type, complexity, tags })
      setQuestions(res.data)
      setTotal(res.total)
      log('QuestionList', 'Fetched questions', res.data.length)
    } catch (e) {
      error('QuestionList', 'fetchQuestions failed', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteQuestion(deleteTarget.id)
      log('QuestionList', 'Deleted question', deleteTarget.id)
      setDeleteTarget(null)
      void fetchQuestions()
    } catch (e) {
      error('QuestionList', 'delete failed', e)
    }
  }

  return (
    <Container>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Question Bank</Typography>
          <Box>
            <Button variant="outlined" startIcon={<UploadIcon />} sx={{ mr: 2 }} onClick={() => setImportOpen(true)}>Import from Excel</Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditQuestion(undefined); setFormOpen(true) }}>Create Question</Button>
          </Box>
        </Box>
      </Paper>

      <QuestionFilters
        search={search}
        onSearch={setSearch}
        type={type}
        onTypeChange={setType}
        complexity={complexity}
        onComplexityChange={setComplexity}
        tags={tags}
        onTagsChange={setTags}
        onClear={() => { setSearch(''); setType(undefined); setComplexity(undefined); setTags([]) }}
      />

      <Paper>
        {loading ? (
          <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box>
        ) : questions.length === 0 ? (
          <EmptyState title="No questions yet" message="Create or import questions to get started." action={<Button variant="contained" onClick={() => setFormOpen(true)}>Create a question</Button>} />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Complexity</TableCell>
                <TableCell>Tags</TableCell>
                <TableCell>Max Score</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {questions.map(q => (
                <TableRow key={q.id}>
                  <TableCell>{q.title}</TableCell>
                  <TableCell><Chip label={q.type} color={q.type === 'single_choice' ? 'primary' : q.type === 'multi_choice' ? 'success' : 'default'} /></TableCell>
                  <TableCell>{q.complexity}</TableCell>
                  <TableCell><Stack direction="row" spacing={1}>{q.tags?.map(t => <Chip key={t} label={t} size="small" />)}</Stack></TableCell>
                  <TableCell>{q.max_score}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => { setEditQuestion(q); setFormOpen(true) }} aria-label="edit"><EditIcon /></IconButton>
                    <IconButton onClick={() => setDeleteTarget(q)} aria-label="delete"><DeleteIcon color="error" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination component="div" count={total} page={page - 1} onPageChange={(e, p) => setPage(p + 1)} rowsPerPage={limit} onRowsPerPageChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(1) }} rowsPerPageOptions={[5, 10, 20]} />
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </Paper>

      <QuestionFormDialog question={editQuestion} open={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => void fetchQuestions()} />

      <ExcelImportDialog open={importOpen} onClose={() => setImportOpen(false)} onSuccess={() => void fetchQuestions()} />

      <ConfirmDialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete question" message="Are you sure you want to delete this question? This action cannot be undone." />
    </Container>
  )
}

export default QuestionList
