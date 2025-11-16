/**
 * Enhanced Logger Utility
 * 
 * Provides comprehensive logging functionality with:
 * - Multiple log levels (DEBUG, INFO, WARN, ERROR)
 * - Timestamp formatting
 * - Context/metadata support
 * - Console color coding
 * - Environment-based filtering
 * - Specialized loggers for API calls and user actions
 */

/**
 * Logger metadata interface
 */
export interface LogMetadata {
  [key: string]: unknown
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  isDevelopment: boolean
  enableDebug: boolean
}

const config: LoggerConfig = {
  isDevelopment: import.meta.env.MODE === 'development',
  enableDebug: import.meta.env.MODE === 'development',
}

/**
 * Format timestamp in ISO format
 */
const formatTimestamp = (): string => {
  return new Date().toISOString()
}

/**
 * Format log line with color and context
 */
const formatLine = (level: string, color: string, context?: string) => {
  const timestamp = formatTimestamp()
  const prefix = context ? `[${context}]` : '[App]'
  return [`%c${timestamp} ${prefix} ${level}`, `color: ${color}; font-weight: 600;`] as const
}

/**
 * Generic logger function
 */
const createLogger = (
  level: 'log' | 'warn' | 'error' | 'debug',
  color: string,
) => {
  return (context: string, ...payload: unknown[]) => {
    if (!config.enableDebug && level === 'debug') {
      return
    }

    const [message, style] = formatLine(level.toUpperCase(), color, context)
    // eslint-disable-next-line no-console
    switch (level) {
      case 'log':
        console.log(message, style, ...payload)
        break
      case 'warn':
        console.warn(message, style, ...payload)
        break
      case 'error':
        console.error(message, style, ...payload)
        break
      case 'debug':
        console.debug(message, style, ...payload)
        break
    }
  }
}

/**
 * Debug level logging - only in development
 */
export const debug = createLogger('debug', '#10b981')

/**
 * Info level logging
 */
export const info = createLogger('log', '#2563eb')

/**
 * Warning level logging
 */
export const warn = createLogger('warn', '#f59e0b')

/**
 * Error level logging
 */
export const error = createLogger('error', '#dc2626')

/**
 * Log API call with method, URL, and optional response
 * @param method - HTTP method (GET, POST, etc.)
 * @param url - API endpoint URL
 * @param response - Optional response data
 */
export const logApiCall = (
  method: string,
  url: string,
  response?: { status?: number; data?: unknown }
): void => {
  const metadata = {
    method,
    url,
    ...(response && {
      status: response.status,
      data: response.data,
    }),
  }

  debug('API', `${method} ${url}`, metadata)
}

/**
 * Log user action with metadata
 * @param action - Action name/description
 * @param metadata - Optional metadata object
 */
export const logUserAction = (action: string, metadata?: LogMetadata): void => {
  info('User', action, metadata)
}

/**
 * Enable debug mode (useful for development)
 */
export const enableDebugMode = (): void => {
  config.enableDebug = true
  info('Logger', 'Debug mode enabled')
}

/**
 * Disable debug mode
 */
export const disableDebugMode = (): void => {
  config.enableDebug = false
  info('Logger', 'Debug mode disabled')
}

// Alias for backward compatibility
export const log = info