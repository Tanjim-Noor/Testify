import React from 'react'
import LinearProgress from '@mui/material/LinearProgress'
import { useLocation } from 'react-router-dom'

const RouteLoader: React.FC = () => {
  const [loading, setLoading] = React.useState(false)
  const location = useLocation()
  const timeout = React.useRef<number | null>(null)

  React.useEffect(() => {
    // show progress for route changes
    setLoading(true)
    if (timeout.current) window.clearTimeout(timeout.current)
    // hide after short delay (simulate network route loads) to prevent flicker
    timeout.current = window.setTimeout(() => setLoading(false), 350)
    return () => {
      if (timeout.current) {
        window.clearTimeout(timeout.current)
        timeout.current = null
      }
    }
  }, [location])

  if (!loading) return null
  return <LinearProgress color="primary" />
}

export default RouteLoader
