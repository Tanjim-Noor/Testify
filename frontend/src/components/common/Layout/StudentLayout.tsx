import React from 'react'
import Box from '@mui/material/Box'
import { Outlet } from 'react-router-dom'
import { AppHeader, NavigationDrawer, BreadcrumbsNav } from '@/components/common/Layout'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

const drawerWidth = 240

const StudentLayout: React.FC = () => {
  const theme = useTheme()
  useMediaQuery(theme.breakpoints.up('md'))

  return (
    <Box sx={{ display: 'flex' }}>
      <AppHeader />
      <NavigationDrawer />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
      <BreadcrumbsNav />
        <Outlet />
      </Box>
    </Box>
  )
}

export default StudentLayout
