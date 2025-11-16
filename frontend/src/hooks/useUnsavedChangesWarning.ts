/**
 * useUnsavedChangesWarning Hook
 * 
 * Warns user about unsaved changes before leaving the page
 */

import { useEffect } from 'react'
import { useBlocker } from 'react-router-dom'

/**
 * Hook to warn about unsaved changes
 * @param hasUnsavedChanges - Whether there are unsaved changes
 * @param message - Custom warning message
 */
export const useUnsavedChangesWarning = (
  hasUnsavedChanges: boolean,
  message: string = 'You have unsaved changes. Are you sure you want to leave?'
) => {
  // Warn on page reload/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = message
        return message
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges, message])

  // Warn on route change (React Router v6)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  )

  // Handle route change confirmation
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const shouldProceed = window.confirm(message)
      if (shouldProceed) {
        blocker.proceed()
      } else {
        blocker.reset()
      }
    }
  }, [blocker, message])

  return blocker
}

/**
 * Hook to prevent navigation (simpler version)
 * @param when - Condition to prevent navigation
 * @param message - Warning message
 */
export const usePrompt = (when: boolean, message: string) => {
  useUnsavedChangesWarning(when, message)
}

export default useUnsavedChangesWarning
