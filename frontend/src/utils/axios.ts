/**
 * Axios Configuration
 * 
 * Configures Axios with interceptors for request/response handling,
 * authentication, and comprehensive error handling
 */

import axios, { type AxiosRequestConfig, type AxiosResponse, AxiosError } from 'axios'
import { debug, info, error as logError, logApiCall } from './logger'
import { clearAuth, getToken } from './storage'
import { 
  handleApiError, 
  handleNetworkError, 
  getErrorMessage, 
  isNetworkError,
  isValidationError,
} from './errorHandler'
import { notify } from '@/components/common/NotificationProvider'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const DEFAULT_TIMEOUT = 30_000 // 30 seconds

/**
 * Shared Axios instance that automatically attaches the current JWT token
 * and centralizes error reporting.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
})

/**
 * Request Interceptor
 * - Adds authentication token
 * - Logs all requests
 */
apiClient.interceptors.request.use(
  (config) => {
    const startTime = Date.now()
    config.metadata = { startTime }

    // Add auth token
    const token = getToken()
    config.headers = config.headers ?? {}
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Log request in development
    if (import.meta.env.DEV) {
      debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        method: config.method,
        url: config.url,
        data: config.data,
        params: config.params,
      })
    }

    return config
  },
  (error) => {
    logError('Request interceptor error', error)
    return Promise.reject(error)
  }
)

/**
 * Response Interceptor
 * - Logs all responses
 * - Handles errors globally
 * - Shows toast notifications
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Calculate response time
    const responseTime = Date.now() - (response.config.metadata?.startTime || Date.now())

    // Log response in development
    if (import.meta.env.DEV) {
      logApiCall(
        response.config.method?.toUpperCase() || 'UNKNOWN',
        response.config.url || '',
        {
          status: response.status,
          data: response.data,
        }
      )
      info(`API Response: ${response.status} in ${responseTime}ms`)
    }

    return response
  },
  async (err: AxiosError) => {
    // Log error
    logError('API Response Error', err, {
      status: err.response?.status,
      url: err.config?.url,
      method: err.config?.method,
      data: err.response?.data,
    })

    const status = err?.response?.status

    // Handle network errors
    if (isNetworkError(err)) {
      const networkError = handleNetworkError(err)
      notify.error(networkError.message)
      return Promise.reject(err)
    }

    // Handle specific status codes globally
    switch (status) {
      case 401: {
        // Unauthorized - clear auth and redirect to login
        info('401 Unauthorized — clearing auth and redirecting')
        notify.error('Your session has expired. Please login again.')
        
        try {
          clearAuth()
          // Delay to allow toast to show
          setTimeout(() => {
            window.location.href = '/login'
          }, 1000)
        } catch (e) {
          logError('Failed to clear auth on 401', e as Error)
        }
        break
      }

      case 403: {
        // Forbidden - access denied
        info('403 Forbidden — access denied')
        notify.error('You do not have permission to perform this action.')
        break
      }

      case 404: {
        // Not Found
        const errorData = err.response?.data as { detail?: string }
        notify.warning(errorData?.detail || 'The requested resource was not found.')
        break
      }

      case 422: {
        // Validation Error
        const errorData = err.response?.data as { detail?: string }
        notify.error(errorData?.detail || 'Validation failed. Please check your input.')
        break
      }

      case 429: {
        // Rate Limit
        notify.warning('Too many requests. Please wait a moment and try again.')
        break
      }

      case 409: {
        // Conflict
        const errorData = err.response?.data as { detail?: string }
        notify.error(errorData?.detail || 'A conflict occurred. Please try again.')
        break
      }

      case 500:
      case 502:
      case 503:
      case 504: {
        // Server Errors
        notify.error('Server error occurred. Please try again later.')
        break
      }

      default: {
        // Unknown error
        if (!isValidationError(err)) {
          const errorMessage = getErrorMessage(err)
          notify.error(errorMessage)
        }
        break
      }
    }

    // Process error through error handler (for additional logging/tracking)
    handleApiError(err)
    
    return Promise.reject(err)
  }
)

// Extend Axios config to include metadata
declare module 'axios' {
  export interface AxiosRequestConfig {
    metadata?: {
      startTime: number
    }
  }
}

export type ApiRequestConfig = AxiosRequestConfig
export default apiClient
