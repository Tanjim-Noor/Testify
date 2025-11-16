import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const ExcelImportDialog: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Import Questions from Excel</DialogTitle>
      <DialogContent>
        <Typography>This feature will allow bulk importing of questions from a .xlsx file. Implemented in Phase 5.</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={() => { onSuccess?.(); onClose() }}>Done</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ExcelImportDialog
