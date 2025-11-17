/**
 * ValidationErrors Component
 * 
 * Displays validation errors from backend (422 responses)
 */

import React from 'react'
import { Alert, AlertTitle, List, ListItem, ListItemText, Typography } from '@mui/material'
import type { ValidationError } from '@/utils/errorHandler'

interface ValidationErrorsProps {
  errors: ValidationError[] | Record<string, string>
  title?: string
  severity?: 'error' | 'warning'
  variant?: 'standard' | 'outlined' | 'filled'
}

/**
 * ValidationErrors Component
 */
const ValidationErrors: React.FC<ValidationErrorsProps> = ({
  errors,
  title = 'Validation Errors',
  severity = 'error',
  variant = 'standard',
}) => {
  // Convert errors to array format
  const errorArray: ValidationError[] = Array.isArray(errors)
    ? errors
    : Object.entries(errors).map(([field, message]) => ({
        field,
        message,
      }))

  if (errorArray.length === 0) {
    return null
  }

  return (
    <Alert severity={severity} variant={variant}>
      <AlertTitle>{title}</AlertTitle>
      {errorArray.length === 1 ? (
        <Typography variant="body2">
          <strong>{errorArray[0].field}:</strong> {errorArray[0].message}
        </Typography>
      ) : (
        <List dense disablePadding>
          {errorArray.map((error, index) => (
            <ListItem key={index} disablePadding>
              <ListItemText
                primary={
                  <Typography variant="body2" component="span">
                    <strong>{error.field}:</strong> {error.message}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Alert>
  )
}

export default ValidationErrors
