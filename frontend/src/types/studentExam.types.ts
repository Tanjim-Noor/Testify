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
  student_exam_id?: string // If exam has been started, this will be set
  submission_status?: 'not_started' | 'in_progress' | 'submitted'
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

/**
 * Question in exam session (without correct answers)
 * Used during exam taking
 */
export interface StudentExamQuestion {
  id: string
  title: string
  description?: string
  type: 'single_choice' | 'multi_choice' | 'text' | 'image_upload'
  complexity: string
  options?: string[]
  max_score: number
  order_index: number
}

/**
 * Student's answer for a question
 * Stored in exam session
 */
export interface StudentAnswer {
  question_id: string
  answer_value: AnswerValue
  answered_at?: string // ISO 8601
}

/**
 * Exam details for taking (student view)
 * Returned from GET /api/student/exams/{student_exam_id}
 */
export interface StudentExamDetail {
  id: string
  title: string
  description?: string
  duration_minutes: number
  start_time: string
  end_time: string
}

/**
 * Complete exam session data
 * Used during exam taking
 */
export interface ExamSession {
  student_exam: StudentExamSession
  exam_details: StudentExamDetail
  questions: StudentExamQuestion[]
  answers: Record<string, AnswerValue> // Backend returns object/dictionary, not array
}
