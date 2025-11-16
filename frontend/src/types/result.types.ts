/**
 * Result Types
 * Types for student and admin results functionality
 */

/**
 * Result of a single question for a student
 * Contains the student's answer, correct answer, and scoring information
 */
export interface QuestionResult {
  question_id: string
  title: string
  description?: string
  type: 'single_choice' | 'multi_choice' | 'text' | 'image_upload'
  options?: string[]
  student_answer: {
    answer?: string
    answers?: string[]
    text?: string
    file_url?: string
  } | null
  correct_answer?: string[] | null // Array of correct answers (e.g., ["A"] for single, ["A", "C"] for multi)
  is_correct?: boolean | null // null for text/image questions requiring manual grading
  score: number | null
  max_score: number
  requires_manual_review: boolean
  feedback?: string
}

/**
 * Complete result for a student's exam submission
 * Includes overall scores and question-by-question breakdown
 */
export interface StudentResult {
  student_exam_id: string
  exam_id: string
  exam_title: string
  exam_description?: string
  total_score: number
  max_possible_score: number
  percentage: number
  submitted_at: string // ISO 8601
  status: 'submitted' | 'graded' | 'partially_graded'
  question_results: QuestionResult[]
}

/**
 * Summary statistics for an exam (admin view)
 * Used in results dashboard
 */
export interface ExamResultsSummary {
  exam_id: string
  exam_title: string
  total_students: number
  submitted_count: number
  average_score: number
  highest_score: number
  lowest_score: number
  pass_rate?: number // percentage, if passing threshold is defined
}

/**
 * Summary of a single student's result (admin view)
 * Used in student results table
 */
export interface StudentResultSummary {
  student_exam_id: string
  student_id: string
  student_name: string
  student_email: string
  total_score: number
  max_possible_score: number
  percentage: number
  submitted_at: string | null
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded'
}

/**
 * Complete admin view of exam results
 * Includes summary statistics and all student results
 */
export interface AdminExamResults {
  exam_summary: ExamResultsSummary
  student_results: StudentResultSummary[]
}

/**
 * Request body for manual grading
 * Used by admin to grade text/image questions
 */
export interface ManualGradeRequest {
  score: number
  feedback?: string
}

/**
 * Response after manual grading
 */
export interface ManualGradeResponse {
  message: string
  answer_id: string
  score: number
  updated_total_score?: number
}
