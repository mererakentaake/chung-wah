// src/components/ui/DebugLogButton.jsx
//
// Floating "Debug Log" button. Dark navy background, white text, always
// visible above the rest of the UI so it can be reached even if a page
// fails to render properly. Tapping it opens a full-screen panel listing
// every captured console.log / console.info / console.warn / console.error
// call plus any uncaught JS errors, newest first.

import React, { useEffect, useState } from 'react';
import { X, Trash2, Copy } from 'lucide-react';
import { getLogs, subscribe, clearLogs } from '../../services/debugLogger';

const LEVEL_COLORS = {
  log: '#cbd5e1',
  info: '#7dd3fc',
  warn: '#facc15',
  error: '#f87171',
};

export default function DebugLogButton() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState(getLogs());

  useEffect(() => subscribe(setLogs), []);

  const handleCopy = () => {
    const text = logs.map((l) => `[${l.ts}] ${l.level.toUpperCase()}: ${l.message}`).join('\n');
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: '90px',
          right: '16px',
          zIndex: 9999,
          backgroundColor: '#0A0F2C',
          color: '#ffffff',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '9999px',
          padding: '10px 18px',
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
        }}
      >
        Debug Log
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            backgroundColor: '#0A0F2C',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.15)',
          }}>
            <span style={{ fontWeight: 700, fontSize: '16px' }}>Debug Log ({logs.length})</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleCopy} style={iconBtnStyle} aria-label="Copy logs">
                <Copy size={18} />
              </button>
              <button onClick={clearLogs} style={iconBtnStyle} aria-label="Clear logs">
                <Trash2 size={18} />
              </button>
              <button onClick={() => setOpen(false)} style={iconBtnStyle} aria-label="Close">
                <X size={20} />
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px' }}>
            {logs.length === 0 && (
              <div style={{ opacity: 0.6 }}>No log entries yet.</div>
            )}
            {logs.slice().reverse().map((l, i) => (
              <div key={i} style={{ marginBottom: '8px', color: LEVEL_COLORS[l.level] || '#fff' }}>
                <div style={{ opacity: 0.6, fontSize: '10px' }}>{l.ts} · {l.level.toUpperCase()}</div>
                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{l.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

const iconBtnStyle = {
  background: 'rgba(255,255,255,0.08)',
  border: 'none',
  color: '#fff',
  borderRadius: '8px',
  padding: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
