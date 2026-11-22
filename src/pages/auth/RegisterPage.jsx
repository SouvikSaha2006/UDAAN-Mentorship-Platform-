import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getRoleDashboardPath } from '../../utils/helpers';

const registerSchema = z
  .object({
    role: z.enum(['student', 'mentor']),
    name: z.string().min(2, 'Full name is required'),
    email: z.string().email('Valid email address is required'),
    department: z.string().min(2, 'Department is required'),
    course: z.string().optional(),
    semester: z.string().optional(),
    qualification: z.string().optional(),
    experienceYears: z.string().optional(),
    expertise: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { register: registerUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'student',
      department: 'Computer Science & Engineering',
      course: 'B.Tech Computer Science',
      semester: '3rd Semester',
    },
  });

  const role = watch('role');

  const onSubmit = (values) => {
    setErrorMsg('');
    const res = registerUser(values);
    if (!res.ok) {
      setErrorMsg(res.error);
      return;
    }
    showToast('Demo account created and signed in!', 'success');
    navigate(getRoleDashboardPath(res.user.role));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="card-surface p-6 sm:p-8">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-royal-600 dark:text-royal-400">
          <ShieldCheck className="w-4 h-4" /> Frontend Demo Registration
        </span>
        <h1 className="text-2xl font-extrabold text-navy-950 dark:text-white mt-1">
          Join UDAAN Mentorship Community
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Register as a Student or Mentor. All data is saved locally in your browser.
        </p>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-3 my-6" role="tablist" aria-label="Registration role">
          <button
            type="button"
            role="tab"
            aria-selected={role === 'student'}
            onClick={() => setValue('role', 'student')}
            className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all ${
              role === 'student'
                ? 'bg-royal-600 text-white border-royal-600 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            Student Registration
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === 'mentor'}
            onClick={() => setValue('role', 'mentor')}
            className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all ${
              role === 'mentor'
                ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            Mentor Registration
          </button>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-4 py-3 text-sm text-rose-800 dark:text-rose-200"
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold mb-1.5">
                Full Name
              </label>
              <input id="name" {...register('name')} className="input-field" placeholder="e.g., Priya Nair" />
              {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-semibold mb-1.5">
                Email Address
              </label>
              <input id="reg-email" type="email" {...register('email')} className="input-field" placeholder="priya@udaan.edu" />
              {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-semibold mb-1.5">
              Department
            </label>
            <select id="department" {...register('department')} className="input-field">
              <option>Computer Science & Engineering</option>
              <option>Electronics & Communication</option>
              <option>Mathematics & Data Science</option>
              <option>Design & Humanities</option>
            </select>
          </div>

          {role === 'student' ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="course" className="block text-sm font-semibold mb-1.5">
                  Course / Program
                </label>
                <input id="course" {...register('course')} className="input-field" />
              </div>
              <div>
                <label htmlFor="semester" className="block text-sm font-semibold mb-1.5">
                  Semester
                </label>
                <select id="semester" {...register('semester')} className="input-field">
                  <option>1st Semester</option>
                  <option>3rd Semester</option>
                  <option>5th Semester</option>
                  <option>7th Semester</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="qualification" className="block text-sm font-semibold mb-1.5">
                  Qualification
                </label>
                <input id="qualification" {...register('qualification')} className="input-field" placeholder="e.g., M.Tech / Ph.D." />
              </div>
              <div>
                <label htmlFor="experienceYears" className="block text-sm font-semibold mb-1.5">
                  Years of Experience
                </label>
                <input id="experienceYears" type="number" min="1" {...register('experienceYears')} className="input-field" placeholder="5" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="expertise" className="block text-sm font-semibold mb-1.5">
                  Areas of Expertise (comma-separated)
                </label>
                <input id="expertise" {...register('expertise')} className="input-field" placeholder="Web Accessibility, Python, Career Prep" />
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-password" className="block text-sm font-semibold mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="input-field pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-600 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-1.5">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                className="input-field"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-rose-600 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-3 mt-2">
            <UserPlus className="w-4 h-4" /> Complete {role === 'student' ? 'Student' : 'Mentor'} Registration
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-royal-600 dark:text-royal-400 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
