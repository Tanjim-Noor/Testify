/**
 * Generic wrapper for API responses that always contain a success state.
 */
export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

/**
 * Describes how pagination metadata is communicated from the backend.
 */
export interface PaginationMeta {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
}

/**
 * API error shape returned by FastAPI endpoints.
 */
export interface ApiError {
  message: string
  code?: string
  details?: Record<string, string[]>
}

/**
 * Combines paginated data with the common API envelope.
 */
export interface PaginatedResponse<T> extends ApiResponse<T> {
  meta: PaginationMeta
}