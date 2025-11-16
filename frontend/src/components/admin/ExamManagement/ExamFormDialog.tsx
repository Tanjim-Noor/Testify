import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, CircularProgress } from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { DateTimePicker } from '@mui/x-date-pickers'
import type { Exam, ExamFormData } from '@/types/exam.types'
import { createExam, updateExam } from '@/api/exams'
import { log, error } from '@/utils/logger'
import dayjs from 'dayjs'
import { success as notifySuccess, error as notifyError } from '@/utils/notifier'

interface Props {
  open: boolean
  onClose: () => void
  exam?: Exam
  onSuccess?: () => void
}

const ExamFormDialog: React.FC<Props> = ({ open, onClose, exam, onSuccess }) => {
  const isEdit = Boolean(exam)
  const { control, handleSubmit, formState, reset } = useForm<ExamFormData>({
    defaultValues: exam ? ({
      title: exam.title,
      description: exam.description ?? '',
      start_time: exam.start_time,
      end_time: exam.end_time,
      duration_minutes: exam.duration_minutes,
    }) : { title: '', description: '', start_time: '', end_time: '', duration_minutes: 60 }
  })

  React.useEffect(() => {
    if (open) {
      if (exam) {
        reset({
          title: exam.title,
          description: exam.description ?? '',
          start_time: exam.start_time,
          end_time: exam.end_time,
          duration_minutes: exam.duration_minutes,
        })
      } else {
        reset(undefined)
      }
    }
  }, [open, exam])

  const onSubmit = async (data: ExamFormData) => {
    try {
      // Ensure ISO 8601 format
      const payload: ExamFormData = {
        ...data,
        start_time: dayjs(data.start_time).toISOString(),
        end_time: dayjs(data.end_time).toISOString(),
      }

      // Validate end after start
      if (!dayjs(payload.end_time).isAfter(dayjs(payload.start_time))) {
        notifyError('End time must be after start time')
        return
      }

      // For new exams, recommend start time be in future
      if (!isEdit && !dayjs(payload.start_time).isAfter(dayjs())) {
        notifyError('Start time should be in the future')
        return
      }

      if (isEdit && exam) {
        log('ExamForm', 'Updating exam', exam.id)
        await updateExam(exam.id, payload)
        notifySuccess('Exam updated')
      } else {
        log('ExamForm', 'Creating exam', data.title)
        await createExam(payload)
        notifySuccess('Exam created')
      }
      onSuccess?.()
      onClose()
    } catch (err) {
      error('ExamForm', 'submit failed', err)
      notifyError('Failed to save exam')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{isEdit ? 'Edit Exam' : 'Create Exam'}</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ display: 'grid', gap: 2, mt: 1 }}>
          <Controller name="title" control={control as any} rules={{ required: true, maxLength: 200 }} render={({ field }) => (
            <TextField label="Title" required fullWidth {...field} />
          )} />

          <Controller name="description" control={control as any} render={({ field }) => (
            <TextField label="Description" fullWidth multiline minRows={3} {...field} />
          )} />

          <Controller name="start_time" control={control as any} rules={{ required: true }} render={({ field }) => (
            <DateTimePicker
              label="Start Date & Time"
              value={field.value ? dayjs(field.value) : null}
              onChange={(v) => field.onChange(v ? dayjs(v).toISOString() : '')}
              renderInput={(params) => <TextField {...params} />}
            />
          )} />

          <Controller name="end_time" control={control as any} rules={{ required: true }} render={({ field }) => (
            <DateTimePicker
              label="End Date & Time"
              value={field.value ? dayjs(field.value) : null}
              onChange={(v) => field.onChange(v ? dayjs(v).toISOString() : '')}
              renderInput={(params) => <TextField {...params} />}
            />
          )} />

          <Controller name="duration_minutes" control={control as any} rules={{ required: true, min: 1 }} render={({ field }) => (
            <TextField label="Duration (minutes)" type="number" inputProps={{ min: 1 }} {...field} />
          )} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={formState.isSubmitting}>{formState.isSubmitting ? <CircularProgress size={20} /> : (isEdit ? 'Update Exam' : 'Create Exam')}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ExamFormDialog
