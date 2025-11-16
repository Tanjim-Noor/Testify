import apiClient from '@/utils/axios'
import { log, error } from '@/utils/logger'
import type {
  StudentResult,
  AdminExamResults,
  ExamResultsSummary,
  ManualGradeRequest,
  ManualGradeResponse,
} from '@/types/result.types'

/**
 * Get student's result for a specific exam
 * Endpoint: GET /api/student/results/{student_exam_id}
 * @param studentExamId - The student exam session ID
 * @returns Complete result with question breakdown
 */
export async function getStudentResult(studentExamId: string): Promise<StudentResult> {
  try {
    log('ResultsAPI', 'Fetching student result', studentExamId)
    const res = await apiClient.get(`/api/student/results/${studentExamId}`)
    return res.data as StudentResult
  } catch (err) {
    error('ResultsAPI', 'getStudentResult failed', err)
    throw err
  }
}

/**
 * Get student's result by exam ID (finds their student_exam_id automatically)
 * Endpoint: GET /api/student/results/exam/{exam_id}
 * @param examId - The exam ID
 * @returns Complete result with question breakdown
 */
export async function getStudentResultByExamId(examId: string): Promise<StudentResult> {
  try {
    log('ResultsAPI', 'Fetching student result by exam ID', examId)
    const res = await apiClient.get(`/api/student/results/exam/${examId}`)
    return res.data as StudentResult
  } catch (err) {
    error('ResultsAPI', 'getStudentResultByExamId failed', err)
    throw err
  }
}

/**
 * Get all results for an exam (admin only)
 * Endpoint: GET /api/admin/results/exam/{exam_id}
 * @param examId - The exam ID
 * @returns Exam summary and all student results
 */
export async function getExamResults(examId: string): Promise<AdminExamResults> {
  try {
    log('ResultsAPI', 'Fetching exam results (admin)', examId)
    const res = await apiClient.get(`/api/admin/results/exam/${examId}`)
    return res.data as AdminExamResults
  } catch (err) {
    error('ResultsAPI', 'getExamResults failed', err)
    throw err
  }
}

/**
 * Get detailed student exam for review (admin only)
 * Endpoint: GET /api/admin/results/student-exam/{student_exam_id}
 * @param studentExamId - The student exam session ID
 * @returns Detailed student result for admin review
 */
export async function getStudentExamDetail(studentExamId: string): Promise<StudentResult> {
  try {
    log('ResultsAPI', 'Fetching student exam detail (admin)', studentExamId)
    const res = await apiClient.get(`/api/admin/results/student-exam/${studentExamId}`)
    return res.data as StudentResult
  } catch (err) {
    error('ResultsAPI', 'getStudentExamDetail failed', err)
    throw err
  }
}

/**
 * Get statistics for an exam (admin only)
 * Endpoint: GET /api/admin/results/exam/{exam_id}/statistics
 * @param examId - The exam ID
 * @returns Exam statistics summary
 */
export async function getExamStatistics(examId: string): Promise<ExamResultsSummary> {
  try {
    log('ResultsAPI', 'Fetching exam statistics (admin)', examId)
    const res = await apiClient.get(`/api/admin/results/exam/${examId}/statistics`)
    return res.data as ExamResultsSummary
  } catch (err) {
    error('ResultsAPI', 'getExamStatistics failed', err)
    throw err
  }
}

/**
 * Grade a text or image answer manually (admin only)
 * Endpoint: POST /api/admin/student-answers/{answer_id}/grade
 * @param answerId - The student answer ID
 * @param gradeData - Score and optional feedback
 * @returns Updated grade information
 */
export async function gradeAnswer(
  answerId: string,
  gradeData: ManualGradeRequest
): Promise<ManualGradeResponse> {
  try {
    log('ResultsAPI', 'Grading answer (admin)', { answerId, gradeData })
    const res = await apiClient.post(`/api/admin/student-answers/${answerId}/grade`, gradeData)
    return res.data as ManualGradeResponse
  } catch (err) {
    error('ResultsAPI', 'gradeAnswer failed', err)
    throw err
  }
}

export default {
  getStudentResult,
  getStudentResultByExamId,
  getExamResults,
  getStudentExamDetail,
  getExamStatistics,
  gradeAnswer,
}
