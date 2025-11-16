import React from 'react'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, LinearProgress, Link } from '@mui/material'
import FileUploadZone from './FileUploadZone'
import ImportResults from './ImportResults'
import { importQuestions, type ImportResult } from '@/api/questions'
import { log, error } from '@/utils/logger'
import { success as notifySuccess, error as notifyError } from '@/utils/notifier'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const ExcelImportDialog: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const [file, setFile] = React.useState<File | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [progress, setProgress] = React.useState<number | null>(null)
  const [result, setResult] = React.useState<ImportResult | null>(null)
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="md">
      <DialogTitle>Import Questions from Excel</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>Import questions using an Excel (.xlsx) file. Download the template to see the expected columns.</Typography>
        <Box sx={{ mb: 2 }}>
          <Link href="/questions_template.csv" download>Download template (CSV example)</Link>
        </Box>
        <FileUploadZone onFileSelected={setFile} disabled={uploading} />
        {uploading && progress !== null && <LinearProgress variant="determinate" value={progress} sx={{ mt: 2 }} />}
        {uploading && progress === null && <LinearProgress sx={{ mt: 2 }} />}
        {result && <Box sx={{ mt: 2 }}><ImportResults result={result} /></Box>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="outlined" onClick={() => { setFile(null); setResult(null); }}>Reset</Button>
        <Button disabled={!file || uploading} onClick={async () => {
          if (!file) return
          try {
            setUploading(true)
            setProgress(0)
            const res = await importQuestions(file, (e) => {
              if (!e.lengthComputable) return
              const pct = Math.round((e.loaded / e.total) * 100)
              setProgress(pct)
            })
            log('ExcelImportDialog', 'Import result', res)
            setResult(res)
            notifySuccess(`${res.success_count} questions imported, ${res.error_count} errors`)
            onSuccess?.()
          } catch (e) {
            error('ExcelImportDialog', 'Import failed', e)
            notifyError('Upload failed; see console for details')
          } finally {
            setUploading(false)
            setProgress(null)
          }
        }} variant="contained">Upload</Button>
        <Button variant="contained" onClick={() => { onClose(); setFile(null); setResult(null) }}>Done</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ExcelImportDialog
