import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { debug, error } from './logger'

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
  const token = localStorage.getItem('accessToken')
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
    return Promise.reject(err)
  },
)

export type ApiRequestConfig = AxiosRequestConfig
export default apiClient