import apiClient from '@/utils/axios'
import { log, error } from '@/utils/logger'
import type { AvailableExam } from '@/types/studentExam.types'

/**
 * Get available exams for the current student
 * Endpoint: GET /api/student/exams
 */
export async function getAvailableExams(): Promise<AvailableExam[]> {
  try {
    log('StudentExamsAPI', 'Fetching available exams for student')
    const res = await apiClient.get('/api/student/exams')
    return res.data as AvailableExam[]
  } catch (err) {
    error('StudentExamsAPI', 'getAvailableExams failed', err)
    throw err
  }
}

/**
 * Start or resume an exam for the student
 * Endpoint: POST /api/student/exams/{exam_id}/start
 * @param examId - The exam ID to start/resume
 * @returns Student exam session information
 */
export async function startExam(examId: string): Promise<{ student_exam_id: string; message: string }> {
  try {
    log('StudentExamsAPI', 'Starting exam', examId)
    const res = await apiClient.post(`/api/student/exams/${examId}/start`)
    return res.data as { student_exam_id: string; message: string }
  } catch (err) {
    error('StudentExamsAPI', 'startExam failed', err)
    throw err
  }
}

export default { getAvailableExams, startExam }
