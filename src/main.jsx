// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import DebugLogButton from './components/ui/DebugLogButton';
import { initDebugLogger } from './services/debugLogger';
import './index.css';

// VITE_ENABLE_DEBUG_PANEL is written into .env.local by the CI workflow
// (true for android-build-dev.yml, false for android-build-user.yml). Vite
// inlines this as a literal true/false at build time, so the minifier
// dead-code-eliminates the debug logger + panel entirely from the
// user-facing production build — it isn't just hidden, it isn't shipped.
const DEBUG_PANEL_ENABLED = import.meta.env.VITE_ENABLE_DEBUG_PANEL === 'true';

if (DEBUG_PANEL_ENABLED) {
  initDebugLogger(); // must run before anything else that could throw
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <App />
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: '#1e1b4b',
                  color: '#fff',
                  borderRadius: '12px',
                  border: '1px solid rgba(249,198,31,0.3)',
                  fontFamily: 'DM Sans, sans-serif',
                },
                success: { iconTheme: { primary: '#F9C61F', secondary: '#0A0F2C' } },
                error: { iconTheme: { primary: '#E84545', secondary: '#fff' } },
              }}
            />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
    {DEBUG_PANEL_ENABLED && <DebugLogButton />}
  </React.StrictMode>
);
