import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getRoleDashboardPath } from '../../utils/helpers';
import { apiClient } from '../../services/apiClient';

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

const DEFAULT_DEPARTMENTS = [
  { code: 'CSE', name: 'Computer Science & Engineering' },
  { code: 'ECE', name: 'Electronics & Communication' },
  { code: 'MDS', name: 'Mathematics & Data Science' },
  { code: 'DES', name: 'Design & Humanities' },
];

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [semesterOptions, setSemesterOptions] = useState([
    '1st Semester',
    '2nd Semester',
    '3rd Semester',
    '4th Semester',
    '5th Semester',
    '6th Semester',
    '7th Semester',
    '8th Semester',
  ]);

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
      course: 'B.Tech Computer Science & Engineering',
      semester: '1st Semester',
    },
  });

  const role = watch('role');
  const selectedDepartment = watch('department');
  const selectedCourse = watch('course');

  // Feature 8: Fetch real active departments from API on mount
  useEffect(() => {
    let isMounted = true;
    async function loadDepartments() {
      try {
        const data = await apiClient.academics.getDepartments();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setDepartments(data);
        }
      } catch {
        // Fallback to DEFAULT_DEPARTMENTS silently
      }
    }
    loadDepartments();
    return () => {
      isMounted = false;
    };
  }, []);

  // Feature 8: Dynamically fetch courses whenever the selected department changes
  useEffect(() => {
    let isMounted = true;
    async function loadCourses() {
      if (!selectedDepartment) return;
      const deptObj = departments.find(
        (d) => d.name === selectedDepartment || d.code === selectedDepartment
      );
      const deptKey = deptObj ? (deptObj.id || deptObj.code) : selectedDepartment;

      try {
        const courses = await apiClient.academics.getDepartmentCourses(deptKey);
        if (isMounted && Array.isArray(courses) && courses.length > 0) {
          setAvailableCourses(courses);
          // Set initial course if current is not in list
          if (!courses.some((c) => c.name === selectedCourse)) {
            setValue('course', courses[0].name);
            setSemesterOptions(courses[0].semesterOptions || []);
            setValue('semester', courses[0].semesterOptions?.[0] || '1st Semester');
          }
        }
      } catch {
        // Fallback: static courses for common departments
        if (selectedDepartment.includes('Computer')) {
          setAvailableCourses([
            {
              code: 'BTECH-CSE',
              name: 'B.Tech Computer Science & Engineering',
              semesterOptions: [
                '1st Semester', '2nd Semester', '3rd Semester', '4th Semester',
                '5th Semester', '6th Semester', '7th Semester', '8th Semester',
              ],
            },
          ]);
        }
      }
    }
    loadCourses();
    return () => {
      isMounted = false;
    };
  }, [selectedDepartment, departments, setValue, selectedCourse]);

  // Update semester options when course changes
  useEffect(() => {
    if (!selectedCourse || availableCourses.length === 0) return;
    const foundCourse = availableCourses.find((c) => c.name === selectedCourse || c.code === selectedCourse);
    if (foundCourse && foundCourse.semesterOptions?.length > 0) {
      setSemesterOptions(foundCourse.semesterOptions);
    }
  }, [selectedCourse, availableCourses]);

  const onSubmit = async (values) => {
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      // 1. Try real backend registration (Features 6, 8, 9)
      const res = await apiClient.auth.register(values);
      const studentId = res.user?.studentId || res.user?.student_id;
      showToast(
        studentId
          ? `Welcome to UDAAN! Generated Student ID: ${studentId}`
          : 'Account created and authenticated!',
        'success'
      );
      navigate(getRoleDashboardPath(res.user.role));
    } catch (apiErr) {
      // 2. If backend is offline or returns error, try local fallback registration
      const localRes = registerUser(values);
      if (!localRes.ok) {
        setErrorMsg(apiErr.message || localRes.error);
        setIsSubmitting(false);
        return;
      }
      showToast('Account registered (Local storage mode)!', 'success');
      navigate(getRoleDashboardPath(localRes.user.role));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="card-surface p-6 sm:p-8">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-royal-600 dark:text-royal-400">
          <ShieldCheck className="w-4 h-4" /> UDAAN Registration
        </span>
        <h1 className="text-2xl font-extrabold text-navy-950 dark:text-white mt-1">
          Join UDAAN Mentorship Community
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Register as a Student or Mentor with deterministic student ID assignment and academic validation.
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
            aria-live="assertive"
            className="mb-5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-4 py-3 text-sm text-rose-800 dark:text-rose-200 font-medium"
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
              {departments.map((dept) => (
                <option key={dept.id || dept.code} value={dept.name}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>

          {role === 'student' ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="course" className="block text-sm font-semibold mb-1.5">
                  Course / Program
                </label>
                {availableCourses.length > 0 ? (
                  <select id="course" {...register('course')} className="input-field">
                    {availableCourses.map((c) => (
                      <option key={c.id || c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input id="course" {...register('course')} className="input-field" />
                )}
              </div>
              <div>
                <label htmlFor="semester" className="block text-sm font-semibold mb-1.5">
                  Semester (Academic Level)
                </label>
                <select id="semester" {...register('semester')} className="input-field">
                  {semesterOptions.map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-3 mt-2 disabled:opacity-60"
          >
            <UserPlus className="w-4 h-4" /> {isSubmitting ? 'Registering...' : `Complete ${role === 'student' ? 'Student' : 'Mentor'} Registration`}
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
