/**
 * AccessDenied Component (403)
 * 
 * Displays a friendly error page for access denied errors
 */

import React from 'react'
import { Box, Button, Typography, Paper } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'

/**
 * AccessDenied Component
 */
const AccessDenied: React.FC = () => {
  const navigate = useNavigate()

  const handleGoHome = () => {
    navigate('/')
  }

  const handleGoBack = () => {
    navigate(-1)
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
        <LockOutlinedIcon 
          sx={{ 
            fontSize: 100, 
            color: 'warning.main',
            mb: 2,
          }} 
        />
        
        <Typography variant="h3" gutterBottom>
          403
        </Typography>
        
        <Typography variant="h5" gutterBottom>
          Access Denied
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          You don't have permission to access this resource.
          Please contact your administrator if you believe this is a mistake.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="contained" onClick={handleGoHome}>
            Go to Home
          </Button>
          <Button variant="outlined" onClick={handleGoBack}>
            Go Back
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}

export default AccessDenied
