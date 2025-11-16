/**
 * ServerError Component (500)
 * 
 * Displays a friendly error page for server errors
 */

import React from 'react'
import { Box, Button, Typography, Paper } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'

/**
 * ServerError Component
 */
const ServerError: React.FC = () => {
  const navigate = useNavigate()

  const handleGoHome = () => {
    navigate('/')
  }

  const handleReload = () => {
    window.location.reload()
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 500,
          textAlign: 'center',
        }}
      >
        <ErrorOutlineIcon 
          sx={{ 
            fontSize: 100, 
            color: 'error.main',
            mb: 2,
          }} 
        />
        
        <Typography variant="h3" gutterBottom>
          500
        </Typography>
        
        <Typography variant="h5" gutterBottom>
          Server Error
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Oops! Something went wrong on our end. We're working to fix the issue.
          Please try again later.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="contained" onClick={handleReload}>
            Try Again
          </Button>
          <Button variant="outlined" onClick={handleGoHome}>
            Go to Home
          </Button>
        </Box>

        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 3 }}>
          If this problem persists, please contact support.
        </Typography>
      </Paper>
    </Box>
  )
}

export default ServerError
