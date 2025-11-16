import React from 'react'
import { Button, Container, Typography, Stack } from '@mui/material'
import { useAuthStore } from '@/store/authStore'
import { Link } from 'react-router-dom'
import ROUTES from '@/utils/routes'

const NotFound: React.FC = () => {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const goTo = user?.role === 'admin' ? ROUTES.ADMIN.DASHBOARD : ROUTES.STUDENT.DASHBOARD

  return (
    <Container maxWidth="md" sx={{ textAlign: 'center', py: 10 }}>
      <Typography variant="h1" component="h1" sx={{ fontSize: '6rem' }}>404</Typography>
      <Typography variant="h5" sx={{ mb: 2 }}>Page Not Found</Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>We couldn't find the page you're looking for.</Typography>
      <Stack direction="row" spacing={2} justifyContent="center">
        {isAuthenticated ? (
          <Button component={Link} to={goTo} variant="contained">Go to Dashboard</Button>
        ) : (
          <Button component={Link} to={ROUTES.LOGIN} variant="contained">Go to Login</Button>
        )}
        <Button component={Link} to="/">Home</Button>
      </Stack>
    </Container>
  )
}

export default NotFound
