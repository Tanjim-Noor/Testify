import React from 'react'
import { Box, TextField, IconButton, Button } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'

interface Props {
  options: string[]
  onChange: (opts: string[]) => void
}

const OptionsEditor: React.FC<Props> = ({ options, onChange }) => {
  const updateIdx = (idx: number, value: string) => {
    const copy = [...options]
    copy[idx] = value
    onChange(copy)
  }

  const addOption = () => onChange([...options, ''])
  const remove = (idx: number) => onChange(options.filter((_, i) => i !== idx))

  return (
    <Box sx={{ display: 'grid', gap: 1 }}>
      {options.map((o, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1 }}>
          <TextField fullWidth size="small" value={o} onChange={(e) => updateIdx(i, e.target.value)} />
          <IconButton onClick={() => remove(i)} aria-label="remove-option"><DeleteIcon /></IconButton>
        </Box>
      ))}
      <Button startIcon={<AddIcon />} onClick={addOption}>Add option</Button>
    </Box>
  )
}

export default OptionsEditor
