// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { onAuthChange } from '../services/auth';
import { USER_TYPES } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [userType, setUserType]     = useState(USER_TYPES.UNKNOWN);
  const [schoolCode, setSchoolCode] = useState('');
  const [userId, setUserId]         = useState('');
  const authSetDirectly             = useRef(false);

  const setAuthState = (type, code, uid) => {
    authSetDirectly.current = true;
    setUserType(type);
    setSchoolCode(code);
    setUserId(uid);
    localStorage.setItem('schoolCode', code || '');
    localStorage.setItem('userId', uid || '');
    setTimeout(() => { authSetDirectly.current = false; }, 3000);
  };

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setUserType(USER_TYPES.UNKNOWN);
        setSchoolCode('');
        setUserId('');
        localStorage.removeItem('schoolCode');
        localStorage.removeItem('userId');
        setLoading(false);
        return;
      }

      if (authSetDirectly.current) {
        setLoading(false);
        return;
      }

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
            localStorage.setItem('schoolCode', code || '');
            localStorage.setItem('userId', uid || firebaseUser.uid);
            setLoading(false);
            return;
          }
        }
      } catch (_) {}

      setUserType(USER_TYPES.UNKNOWN);
      setSchoolCode('');
      setUserId('');
      localStorage.removeItem('schoolCode');
      localStorage.removeItem('userId');
      setLoading(false);
    });
    return unsub;
  }, []);

  const isAdmin    = userType === USER_TYPES.ADMIN;
  const isAccounts = userType === USER_TYPES.ACCOUNTS;
  const isTeacher  = userType === USER_TYPES.TEACHER;
  const isStudent  = userType === USER_TYPES.STUDENT;
  const isParent   = userType === USER_TYPES.PARENT;

  return (
    <AuthContext.Provider value={{
      user, loading, userType, schoolCode, userId,
      setUserType, setSchoolCode, setUserId,
      setAuthState,
      isAdmin, isAccounts, isTeacher, isStudent, isParent,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
