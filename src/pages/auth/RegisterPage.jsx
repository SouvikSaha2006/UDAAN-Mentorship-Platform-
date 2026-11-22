import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus, ShieldCheck, Accessibility, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getRoleDashboardPath } from '../../utils/helpers';
import { apiClient } from '../../services/apiClient';

const registerSchema = z
  .object({
    role: z.enum(['student', 'mentor']),
    name: z.string().min(2, 'Full name must contain at least 2 characters'),
    email: z.string().email('Please enter a valid institutional email address'),
    phone: z.string().optional(),
    department: z.string().min(2, 'Department selection is required'),
    course: z.string().optional(),
    semester: z.string().optional(),
    disabilityType: z.string().optional(),
    preferredCommunication: z.string().optional(),
    accommodationNeeds: z.string().optional(),
    qualification: z.string().optional(),
    experienceYears: z.string().optional(),
    expertise: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match. Please re-enter your password.',
    path: ['confirmPassword'],
  });

const DEFAULT_DEPARTMENTS = [
  { code: 'CSE', name: 'Computer Science & Engineering' },
  { code: 'ECE', name: 'Electronics & Communication' },
  { code: 'MDS', name: 'Mathematics & Data Science' },
  { code: 'DES', name: 'Design & Humanities' },
];

const DISABILITY_OPTIONS = [
  'None / Not Disclosed',
  'Visual Impairment (Low Vision / Blindness)',
  'Hearing Impairment (Hard of Hearing / Deaf)',
  'Locomotor Disability / Wheelchair User',
  'Specific Learning Disability (Dyslexia)',
  'Neurodivergent / ADHD',
  'Multiple / Other Accommodations',
];

const COMMUNICATION_MODES = [
  { value: 'text', label: 'Written Text & Chat (Screen-Reader Optimized)' },
  { value: 'captioned video', label: 'Live Video with Captions & Transcripts' },
  { value: 'audio', label: 'High-Clarity Audio Narration' },
  { value: 'sign language', label: 'Indian Sign Language (ISL) Interpreter' },
];

const COMMON_ASSISTIVE_NEEDS = [
  'Screen Reader Support',
  'Extended Exam Time (+30 mins)',
  'High Contrast UI',
  'Dyslexia-Friendly Reading Mode',
  'Video Transcripts & Captions',
  'Ground-Floor / Ramp Lab Access',
];

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [semesterOptions, setSemesterOptions] = useState([
    '1st Semester', '2nd Semester', '3rd Semester', '4th Semester',
    '5th Semester', '6th Semester', '7th Semester', '8th Semester',
  ]);
  const [selectedNeeds, setSelectedNeeds] = useState(['Screen Reader Support']);

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
      disabilityType: 'None / Not Disclosed',
      preferredCommunication: 'text',
      phone: '+91 98765 43210',
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
        // Fallback silently
      }
    }
    loadDepartments();
    return () => { isMounted = false; };
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
          if (!courses.some((c) => c.name === selectedCourse)) {
            setValue('course', courses[0].name);
            setSemesterOptions(courses[0].semesterOptions || []);
            setValue('semester', courses[0].semesterOptions?.[0] || '1st Semester');
          }
        }
      } catch {
        // Fallback
      }
    }
    loadCourses();
    return () => { isMounted = false; };
  }, [selectedDepartment, departments, setValue, selectedCourse]);

  // Update semester options when course changes
  useEffect(() => {
    if (!selectedCourse || availableCourses.length === 0) return;
    const foundCourse = availableCourses.find((c) => c.name === selectedCourse || c.code === selectedCourse);
    if (foundCourse && foundCourse.semesterOptions?.length > 0) {
      setSemesterOptions(foundCourse.semesterOptions);
    }
  }, [selectedCourse, availableCourses]);

  const toggleNeed = (need) => {
    setSelectedNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    );
  };

  const onSubmit = async (values) => {
    setErrorMsg('');
    setIsSubmitting(true);

    const payload = {
      ...values,
      assistiveDevices: selectedNeeds,
      accessibilityNeeds: selectedNeeds,
    };

    try {
      // 1. Feature 1 & 6: Real backend registration with atomic Student ID generation
      const res = await registerUser(payload);
      if (!res.ok) {
        setErrorMsg(res.error || 'Registration failed.');
        setIsSubmitting(false);
        return;
      }
      const studentId = res.user?.studentId || res.user?.student_id;
      showToast(
        studentId
          ? `Welcome to UDAAN! Generated Student ID: ${studentId}`
          : 'Account created and authenticated!',
        'success'
      );
      navigate(getRoleDashboardPath(res.user.role));
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred during registration.');
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
          Register with accessible onboarding, deterministic Student ID allocation, and personal accommodations.
        </p>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-3 my-6" role="tablist" aria-label="Registration role selection">
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
              {errors.name && (
                <p role="alert" aria-live="polite" className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-semibold mb-1.5">
                Institutional Email Address
              </label>
              <input id="reg-email" type="email" {...register('email')} className="input-field" placeholder="priya@udaan.edu" />
              {errors.email && (
                <p role="alert" aria-live="polite" className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="department" className="block text-sm font-semibold mb-1.5">
                Academic Department
              </label>
              <select id="department" {...register('department')} className="input-field">
                {departments.map((dept) => (
                  <option key={dept.id || dept.code} value={dept.name}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold mb-1.5">
                Contact Phone Number
              </label>
              <input id="phone" {...register('phone')} className="input-field" placeholder="+91 98765 43210" />
            </div>
          </div>

          {role === 'student' ? (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="course" className="block text-sm font-semibold mb-1.5">
                    Course / Degree Program
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
                    Semester Level
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

              {/* Feature 1: Specially Abled Student Fields */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <Accessibility className="w-4 h-4 text-violet-600" /> Assistive Profile & Accommodations
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="disabilityType" className="block text-xs font-semibold mb-1">
                      Disability Category
                    </label>
                    <select id="disabilityType" {...register('disabilityType')} className="input-field text-xs">
                      {DISABILITY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="preferredCommunication" className="block text-xs font-semibold mb-1">
                      Preferred Communication Mode
                    </label>
                    <select id="preferredCommunication" {...register('preferredCommunication')} className="input-field text-xs">
                      {COMMUNICATION_MODES.map((mode) => (
                        <option key={mode.value} value={mode.value}>
                          {mode.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold mb-2">Assistive Requirements & Learning Accommodations:</span>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {COMMON_ASSISTIVE_NEEDS.map((need) => {
                      const isSelected = selectedNeeds.includes(need);
                      return (
                        <button
                          key={need}
                          type="button"
                          onClick={() => toggleNeed(need)}
                          aria-pressed={isSelected}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-royal-50 dark:bg-royal-950/50 border-royal-500 text-royal-800 dark:text-royal-200'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-royal-600' : 'text-slate-400'}`} />
                          <span>{need}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="qualification" className="block text-sm font-semibold mb-1.5">
                  Academic Qualification
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
                  placeholder="Min. 6 characters"
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
              {errors.password && (
                <p role="alert" aria-live="polite" className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
                  {errors.password.message}
                </p>
              )}
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
                placeholder="Re-enter password"
              />
              {errors.confirmPassword && (
                <p role="alert" aria-live="polite" className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-3 mt-2 disabled:opacity-60"
          >
            <UserPlus className="w-4 h-4" /> {isSubmitting ? 'Registering Account...' : `Complete ${role === 'student' ? 'Student' : 'Mentor'} Registration`}
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
