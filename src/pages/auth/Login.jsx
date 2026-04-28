// src/pages/auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ShieldCheck, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginUser, registerUser, loginAdmin, loginAccounts } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import { USER_TYPES, ROUTES, SCHOOL_CODE } from '../../utils/constants';
import { markLaunched } from '../Welcome';

const USER_OPTIONS = [
  { label: 'Student',  value: USER_TYPES.STUDENT,  color: '#F4A334' },
  { label: 'Teacher',  value: USER_TYPES.TEACHER,   color: '#F9C61F' },
  { label: 'Parent',   value: USER_TYPES.PARENT,    color: '#E84545' },
  { label: 'Accounts', value: USER_TYPES.ACCOUNTS,  color: '#10b981' },
  { label: 'Admin',    value: USER_TYPES.ADMIN,     color: '#a855f7' },
];

const ERROR_MSGS = {
  'USER_NOT_FOUND':            'No account found with that email.',
  'USER_NOT_PREREGISTERED':    'Your email has not been pre-registered by the school admin.',
  'NEEDS_REGISTRATION':        'Your account is pre-registered but not yet activated. Switch to "Register" below and set your password to activate it.',
  'NOT_AN_ADMIN':              'This account does not have admin access.',
  'NOT_AN_ACCOUNTANT':         'This account does not have accounts access.',
  'auth/wrong-password':       'Incorrect password.',
  'auth/invalid-credential':   'Incorrect email or password.',
  'auth/user-not-found':       'No account found with that email.',
  'auth/email-already-in-use': 'Email already registered. Try signing in instead.',
  'auth/weak-password':        'Password should be at least 6 characters.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/too-many-requests':    'Too many attempts. Try again later.',
};

