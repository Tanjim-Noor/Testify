import apiClient from '@/utils/axios'
import { log, error } from '@/utils/logger'
import type { Exam, ExamFormData, ExamDetail } from '@/types/exam.types'

/**
 * Get exams list
 * @param filters optional filter { is_published: boolean }
 */
export async function getExams(filters?: { is_published?: boolean }): Promise<Exam[]> {
  try {
    log('ExamsAPI', 'Fetching exams', filters)
    const res = await apiClient.get('/api/admin/exams', { params: filters })
    return res.data as Exam[]
  } catch (err) {
    error('ExamsAPI', 'getExams failed', err)
    throw err
  }
}

export async function getExamById(id: string): Promise<ExamDetail> {
  try {
    log('ExamsAPI', 'Fetch exam', id)
    const res = await apiClient.get(`/api/admin/exams/${id}`)
    return res.data as ExamDetail
  } catch (err) {
    error('ExamsAPI', 'getExamById failed', err)
    throw err
  }
}

export async function createExam(payload: ExamFormData): Promise<Exam> {
  try {
    log('ExamsAPI', 'Create exam', payload.title)
    const res = await apiClient.post('/api/admin/exams', payload)
    return res.data as Exam
  } catch (err) {
    error('ExamsAPI', 'createExam failed', err)
    throw err
  }
}

export async function updateExam(id: string, payload: Partial<ExamFormData>): Promise<Exam> {
  try {
    log('ExamsAPI', 'Update exam', id)
    const res = await apiClient.put(`/api/admin/exams/${id}`, payload)
    return res.data as Exam
  } catch (err) {
    error('ExamsAPI', 'updateExam failed', err)
    throw err
  }
}

export async function deleteExam(id: string): Promise<{ message: string }>{
  try {
    log('ExamsAPI', 'Delete exam', id)
    const res = await apiClient.delete(`/api/admin/exams/${id}`)
    return res.data as { message: string }
  } catch (err) {
    error('ExamsAPI', 'deleteExam failed', err)
    throw err
  }
}

export async function publishExam(id: string, isPublished: boolean): Promise<Exam> {
  try {
    log('ExamsAPI', 'Publish toggle', { id, isPublished })
    const res = await apiClient.put(`/api/admin/exams/${id}/publish`, { is_published: isPublished })
    return res.data as Exam
  } catch (err) {
    error('ExamsAPI', 'publishExam failed', err)
    throw err
  }
}

export async function assignQuestions(examId: string, assignments: Array<{ question_id: string; order_index: number }>): Promise<ExamDetail> {
  try {
    log('ExamsAPI', 'Assign questions', examId)
    const res = await apiClient.post(`/api/admin/exams/${examId}/questions`, assignments)
    return res.data as ExamDetail
  } catch (err) {
    error('ExamsAPI', 'assignQuestions failed', err)
    throw err
  }
}

export async function reorderQuestions(examId: string, questionIds: string[]): Promise<{ message: string }>{
  try {
    log('ExamsAPI', 'Reorder questions', examId)
    const res = await apiClient.put(`/api/admin/exams/${examId}/questions/reorder`, questionIds)
    return res.data as { message: string }
  } catch (err) {
    error('ExamsAPI', 'reorderQuestions failed', err)
    throw err
  }
}

export default { getExams, getExamById, createExam, updateExam, deleteExam, publishExam, assignQuestions, reorderQuestions }
