/**
 * QuestionType - literal types supported by the backend.
 */
export type QuestionType = 'single_choice' | 'multi_choice' | 'text' | 'image_upload'

/**
 * Question – full server-side representation of a question.
 */
export interface Question {
  id: string
  title: string
  description?: string
  complexity: string
  type: QuestionType
  options?: string[]
  correct_answers: string[]
  max_score: number
  tags?: string[]
  created_at: string
}

/**
 * QuestionFormData – payload used for create/update operations.
 * This mirrors the backend model but omits server-managed fields.
 */
export interface QuestionFormData {
  title: string
  description?: string
  complexity: string
  type: QuestionType
  options?: string[]
  correct_answers: string[]
  max_score: number
  tags?: string[]
}

/**
 * Paginated result used by the Question list endpoint.
 */
export interface PaginatedQuestions {
  data: Question[]
  total: number
  page: number
  limit: number
}

/**
 * Import error returned from the backend import endpoint.
 */
export interface ImportError {
  row_number: number
  errors: string[]
}

export * from './question.types'