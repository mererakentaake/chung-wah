// src/pages/auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ShieldCheck, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginUser, registerUser, loginAdmin, loginAccounts, registerAccounts, loginWithGoogle } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import { USER_TYPES, ROUTES } from '../../utils/constants';

const USER_OPTIONS = [
  { label: 'Student',  value: USER_TYPES.STUDENT,  color: '#F4A334' },
  { label: 'Parent',   value: USER_TYPES.PARENT,    color: '#E84545' },
  { label: 'Teacher',  value: USER_TYPES.TEACHER,   color: '#F9C61F' },
  { label: 'Admin',    value: USER_TYPES.ADMIN,      color: '#a855f7' },
  { label: 'Accounts', value: USER_TYPES.ACCOUNTS,  color: '#10b981' },
];

const ERROR_MSGS = {
  'USER_NOT_FOUND':          'No account found with that email.',
  'USER_NOT_PREREGISTERED':  'Your email has not been pre-registered. Contact the school admin.',
  'NEEDS_REGISTRATION':      'Account not yet activated. Switch to "Register" to set your password.',
  'TOO_YOUNG':               'Students in this class do not have direct app access. Your parent can view your information from their Parent portal.',
  'NEEDS_PARENT_PERMISSION': 'Your parent has not yet enabled app access. Ask them to enable it from their Parent portal.',
  'NOT_AN_ADMIN':            'This account does not have admin access.',
  'NOT_AN_ACCOUNTANT':       'This account does not have accounts access.',
  'FIRESTORE_RULES_BLOCKED': 'Access denied. Ask your admin to update Firestore security rules.',
  'auth/wrong-password':     'Incorrect password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/user-not-found':     'No account found with that email.',
  'auth/email-already-in-use': 'Email already registered. Try signing in.',
  'auth/weak-password':      'Password must be at least 6 characters.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/too-many-requests':  'Too many attempts. Try again later.',
};