export default function Login() {
  const navigate = useNavigate();
  const { setAuthState } = useAuth();
  const [mode, setMode]         = useState('login');
  const [userType, setUserType] = useState(USER_TYPES.STUDENT);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [form, setForm]         = useState({ email: '', password: '', confirmPassword: '' });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const isAdmin      = userType === USER_TYPES.ADMIN;
  const isAccounts   = userType === USER_TYPES.ACCOUNTS;
  const isPrivileged = isAdmin || isAccounts;

  const handleTypeChange = (type) => {
    setUserType(type);
    setError('');
    if (type === USER_TYPES.ADMIN || type === USER_TYPES.ACCOUNTS) setMode('login');
  };

  // For Parent tab we still pass TEACHER to checkSchoolAndUser (existing Parent-Teacher collection)
  const resolveLoginType = (type) => {
    if (type === USER_TYPES.PARENT) return USER_TYPES.TEACHER;
    return type;
  };

  const submit = async () => {
    setError('');
    const { email, password, confirmPassword } = form;
    if (!email.trim() || !password.trim()) {
      setError('Please fill in your email and password.');
      return;
    }
    if (!isPrivileged && mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const code = SCHOOL_CODE;
      if (isAdmin) {
        const { user } = await loginAdmin({ email, password, schoolCode: code });
        setAuthState(USER_TYPES.ADMIN, code, user.uid);
        markLaunched();
        toast.success('Welcome, Admin!');
        navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
      } else if (isAccounts) {
        const { user } = await loginAccounts({ email, password, schoolCode: code });
        setAuthState(USER_TYPES.ACCOUNTS, code, user.uid);
        markLaunched();
        toast.success('Welcome, Accounts!');
        navigate(ROUTES.ACCOUNTS_DASHBOARD, { replace: true });
      } else if (mode === 'login') {
        const loginType = resolveLoginType(userType);
        const { user, userType: resolvedType } = await loginUser({ email, password, schoolCode: code, userType: loginType });
        setAuthState(resolvedType, code, user.uid);
        markLaunched();
        toast.success('Welcome back!');
        navigate(ROUTES.HOME, { replace: true });
      } else {
        const loginType = resolveLoginType(userType);
        const user = await registerUser({ email, password, schoolCode: code, userType: loginType });
        setAuthState(userType === USER_TYPES.PARENT ? USER_TYPES.PARENT : loginType, code, user.uid);
        markLaunched();
        toast.success('Account created!');
        navigate(ROUTES.PROFILE, { replace: true });
      }
    } catch (err) {
      setError(ERROR_MSGS[err.message] || ERROR_MSGS[err.code] || `Error: ${err.code || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const activeOption = USER_OPTIONS.find(o => o.value === userType);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center pt-10 pb-5 px-6 bg-gradient-to-b from-gray-50 to-white">
        <img src="/school-crest.png" alt="Chung Wah"
          className="w-20 h-20 object-contain drop-shadow-md mb-3" />
        <h1 className="font-display font-extrabold text-gray-900 text-xl tracking-tight">Chung Wah</h1>
        <p className="text-gray-400 text-xs font-body">E-School Platform</p>
      </div>

      <div className="flex-1 px-6 pb-8">
        <div className="mb-4">
          <h2 className="font-display font-bold text-gray-900 text-2xl mb-1">
            {isAdmin ? 'Admin Sign In' : isAccounts ? 'Accounts Sign In' : mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-gray-400 font-body text-sm">
            {isAdmin ? 'Restricted to authorised administrators'
              : isAccounts ? 'Restricted to accounts staff'
              : mode === 'login' ? 'Sign in to your school account'
              : 'Join your school platform'}
          </p>
        </div>

        {/* Role selector — scrollable row */}
        <div className="flex gap-1.5 mb-5 p-1 rounded-2xl bg-gray-100 border border-gray-200 overflow-x-auto">
          {USER_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => handleTypeChange(opt.value)}
              className={`flex-shrink-0 px-3 py-2.5 rounded-xl font-display font-semibold text-xs transition-all duration-200
                ${userType === opt.value ? 'text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              style={userType === opt.value ? { background: opt.color } : {}}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Notice banners */}
        {isAdmin && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-50 border border-purple-200 mb-4">
            <ShieldCheck size={16} className="text-purple-500 shrink-0 mt-0.5" />
            <p className="text-purple-600 text-xs font-body">
              Admin accounts are configured in Firebase. Contact your system administrator if you need access.
            </p>
          </div>
        )}
        {isAccounts && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 mb-4">
            <Calculator size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-emerald-600 text-xs font-body">
              Accounts access is restricted to finance staff. Contact your administrator to be registered.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-gray-500 text-xs font-body font-medium mb-1.5 block">Email</label>
            <input className="field" type="email" placeholder="you@example.com" value={form.email}
              onChange={set('email')} autoComplete="email" />
          </div>
          <div>
            <label className="text-gray-500 text-xs font-body font-medium mb-1.5 block">Password</label>
            <div className="relative">
              <input className="field pr-11" type={showPass ? 'text' : 'password'}
                placeholder="Your password" value={form.password} onChange={set('password')}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isPrivileged && mode === 'register' && (
            <div>
              <label className="text-gray-500 text-xs font-body font-medium mb-1.5 block">Confirm Password</label>
              <input className="field" type="password" placeholder="Re-enter password"
                value={form.confirmPassword} onChange={set('confirmPassword')} />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm font-body">{error}</p>
            </div>
          )}

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-yellow-500 text-sm font-body hover:text-yellow-600 transition-colors">
              Forgot password?
            </Link>
          </div>

          <button onClick={submit} disabled={loading}
            className="w-full h-14 rounded-2xl font-display font-bold text-base
                       flex items-center justify-center gap-2 mt-1 disabled:opacity-50 transition-all"
            style={{
              background: isAdmin
                ? 'linear-gradient(135deg, #a855f7, #7c3aed)'
                : isAccounts
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #F4A334, #F9C61F)',
              color: isAdmin || isAccounts ? 'white' : '#1a1f36',
            }}>
            {loading ? (
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-current opacity-60"
                    style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
                ))}
              </div>
            ) : isAdmin ? 'Sign In as Admin'
              : isAccounts ? 'Sign In to Accounts'
              : mode === 'login' ? 'Sign In'
              : 'Create Account'}
          </button>

          {!isPrivileged && (
            <p className="text-center text-gray-400 font-body text-sm pb-2">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
                className="font-semibold hover:underline transition-colors"
                style={{ color: activeOption?.color }}>
                {mode === 'login' ? 'Register' : 'Sign In'}
              </button>
            </p>
          )}
        </div>
      </div>
      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }`}</style>
    </div>
  );
}
