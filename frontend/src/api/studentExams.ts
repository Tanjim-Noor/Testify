import apiClient from '@/utils/axios'
import { log, error } from '@/utils/logger'
import type { AvailableExam, ExamSession, AnswerValue } from '@/types/studentExam.types'

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
 * @returns Student exam session information with student_exam_id
 */
export async function startExam(examId: string): Promise<{ student_exam_id: string; message?: string }> {
  try {
    log('StudentExamsAPI', 'Starting exam', examId)
    const res = await apiClient.post(`/api/student/exams/${examId}/start`)
    // Backend returns 'id' but we need 'student_exam_id' for consistency
    const data = res.data as { id: string; [key: string]: any }
    return { student_exam_id: data.id, message: 'Exam started successfully' }
  } catch (err) {
    error('StudentExamsAPI', 'startExam failed', err)
    throw err
  }
}

/**
 * Get exam session with questions and current answers
 * Endpoint: GET /api/student/exams/{student_exam_id}
 * @param studentExamId - The student exam session ID
 * @returns Complete exam session data
 */
export async function getExamSession(studentExamId: string): Promise<ExamSession> {
  try {
    log('StudentExamsAPI', 'Fetching exam session', studentExamId)
    const res = await apiClient.get(`/api/student/exams/${studentExamId}`)
    return res.data as ExamSession
  } catch (err) {
    error('StudentExamsAPI', 'getExamSession failed', err)
    throw err
  }
}

/**
 * Save answer for a specific question (auto-save)
 * Endpoint: PUT /api/student/exams/{student_exam_id}/answer
 * @param studentExamId - The student exam session ID
 * @param questionId - The question ID
 * @param answerValue - The answer value
 * @returns Success message
 */
export async function saveAnswer(
  studentExamId: string,
  questionId: string,
  answerValue: AnswerValue
): Promise<{ message: string }> {
  try {
    log('StudentExamsAPI', 'Saving answer', { studentExamId, questionId })
    const res = await apiClient.put(`/api/student/exams/${studentExamId}/answer`, {
      question_id: questionId,
      answer_value: answerValue,
    })
    return res.data as { message: string }
  } catch (err) {
    error('StudentExamsAPI', 'saveAnswer failed', err)
    throw err
  }
}

/**
 * Submit exam
 * Endpoint: POST /api/student/exams/{student_exam_id}/submit
 * @param studentExamId - The student exam session ID
 * @returns Success message
 */
export async function submitExam(studentExamId: string): Promise<{ message: string }> {
  try {
    log('StudentExamsAPI', 'Submitting exam', studentExamId)
    const res = await apiClient.post(`/api/student/exams/${studentExamId}/submit`)
    return res.data as { message: string }
  } catch (err) {
    error('StudentExamsAPI', 'submitExam failed', err)
    throw err
  }
}

export default { getAvailableExams, startExam, getExamSession, saveAnswer, submitExam }
