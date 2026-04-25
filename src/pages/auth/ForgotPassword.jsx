// src/pages/auth/ForgotPassword.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { resetPassword } from '../../services/auth';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (e) {
      toast.error('Could not send reset email. Check the address and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-bg flex flex-col px-6 pt-14">
      <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2 text-white/60 hover:text-white transition-colors w-fit">
        <ArrowLeft size={18} /> Back
      </button>

      {sent ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle size={40} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="font-display font-bold text-white text-2xl mb-2">Email Sent!</h2>
            <p className="text-white/50 font-body">Check your inbox for the password reset link.</p>
          </div>
          <button onClick={() => navigate(-1)} className="btn-gradient w-full h-12 rounded-2xl font-display font-bold text-navy-900">
            Back to Login
          </button>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gold-500/20 flex items-center justify-center mb-4">
              <Mail size={28} className="text-gold-400" />
            </div>
            <h2 className="font-display font-bold text-white text-2xl mb-2">Reset Password</h2>
            <p className="text-white/50 font-body text-sm">Enter your registered email address and we'll send you a recovery link.</p>
          </div>

          <div className="flex flex-col gap-4">
            <input
              className="field"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <button
              onClick={submit}
              disabled={loading || !email.trim()}
              className="h-14 rounded-2xl btn-gradient font-display font-bold text-navy-900 text-base disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Recovery Email'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
