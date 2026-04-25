// src/pages/auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginUser, registerUser, loginAdmin } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import { USER_TYPES, ROUTES } from '../../utils/constants';

const USER_OPTIONS = [
  { label: 'Student', value: USER_TYPES.STUDENT, color: '#F4A334' },
  { label: 'Parent / Teacher', value: USER_TYPES.TEACHER, color: '#F9C61F' },
  { label: 'Admin', value: USER_TYPES.ADMIN, color: '#a855f7' },
];

const ERROR_MSGS = {
  'USER_NOT_FOUND': 'No account found with that email.',
  'USER_NOT_PREREGISTERED': 'Your email has not been pre-registered by the school admin yet.',
  'NOT_AN_ADMIN': 'This account does not have admin access for this school.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/email-already-in-use': 'Email already registered.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/invalid-api-key': 'App configuration error. Contact support.',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
};

export default function Login() {
  const navigate = useNavigate();
  const { refreshUserType } = useAuth();
  const [mode, setMode] = useState('login');
  const [userType, setUserType] = useState(USER_TYPES.STUDENT);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ schoolCode: '', email: '', password: '', confirmPassword: '' });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const isAdmin = userType === USER_TYPES.ADMIN;

  const handleTypeChange = (type) => {
    setUserType(type);
    setError('');
    if (type === USER_TYPES.ADMIN) setMode('login'); // admin is always login-only
  };

  const submit = async () => {
    setError('');
    const { schoolCode, email, password, confirmPassword } = form;
    if (!schoolCode.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!isAdmin && mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      if (isAdmin) {
        await loginAdmin({ email, password, schoolCode });
        refreshUserType();
        toast.success('Welcome, Admin!');
        navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
      } else if (mode === 'login') {
        await loginUser({ email, password, schoolCode, userType });
        refreshUserType();
        toast.success('Welcome back!');
        navigate(ROUTES.HOME, { replace: true });
      } else {
        await registerUser({ email, password, schoolCode, userType });
        refreshUserType();
        toast.success('Account created!');
        navigate(ROUTES.PROFILE, { replace: true });
      }
    } catch (err) {
      setError(ERROR_MSGS[err.message] || ERROR_MSGS[err.code] || `Error: ${err.code || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      {/* School crest header */}
      <div className="flex flex-col items-center pt-12 pb-5 px-6">
        <img src="/school-crest.png" alt="Chung Wah School Crest"
          className="w-24 h-24 object-contain drop-shadow-lg mb-3" />
        <h1 className="font-display font-extrabold text-white text-xl tracking-tight">Chung Wah</h1>
        <p className="text-white/40 text-xs font-body">E-School Platform</p>
      </div>

      <div className="flex-1 px-6">
        <div className="mb-5">
          <h2 className="font-display font-bold text-white text-2xl mb-1">
            {isAdmin ? 'Admin Sign In' : mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-white/40 font-body text-sm">
            {isAdmin
              ? 'Your credentials are set up in Firebase'
              : mode === 'login' ? 'Sign in to your school account' : 'Join your school platform'}
          </p>
        </div>

        {/* User type tabs */}
        <div className="flex gap-1.5 mb-5 p-1 rounded-2xl bg-white/5 border border-white/8">
          {USER_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => handleTypeChange(opt.value)}
              className={`flex-1 py-2.5 rounded-xl font-display font-semibold text-xs transition-all duration-200
                ${userType === opt.value ? 'text-navy-900 shadow-sm' : 'text-white/50 hover:text-white/80'}`}
              style={userType === opt.value ? { background: opt.color } : {}}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Admin info notice */}
        {isAdmin && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-500/15 border border-purple-500/25 mb-4">
            <ShieldCheck size={16} className="text-purple-400 shrink-0 mt-0.5" />
            <p className="text-purple-300 text-xs font-body">
              Admin accounts are configured in Firebase. Contact your system administrator if you need access.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-white/60 text-xs font-body font-medium mb-1.5 block">School Code</label>
            <input className="field" placeholder="Your school code" value={form.schoolCode}
              onChange={set('schoolCode')} autoCapitalize="characters" />
          </div>

          <div>
            <label className="text-white/60 text-xs font-body font-medium mb-1.5 block">Email</label>
            <input className="field" type="email" placeholder="you@example.com" value={form.email}
              onChange={set('email')} autoComplete="email" />
          </div>

          <div>
            <label className="text-white/60 text-xs font-body font-medium mb-1.5 block">Password</label>
            <div className="relative">
              <input className="field pr-11" type={showPass ? 'text' : 'password'}
                placeholder="Your password" value={form.password} onChange={set('password')}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isAdmin && mode === 'register' && (
            <div>
              <label className="text-white/60 text-xs font-body font-medium mb-1.5 block">Confirm Password</label>
              <input className="field" type="password" placeholder="Re-enter password"
                value={form.confirmPassword} onChange={set('confirmPassword')} />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-coral-500/15 border border-coral-500/25">
              <AlertCircle size={16} className="text-coral-400 shrink-0 mt-0.5" />
              <p className="text-coral-300 text-sm font-body">{error}</p>
            </div>
          )}

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-gold-400 text-sm font-body hover:text-gold-300 transition-colors">
              Forgot password?
            </Link>
          </div>

          <button onClick={submit} disabled={loading}
            className="w-full h-14 rounded-2xl font-display font-bold text-base
                       flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{
              background: isAdmin ? 'linear-gradient(135deg, #a855f7, #7c3aed)' : 'linear-gradient(135deg, #F4A334, #F9C61F)',
              color: isAdmin ? 'white' : '#0a0f2c',
            }}>
            {loading ? (
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-current opacity-60"
                    style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
                ))}
              </div>
            ) : isAdmin ? 'Sign In as Admin' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {/* Register toggle — hidden for admin */}
          {!isAdmin && (
            <p className="text-center text-white/50 font-body text-sm pb-8">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
                className="text-gold-400 font-semibold hover:text-gold-300 transition-colors">
                {mode === 'login' ? 'Register' : 'Sign In'}
              </button>
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
      `}</style>
    </div>
  );
}
