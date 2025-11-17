import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
  Tooltip,
  CircularProgress,
} from '@mui/material'
import {
  Close,
  ZoomIn,
  ZoomOut,
  FitScreen,
  Download,
} from '@mui/icons-material'
import { getAuthenticatedImageUrl, downloadImage } from '@/api/uploads'
import { log, error as logError } from '@/utils/logger'

interface ImageViewerDialogProps {
  open: boolean
  onClose: () => void
  imageUrl: string
  filename?: string
  title?: string
}

/**
 * Full-screen image viewer dialog with zoom controls
 * Displays uploaded images with zoom and download functionality
 */
const ImageViewerDialog: React.FC<ImageViewerDialogProps> = ({
  open,
  onClose,
  imageUrl,
  filename = 'image.jpg',
  title = 'Image Viewer',
}) => {
  const [zoom, setZoom] = useState(100)
  const [imageBlobUrl, setImageBlobUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Load image with authentication when dialog opens
  useEffect(() => {
    const loadImage = async () => {
      if (open && imageUrl) {
        try {
          setLoading(true)
          log('ImageViewerDialog', 'Loading image', imageUrl)
          const blobUrl = await getAuthenticatedImageUrl(imageUrl)
          setImageBlobUrl(blobUrl)
        } catch (err) {
          logError('ImageViewerDialog', 'Failed to load image', err)
        } finally {
          setLoading(false)
        }
      }
    }
    
    loadImage()

    // Cleanup blob URL when dialog closes
    return () => {
      if (imageBlobUrl) {
        window.URL.revokeObjectURL(imageBlobUrl)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, imageUrl])

  // Reset zoom when dialog opens/closes
  useEffect(() => {
    if (open) {
      setZoom(100)
    }
  }, [open])

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 25))
  }

  const handleFitScreen = () => {
    setZoom(100)
  }

  const handleDownload = async () => {
    try {
      await downloadImage(imageUrl, filename)
    } catch (err) {
      console.error('Failed to download image:', err)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">{title}</Typography>
        <Box>
          <Tooltip title="Zoom Out">
            <IconButton onClick={handleZoomOut} disabled={zoom <= 25}>
              <ZoomOut />
            </IconButton>
          </Tooltip>
          <Typography variant="body2" component="span" sx={{ mx: 1 }}>
            {zoom}%
          </Typography>
          <Tooltip title="Zoom In">
            <IconButton onClick={handleZoomIn} disabled={zoom >= 200}>
              <ZoomIn />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fit to Screen">
            <IconButton onClick={handleFitScreen}>
              <FitScreen />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <IconButton onClick={handleDownload}>
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          backgroundColor: 'grey.900',
          p: 2,
        }}
      >
        {loading ? (
          <CircularProgress />
        ) : imageBlobUrl ? (
          <Box
            component="img"
            src={imageBlobUrl}
            alt={filename}
            sx={{
              maxWidth: `${zoom}%`,
              maxHeight: `${zoom}%`,
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              transition: 'all 0.3s ease',
            }}
          />
        ) : (
          <Typography>Failed to load image</Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>
          {filename}
        </Typography>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ImageViewerDialog
