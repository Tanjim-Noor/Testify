import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
} from '@mui/material'
import {
  CloudUpload,
  Delete,
  Visibility,
  CheckCircle,
  Error as ErrorIcon,
  InsertDriveFile,
} from '@mui/icons-material'
import type { AnswerValue } from '@/types/studentExam.types'
import { uploadImage, getImageUrl } from '@/api/uploads'
import { log, error as logError } from '@/utils/logger'

interface ImageUploadAnswerProps {
  value: AnswerValue
  onChange: (value: AnswerValue) => void
  studentExamId?: string
  questionId?: string
}

// Allowed image types
const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
}

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

/**
 * Image upload answer component
 * Allows students to upload images as exam answers
 */
const ImageUploadAnswer: React.FC<ImageUploadAnswerProps> = ({
  value,
  onChange,
  studentExamId,
  questionId,
}) => {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Handle file drop/selection
  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: any[]) => {
      // Clear previous messages
      setUploadError(null)
      setUploadSuccess(false)

      // Handle rejections
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0]
        const errorCode = rejection.errors[0]?.code
        
        let errorMessage = 'Invalid file. Please try again.'
        if (errorCode === 'file-too-large') {
          errorMessage = 'File size exceeds 5MB limit. Please upload a smaller image.'
        } else if (errorCode === 'file-invalid-type') {
          errorMessage = 'Invalid file type. Please upload a JPG, PNG, GIF, or WEBP image.'
        }
        
        setUploadError(errorMessage)
        logError('ImageUploadAnswer', 'File rejected', rejection.errors)
        return
      }

      // No files accepted
      if (acceptedFiles.length === 0) {
        return
      }

      const file = acceptedFiles[0]

      try {
        setUploading(true)
        log('ImageUploadAnswer', 'Uploading file', { name: file.name, size: file.size })

        // Upload file
        const response = await uploadImage(file, studentExamId, questionId)

        // Update answer value with file metadata
        const newValue: AnswerValue = {
          file_url: response.file_url,
          text: JSON.stringify({
            filename: response.filename,
            file_size: response.file_size,
            uploaded_at: new Date().toISOString(),
            mime_type: response.mime_type,
          }),
        }

        onChange(newValue)
        setUploadSuccess(true)
        log('ImageUploadAnswer', 'File uploaded successfully', response)

        // Hide success message after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000)
      } catch (err: any) {
        const errorMsg = err?.response?.data?.detail || 'Failed to upload file. Please try again.'
        setUploadError(errorMsg)
        logError('ImageUploadAnswer', 'Upload failed', err)
      } finally {
        setUploading(false)
      }
    },
    [onChange, studentExamId, questionId]
  )

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: ALLOWED_IMAGE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: uploading,
  })

  // Handle remove image
  const handleRemove = () => {
    onChange({})
    setConfirmDelete(false)
    setUploadError(null)
    setUploadSuccess(false)
    log('ImageUploadAnswer', 'Image removed')
  }

  // Parse metadata from text field
  const getMetadata = () => {
    try {
      if (value.text) {
        return JSON.parse(value.text)
      }
    } catch {
      return null
    }
    return null
  }

  const metadata = getMetadata()
  const hasImage = !!value.file_url

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Dropzone styles
  const getDropzoneStyle = () => {
    const baseStyle = {
      border: '2px dashed',
      borderRadius: 2,
      padding: 4,
      textAlign: 'center' as const,
      cursor: uploading ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s ease',
      backgroundColor: uploading ? 'action.disabledBackground' : 'background.paper',
    }

    if (isDragAccept) {
      return { ...baseStyle, borderColor: 'success.main', backgroundColor: 'success.lighter' }
    }
    if (isDragReject) {
      return { ...baseStyle, borderColor: 'error.main', backgroundColor: 'error.lighter' }
    }
    if (isDragActive) {
      return { ...baseStyle, borderColor: 'primary.main', backgroundColor: 'primary.lighter' }
    }
    return { ...baseStyle, borderColor: 'divider' }
  }

  return (
    <Box>
      {/* Upload area (shown when no image) */}
      {!hasImage && (
        <Paper
          {...getRootProps()}
          sx={getDropzoneStyle()}
          elevation={0}
        >
          <input {...getInputProps()} />
          
          {uploading ? (
            <Box py={3}>
              <CircularProgress size={40} />
              <Typography variant="body2" color="text.secondary" mt={2}>
                Uploading...
              </Typography>
            </Box>
          ) : (
            <Box py={3}>
              <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1" gutterBottom>
                {isDragActive
                  ? 'Drop the image here...'
                  : 'Drag & drop an image here, or click to select'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supported formats: JPG, PNG, GIF, WEBP (Max 5MB)
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Image preview (shown when image exists) */}
      {hasImage && value.file_url && (
        <Card sx={{ maxWidth: 500, mx: 'auto' }}>
          <CardMedia
            component="img"
            height="200"
            image={getImageUrl(value.file_url)}
            alt={metadata?.filename || 'Uploaded image'}
            sx={{ objectFit: 'contain', backgroundColor: 'grey.100', cursor: 'pointer' }}
            onClick={() => setPreviewOpen(true)}
          />
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <InsertDriveFile color="action" />
              <Typography variant="body2" noWrap>
                {metadata?.filename || 'image.jpg'}
              </Typography>
            </Box>
            {metadata?.file_size && (
              <Typography variant="caption" color="text.secondary">
                Size: {formatFileSize(metadata.file_size)}
              </Typography>
            )}
            {metadata?.uploaded_at && (
              <Typography variant="caption" color="text.secondary" display="block">
                Uploaded: {new Date(metadata.uploaded_at).toLocaleString()}
              </Typography>
            )}
          </CardContent>
          <CardActions>
            <Button
              size="small"
              startIcon={<Visibility />}
              onClick={() => setPreviewOpen(true)}
            >
              View Full Size
            </Button>
            <Button
              size="small"
              color="error"
              startIcon={<Delete />}
              onClick={() => setConfirmDelete(true)}
            >
              Remove
            </Button>
          </CardActions>
        </Card>
      )}

      {/* Success message */}
      {uploadSuccess && (
        <Alert severity="success" icon={<CheckCircle />} sx={{ mt: 2 }}>
          Image uploaded successfully!
        </Alert>
      )}

      {/* Error message */}
      {uploadError && (
        <Alert
          severity="error"
          icon={<ErrorIcon />}
          sx={{ mt: 2 }}
          onClose={() => setUploadError(null)}
        >
          {uploadError}
        </Alert>
      )}

      {/* Full-size preview dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Image Preview</DialogTitle>
        <DialogContent>
          {value.file_url && (
            <Box
              component="img"
              src={getImageUrl(value.file_url)}
              alt={metadata?.filename || 'Preview'}
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: '70vh',
                objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Remove Image?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this image? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button onClick={handleRemove} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ImageUploadAnswer

