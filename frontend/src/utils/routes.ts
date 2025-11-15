/**
 * Centralized route constants for the app.
 *
 * This file creates a single source of truth for all route paths in the
 * application. Use these constants instead of hardcoding paths across your
 * components so refactors are easy and centralized.
 */
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  HOME: '/',
  ADMIN: {
    /**
     * Admin dashboard root route
     * @example /admin/dashboard
     */
    DASHBOARD: '/admin/dashboard',
    /**
     * Admin question bank list
     * @example /admin/questions
     */
    QUESTIONS: '/admin/questions',
    /**
     * Admin exam management
     * @example /admin/exams
     */
    EXAMS: '/admin/exams',
    /**
     * Admin results and grading
     * @example /admin/results
     */
    RESULTS: '/admin/results',
  },
  STUDENT: {
    /**
     * Student dashboard root
     * @example /student/dashboard
     */
    DASHBOARD: '/student/dashboard',
    /**
     * Student available exams
     * @example /student/exams
     */
    EXAMS: '/student/exams',
    /**
     * Student results
     * @example /student/results
     */
    RESULTS: '/student/results',
  },
}

export default ROUTES
