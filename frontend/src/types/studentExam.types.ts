/**
 * Student Exam Types
 * Types for student-facing exam features including available exams, exam sessions, and answers
 */

/**
 * Exam status from student perspective
 */
export type ExamStatus = 'available' | 'upcoming' | 'ended'

/**
 * Available exam information for students
 * Returned from GET /api/student/exams
 */
export interface AvailableExam {
  exam_id: string
  title: string
  description?: string
  start_time: string // ISO 8601
  end_time: string // ISO 8601
  duration_minutes: number
  status: ExamStatus
}

/**
 * Student exam session information
 * Tracks student's progress in an exam
 */
export interface StudentExamSession {
  id: string
  exam_id: string
  student_id: string
  started_at: string | null // ISO 8601, null if not started
  submitted_at: string | null // ISO 8601, null if not submitted
  status: 'not_started' | 'in_progress' | 'submitted'
  time_remaining_seconds: number | null
}

/**
 * Answer value for different question types
 * Used when saving answers during exam taking
 */
export interface AnswerValue {
  answer?: string // For single choice
  answers?: string[] // For multiple choice
  text?: string // For text questions
  file_url?: string // For image upload questions
}

/**
 * Extended available exam with session info
 * Used in exam list to show resume capability
 */
export interface AvailableExamWithSession extends AvailableExam {
  session?: StudentExamSession
}
