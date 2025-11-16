import React from 'react'
import { Box, Typography, Paper, Stack } from '@mui/material'
import {
  DragDropContext,
  Droppable,
  Draggable
} from '@hello-pangea/dnd'
import type { DropResult } from '@hello-pangea/dnd'
import type { Question } from '@/types/question.types'
import QuestionCard from './QuestionCard'
import { log } from '@/utils/logger'

interface SelectedQuestionsProps {
  questions: Question[]
  onReorder: (newOrder: Question[]) => void
  onRemove: (questionId: string) => void
}

const SelectedQuestions: React.FC<SelectedQuestionsProps> = ({
  questions,
  onReorder,
  onRemove
}) => {
  const handleDragEnd = (result: DropResult) => {
    // Dropped outside the list
    if (!result.destination) {
      log('SelectedQuestions', 'Drag cancelled')
      return
    }

    // No movement
    if (result.destination.index === result.source.index) {
      return
    }

    // Reorder the array
    const newQuestions = Array.from(questions)
    const [removed] = newQuestions.splice(result.source.index, 1)
    newQuestions.splice(result.destination.index, 0, removed)

    log('SelectedQuestions', 'Reordered', {
      from: result.source.index,
      to: result.destination.index
    })

    onReorder(newQuestions)
  }

  const totalScore = questions.reduce((sum, q) => sum + q.max_score, 0)

  return (
    <Box>
      {/* Header */}
      <Typography variant="h6" gutterBottom>
        Selected Questions
      </Typography>

      {/* Statistics */}
      <Paper
        variant="outlined"
        sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}
      >
        <Stack direction="row" spacing={3}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Questions
            </Typography>
            <Typography variant="h6">{questions.length}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Total Score
            </Typography>
            <Typography variant="h6">{totalScore} pts</Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Empty State */}
      {questions.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: 6,
            textAlign: 'center',
            bgcolor: 'background.default',
            borderStyle: 'dashed'
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No questions selected
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select questions from the left to build your exam
          </Typography>
        </Paper>
      ) : (
        /* Drag and Drop List */
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="selected-questions">
            {(provided, snapshot) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                sx={{
                  bgcolor: snapshot.isDraggingOver
                    ? 'action.hover'
                    : 'transparent',
                  borderRadius: 1,
                  transition: 'background-color 0.2s',
                  minHeight: 100,
                  p: 1
                }}
              >
                {questions.map((question, index) => (
                  <Draggable
                    key={question.id}
                    draggableId={question.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        sx={{
                          mb: 1,
                          opacity: snapshot.isDragging ? 0.8 : 1
                        }}
                      >
                        <QuestionCard
                          question={question}
                          orderIndex={index}
                          isSelected={true}
                          onRemove={onRemove}
                          dragHandleProps={provided.dragHandleProps}
                          isDragging={snapshot.isDragging}
                        />
                      </Box>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Instructions */}
      {questions.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Drag questions to reorder them in the exam
        </Typography>
      )}
    </Box>
  )
}

export default SelectedQuestions
