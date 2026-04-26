// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { onAuthChange } from '../services/auth';
import { USER_TYPES } from '../utils/constants';

const AuthContext = createContext(null);

// ── Debug overlay ─────────────────────────────────────────────────────────────
import { getDebugLog, clearDebugLog } from '../services/auth';

function DebugOverlay() {
  const [logs, setLogs] = React.useState([]);
  const [visible, setVisible] = React.useState(true);
  React.useEffect(() => {
    const id = setInterval(() => setLogs([...getDebugLog()]), 1000);
    return () => clearInterval(id);
  }, []);
  if (!visible) return (
    <button onClick={() => setVisible(true)} style={{
      position:'fixed',bottom:60,right:8,zIndex:9999,
      background:'#000',color:'#0f0',fontSize:10,
      padding:'4px 8px',borderRadius:4,border:'1px solid #0f0',
    }}>DBG</button>
  );
  return (
    <div style={{position:'fixed',top:0,left:0,right:0,zIndex:9999,
      background:'rgba(0,0,0,0.95)',padding:'6px 8px',maxHeight:'45vh',overflowY:'auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
        <span style={{color:'#fff',fontFamily:'monospace',fontSize:11,fontWeight:'bold'}}>🔍 FULL DEBUG LOG</span>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>{clearDebugLog();setLogs([]);}}
            style={{color:'#f80',background:'none',border:'none',fontSize:11,cursor:'pointer'}}>CLEAR</button>
          <button onClick={()=>setVisible(false)}
            style={{color:'#f00',background:'none',border:'none',fontSize:12,cursor:'pointer'}}>✕</button>
        </div>
      </div>
      {logs.length===0 && <p style={{color:'#888',fontFamily:'monospace',fontSize:10}}>No logs yet</p>}
      {logs.map((l,i)=>(
        <p key={i} style={{
          color:l.includes('FAILED')||l.includes('REJECTED')||l.includes('ERROR')||l.includes('404')?'#f44':
                l.includes('SUCCESS')||l.includes('OK')||l.includes('200')||l.includes('found')?'#4f4':
                l.includes('path=')||l.includes('exists=')||l.includes('REST')?'#4df':'#ff4',
          fontFamily:'monospace',fontSize:10,margin:'1px 0',wordBreak:'break-all',
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

  // When Login.jsx calls setAuthState directly after a successful login,
  // we set this flag so the concurrent onAuthChange doesn't override it.
  const authSetDirectly = useRef(false);

  // Called by Login.jsx right after loginAdmin/loginUser/registerUser succeeds.
  // This bypasses the broken Firestore SDK getSession flow entirely.
  const setAuthState = (type, code, uid) => {
    authSetDirectly.current = true;
    setUserType(type);
    setSchoolCode(code);
    setUserId(uid);
    // Reset flag after a short delay so future onAuthChange events work normally
    setTimeout(() => { authSetDirectly.current = false; }, 3000);
  };

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        // Genuine sign-out
        setUserType(USER_TYPES.UNKNOWN);
        setSchoolCode('');
        setUserId('');
        setLoading(false);
        return;
      }

      // If Login.jsx already set the state directly, don't override it
      if (authSetDirectly.current) {
        setLoading(false);
        return;
      }

      // Try to restore session via REST API (bypasses broken Firestore SDK)
      try {
        const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
        const idToken = await firebaseUser.getIdToken();
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/sessions/${firebaseUser.uid}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
        if (res.ok) {
          const json = await res.json();
          const fields = json.fields || {};
          const type = fields.userType?.stringValue;
          const code = fields.schoolCode?.stringValue;
          const uid  = fields.userId?.stringValue;
          if (type && type !== USER_TYPES.UNKNOWN) {
            setUserType(type);
            setSchoolCode(code || '');
            setUserId(uid || firebaseUser.uid);
            setLoading(false);
            return;
          }
        }
      } catch (_) {}

      // No valid session found — user needs to log in
      setUserType(USER_TYPES.UNKNOWN);
      setSchoolCode('');
      setUserId('');
      setLoading(false);
    });
    return unsub;
  }, []);

  const isAdmin = userType === USER_TYPES.ADMIN;

  return (
    <AuthContext.Provider value={{
      user, loading, userType, schoolCode, userId,
      setUserType, setSchoolCode, setUserId,
      setAuthState, isAdmin,
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
