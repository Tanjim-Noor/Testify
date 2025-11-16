import React from 'react'
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  IconButton,
  Box,
  Stack
} from '@mui/material'
import {
  DragIndicator as DragIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material'
import type { Question } from '@/types/question.types'
import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'

interface QuestionCardProps {
  question: Question
  orderIndex?: number
  isSelected?: boolean
  onAdd?: (question: Question) => void
  onRemove?: (questionId: string) => void
  dragHandleProps?: DraggableProvidedDragHandleProps | null
  isDragging?: boolean
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  orderIndex,
  isSelected = false,
  onAdd,
  onRemove,
  dragHandleProps,
  isDragging = false
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'single_choice':
        return 'primary'
      case 'multi_choice':
        return 'secondary'
      case 'text':
        return 'success'
      case 'image_upload':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'single_choice':
        return 'Single Choice'
      case 'multi_choice':
        return 'Multi Choice'
      case 'text':
        return 'Text'
      case 'image_upload':
        return 'Image Upload'
      default:
        return type
    }
  }

  return (
    <Card
      sx={{
        mb: 1,
        opacity: isDragging ? 0.5 : 1,
        '&:hover': {
          boxShadow: 3
        },
        transition: 'box-shadow 0.2s'
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="flex-start" gap={1}>
          {/* Drag Handle - only show if in selected list */}
          {isSelected && dragHandleProps && (
            <Box
              {...dragHandleProps}
              sx={{
                cursor: 'grab',
                display: 'flex',
                alignItems: 'center',
                color: 'text.secondary',
                '&:active': {
                  cursor: 'grabbing'
                }
              }}
            >
              <DragIcon />
            </Box>
          )}

          {/* Order Index */}
          {typeof orderIndex === 'number' && (
            <Typography
              variant="h6"
              color="primary"
              sx={{ minWidth: 40, flexShrink: 0 }}
            >
              {orderIndex + 1}.
            </Typography>
          )}

          {/* Question Content */}
          <Box flex={1}>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              {question.title}
            </Typography>

            {question.description && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {question.description}
              </Typography>
            )}

            <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
              <Chip
                label={getTypeLabel(question.type)}
                color={getTypeColor(question.type)}
                size="small"
              />
              <Chip
                label={question.complexity}
                variant="outlined"
                size="small"
              />
              <Chip
                label={`${question.max_score} pts`}
                color="default"
                size="small"
              />
              {question.tags?.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  variant="outlined"
                  size="small"
                  sx={{ borderStyle: 'dashed' }}
                />
              ))}
            </Stack>
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
        {!isSelected && onAdd && (
          <IconButton
            color="primary"
            onClick={() => onAdd(question)}
            size="small"
            aria-label="Add question"
          >
            <AddIcon />
          </IconButton>
        )}

        {isSelected && onRemove && (
          <IconButton
            color="error"
            onClick={() => onRemove(question.id)}
            size="small"
            aria-label="Remove question"
          >
            <DeleteIcon />
          </IconButton>
        )}
      </CardActions>
    </Card>
  )
}

export default QuestionCard
