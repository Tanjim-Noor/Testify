import { ThemeProvider } from '@mui/material/styles'
import { Box, Button, Chip, Container, CssBaseline, Paper, Stack, Typography } from '@mui/material'
import { ErrorBoundary } from '@/components/common'
import theme from '@/theme'

const AppContent = () => (
  <Container maxWidth="md" sx={{ py: 8 }}>
    <Stack spacing={4}>
      <Paper
        elevation={3}
        sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <Typography variant="h3" component="h1">
          Welcome to {import.meta.env.VITE_APP_NAME ?? 'Exam Management System'}
        </Typography>
        <Typography color="text.secondary">
          This is the foundation for the Admin and Student portals. Explore the
          left-hand navigation and start wiring up the domain-specific pages.
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label="Material UI" color="primary" />
          <Chip label="Zustand" color="secondary" />
          <Chip label="React Router" />
        </Stack>
        <Box>
          <Button variant="contained" sx={{ mr: 2 }}>
            View Admin Plan
          </Button>
          <Button variant="outlined">View Student Plan</Button>
        </Box>
      </Paper>
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Runtime Details
        </Typography>
        <Typography variant="body2">
          API Base URL: {import.meta.env.VITE_API_BASE_URL ?? 'Not configured'}
        </Typography>
        <Typography variant="body2">Vite Mode: {import.meta.env.MODE}</Typography>
      </Paper>
    </Stack>
  </Container>
)

const App = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  </ThemeProvider>
)

export default App
