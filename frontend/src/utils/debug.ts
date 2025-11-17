/**
 * Debug Utilities
 * 
 * Development-only helpers for debugging and testing
 */

import { info, enableDebugMode, disableDebugMode } from './logger'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useExamStore } from '@/store/examStore'

/**
 * Enable verbose debug logging
 */
export const enableVerboseLogging = (): void => {
  enableDebugMode()
  info('Verbose logging enabled')
}

/**
 * Disable verbose debug logging
 */
export const disableVerboseLogging = (): void => {
  disableDebugMode()
  info('Verbose logging disabled')
}

/**
 * Log all Zustand store states
 */
export const logAllStores = (): void => {
  if (import.meta.env.MODE !== 'development') {
    console.warn('logAllStores is only available in development mode')
    return
  }

  console.group('📦 Zustand Store States')
  
  console.group('Auth Store')
  console.log(useAuthStore.getState())
  console.groupEnd()
  
  console.group('UI Store')
  console.log(useUIStore.getState())
  console.groupEnd()
  
  console.group('Exam Store')
  console.log(useExamStore.getState())
  console.groupEnd()
  
  console.groupEnd()
}

/**
 * Log component tree (simplified)
 */
export const logComponentTree = (): void => {
  if (import.meta.env.MODE !== 'development') {
    console.warn('logComponentTree is only available in development mode')
    return
  }

  console.log('Component tree logging is best done with React DevTools')
  console.log('Install React DevTools browser extension for component inspection')
}

/**
 * Clear all local storage
 */
export const clearAllStorage = (): void => {
  if (confirm('This will clear all local storage. Continue?')) {
    localStorage.clear()
    sessionStorage.clear()
    info('All storage cleared')
    window.location.reload()
  }
}

/**
 * Toggle debug mode
 */
export const toggleDebugMode = (): void => {
  const currentMode = localStorage.getItem('debug-mode')
  if (currentMode === 'enabled') {
    localStorage.removeItem('debug-mode')
    disableDebugMode()
  } else {
    localStorage.setItem('debug-mode', 'enabled')
    enableDebugMode()
  }
}

/**
 * Setup debug keyboard shortcuts
 */
export const setupDebugShortcuts = (): void => {
  if (import.meta.env.MODE !== 'development') {
    return
  }

  const handleKeyPress = (e: KeyboardEvent) => {
    // Ctrl+Shift+D - Toggle debug mode
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault()
      toggleDebugMode()
    }

    // Ctrl+Shift+S - Log all stores
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault()
      logAllStores()
    }

    // Ctrl+Shift+C - Clear storage
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault()
      clearAllStorage()
    }
  }

  window.addEventListener('keydown', handleKeyPress)
  
  info('Debug shortcuts enabled:')
  console.log('  Ctrl+Shift+D - Toggle debug mode')
  console.log('  Ctrl+Shift+S - Log all stores')
  console.log('  Ctrl+Shift+C - Clear storage')
}

/**
 * Initialize debug utilities
 */
export const initDebugUtils = (): void => {
  if (import.meta.env.MODE !== 'development') {
    return
  }

  // Setup shortcuts
  setupDebugShortcuts()

  // Expose debug utilities globally
  ;(window as unknown as { debug: Record<string, unknown> }).debug = {
    enableVerboseLogging,
    disableVerboseLogging,
    logAllStores,
    logComponentTree,
    clearAllStorage,
    toggleDebugMode,
  }

  info('Debug utilities initialized. Access via window.debug')
}

// Auto-initialize in development
if (import.meta.env.MODE === 'development') {
  initDebugUtils()
}
