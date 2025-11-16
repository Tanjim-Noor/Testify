/**
 * Network Retry Utility
 * 
 * Implements retry logic with exponential backoff for failed network requests
 */

import { AxiosError } from 'axios'
import { debug, warn, error as logError } from './logger'

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
}

/**
 * Default retry configuration
 */
const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
}

/**
 * Check if an error should be retried
 * @param err - Error to check
 * @returns True if error is retryable
 */
export const isRetryableError = (err: unknown): boolean => {
  // Not an Axios error - don't retry
  if (!(err instanceof AxiosError)) {
    return false
  }

  const status = err.response?.status

  // Network errors (no response) - retry
  if (!status) {
    debug('Network error detected - retryable', { error: err.message })
    return true
  }

  // 5xx server errors - retry
  if (status >= 500 && status < 600) {
    debug(`Server error ${status} - retryable`)
    return true
  }

  // 429 Rate Limit - retry
  if (status === 429) {
    debug('Rate limit error - retryable')
    return true
  }

  // Timeout errors - retry
  if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
    debug('Timeout error - retryable')
    return true
  }

  // 4xx client errors (except 429) - don't retry
  if (status >= 400 && status < 500) {
    debug(`Client error ${status} - not retryable`)
    return false
  }

  // Default: don't retry
  return false
}

/**
 * Calculate delay with exponential backoff
 * @param attempt - Current attempt number (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
const calculateDelay = (attempt: number, config: Required<RetryConfig>): number => {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt)
  return Math.min(delay, config.maxDelay)
}

/**
 * Sleep for specified milliseconds
 * @param ms - Milliseconds to sleep
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry a request function with exponential backoff
 * @param requestFn - Async function that makes the request
 * @param config - Retry configuration
 * @returns Promise that resolves with the request result
 */
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  let lastError: unknown

  for (let attempt = 0; attempt < finalConfig.maxRetries; attempt++) {
    try {
      debug(`Attempt ${attempt + 1}/${finalConfig.maxRetries}`)
      
      const result = await requestFn()
      
      if (attempt > 0) {
        debug(`Request succeeded on attempt ${attempt + 1}`)
      }
      
      return result
    } catch (err) {
      lastError = err

      // Check if we should retry
      if (!isRetryableError(err)) {
        logError('Non-retryable error encountered', err as Error)
        throw err
      }

      // Don't wait after the last attempt
      if (attempt === finalConfig.maxRetries - 1) {
        warn(`Max retries (${finalConfig.maxRetries}) reached`)
        break
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, finalConfig)
      warn(`Request failed, retrying in ${delay}ms...`, {
        attempt: attempt + 1,
        maxRetries: finalConfig.maxRetries,
        error: err instanceof Error ? err.message : 'Unknown error',
      })

      await sleep(delay)
    }
  }

  // All retries failed
  logError('All retry attempts failed', lastError as Error)
  throw lastError
}

/**
 * Create a retry wrapper for an async function
 * @param fn - Function to wrap with retry logic
 * @param config - Retry configuration
 * @returns Wrapped function with retry logic
 */
export function withRetry<T extends (...args: never[]) => Promise<unknown>>(
  fn: T,
  config: RetryConfig = {}
): T {
  return (async (...args: Parameters<T>) => {
    return retryRequest(() => fn(...args), config)
  }) as T
}

/**
 * Extract retry-after header value (in seconds)
 * @param err - Axios error
 * @returns Retry-after value in milliseconds, or null
 */
export const getRetryAfter = (err: unknown): number | null => {
  if (!(err instanceof AxiosError)) {
    return null
  }

  const retryAfter = err.response?.headers['retry-after']
  if (!retryAfter) {
    return null
  }

  // Retry-After can be in seconds or a date
  const seconds = parseInt(retryAfter, 10)
  if (!isNaN(seconds)) {
    return seconds * 1000 // Convert to milliseconds
  }

  // Try parsing as date
  const date = new Date(retryAfter)
  if (!isNaN(date.getTime())) {
    return Math.max(0, date.getTime() - Date.now())
  }

  return null
}
