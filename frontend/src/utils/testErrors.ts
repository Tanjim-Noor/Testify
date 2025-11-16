/**
 * Test Errors Utility
 * 
 * Development-only utilities to simulate various error scenarios for testing
 */

import axios from 'axios'
import { info, warn } from './logger'

/**
 * Simulate network error
 */
export const simulateNetworkError = async (): Promise<never> => {
  warn('Simulating network error')
  throw new axios.AxiosError(
    'Network Error',
    'ERR_NETWORK',
    undefined,
    undefined,
    undefined
  )
}

/**
 * Simulate API error
 */
export const simulateApiError = async (status: number, message?: string): Promise<never> => {
  warn(`Simulating API error: ${status}`)
  
  const error = new axios.AxiosError(
    message || `HTTP Error ${status}`,
    'ERR_BAD_REQUEST'
  )
  
  error.response = {
    status,
    statusText: getStatusText(status),
    data: { detail: message || getDefaultMessage(status) },
    headers: {},
    config: {} as never,
  }
  
  throw error
}

/**
 * Simulate 401 Unauthorized
 */
export const simulate401 = async (): Promise<never> => {
  return simulateApiError(401, 'Unauthorized access')
}

/**
 * Simulate 403 Forbidden
 */
export const simulate403 = async (): Promise<never> => {
  return simulateApiError(403, 'Access denied')
}

/**
 * Simulate 404 Not Found
 */
export const simulate404 = async (): Promise<never> => {
  return simulateApiError(404, 'Resource not found')
}

/**
 * Simulate 422 Validation Error
 */
export const simulate422 = async (): Promise<never> => {
  warn('Simulating validation error')
  
  const error = new axios.AxiosError('Validation Error', 'ERR_BAD_REQUEST')
  
  error.response = {
    status: 422,
    statusText: 'Unprocessable Entity',
    data: {
      detail: [
        {
          loc: ['body', 'email'],
          msg: 'Invalid email format',
          type: 'value_error.email',
        },
        {
          loc: ['body', 'password'],
          msg: 'Password must be at least 8 characters',
          type: 'value_error.minlength',
        },
      ],
    },
    headers: {},
    config: {} as never,
  }
  
  throw error
}

/**
 * Simulate 429 Rate Limit
 */
export const simulate429 = async (): Promise<never> => {
  warn('Simulating rate limit error')
  
  const error = new axios.AxiosError('Rate Limit Exceeded', 'ERR_BAD_REQUEST')
  
  error.response = {
    status: 429,
    statusText: 'Too Many Requests',
    data: { detail: 'Rate limit exceeded. Please try again later.' },
    headers: {
      'retry-after': '60',
    },
    config: {} as never,
  }
  
  throw error
}

/**
 * Simulate 500 Server Error
 */
export const simulate500 = async (): Promise<never> => {
  return simulateApiError(500, 'Internal server error')
}

/**
 * Simulate slow response
 */
export const simulateSlowResponse = async <T>(
  data: T,
  delayMs: number = 3000
): Promise<T> => {
  info(`Simulating slow response (${delayMs}ms)`)
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delayMs)
  })
}

/**
 * Simulate timeout
 */
export const simulateTimeout = async (): Promise<never> => {
  warn('Simulating timeout error')
  
  const error = new axios.AxiosError('Timeout', 'ECONNABORTED')
  error.code = 'ECONNABORTED'
  
  throw error
}

/**
 * Get status text for status code
 */
const getStatusText = (status: number): string => {
  const statusTexts: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  }
  
  return statusTexts[status] || 'Unknown'
}

/**
 * Get default error message for status code
 */
const getDefaultMessage = (status: number): string => {
  const messages: Record<number, string> = {
    400: 'Bad request',
    401: 'Unauthorized access',
    403: 'Access denied',
    404: 'Resource not found',
    409: 'Resource already exists',
    422: 'Validation failed',
    429: 'Too many requests',
    500: 'Internal server error',
    502: 'Bad gateway',
    503: 'Service unavailable',
    504: 'Gateway timeout',
  }
  
  return messages[status] || 'An error occurred'
}

/**
 * Test all error scenarios
 */
export const testAllErrors = async (): Promise<void> => {
  if (import.meta.env.MODE !== 'development') {
    console.warn('testAllErrors is only available in development mode')
    return
  }

  console.group('🧪 Testing Error Scenarios')
  
  const scenarios = [
    { name: '401 Unauthorized', fn: simulate401 },
    { name: '403 Forbidden', fn: simulate403 },
    { name: '404 Not Found', fn: simulate404 },
    { name: '422 Validation', fn: simulate422 },
    { name: '429 Rate Limit', fn: simulate429 },
    { name: '500 Server Error', fn: simulate500 },
    { name: 'Network Error', fn: simulateNetworkError },
    { name: 'Timeout', fn: simulateTimeout },
  ]
  
  for (const scenario of scenarios) {
    console.group(`Testing: ${scenario.name}`)
    try {
      await scenario.fn()
    } catch (error) {
      console.log('Error caught:', error)
    }
    console.groupEnd()
    // Wait a bit between tests
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  
  console.groupEnd()
}

// Expose test utilities globally in development
if (import.meta.env.MODE === 'development') {
  ;(window as unknown as { testErrors: Record<string, unknown> }).testErrors = {
    networkError: simulateNetworkError,
    unauthorized: simulate401,
    forbidden: simulate403,
    notFound: simulate404,
    validation: simulate422,
    rateLimit: simulate429,
    serverError: simulate500,
    slowResponse: simulateSlowResponse,
    timeout: simulateTimeout,
    testAll: testAllErrors,
  }
  
  info('Test error utilities available via window.testErrors')
}
