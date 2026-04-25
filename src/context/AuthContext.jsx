// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange, getSession, getDebugLog, clearDebugLog } from '../services/auth';
import { USER_TYPES } from '../utils/constants';

const AuthContext = createContext(null);

async function retryAsync(fn, attempts = 3, delayMs = 800) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

// ── Full-screen debug overlay ─────────────────────────────────────────────────
function DebugOverlay() {
  const [logs, setLogs] = useState([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Poll every second so new entries appear live
    const id = setInterval(() => setLogs([...getDebugLog()]), 1000);
    return () => clearInterval(id);
  }, []);

  if (!visible) return (
    <button onClick={() => setVisible(true)} style={{
      position: 'fixed', bottom: 60, right: 8, zIndex: 9999,
      background: '#000', color: '#0f0', fontSize: 10,
      padding: '4px 8px', borderRadius: 4, border: '1px solid #0f0',
    }}>DBG</button>
  );

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.95)', padding: '6px 8px',
      maxHeight: '45vh', overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' }}>
          🔍 FULL DEBUG LOG
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { clearDebugLog(); setLogs([]); }}
            style={{ color: '#f80', background: 'none', border: 'none', fontSize: 11, cursor: 'pointer' }}>
            CLEAR
          </button>
          <button onClick={() => setVisible(false)}
            style={{ color: '#f00', background: 'none', border: 'none', fontSize: 12, cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      </div>
      {logs.length === 0 && (
        <p style={{ color: '#888', fontFamily: 'monospace', fontSize: 10 }}>No logs yet — try logging in</p>
      )}
      {logs.map((l, i) => (
        <p key={i} style={{
          color: l.includes('FAILED') || l.includes('REJECTED') || l.includes('ERROR') ? '#f44' :
                 l.includes('SUCCESS') || l.includes('OK') ? '#4f4' :
                 l.includes('path=') || l.includes('exists=') ? '#4df' : '#ff4',
          fontFamily: 'monospace', fontSize: 10, margin: '1px 0', wordBreak: 'break-all',
        }}>{l}</p>
      ))}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [userType, setUserType]     = useState(USER_TYPES.UNKNOWN);
  const [schoolCode, setSchoolCode] = useState('');
  const [userId, setUserId]         = useState('');

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const session = await retryAsync(() => getSession(firebaseUser.uid), 3, 800);
          if (session && session.userType && session.userType !== USER_TYPES.UNKNOWN) {
            setUserType(session.userType);
            setSchoolCode(session.schoolCode || '');
            setUserId(session.userId || firebaseUser.uid);
          } else {
            setUserType(USER_TYPES.UNKNOWN);
            setSchoolCode(''); setUserId('');
          }
        } catch (err) {
          console.error('[AUTH] getSession failed:', err.message);
          setUserType(USER_TYPES.UNKNOWN);
          setSchoolCode(''); setUserId('');
        }
      } else {
        setUserType(USER_TYPES.UNKNOWN);
        setSchoolCode(''); setUserId('');
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshUserType = async () => {
    if (user) {
      try {
        const session = await retryAsync(() => getSession(user.uid), 3, 800);
        if (session) {
          setUserType(session.userType || USER_TYPES.UNKNOWN);
          setSchoolCode(session.schoolCode || '');
          setUserId(session.userId || user.uid);
        }
      } catch (err) {
        console.error('[AUTH] refreshUserType failed:', err.message);
      }
    }
  };

  const isAdmin = userType === USER_TYPES.ADMIN;

  return (
    <AuthContext.Provider value={{
      user, loading, userType, schoolCode, userId,
      setUserType, refreshUserType, isAdmin,
    }}>
      <DebugOverlay />
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
