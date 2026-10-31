import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element #root was not found')
}

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
