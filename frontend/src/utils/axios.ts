import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { debug, error, log } from './logger'
import { clearAuth, getToken } from './storage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const DEFAULT_TIMEOUT = 10_000

/**
 * Shared Axios instance that automatically attaches the current JWT token
 * and centralizes error reporting.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  config.headers = config.headers ?? {}
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (import.meta.env.DEV) {
    debug('Axios', 'Request', config)
  }
  return config
})

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (import.meta.env.DEV) {
      debug('Axios', 'Response', response)
    }
    return response
  },
  (err) => {
    error('Axios', 'Response error', err)
    const status = err?.response?.status
    // Global auth handling
    if (status === 401) {
      log('Axios', '401 Unauthorized — clearing auth and redirecting')
      try {
        clearAuth()
        window.location.href = '/login'
      } catch (e) {
        error('Axios', 'Failed to clear auth on 401', e)
      }
    }
    if (status === 403) {
      log('Axios', '403 Forbidden — access denied')
    }
    return Promise.reject(err)
  },
)

export type ApiRequestConfig = AxiosRequestConfig
export default apiClient