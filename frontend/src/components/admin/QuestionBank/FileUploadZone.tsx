import React from 'react'
import { useDropzone } from 'react-dropzone'
import { Box, Typography, Button, Paper, Stack, IconButton } from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import DeleteIcon from '@mui/icons-material/Delete'

interface Props {
  onFileSelected: (file: File | null) => void
  disabled?: boolean
  maxSizeBytes?: number
}

const FileUploadZone: React.FC<Props> = ({ onFileSelected, disabled = false, maxSizeBytes = 10 * 1024 * 1024 }) => {
  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length) {
      onFileSelected(acceptedFiles[0])
    }
  }, [onFileSelected])

  const { getRootProps, getInputProps, acceptedFiles, fileRejections, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxSize: maxSizeBytes,
    disabled,
  })

  const file = acceptedFiles && acceptedFiles.length ? acceptedFiles[0] : null

  React.useEffect(() => {
    // Keep parent in sync
    onFileSelected(file || null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file])

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box {...getRootProps()} sx={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <input {...getInputProps()} />
        <Stack direction="row" spacing={2} alignItems="center">
          <UploadFileIcon />
          <Box>
            <Typography variant="subtitle1">Drag and drop Excel (.xlsx) file here, or click to select</Typography>
            <Typography variant="body2" color="text.secondary">Maximum size: {Math.round(maxSizeBytes / (1024 * 1024))} MB</Typography>
            {isDragActive && <Typography variant="body2">Release to upload</Typography>}
          </Box>
        </Stack>
      </Box>

      {file && (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography>{file.name} — {Math.round(file.size / 1024)} KB</Typography>
          <IconButton aria-label="remove" onClick={() => onFileSelected(null)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      )}

      {fileRejections && fileRejections.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {fileRejections.map((r) => (
            <Typography key={r.file.name} color="error">{r.file.name} — {r.errors.map(e => e.message).join(', ')}</Typography>
          ))}
        </Box>
      )}

      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Button variant="contained" disabled={!file || disabled} onClick={() => onFileSelected(file)} startIcon={<UploadFileIcon />}>Upload</Button>
        <Button variant="outlined" onClick={() => onFileSelected(null)}>Clear</Button>
      </Box>
    </Paper>
  )
}

export default FileUploadZone
