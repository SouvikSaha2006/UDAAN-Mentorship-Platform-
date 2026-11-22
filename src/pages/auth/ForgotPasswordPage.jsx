import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('student@udaan.edu');
  const [resetCode, setResetCode] = useState('');
  const [demoCodeHint, setDemoCodeHint] = useState('UDAAN-2026');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { requestPasswordReset, resetPassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const codeInputRef = useRef(null);
  const completeBtnRef = useRef(null);

  // Accessible focus management between steps
  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => {
        codeInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
    if (step === 3) {
      const timer = setTimeout(() => {
        completeBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const res = await requestPasswordReset(cleanEmail);
      if (!res.ok) {
        setError(res.error || 'Failed to dispatch reset code. Please try again.');
        showToast(res.error || 'Failed to dispatch reset code.', 'error');
        return;
      }

      const generatedCode = res.data?.demo_code || 'UDAAN-2026';
      setDemoCodeHint(generatedCode);
      setResetCode(generatedCode);

      setStep(2);
      showToast(
        res.data?.demo_code
          ? `Reset code dispatched! Dev code: ${res.data.demo_code} (also in server console)`
          : 'Password reset verification code dispatched to your email.',
        'info'
      );
    } catch (err) {
      setError(err.message || 'Unable to connect to the reset service.');
      showToast('Connection error. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    if (!resetCode.trim()) {
      setError('Please enter the verification code.');
      codeInputRef.current?.focus();
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const res = await resetPassword(email.trim().toLowerCase(), resetCode.trim(), newPassword);
      if (!res.ok) {
        setError(res.error || 'Invalid or expired verification code.');
        showToast(res.error || 'Password reset failed.', 'error');
        return;
      }

      setStep(3);
      showToast('Password updated successfully! Please sign in.', 'success');
    } catch (err) {
      setError(err.message || 'Error updating password.');
      showToast(err.message || 'Password update failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <div className="card-surface p-6 sm:p-8">
        <div className="w-11 h-11 rounded-xl bg-royal-50 dark:bg-royal-950/60 text-royal-600 dark:text-royal-400 flex items-center justify-center mb-4">
          <KeyRound className="w-5 h-5" aria-hidden="true" />
        </div>
        <h1
          id="fp-heading"
          className="text-2xl font-extrabold text-navy-950 dark:text-white"
          tabIndex={-1}
        >
          {step === 3
            ? 'Password Reset Complete'
            : step === 2
            ? 'Verify Code & Set Password'
            : 'Reset Password'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {step === 3
            ? 'Your credentials have been securely updated.'
            : step === 2
            ? 'Enter the 6-digit verification code sent to your email.'
            : 'Enter your registered email to receive a single-use verification code.'}
        </p>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-medium border border-rose-200 dark:border-rose-800"
          >
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRequestReset} className="mt-5 space-y-4" noValidate>
            <div>
              <label htmlFor="fp-email" className="block text-sm font-semibold mb-1.5">
                Registered Email Address
              </label>
              <input
                id="fp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                required
                autoComplete="email"
                aria-describedby="fp-email-hint"
              />
              <span id="fp-email-hint" className="sr-only">
                Enter your university or registered institutional email address.
              </span>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Dispatching Code...</span>
                </>
              ) : (
                'Send Verification Code'
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleConfirmReset} className="mt-5 space-y-4" noValidate>
            <div
              role="region"
              aria-label="Development verification code hint"
              className="p-3 rounded-xl bg-royal-50 dark:bg-royal-950/40 text-xs text-royal-800 dark:text-royal-200 border border-royal-200 dark:border-royal-800/60"
            >
              Verification Code dispatched to <strong>{email}</strong>.
              {demoCodeHint && (
                <div className="mt-1">
                  Local Dev / Demo Code: <strong>{demoCodeHint}</strong> (also printed in server terminal).
                </div>
              )}
            </div>
            <div>
              <label htmlFor="fp-code" className="block text-sm font-semibold mb-1.5">
                Verification Code
              </label>
              <input
                ref={codeInputRef}
                id="fp-code"
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                className="input-field font-mono uppercase tracking-wider"
                placeholder="6-digit code or UDAAN-2026"
                required
                autoComplete="one-time-code"
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
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Updating Password...</span>
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="mt-5 space-y-4">
            <div
              role="status"
              aria-live="polite"
              className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-sm text-emerald-800 dark:text-emerald-200"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>
                Your password for <strong>{email}</strong> has been updated. All previous sessions have been signed out.
              </span>
            </div>
            <button
              ref={completeBtnRef}
              id="fp-return-btn"
              type="button"
              onClick={() => navigate('/login')}
              className="btn-primary w-full"
            >
              Return to Sign In
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-royal-600 dark:hover:text-royal-400"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
