/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree
 * Displays a fallback UI and logs errors for debugging
 */

import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Box, Button, Typography, Paper, Alert, Collapse } from '@mui/material'
import { error as logError } from '@/utils/logger'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  showDetails: boolean
}

/**
 * ErrorBoundary class component
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  readonly state: ErrorBoundaryState = {
    hasError: false,
    showDetails: false,
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to logger utility
    logError('React Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      errorInfo,
    })

    // Update state with error info
    this.setState({
      errorInfo,
    })

    // In production, you could send to an error tracking service here
    // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
  }

  handleReload = (): void => {
    window.location.reload()
  }

  handleGoHome = (): void => {
    window.location.href = '/'
  }

  toggleDetails = (): void => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }))
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      const isDevelopment = import.meta.env.MODE === 'development'

      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            px: 2,
            bgcolor: 'background.default',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 600,
              width: '100%',
              textAlign: 'center',
            }}
          >
            <Typography variant="h4" gutterBottom color="error">
              Oops! Something went wrong
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              We're sorry for the inconvenience. The application encountered an unexpected error.
            </Typography>

            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2 }}>
              <Button variant="contained" color="primary" onClick={this.handleReload}>
                Reload Page
              </Button>
              <Button variant="outlined" onClick={this.handleGoHome}>
                Go to Home
              </Button>
            </Box>

            {/* Show error details in development mode */}
            {isDevelopment && (
              <>
                <Button
                  size="small"
                  onClick={this.toggleDetails}
                  sx={{ mt: 2 }}
                >
                  {this.state.showDetails ? 'Hide' : 'Show'} Error Details
                </Button>

                <Collapse in={this.state.showDetails}>
                  <Paper
                    sx={{
                      mt: 2,
                      p: 2,
                      bgcolor: 'grey.100',
                      textAlign: 'left',
                      maxHeight: 300,
                      overflow: 'auto',
                    }}
                  >
                    <Typography variant="caption" component="pre" sx={{ fontSize: 10 }}>
                      {this.state.error?.stack}
                    </Typography>
                    {this.state.errorInfo && (
                      <Typography variant="caption" component="pre" sx={{ fontSize: 10, mt: 2 }}>
                        {this.state.errorInfo.componentStack}
                      </Typography>
                    )}
                  </Paper>
                </Collapse>
              </>
            )}

            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 3 }}>
              If this problem persists, please contact support.
            </Typography>
          </Paper>
        </Box>
      )
    }

    return this.props.children
  }
}