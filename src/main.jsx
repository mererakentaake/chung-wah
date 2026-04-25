// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
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
  </React.StrictMode>
);
