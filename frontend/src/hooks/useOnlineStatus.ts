/**
 * useOnlineStatus Hook
 * 
 * Detects and tracks online/offline status
 */

import { useState, useEffect } from 'react'
import { info, warn } from '@/utils/logger'

/**
 * Hook to detect online/offline status
 * @returns Object with isOnline boolean
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      info('Network connection restored')
    }

    const handleOffline = () => {
      setIsOnline(false)
      warn('Network connection lost')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline }
}

export default useOnlineStatus
