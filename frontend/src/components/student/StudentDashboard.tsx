import React from 'react'
import { Container, Card, CardContent, Typography } from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import { useAuthStore } from '@/store/authStore'

const StudentDashboard: React.FC = () => {
  const user = useAuthStore((s) => s.user)

  return (
    <Container>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5">Welcome, {user?.email}</Typography>
              <Typography color="text.secondary">Role: {user?.role}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1">Available Exams</Typography>
              <Typography>Coming soon: Available exams list</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1">Upcoming</Typography>
              <Typography>Coming soon: upcoming exam schedule</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

export default StudentDashboard
