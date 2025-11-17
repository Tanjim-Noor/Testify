/**
 * NotificationProvider Component
 * 
 * Provides toast notification functionality using react-hot-toast
 * Supports success, error, warning, and info notifications
 */

import React, { useEffect } from 'react'
import toast, { Toaster, type ToastOptions } from 'react-hot-toast'
import { setNotifier, clearNotifier } from '@/utils/notifier'

/**
 * Default toast options
 */
const defaultOptions: ToastOptions = {
  duration: 5000,
  position: 'top-right',
  style: {
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    maxWidth: '500px',
  },
}

/**
 * Toast notification types
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info'

/**
 * Show notification function
 */
const showNotification = (
  message: string,
  type: NotificationType = 'info',
  options?: ToastOptions
) => {
  const finalOptions = { ...defaultOptions, ...options }

  switch (type) {
    case 'success':
      toast.success(message, {
        ...finalOptions,
        iconTheme: {
          primary: '#10b981',
          secondary: '#fff',
        },
      })
      break
    case 'error':
      toast.error(message, {
        ...finalOptions,
        iconTheme: {
          primary: '#ef4444',
          secondary: '#fff',
        },
      })
      break
    case 'warning':
      toast(message, {
        ...finalOptions,
        icon: '⚠️',
        style: {
          ...finalOptions.style,
          backgroundColor: '#fef3c7',
          color: '#92400e',
        },
      })
      break
    case 'info':
    default:
      toast(message, {
        ...finalOptions,
        icon: 'ℹ️',
        style: {
          ...finalOptions.style,
          backgroundColor: '#dbeafe',
          color: '#1e40af',
        },
      })
      break
  }
}

/**
 * NotificationProvider Component
 */
const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Set the global notifier function
    setNotifier(showNotification)
    
    return () => {
      clearNotifier()
    }
  }, [])

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={defaultOptions}
      />
    </>
  )
}

export default NotificationProvider

/**
 * Exported helper functions for direct usage
 */
export const notify = {
  success: (message: string, options?: ToastOptions) => 
    showNotification(message, 'success', options),
  error: (message: string, options?: ToastOptions) => 
    showNotification(message, 'error', options),
  warning: (message: string, options?: ToastOptions) => 
    showNotification(message, 'warning', options),
  info: (message: string, options?: ToastOptions) => 
    showNotification(message, 'info', options),
  promise: toast.promise,
  loading: toast.loading,
  dismiss: toast.dismiss,
  custom: toast.custom,
}