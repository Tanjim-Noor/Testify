/**
 * Global Error Handler Utility
 * 
 * Provides centralized error processing and user-friendly error messages
 */

import { AxiosError } from 'axios'
import { error as logError } from './logger'

/**
 * Standardized error object
 */
export interface StandardError {
  message: string
  code?: string
  details?: Record<string, unknown>
  isRetryable: boolean
  originalError?: unknown
}

/**
 * Validation error structure
 */
export interface ValidationError {
  field: string
  message: string
}

/**
 * Handle API errors from Axios
 * @param err - Axios error object
 * @returns Standardized error
 */
export const handleApiError = (err: unknown): StandardError => {
  if (err instanceof AxiosError) {
    const status = err.response?.status
    const responseData = err.response?.data

    logError('API Error', err, {
      status,
      url: err.config?.url,
      method: err.config?.method,
      data: responseData,
    })

    // Handle specific status codes
    switch (status) {
      case 400:
        return {
          message: responseData?.detail || 'Invalid request. Please check your input.',
          code: 'BAD_REQUEST',
          details: responseData,
          isRetryable: false,
          originalError: err,
        }

      case 401:
        return {
          message: 'Your session has expired. Please login again.',
          code: 'UNAUTHORIZED',
          isRetryable: false,
          originalError: err,
        }

      case 403:
        return {
          message: 'You do not have permission to perform this action.',
          code: 'FORBIDDEN',
          isRetryable: false,
          originalError: err,
        }

      case 404:
        return {
          message: 'The requested resource was not found.',
          code: 'NOT_FOUND',
          isRetryable: false,
          originalError: err,
        }

      case 409:
        return {
          message: responseData?.detail || 'A conflict occurred. Please try again.',
          code: 'CONFLICT',
          isRetryable: false,
          originalError: err,
        }

      case 422:
        return {
          message: 'Validation failed. Please check your input.',
          code: 'VALIDATION_ERROR',
          details: responseData,
          isRetryable: false,
          originalError: err,
        }

      case 429:
        return {
          message: 'Too many requests. Please wait a moment and try again.',
          code: 'RATE_LIMIT',
          isRetryable: true,
          originalError: err,
        }

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          message: 'Server error occurred. Please try again later.',
          code: 'SERVER_ERROR',
          isRetryable: true,
          originalError: err,
        }

      default:
        return {
          message: responseData?.detail || 'An unexpected error occurred. Please try again.',
          code: 'UNKNOWN_ERROR',
          isRetryable: false,
          originalError: err,
        }
    }
  }

  // Not an Axios error
  return {
    message: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN_ERROR',
    isRetryable: false,
    originalError: err,
  }
}

/**
 * Handle network errors
 * @param err - Network error
 * @returns Standardized error
 */
export const handleNetworkError = (err: unknown): StandardError => {
  logError('Network Error', err)

  if (err instanceof AxiosError) {
    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      return {
        message: 'Request timeout. Please check your connection and try again.',
        code: 'TIMEOUT',
        isRetryable: true,
        originalError: err,
      }
    }

    if (err.code === 'ERR_NETWORK' || !err.response) {
      return {
        message: 'Unable to connect to the server. Please check your internet connection.',
        code: 'NETWORK_ERROR',
        isRetryable: true,
        originalError: err,
      }
    }
  }

  return {
    message: 'Network error occurred. Please check your connection.',
    code: 'NETWORK_ERROR',
    isRetryable: true,
    originalError: err,
  }
}

/**
 * Handle validation errors
 * @param errors - Validation errors from backend
 * @returns Array of validation errors
 */
export const handleValidationError = (errors: unknown): ValidationError[] => {
  logError('Validation Error', undefined, { errors })

  // FastAPI validation error format
  if (Array.isArray(errors)) {
    return errors.map((err) => ({
      field: err.loc ? err.loc.join('.') : 'unknown',
      message: err.msg || 'Validation failed',
    }))
  }

  // Object format { field: message }
  if (typeof errors === 'object' && errors !== null) {
    return Object.entries(errors).map(([field, message]) => ({
      field,
      message: String(message),
    }))
  }

  return [
    {
      field: 'general',
      message: 'Validation failed. Please check your input.',
    },
  ]
}

/**
 * Extract user-friendly error message
 * @param err - Any error object
 * @returns User-friendly error message
 */
export const getErrorMessage = (err: unknown): string => {
  // Already a StandardError
  if (err && typeof err === 'object' && 'message' in err && 'isRetryable' in err) {
    return (err as StandardError).message
  }

  // Axios error
  if (err instanceof AxiosError) {
    return handleApiError(err).message
  }

  // Error object
  if (err instanceof Error) {
    // Don't expose technical error messages in production
    if (import.meta.env.MODE === 'production') {
      return 'An unexpected error occurred. Please try again.'
    }
    return err.message
  }

  // String error
  if (typeof err === 'string') {
    return err
  }

  // Unknown error
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Determine if error should be retried
 * @param err - Error object
 * @returns True if error is retryable
 */
export const shouldRetry = (err: unknown): boolean => {
  // Check if it's a StandardError with isRetryable flag
  if (err && typeof err === 'object' && 'isRetryable' in err) {
    return (err as StandardError).isRetryable
  }

  // Axios error
  if (err instanceof AxiosError) {
    const status = err.response?.status

    // Retry on network errors
    if (!status) {
      return true
    }

    // Retry on 5xx errors and 429 (rate limit)
    if (status >= 500 || status === 429) {
      return true
    }

    // Don't retry on 4xx errors (except 429)
    return false
  }

  // Default: don't retry
  return false
}

/**
 * Check if error is network-related
 */
export const isNetworkError = (err: unknown): boolean => {
  if (err instanceof AxiosError) {
    return err.code === 'ERR_NETWORK' || !err.response
  }
  return false
}

/**
 * Check if error is authentication-related
 */
export const isAuthError = (err: unknown): boolean => {
  if (err instanceof AxiosError) {
    return err.response?.status === 401
  }
  return false
}

/**
 * Check if error is a validation error
 */
export const isValidationError = (err: unknown): boolean => {
  if (err instanceof AxiosError) {
    return err.response?.status === 422
  }
  return false
}
