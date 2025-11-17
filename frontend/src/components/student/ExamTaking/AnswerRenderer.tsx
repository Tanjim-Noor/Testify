import React from 'react'
import type { StudentExamQuestion, AnswerValue } from '@/types/studentExam.types'
import SingleChoiceAnswer from './AnswerComponents/SingleChoiceAnswer'
import MultiChoiceAnswer from './AnswerComponents/MultiChoiceAnswer'
import TextAnswer from './AnswerComponents/TextAnswer'
import ImageUploadAnswer from './AnswerComponents/ImageUploadAnswer'

interface AnswerRendererProps {
  question: StudentExamQuestion
  currentAnswer: AnswerValue
  onAnswerChange: (value: AnswerValue) => void
  studentExamId?: string
}

/**
 * Answer renderer component
 * Renders the appropriate answer component based on question type
 */
const AnswerRenderer: React.FC<AnswerRendererProps> = ({ 
  question, 
  currentAnswer, 
  onAnswerChange,
  studentExamId 
}) => {
  switch (question.type) {
    case 'single_choice':
      return (
        <SingleChoiceAnswer
          options={question.options || []}
          value={currentAnswer}
          onChange={onAnswerChange}
        />
      )

    case 'multi_choice':
      return (
        <MultiChoiceAnswer
          options={question.options || []}
          value={currentAnswer}
          onChange={onAnswerChange}
        />
      )

    case 'text':
      return <TextAnswer value={currentAnswer} onChange={onAnswerChange} />

    case 'image_upload':
      return (
        <ImageUploadAnswer
          value={currentAnswer}
          onChange={onAnswerChange}
          studentExamId={studentExamId}
          questionId={question.id}
        />
      )

    default:
      return null
  }
}

export default AnswerRenderer
