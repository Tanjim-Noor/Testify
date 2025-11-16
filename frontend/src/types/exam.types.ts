/**
 * Exam basic model returned from the backend
 */
export interface Exam {
  id: string
  title: string
  description?: string
  start_time: string // ISO 8601
  end_time: string // ISO 8601
  duration_minutes: number
  is_published: boolean
  created_by: string
  created_at: string
  question_count: number
}

/**
 * Data used when creating or updating an exam
 */
export interface ExamFormData {
  title: string
  description?: string
  start_time: string // ISO 8601
  end_time: string // ISO 8601
  duration_minutes: number
}

/**
 * Exam detail including questions array returned by GET /api/admin/exams/{id}
 */
export interface ExamDetail extends Exam {
  questions: any[]
}