export default function Login() {
  const navigate = useNavigate();
  const { setAuthState } = useAuth();
  const [mode, setMode]         = useState('login');
  const [userType, setUserType] = useState(USER_TYPES.STUDENT);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]       = useState('');
  const [form, setForm]         = useState({ email: '', password: '', confirmPassword: '' });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const isAdmin    = userType === USER_TYPES.ADMIN;
  const isAccounts = userType === USER_TYPES.ACCOUNTS;
  const activeColor = USER_OPTIONS.find(o => o.value === userType)?.color || '#F4A334';

  const handleTypeChange = (type) => {
    setUserType(type);
    setError('');
    if (type === USER_TYPES.ADMIN) setMode('login');
  };

  const resolveLoginType = (type) =>
    type === USER_TYPES.PARENT ? USER_TYPES.TEACHER : type;

  const submit = async () => {
    setError('');
    const { email, password, confirmPassword } = form;
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields.'); return; }
    if (!isAdmin && !isAccounts && mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.'); return;
    }
    setLoading(true);
    try {
      if (isAdmin) {
        const { user } = await loginAdmin({ email, password });
        setAuthState(USER_TYPES.ADMIN, user.uid);
        toast.success('Welcome, Admin!');
        navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
      } else if (isAccounts && mode === 'login') {
        const { user } = await loginAccounts({ email, password });
        setAuthState(USER_TYPES.ACCOUNTS, user.uid);
        toast.success('Welcome to Accounts!');
        navigate(ROUTES.ACCOUNTS_DASHBOARD, { replace: true });
      } else if (isAccounts && mode === 'register') {
        const user = await registerAccounts({ email, password });
        setAuthState(USER_TYPES.ACCOUNTS, user.uid);
        toast.success('Accounts account activated!');
        navigate(ROUTES.ACCOUNTS_DASHBOARD, { replace: true });
      } else if (mode === 'login') {
        const loginType = resolveLoginType(userType);
        const { user, userType: resolvedType } = await loginUser({ email, password, userType: loginType });
        setAuthState(resolvedType, user.uid);
        toast.success('Welcome back!');
        navigate(ROUTES.HOME, { replace: true });
      } else {
        const loginType = resolveLoginType(userType);
        const user = await registerUser({ email, password, userType: loginType });
        setAuthState(loginType, user.uid);
        toast.success('Account created!');
        navigate(ROUTES.HOME, { replace: true });
      }
    } catch (err) {
      setError(ERROR_MSGS[err.message] || ERROR_MSGS[err.code] || `Error: ${err.code || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In respects the exact same pre-registration gate as the
  // email/password flow above (see loginWithGoogle() in services/auth.js) —
  // it's just a different way to prove "I own this email", not a way around
  // needing that email pre-registered by the admin.
  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const loginType = isAdmin ? USER_TYPES.ADMIN
        : isAccounts ? USER_TYPES.ACCOUNTS
        : resolveLoginType(userType);
      const { user, userType: resolvedType } = await loginWithGoogle({ userType: loginType });
      setAuthState(resolvedType, user.uid);
      toast.success('Welcome!');
      navigate(
        resolvedType === USER_TYPES.ADMIN ? ROUTES.ADMIN_DASHBOARD
          : resolvedType === USER_TYPES.ACCOUNTS ? ROUTES.ACCOUNTS_DASHBOARD
          : ROUTES.HOME,
        { replace: true }
      );
    } catch (err) {
      // Cancelling the Google account picker isn't a real error — just go
      // back to the form quietly instead of showing a scary red banner.
      if (err.message !== 'GOOGLE_SIGNIN_CANCELLED' && err.code !== '12501') {
        setError(ERROR_MSGS[err.message] || ERROR_MSGS[err.code] || `Error: ${err.code || err.message}`);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex flex-col items-center pt-10 pb-5 px-6 bg-gradient-to-b from-gray-50 to-white">
        <img src="/school-crest.png" alt="Chung Wah" className="w-20 h-20 object-contain drop-shadow-md mb-3" />
        <h1 className="font-display font-extrabold text-gray-900 text-xl tracking-tight">Chung Wah</h1>
        <p className="text-gray-400 text-xs font-body">E-School Platform</p>
      </div>

      <div className="flex-1 px-6 pb-10">
        <div className="mb-5">
          <h2 className="font-display font-bold text-gray-900 text-2xl mb-1">
            {isAdmin ? 'Admin Sign In' : isAccounts ? 'Accounts Sign In'
              : mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-gray-400 font-body text-sm">
            {isAdmin ? 'Restricted to authorised administrators'
              : isAccounts ? 'Restricted to accounts staff'
              : mode === 'login' ? 'Sign in to your school account'
              : 'Activate your school account'}
          </p>
        </div>

        <div className="flex gap-1.5 mb-5 p-1 rounded-2xl bg-gray-100 border border-gray-200 overflow-x-auto">
          {USER_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => handleTypeChange(opt.value)}
              className="flex-shrink-0 px-3 py-2.5 rounded-xl font-display font-semibold text-xs transition-all duration-200"
              style={userType === opt.value ? { background: opt.color, color: '#fff' } : { color: '#9ca3af' }}>
              {opt.label}
            </button>
          ))}
        </div>

        {isAdmin && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-50 border border-purple-200 mb-4">
            <ShieldCheck size={15} className="text-purple-500 shrink-0 mt-0.5" />
            <p className="text-purple-600 text-xs font-body">Admin accounts are configured by the system administrator.</p>
          </div>
        )}
        {isAccounts && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 mb-4">
            <Calculator size={15} className="text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-emerald-600 text-xs font-body">Your email must be pre-registered by Admin before you can activate your account.</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-gray-500 text-xs font-body font-medium mb-1.5 block">Email</label>
            <input className="field" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" />
          </div>
          <div>
            <label className="text-gray-500 text-xs font-body font-medium mb-1.5 block">Password</label>
            <div className="relative">
              <input className="field pr-11" type={showPass ? 'text' : 'password'} placeholder="Your password"
                value={form.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isAdmin && !isAccounts && mode === 'register' && (
            <div>
              <label className="text-gray-500 text-xs font-body font-medium mb-1.5 block">Confirm Password</label>
              <input className="field" type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={set('confirmPassword')} />
            </div>
          )}
          {isAccounts && mode === 'register' && (
            <div>
              <label className="text-gray-500 text-xs font-body font-medium mb-1.5 block">Confirm Password</label>
              <input className="field" type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={set('confirmPassword')} />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm font-body">{error}</p>
            </div>
          )}

          <div className="flex justify-end -mt-1">
            <Link to="/forgot-password" className="text-xs font-body hover:underline" style={{ color: activeColor }}>Forgot password?</Link>
          </div>

          <button onClick={submit} disabled={loading || googleLoading}
            className="w-full h-14 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            style={{
              background: isAdmin ? 'linear-gradient(135deg,#a855f7,#7c3aed)'
                : isAccounts ? 'linear-gradient(135deg,#10b981,#059669)'
                : 'linear-gradient(135deg,#F4A334,#F9C61F)',
              color: isAdmin || isAccounts ? '#fff' : '#1a1f36',
            }}>
            {loading
              ? <div className="w-5 h-5 border-2 border-current opacity-40 border-t-current rounded-full animate-spin" />
              : isAdmin ? 'Sign In as Admin' : isAccounts ? (mode === 'login' ? 'Sign In to Accounts' : 'Activate Account')
              : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-xs font-body">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button onClick={handleGoogleSignIn} disabled={loading || googleLoading}
            className="w-full h-14 rounded-2xl font-display font-semibold text-sm flex items-center justify-center gap-2.5 disabled:opacity-50 transition-all bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
            {googleLoading
              ? <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
              : (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.92c1.7-1.57 2.68-3.88 2.68-6.64z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.27c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34C2.44 15.98 5.48 18 9 18z"/>
                    <path fill="#FBBC05" d="M3.97 10.71A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.71V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.34z"/>
                    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.95l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z"/>
                  </svg>
                  Continue with Google
                </>
              )}
          </button>

          {!isAdmin && (
            <p className="text-center text-gray-400 font-body text-sm">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
                className="font-semibold hover:underline" style={{ color: activeColor }}>
                {mode === 'login' ? 'Register' : 'Sign In'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
