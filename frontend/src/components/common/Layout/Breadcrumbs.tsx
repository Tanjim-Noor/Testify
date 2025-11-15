import React from 'react'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useLocation, Link as RouterLink } from 'react-router-dom'

const BreadcrumbsNav: React.FC = () => {
  const { pathname } = useLocation()
  const segments = pathname.split('/').filter(Boolean)

  return (
    <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
      <Link component={RouterLink} to="/">
        Home
      </Link>
      {segments.map((seg, idx) => {
        const to = '/' + segments.slice(0, idx + 1).join('/')
        const isLast = idx === segments.length - 1
        return isLast ? (
          <Typography key={to} color="text.primary">{decodeURIComponent(seg)}</Typography>
        ) : (
          <Link key={to} component={RouterLink} to={to}>{decodeURIComponent(seg)}</Link>
        )
      })}
    </Breadcrumbs>
  )
}

export default BreadcrumbsNav
