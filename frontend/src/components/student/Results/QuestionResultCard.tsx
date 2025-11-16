import React from 'react'
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  useTheme,
  Divider,
  Stack,
} from '@mui/material'
import {
  ExpandMore,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  RadioButtonChecked,
  CheckBox,
  TextFields,
  Image,
} from '@mui/icons-material'
import type { QuestionResult } from '@/types/result.types'

interface QuestionResultCardProps {
  question: QuestionResult
  questionNumber: number
}

/**
 * Question Result Card
 * Expandable accordion showing question, student answer, correct answer, and score
 */
const QuestionResultCard: React.FC<QuestionResultCardProps> = ({
  question,
  questionNumber,
}) => {
  const theme = useTheme()

  // Determine status and color
  const isPending = question.requires_manual_review
  const isCorrect = question.is_correct === true
  const isIncorrect = question.is_correct === false

  const statusColor = isPending
    ? theme.palette.warning.main
    : isCorrect
      ? theme.palette.success.main
      : theme.palette.error.main

  const statusIcon = isPending ? (
    <HourglassEmpty sx={{ color: statusColor }} />
  ) : isCorrect ? (
    <CheckCircle sx={{ color: statusColor }} />
  ) : (
    <Cancel sx={{ color: statusColor }} />
  )

  const statusLabel = isPending
    ? 'Pending Review'
    : isCorrect
      ? 'Correct'
      : 'Incorrect'

  // Question type icon
  const typeIcons: Record<string, React.ReactElement> = {
    single_choice: <RadioButtonChecked fontSize="small" />,
    multi_choice: <CheckBox fontSize="small" />,
    text: <TextFields fontSize="small" />,
    image_upload: <Image fontSize="small" />,
  }

  // Format answer display
  const formatAnswer = (answer: QuestionResult['student_answer']) => {
    if (!answer) return 'No answer provided'

    if (answer.answer !== undefined && answer.answer !== null && answer.answer !== '') {
      return answer.answer
    }
    if (answer.answers && answer.answers.length > 0) {
      return answer.answers.join(', ')
    }
    if (answer.text !== undefined && answer.text !== null && answer.text !== '') {
      return answer.text
    }
    if (answer.file_url) {
      return <a href={answer.file_url} target="_blank" rel="noopener noreferrer">View Image</a>
    }

    return 'No answer provided'
  }

  const formatCorrectAnswer = (correctAnswer: QuestionResult['correct_answer']) => {
    if (!correctAnswer || correctAnswer.length === 0) return null

    // Find the full option text for each correct answer letter
    if (question.options && question.options.length > 0) {
      const fullAnswers = correctAnswer.map((letter) => {
        // Find option that starts with this letter (e.g., "B:" or "B ")
        const matchingOption = question.options!.find((opt) => {
          const optLetter = opt.trim().split(/[:\s]/)[0]
          return optLetter.toUpperCase() === letter.toUpperCase()
        })
        return matchingOption || letter
      })
      return fullAnswers.join(', ')
    }

    return correctAnswer.join(', ')
  }

  return (
    <Accordion
      sx={{
        mb: 2,
        border: `2px solid ${statusColor}40`,
        '&:before': { display: 'none' },
        background: `linear-gradient(135deg, ${statusColor}08 0%, ${statusColor}02 100%)`,
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          '& .MuiAccordionSummary-content': {
            alignItems: 'center',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            width: '100%',
            flexWrap: 'wrap',
          }}
        >
          {/* Question Number */}
          <Typography
            variant="h6"
            sx={{
              minWidth: 40,
              fontWeight: 'bold',
              color: 'text.secondary',
            }}
          >
            Q{questionNumber}
          </Typography>

          {/* Question Title */}
          <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
            {question.title}
          </Typography>

          {/* Type Icon */}
          <Chip
            icon={typeIcons[question.type]}
            label={question.type.replace('_', ' ')}
            size="small"
            variant="outlined"
          />

          {/* Score */}
          <Chip
            label={`${question.score}/${question.max_score} pts`}
            size="small"
            sx={{
              fontWeight: 'bold',
              bgcolor: `${statusColor}20`,
              color: statusColor,
            }}
          />

          {/* Status Icon */}
          {statusIcon}
        </Box>
      </AccordionSummary>

      <AccordionDetails>
        <Stack spacing={2}>
          {/* Question Description */}
          {question.description && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                {question.description}
              </Typography>
            </Box>
          )}

          <Divider />

          {/* Student's Answer */}
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Your Answer:
            </Typography>
            <Box
              sx={{
                p: 2,
                bgcolor: isIncorrect ? 'error.lighter' : 'background.default',
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="body2">
                {formatAnswer(question.student_answer)}
              </Typography>
            </Box>
          </Box>

          {/* Correct Answer (if available and incorrect) */}
          {!isPending && question.correct_answer && isIncorrect && (
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Correct Answer:
              </Typography>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'success.lighter',
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.success.light}`,
                }}
              >
                <Typography variant="body2" color="success.dark">
                  {formatCorrectAnswer(question.correct_answer)}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Options (for choice questions) */}
          {question.options && question.options.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Options:
              </Typography>
              <Stack spacing={1}>
                {question.options.map((option, idx) => {
                  const isStudentAnswer =
                    question.student_answer?.answer === option ||
                    question.student_answer?.answers?.includes(option)
                  const isCorrectOption =
                    question.correct_answer?.includes(option) || false

                  return (
                    <Chip
                      key={idx}
                      label={option}
                      variant={isStudentAnswer || isCorrectOption ? 'filled' : 'outlined'}
                      color={
                        isCorrectOption
                          ? 'success'
                          : isStudentAnswer
                            ? 'error'
                            : 'default'
                      }
                      size="small"
                      icon={
                        isCorrectOption ? (
                          <CheckCircle />
                        ) : isStudentAnswer ? (
                          <Cancel />
                        ) : undefined
                      }
                    />
                  )
                })}
              </Stack>
            </Box>
          )}

          {/* Feedback (if provided by grader) */}
          {question.feedback && (
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Feedback:
              </Typography>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'info.lighter',
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.info.light}`,
                }}
              >
                <Typography variant="body2">{question.feedback}</Typography>
              </Box>
            </Box>
          )}

          {/* Status Badge */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Chip
              label={statusLabel}
              color={
                isPending ? 'warning' : isCorrect ? 'success' : 'error'
              }
              icon={statusIcon}
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  )
}

export default QuestionResultCard
