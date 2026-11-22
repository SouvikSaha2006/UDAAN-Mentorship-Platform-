import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('student@udaan.edu');
  const [resetCode, setResetCode] = useState('UDAAN-2026');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const { resetPasswordDemo } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleRequestReset = (e) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Please enter a valid demo email address.');
      return;
    }
    setError('');
    setStep(2);
    showToast('Demo verification code generated: UDAAN-2026', 'info');
  };

  const handleConfirmReset = (e) => {
    e.preventDefault();
    if (resetCode.trim().toUpperCase() !== 'UDAAN-2026') {
      setError('Invalid demo reset code. Use UDAAN-2026.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    const res = resetPasswordDemo(email, newPassword);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setError('');
    setStep(3);
    showToast('Password updated in demo storage!', 'success');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <div className="card-surface p-6 sm:p-8">
        <div className="w-11 h-11 rounded-xl bg-royal-50 dark:bg-royal-950/60 text-royal-600 dark:text-royal-400 flex items-center justify-center mb-4">
          <KeyRound className="w-5 h-5" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-extrabold text-navy-950 dark:text-white">
          {step === 3 ? 'Password Reset Complete' : 'Reset Demo Password'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Frontend simulated password recovery for UDAAN demo accounts.
        </p>

        {error && (
          <div role="alert" className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-medium border border-rose-200 dark:border-rose-800">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRequestReset} className="mt-5 space-y-4">
            <div>
              <label htmlFor="fp-email" className="block text-sm font-semibold mb-1.5">
                Registered Email
              </label>
              <input
                id="fp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Send Demo Reset Code
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleConfirmReset} className="mt-5 space-y-4">
            <div className="p-3 rounded-xl bg-royal-50 dark:bg-royal-950/40 text-xs text-royal-800 dark:text-royal-200">
              Demo verification code: <strong>UDAAN-2026</strong>
            </div>
            <div>
              <label htmlFor="fp-code" className="block text-sm font-semibold mb-1.5">
                Verification Code
              </label>
              <input
                id="fp-code"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label htmlFor="fp-new" className="block text-sm font-semibold mb-1.5">
                New Password
              </label>
              <input
                id="fp-new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
                placeholder="Minimum 6 characters"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Update Password
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-sm text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Your demo password for {email} has been updated.</span>
            </div>
            <button type="button" onClick={() => navigate('/login')} className="btn-primary w-full">
              Return to Login
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-royal-600">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
