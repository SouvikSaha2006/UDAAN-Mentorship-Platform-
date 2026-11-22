import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ShieldCheck, LogIn, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DEMO_ACCOUNTS } from '../../data/mockUsers';
import { getRoleDashboardPath, getRoleLabel } from '../../utils/helpers';

const loginSchema = z.object({
  role: z.enum(['student', 'mentor', 'faculty', 'support', 'admin']),
  email: z.string().email('Please enter a valid institutional email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role');
  const validRole = ['student', 'mentor', 'faculty', 'support', 'admin'].includes(initialRole)
    ? initialRole
    : 'student';

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, loginWithDemoRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: validRole,
      email: `${validRole}@udaan.edu`,
      password: 'Password@123',
      rememberMe: true,
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (initialRole && ['student', 'mentor', 'faculty', 'support', 'admin'].includes(initialRole)) {
      setValue('role', initialRole);
      setValue('email', `${initialRole}@udaan.edu`);
    }
  }, [initialRole, setValue]);

  const onSubmit = async (values) => {
    setAuthError('');
    setIsSubmitting(true);
    try {
      const result = await login(values);
      if (!result.ok) {
        setAuthError(result.error);
        setIsSubmitting(false);
        return;
      }
      showToast(`Welcome back, ${result.user.name}!`, 'success', 'Signed In');
      navigate(getRoleDashboardPath(result.user.role));
    } catch (err) {
      setAuthError(err.message || 'Unable to sign in. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = async (role) => {
    setAuthError('');
    setIsSubmitting(true);
    try {
      const result = await loginWithDemoRole(role);
      if (result.ok) {
        showToast(`Signed in as ${result.user.name} (${getRoleLabel(role)})`, 'success');
        navigate(getRoleDashboardPath(role));
      } else {
        setAuthError(result.error || 'Failed to sign in with demo account.');
      }
    } catch (err) {
      setAuthError(err.message || 'Demo sign in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Login Form */}
        <div className="lg:col-span-7 card-surface p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-royal-600 dark:text-royal-400">
                <ShieldCheck className="w-4 h-4" /> UDAAN Authentication
              </span>
              <h1 className="text-2xl font-extrabold text-navy-950 dark:text-white mt-1">
                Sign In to UDAAN
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Access your role-based mentorship, academic, or support workspace.
              </p>
            </div>
          </div>

          {authError && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-4 py-3 text-sm text-rose-800 dark:text-rose-200 font-medium"
            >
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label htmlFor="role" className="block text-sm font-semibold mb-1.5">
                Select User Role
              </label>
              <select
                id="role"
                {...register('role')}
                onChange={(e) => {
                  const nextRole = e.target.value;
                  setValue('role', nextRole);
                  setValue('email', `${nextRole}@udaan.edu`);
                }}
                className="input-field"
              >
                <option value="student">Student</option>
                <option value="mentor">Mentor</option>
                <option value="faculty">Faculty Member</option>
                <option value="support">Support Coordinator</option>
                <option value="admin">College Administrator</option>
              </select>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-1.5">
                Institutional Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className="input-field"
                placeholder="name@udaan.edu"
              />
              {errors.email && (
                <p role="alert" aria-live="polite" className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  className="input-field pr-11"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p role="alert" aria-live="polite" className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 text-sm">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="rounded border-slate-300 text-royal-600 focus:ring-royal-500"
                />
                <span className="text-slate-600 dark:text-slate-300">Remember me on this browser</span>
              </label>
              <Link to="/forgot-password" className="font-semibold text-royal-600 dark:text-royal-400 hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" /> {isSubmitting ? 'Signing In...' : `Sign In as ${getRoleLabel(selectedRole)}`}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            New to UDAAN?{' '}
            <Link to="/register" className="font-bold text-royal-600 dark:text-royal-400 hover:underline">
              Create a Student or Mentor Account
            </Link>
          </p>
        </div>

        {/* One-Click Demo Accounts Panel */}
        <div className="lg:col-span-5 card-surface p-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-royal-600 dark:text-royal-400" aria-hidden="true" />
            <h2 className="text-base font-extrabold text-navy-950 dark:text-white">
              Quick Role Sign-In
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
            Click any role below to authenticate directly with the real backend database (default password: <code className="font-mono font-bold">Password@123</code>).
          </p>

          <div className="space-y-2.5">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleQuickDemo(acc.role)}
                disabled={isSubmitting}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 hover:border-royal-500 hover:bg-royal-50/40 dark:hover:bg-royal-950/30 transition-all flex items-center justify-between gap-3 disabled:opacity-60"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{acc.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {getRoleLabel(acc.role)} · {acc.email}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-royal-50 text-royal-700 dark:bg-royal-950 dark:text-royal-300 shrink-0">
                  Enter
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
