import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import App from './App'
import ErrorBoundary from '@/components/shared/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          <App />
          <Toaster
            richColors
            position="top-right"
            closeButton
            toastOptions={{
              className: '!text-sm',
            }}
          />
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
)
