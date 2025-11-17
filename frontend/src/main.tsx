import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// Import debug utilities in development
if (import.meta.env.MODE === 'development') {
  import('./utils/debug')
  import('./utils/testErrors')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
