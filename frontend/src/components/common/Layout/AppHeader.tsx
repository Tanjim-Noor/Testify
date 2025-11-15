import React from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import { useTheme } from '@mui/material/styles'
import MenuIcon from '@mui/icons-material/Menu'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { log } from '@/utils/logger'

const AppHeader: React.FC = () => {
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)
  const toggleDrawer = useUIStore((s) => s.toggleDrawer)
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)
  const { logout } = useAuth()

  function handleMenuOpen(e: React.MouseEvent<HTMLElement>) {
    setAnchorEl(e.currentTarget)
  }

  function handleMenuClose() {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    handleMenuClose()
    // Nice simple confirmation
    if (confirm('Are you sure you want to logout?')) {
      log('AppHeader', 'User logging out')
      logout()
    }
  }

  return (
    <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={toggleDrawer}
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {import.meta.env.VITE_APP_NAME ?? 'Exam Management System'}
        </Typography>

        {user && (
          <Box>
            <IconButton onClick={handleMenuOpen} color="inherit">
              <Avatar>{user.email?.charAt(0).toUpperCase()}</Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
              <MenuItem disabled>
                <Box display="flex" flexDirection="column">
                  <Typography variant="body2">{user.email}</Typography>
                  <Chip label={user.role} size="small" sx={{ mt: 1 }} />
                </Box>
              </MenuItem>
              <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  )
}

export default AppHeader
