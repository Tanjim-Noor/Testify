/**
 * OfflineIndicator Component
 * 
 * Displays a banner when the user is offline
 */

import React from 'react'
import { Alert, Slide } from '@mui/material'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

/**
 * OfflineIndicator Component
 */
const OfflineIndicator: React.FC = () => {
  const { isOnline } = useOnlineStatus()

  return (
    <Slide direction="down" in={!isOnline} mountOnEnter unmountOnExit>
      <Alert 
        severity="warning" 
        sx={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: (theme) => theme.zIndex.snackbar,
          borderRadius: 0,
        }}
      >
        You are offline. Some features may not work properly.
      </Alert>
    </Slide>
  )
}

export default OfflineIndicator
