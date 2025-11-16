import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { saveAnswer as saveAnswerAPI, submitExam as submitExamAPI } from '@/api/studentExams'
import { log, error as logError } from '@/utils/logger'
import type { ExamSession, AnswerValue } from '@/types/studentExam.types'

interface ExamStore {
  // Session data
  sessionData: ExamSession | null
  currentQuestionIndex: number
  answers: Record<string, AnswerValue> // Map of question_id to answer value
  timeRemaining: number | null // seconds
  
  // UI state
  isAutoSaving: boolean
  isSubmitting: boolean
  lastSavedAt: Date | null
  saveError: string | null
  
  // Actions
  setSession: (session: ExamSession) => void
  setCurrentQuestionIndex: (index: number) => void
  setAnswer: (questionId: string, value: AnswerValue) => void
  saveAnswerToServer: (studentExamId: string, questionId: string, value: AnswerValue) => Promise<void>
  submitExam: (studentExamId: string) => Promise<void>
  updateTimeRemaining: (seconds: number) => void
  clearSession: () => void
  loadFromLocalStorage: (studentExamId: string) => void
  saveToLocalStorage: (studentExamId: string) => void
}

export const useExamStore = create<ExamStore>()(
  persist(
    (set, get) => ({
      // Initial state
      sessionData: null,
      currentQuestionIndex: 0,
      answers: {},
      timeRemaining: null,
      isAutoSaving: false,
      isSubmitting: false,
      lastSavedAt: null,
      saveError: null,

      // Set session data
      setSession: (session: ExamSession) => {
        log('ExamStore', 'Setting session data', session.student_exam.id)
        
        // Backend returns answers as an object/dictionary already
        // Just use it directly or initialize as empty object if null/undefined
        const answersMap: Record<string, AnswerValue> = session.answers || {}
        
        set({
          sessionData: session,
          answers: answersMap,
          timeRemaining: session.student_exam.time_remaining_seconds,
        })
      },

      // Set current question index
      setCurrentQuestionIndex: (index: number) => {
        set({ currentQuestionIndex: index })
      },

      // Set answer locally (optimistic update)
      setAnswer: (questionId: string, value: AnswerValue) => {
        const { answers } = get()
        log('ExamStore', 'Setting answer', { questionId, value })
        
        set({
          answers: {
            ...answers,
            [questionId]: value,
          },
        })
      },

      // Save answer to server
      saveAnswerToServer: async (studentExamId: string, questionId: string, value: AnswerValue) => {
        try {
          set({ isAutoSaving: true, saveError: null })
          log('ExamStore', 'Saving answer to server', { studentExamId, questionId })
          
          await saveAnswerAPI(studentExamId, questionId, value)
          
          set({
            isAutoSaving: false,
            lastSavedAt: new Date(),
          })
          
          // Save to localStorage as backup
          get().saveToLocalStorage(studentExamId)
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to save answer'
          logError('ExamStore', 'Failed to save answer', err)
          set({
            isAutoSaving: false,
            saveError: message,
          })
          throw err
        }
      },

      // Submit exam
      submitExam: async (studentExamId: string) => {
        try {
          set({ isSubmitting: true })
          log('ExamStore', 'Submitting exam', studentExamId)
          
          await submitExamAPI(studentExamId)
          
          // Clear localStorage after successful submit
          localStorage.removeItem(`exam_${studentExamId}_answers`)
          localStorage.removeItem(`exam_${studentExamId}_timestamp`)
          
          set({ isSubmitting: false })
        } catch (err) {
          logError('ExamStore', 'Failed to submit exam', err)
          set({ isSubmitting: false })
          throw err
        }
      },

      // Update time remaining
      updateTimeRemaining: (seconds: number) => {
        set({ timeRemaining: seconds })
      },

      // Clear session (logout or after submit)
      clearSession: () => {
        log('ExamStore', 'Clearing session')
        set({
          sessionData: null,
          currentQuestionIndex: 0,
          answers: {},
          timeRemaining: null,
          isAutoSaving: false,
          isSubmitting: false,
          lastSavedAt: null,
          saveError: null,
        })
      },

      // Load from localStorage
      loadFromLocalStorage: (studentExamId: string) => {
        try {
          const answersJson = localStorage.getItem(`exam_${studentExamId}_answers`)
          const timestamp = localStorage.getItem(`exam_${studentExamId}_timestamp`)
          
          if (answersJson && timestamp) {
            const answers = JSON.parse(answersJson) as Record<string, AnswerValue>
            const savedAt = new Date(timestamp)
            
            log('ExamStore', 'Loaded from localStorage', { count: Object.keys(answers).length, savedAt })
            
            set({
              answers,
              lastSavedAt: savedAt,
            })
          }
        } catch (err) {
          logError('ExamStore', 'Failed to load from localStorage', err)
        }
      },

      // Save to localStorage
      saveToLocalStorage: (studentExamId: string) => {
        try {
          const { answers } = get()
          localStorage.setItem(`exam_${studentExamId}_answers`, JSON.stringify(answers))
          localStorage.setItem(`exam_${studentExamId}_timestamp`, new Date().toISOString())
          log('ExamStore', 'Saved to localStorage')
        } catch (err) {
          logError('ExamStore', 'Failed to save to localStorage', err)
        }
      },
    }),
    {
      name: 'exam-storage',
      partialize: (state) => ({
        // Only persist answers and current question index
        answers: state.answers,
        currentQuestionIndex: state.currentQuestionIndex,
      }),
    }
  )
)
