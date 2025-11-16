import React from 'react'
import { Box, Typography } from '@mui/material'

interface Props {
  icon?: React.ReactNode
  title?: string
  message?: string
  action?: React.ReactNode
}

const EmptyState: React.FC<Props> = ({ icon, title = 'No items', message = 'Nothing to show here yet.', action }) => {
  return (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      {icon}
      <Typography variant="h6" sx={{ mt: 2 }}>{title}</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>{message}</Typography>
      {action && <Box sx={{ mt: 3 }}>{action}</Box>}
    </Box>
  )
}

export default EmptyState
