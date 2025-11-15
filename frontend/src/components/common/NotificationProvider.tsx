import React, { useCallback, useEffect, useState } from 'react'
import { Snackbar, Alert } from '@mui/material'
import { setNotifier, clearNotifier } from '@/utils/notifier'

const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('info')

  const show = useCallback((msg: string, sev: typeof severity = 'info') => {
    setMessage(msg)
    setSeverity(sev)
    setOpen(true)
  }, [])

  useEffect(() => {
    setNotifier(show)
    return () => {
      clearNotifier()
    }
  }, [show])

  return (
    <>
      {children}
      <Snackbar open={open} autoHideDuration={5000} onClose={() => setOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={severity} onClose={() => setOpen(false)}>
          {message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default NotificationProvider
