import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material'

interface SubmitDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  answeredCount: number
  totalQuestions: number
  isSubmitting: boolean
}

/**
 * Submit confirmation dialog
 * Shows summary and warnings before submission
 */
const SubmitDialog: React.FC<SubmitDialogProps> = ({
  open,
  onClose,
  onConfirm,
  answeredCount,
  totalQuestions,
  isSubmitting,
}) => {
  const unansweredCount = totalQuestions - answeredCount

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Submit Exam?</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          You have answered <strong>{answeredCount}</strong> of <strong>{totalQuestions}</strong> questions.
        </Typography>

        {unansweredCount > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            You have <strong>{unansweredCount}</strong> unanswered question{unansweredCount > 1 ? 's' : ''}.
            Are you sure you want to submit?
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Once submitted, you cannot change your answers.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="primary"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Exam'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SubmitDialog
