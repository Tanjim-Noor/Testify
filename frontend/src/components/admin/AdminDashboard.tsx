import React from 'react'
import { Container, Card, CardContent, Typography } from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import { useAuthStore } from '@/store/authStore'

const AdminDashboard: React.FC = () => {
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
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1">Questions</Typography>
              <Typography>Coming soon: question bank statistics</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1">Exams</Typography>
              <Typography>Coming soon: exam schedule & stats</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

export default AdminDashboard
