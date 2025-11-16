import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, MenuItem, CircularProgress, Autocomplete, Chip } from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import type { Question, QuestionFormData, QuestionType } from '@/types/question.types'
import { createQuestion, updateQuestion } from '@/api/questions'
import OptionsEditor from './OptionsEditor'
import { RadioGroup, FormControlLabel, Radio, FormGroup, Checkbox } from '@mui/material'
import { log, error } from '@/utils/logger'
import { mapAnswersToOptionStrings } from '@/utils/optionUtils'

interface Props {
  open: boolean
  onClose: () => void
  question?: Question
  onSuccess?: () => void
}

const QuestionFormDialog: React.FC<Props> = ({ open, onClose, question, onSuccess }) => {
  const isEdit = Boolean(question)
  const { control, handleSubmit, watch, formState, reset } = useForm<QuestionFormData>({
    defaultValues: question ? { ...question } as any : { title: '', description: '', complexity: '', type: 'single_choice', options: [], correct_answers: [], max_score: 1, tags: [] },
  })

  React.useEffect(() => {
    if (open) {
      if (question) {
        // Normalize correct answers: if backend stores letters ("A"), map them to the
        // actual option strings so the UI can display the selected radio/checkbox.
        const initial = { ...question } as any
        if (initial.options && initial.correct_answers) {
          initial.correct_answers = mapAnswersToOptionStrings(initial.options, initial.correct_answers)
        }
        reset(initial)
      } else {
        reset(undefined)
      }
    }
  }, [open, question])

  const onSubmit = async (data: QuestionFormData) => {
    try {
      if (isEdit && question) {
        log('QuestionForm', 'Updating question', question.id)
        await updateQuestion(question.id, data)
      } else {
        log('QuestionForm', 'Creating question', data.title)
        await createQuestion(data)
      }
      onSuccess?.()
      onClose()
    } catch (e) {
      error('QuestionForm', 'submit failed', e)
      // TODO: show errors via notifier
    }
  }

  const questionType = watch('type') as QuestionType

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{isEdit ? 'Edit Question' : 'Create Question'}</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ display: 'grid', gap: 2, mt: 1 }}>
          <Controller name="title" control={control as any} rules={{ required: true, maxLength: 500 }} render={({ field }) => (
            <TextField label="Title" required fullWidth {...field} />
          )} />

          <Controller name="description" control={control as any} render={({ field }) => (
            <TextField label="Description" fullWidth multiline minRows={3} {...field} />
          )} />

          <Controller name="complexity" control={control as any} rules={{ required: true }} render={({ field }) => (
            <TextField label="Complexity" required fullWidth {...field} />
          )} />

          <Controller name="type" control={control as any} rules={{ required: true }} render={({ field }) => (
            <TextField select label="Type" required {...field}>
              <MenuItem value="single_choice">Single Choice</MenuItem>
              <MenuItem value="multi_choice">Multiple Choice</MenuItem>
              <MenuItem value="text">Text</MenuItem>
              <MenuItem value="image_upload">Image Upload</MenuItem>
            </TextField>
          )} />

                  {['single_choice', 'multi_choice'].includes(questionType) && (
                    <>
                      <Controller name="options" control={control as any} render={({ field }) => (
                        <OptionsEditor options={field.value ?? []} onChange={field.onChange} />
                      )} />

                      {/* Correct answers */}
                      {questionType === 'single_choice' && (
                        <Controller name="correct_answers" control={control as any} render={({ field }) => (
                          <RadioGroup value={field.value?.[0] ?? ''} onChange={(e) => field.onChange([e.target.value])}>
                            {(watch('options') ?? []).map((opt: string, idx: number) => (
                              <FormControlLabel key={idx} value={opt} control={<Radio />} label={opt || `Option ${idx + 1}`} />
                            ))}
                          </RadioGroup>
                        )} />
                      )}

                      {questionType === 'multi_choice' && (
                        <Controller name="correct_answers" control={control as any} render={({ field }) => (
                          <FormGroup>
                            {(watch('options') ?? []).map((opt: string, idx: number) => (
                              <FormControlLabel key={idx} control={<Checkbox checked={(field.value ?? []).includes(opt)} onChange={(e) => {
                                const cur = new Set(field.value ?? [])
                                if (e.target.checked) cur.add(opt)
                                else cur.delete(opt)
                                field.onChange(Array.from(cur))
                              }} />} label={opt || `Option ${idx + 1}`} />
                            ))}
                          </FormGroup>
                        )} />
                      )}
                    </>
                  )}

          <Controller name="tags" control={control as any} render={({ field }) => (
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={field.value ?? []}
              onChange={(_, newValue) => field.onChange(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Tags" placeholder="Add tags (press Enter)" helperText="Type and press Enter to add tags" />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index })
                  return <Chip key={key} label={option} size="small" {...tagProps} />
                })
              }
            />
          )} />

          <Controller name="max_score" control={control as any} rules={{ required: true, min: 1 }} render={({ field }) => (
            <TextField label="Max Score" type="number" inputProps={{ min: 1 }} {...field} />
          )} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={formState.isSubmitting}>{formState.isSubmitting ? <CircularProgress size={20} /> : (isEdit ? 'Update Question' : 'Create Question')}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default QuestionFormDialog
