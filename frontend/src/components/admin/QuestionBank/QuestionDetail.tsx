import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Chip, Box, Stack, Divider } from '@mui/material'
import type { Question } from '@/types/question.types'
import dayjs from 'dayjs'
import { getQuestionById } from '@/api/questions'
import { isOptionCorrect } from '@/utils/optionUtils'
import { log, error } from '@/utils/logger'

interface Props {
  open: boolean
  questionId?: string
  onClose: () => void
  onEdit?: (q: Question) => void
  onDelete?: (id: string) => void
}

const QuestionDetail: React.FC<Props> = ({ open, questionId, onClose, onEdit, onDelete }) => {
  const [question, setQuestion] = React.useState<Question | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    async function load() {
      if (!questionId) return
      setLoading(true)
      try {
        log('QuestionDetail', 'Fetching question', questionId)
        const q = await getQuestionById(questionId)
        setQuestion(q)
      } catch (e) {
        error('QuestionDetail', 'Failed loading question', e)
      } finally {
        setLoading(false)
      }
    }
    if (open) void load()
    // wipe on close
    if (!open) setQuestion(null)
  }, [open, questionId])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Question Details</DialogTitle>
      <DialogContent>
        {loading ? (
          <Typography>Loading…</Typography>
        ) : !question ? (
          <Typography color="text.secondary">No question selected.</Typography>
        ) : (
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Typography variant="h6">{question.title}</Typography>
            {question.description && <Typography color="text.secondary">{question.description}</Typography>}

            <Stack direction="row" spacing={2} alignItems="center">
              <Chip label={`Type: ${question.type}`} />
              <Chip label={`Complexity: ${question.complexity}`} />
              <Chip label={`Max score: ${question.max_score}`} />
            </Stack>

            <Divider />

            <Box>
              <Typography variant="subtitle2">Tags</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>{question.tags?.map((t) => <Chip key={t} label={t} />)}</Stack>
            </Box>

            {question.options && question.options.length > 0 && (
              <Box>
                <Typography variant="subtitle2">Options</Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {question.options.map((opt, idx) => (
                    <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Typography>{String.fromCharCode(65 + idx)}.</Typography>
                      <Typography>{opt}</Typography>
                      {isOptionCorrect(opt, question.correct_answers) && <Chip label="Correct" color="success" size="small" sx={{ ml: 2 }} />}
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            <Divider />

            <Typography variant="caption">Created at: {dayjs(question.created_at).format('YYYY-MM-DD HH:mm')}</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {question && <Button onClick={() => onEdit?.(question)}>Edit</Button>}
        {question && <Button color="error" onClick={() => onDelete?.(question.id)}>Delete</Button>}
      </DialogActions>
    </Dialog>
  )
}

export default QuestionDetail
