import { createTheme } from '@mui/material/styles'

/**
 * Central theme configuration for the entire application.
 * Colors, typography, and component overrides live here so they can be
 * consistently reused across layouts.
 */
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1d4ed8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f472b6',
      contrastText: '#1f2937',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: ['Inter', 'system-ui', 'sans-serif'].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    body1: {
      fontSize: '1rem',
    },
  },
  spacing: 8,
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          textTransform: 'none',
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 2,
      },
    },
  },
})

export default theme