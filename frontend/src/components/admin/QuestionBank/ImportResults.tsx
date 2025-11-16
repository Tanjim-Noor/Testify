import React from 'react'
import { Box, Typography, Alert, Table, TableHead, TableRow, TableCell, TableBody, Paper, Collapse, IconButton } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import type { ImportResult } from '@/api/questions'

interface Props {
  result?: ImportResult | null
}

const ImportResults: React.FC<Props> = ({ result }) => {
  const [open, setOpen] = React.useState(true)
  if (!result) return null

  return (
    <Box>
      <Alert severity={result.error_count ? 'warning' : 'success'} sx={{ mb: 2 }}>
        {result.success_count} questions imported successfully. {result.error_count} errors.
        <IconButton size="small" onClick={() => setOpen(o => !o)}>
          {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Alert>

      <Collapse in={open}>
        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Row</TableCell>
                <TableCell>Error Messages</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.errors.map((e) => (
                <TableRow key={e.row_number}>
                  <TableCell>{e.row_number}</TableCell>
                  <TableCell>
                    {e.errors.map((m, i) => (
                      <Typography variant="body2" color="error" key={i}>{m}</Typography>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Collapse>
    </Box>
  )
}

export default ImportResults
