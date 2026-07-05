// src/components/ui/ErrorBoundary.jsx
//
// Without this, any uncaught error thrown during React rendering unmounts
// the whole tree and the WebView shows a blank white screen (exactly the
// symptom reported after clearing cache). This boundary catches those
// errors, logs them via debugLogger, and shows a simple recovery screen
// instead — the Debug Log button stays reachable either way since it's
// mounted outside this boundary in main.jsx.

import React from 'react';
import { logEvent } from '../../services/debugLogger';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    logEvent(`React render crash: ${error.message}\n${info.componentStack}`, 'error');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '24px',
          background: '#0A0F2C', color: '#fff', textAlign: 'center',
        }}>
          <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
            Something went wrong.
          </p>
          <p style={{ fontSize: '13px', opacity: 0.75, marginBottom: '20px' }}>
            Tap "Debug Log" below to see what happened, or reopen the app.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              background: '#F9C61F', color: '#0A0F2C', border: 'none',
              borderRadius: '8px', padding: '10px 20px', fontWeight: 700,
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
