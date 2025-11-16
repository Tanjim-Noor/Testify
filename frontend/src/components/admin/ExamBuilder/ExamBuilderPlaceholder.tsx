import React from 'react'
import { Container, Paper, Typography, Button } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'

const ExamBuilderPlaceholder: React.FC = () => {
  const navigate = useNavigate()
  const { examId } = useParams()

  return (
    <Container>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5">Exam Builder (coming soon)</Typography>
        <Typography sx={{ mt: 1 }}>This page will let an admin assign and reorder questions for exam <strong>{examId}</strong>.</Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/admin/exams')}>Back to exams</Button>
      </Paper>
    </Container>
  )
}

export default ExamBuilderPlaceholder
