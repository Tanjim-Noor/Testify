import { create } from 'zustand'
import type { Question } from '@/types/question.types'

interface QuestionStoreState {
  questions: Question[]
  loading: boolean
  page: number
  limit: number
  total: number
  filters: {
    search?: string
    type?: string
    complexity?: string
    tags?: string[]
  }
  setQuestions: (q: Question[]) => void
  setLoading: (l: boolean) => void
  setFilters: (f: Partial<QuestionStoreState['filters']>) => void
  setPage: (p: number) => void
  setLimit: (l: number) => void
  setTotal: (t: number) => void
}

export const useQuestionStore = create<QuestionStoreState>((set) => ({
  questions: [],
  loading: false,
  page: 1,
  limit: 10,
  total: 0,
  filters: {},
  setQuestions: (q) => set({ questions: q }),
  setLoading: (l) => set({ loading: l }),
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  setPage: (p) => set({ page: p }),
  setLimit: (l) => set({ limit: l }),
  setTotal: (t) => set({ total: t }),
}))

export default useQuestionStore
