import React from 'react'
import Backdrop from '@mui/material/Backdrop'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

interface Props {
  open?: boolean
  message?: string
  fullscreen?: boolean
}

const LoadingOverlay: React.FC<Props> = ({ open = true, message = 'Loading…', fullscreen = true }) => {
  return (
    <Backdrop
      open={open}
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.tooltip + 1,
        position: fullscreen ? 'fixed' : 'absolute',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <CircularProgress color="inherit" />
        {message && <Typography variant="body1" sx={{ mt: 2 }}>{message}</Typography>}
      </div>
    </Backdrop>
  )
}

export default LoadingOverlay
