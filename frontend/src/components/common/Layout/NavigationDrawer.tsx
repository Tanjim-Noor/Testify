import React from 'react'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import HomeIcon from '@mui/icons-material/Home'
import QuizIcon from '@mui/icons-material/Quiz'
import AssignmentIcon from '@mui/icons-material/Assignment'
import AssessmentIcon from '@mui/icons-material/Assessment'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useLocation, useNavigate } from 'react-router-dom'
import ROUTES from '@/utils/routes'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import Box from '@mui/material/Box'
import { log } from '@/utils/logger'

const drawerWidth = 240

const AdminItems = [
  { text: 'Dashboard', icon: <HomeIcon />, path: ROUTES.ADMIN.DASHBOARD },
  { text: 'Question Bank', icon: <QuizIcon />, path: ROUTES.ADMIN.QUESTIONS },
  { text: 'Exam Management', icon: <AssignmentIcon />, path: ROUTES.ADMIN.EXAMS },
  { text: 'Results', icon: <AssessmentIcon />, path: ROUTES.ADMIN.RESULTS },
]

const StudentItems = [
  { text: 'Dashboard', icon: <HomeIcon />, path: ROUTES.STUDENT.DASHBOARD },
  { text: 'Available Exams', icon: <AssignmentIcon />, path: ROUTES.STUDENT.EXAMS },
  { text: 'My Results', icon: <AssessmentIcon />, path: ROUTES.STUDENT.RESULTS },
]

const NavigationDrawer: React.FC = () => {
  const theme = useTheme()
  const mdUp = useMediaQuery(theme.breakpoints.up('md'))
  const { drawerOpen, setDrawerOpen, toggleDrawer } = useUIStore()
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const location = useLocation()

  const items = user?.role === 'admin' ? AdminItems : StudentItems

  const handleNavigate = (path: string) => {
    log('NavigationDrawer', 'Navigate', path)
    navigate(path)
    if (!mdUp) setDrawerOpen(false)
  }

  const drawerContent = (
    <Box sx={{ width: drawerWidth }} role="presentation">
      <List>
        {items.map((it) => (
          <ListItem key={it.path} disablePadding>
            <ListItemButton
              selected={location.pathname.startsWith(it.path)}
              onClick={() => handleNavigate(it.path)}
            >
              <ListItemIcon>{it.icon}</ListItemIcon>
              <ListItemText primary={it.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
    </Box>
  )

  return (
    <nav aria-label="main navigation">
      {/* Desktop persistent drawer */}
      <Drawer
        variant={mdUp ? 'permanent' : 'temporary'}
        open={mdUp ? true : drawerOpen}
        onClose={toggleDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </nav>
  )
}

export default NavigationDrawer
