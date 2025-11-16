/**
 * GlobalLoader Component
 * 
 * Displays a fullscreen loading overlay with optional message
 * Controlled by the UI store
 */

import React from 'react'
import { Backdrop, CircularProgress, Box, Typography } from '@mui/material'
import { useUIStore } from '@/store/uiStore'

/**
 * GlobalLoader Component
 */
const GlobalLoader: React.FC = () => {
  const { isLoading, loadingMessage } = useUIStore()

  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.modal + 1,
        flexDirection: 'column',
        gap: 2,
      }}
      open={isLoading}
    >
      <CircularProgress color="inherit" size={60} />
      {loadingMessage && (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6">{loadingMessage}</Typography>
        </Box>
      )}
    </Backdrop>
  )
}

export default GlobalLoader
