import { useEffect, useRef, useCallback } from 'react'
import { useExamStore } from '@/store/examStore'
import { log } from '@/utils/logger'
import type { AnswerValue } from '@/types/studentExam.types'

const DEBOUNCE_DELAY = 5000 // 5 seconds

/**
 * Custom hook for auto-saving exam answers
 * Debounces save operations
 */
export const useAutoSave = (studentExamId: string | null) => {
  const saveAnswerToServer = useExamStore((s) => s.saveAnswerToServer)
  const answers = useExamStore((s) => s.answers)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debouncedSave = useCallback(
    (questionId: string, value: AnswerValue) => {
      if (!studentExamId) return
      
      // Clear existing timer
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }

      // Set new timer for debounced save
      saveTimerRef.current = setTimeout(() => {
        log('useAutoSave', 'Debounced save triggered', questionId)
        void saveAnswerToServer(studentExamId, questionId, value)
      }, DEBOUNCE_DELAY)
    },
    [studentExamId, saveAnswerToServer]
  )

  // Watch for answer changes and trigger debounced save
  useEffect(() => {
    const changedQuestions = Object.keys(answers)
    
    changedQuestions.forEach((questionId) => {
      const value = answers[questionId]
      if (value && Object.keys(value).length > 0) {
        debouncedSave(questionId, value)
      }
    })

    // Cleanup timer on unmount
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [answers, debouncedSave])
}
