import apiClient from '@/utils/axios'
import type { AxiosProgressEvent } from 'axios'
import type { Question, QuestionFormData, PaginatedQuestions, ImportError } from '@/types/question.types'
import { log, error } from '@/utils/logger'

/**
 * Parameters for list query - mirrors backend query params.
 */
export interface GetQuestionsFilters {
  page?: number
  limit?: number
  complexity?: string
  type?: string
  tags?: string[]
  search?: string
}

/**
 * Fetch paginated questions with optional filters.
 */
export async function getQuestions(filters: GetQuestionsFilters = {}): Promise<PaginatedQuestions> {
  try {
    log('QuestionsAPI', 'Fetching questions', filters)
    const params: Record<string, unknown> = { ...filters }
    // backend expects `qtype` for question type
    if (filters.type) params.qtype = filters.type
    if (filters.tags && filters.tags.length) params.tags = filters.tags

    const res = await apiClient.get('/api/admin/questions', { params })
    return res.data as PaginatedQuestions
  } catch (err) {
    error('QuestionsAPI', 'getQuestions failed', err)
    throw err
  }
}

/**
 * Get details for a single question.
 */
export async function getQuestionById(id: string): Promise<Question> {
  try {
    log('QuestionsAPI', 'Fetch question', id)
    const res = await apiClient.get(`/api/admin/questions/${id}`)
    return res.data as Question
  } catch (err) {
    error('QuestionsAPI', 'getQuestionById failed', err)
    throw err
  }
}

/**
 * Create new question.
 */
export async function createQuestion(payload: QuestionFormData): Promise<Question> {
  try {
    log('QuestionsAPI', 'Create question', payload.title)
    const res = await apiClient.post('/api/admin/questions', payload)
    return res.data as Question
  } catch (err) {
    error('QuestionsAPI', 'createQuestion failed', err)
    throw err
  }
}

/**
 * Update an existing question.
 */
export async function updateQuestion(id: string, payload: QuestionFormData): Promise<Question> {
  try {
    log('QuestionsAPI', 'Update question', id)
    const res = await apiClient.put(`/api/admin/questions/${id}`, payload)
    return res.data as Question
  } catch (err) {
    error('QuestionsAPI', 'updateQuestion failed', err)
    throw err
  }
}

/**
 * Delete a question.
 */
export async function deleteQuestion(id: string): Promise<{ message: string }> {
  try {
    log('QuestionsAPI', 'Delete question', id)
    const res = await apiClient.delete(`/api/admin/questions/${id}`)
    return res.data as { message: string }
  } catch (err) {
    error('QuestionsAPI', 'deleteQuestion failed', err)
    throw err
  }
}

/**
 * Import questions from an Excel file.
 * Returns an import summary.
 */
export interface ImportResult {
  success_count: number
  error_count: number
  errors: ImportError[]
}

export async function importQuestions(file: File, onUploadProgress?: (e: AxiosProgressEvent) => void): Promise<ImportResult> {
  try {
    log('QuestionsAPI', 'Import questions', file.name)
    const fd = new FormData()
    fd.append('file', file)

    const res = await apiClient.post('/api/admin/questions/import', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })
    return res.data as ImportResult
  } catch (err) {
    error('QuestionsAPI', 'importQuestions failed', err)
    throw err
  }
}

export default {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  importQuestions,
}
