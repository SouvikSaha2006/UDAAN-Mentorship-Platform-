import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  Users,
  Headphones,
  Accessibility,
  GraduationCap,
  LifeBuoy,
  Briefcase,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Target,
  Quote,
} from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';

export default function LandingPage() {
  const { settings } = useAccessibility();

  const fadeUp = settings.reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.45 },
      };

  const features = [
    {
      icon: Users,
      title: 'Personalized Mentorship',
      desc: 'Browse experienced mentors, filter by subject or expertise, and match with mentors aligned to your communication style.',
      color: 'bg-royal-50 text-royal-600 dark:bg-royal-950/60 dark:text-royal-400',
    },
    {
      icon: Target,
      title: 'Structured Learning Plans',
      desc: 'Track academic goals, career milestones, weekly tasks, and mentor recommendations in one clear roadmap.',
      color: 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400',
    },
    {
      icon: Headphones,
      title: 'Assistive Learning Hub',
      desc: 'Built-in Text-to-Speech reader, Speech-to-Text notes, adjustable speed, transcripts, and simplified reading view.',
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    },
    {
      icon: LifeBuoy,
      title: 'Student Support Coordination',
      desc: 'Request exam accommodations, assistive technology, mobility logistics, and track coordinator updates transparently.',
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    },
    {
      icon: GraduationCap,
      title: 'Academic Management',
      desc: 'Stay on top of accessible timetables, subject attendance, flexible assignments, and confirmed exam accommodations.',
      color: 'bg-navy-50 text-navy-700 dark:bg-navy-900/70 dark:text-navy-300',
    },
    {
      icon: Briefcase,
      title: 'Inclusive Career Pathways',
      desc: 'Explore internship opportunities from inclusive partners, resume prep checklists, and mentor career guidance.',
      color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
    },
  ];

  const testimonials = [
    {
      name: 'Aarav Sharma (Sample Student)',
      role: 'B.Tech CSE · 5th Semester',
      quote:
        'Having my mentor notes, exam accommodation passes, and Text-to-Speech study guides in one predictable dashboard transformed how I prepare for semester exams.',
    },
    {
      name: 'Dr. Meera Krishnan (Sample Mentor)',
      role: 'Accessibility Architect & Mentor',
      quote:
        'UDAAN lets me collaborate directly with students on weekly learning milestones while keeping every session transcript and note organized.',
    },
    {
      name: 'Ananya Deshmukh (Sample Coordinator)',
      role: 'Lead Student Support Coordinator',
      quote:
        'Support requests that once took weeks of email threads now move cleanly from Submitted to Approved with clear status tracking for students and faculty.',
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-950 via-navy-900 to-navy-800 text-white py-16 sm:py-24">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, #3b68f6 0%, transparent 45%), radial-gradient(circle at 80% 30%, #8b5cf6 0%, transparent 40%)',
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-amber-200 mb-5">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              UDAAN · Empowering Abilities. Enabling Futures.
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Every Ability Deserves an Opportunity.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-200 max-w-2xl leading-relaxed">
              UDAAN connects specially abled students with mentors, accessible learning resources, and personalized guidance to help them achieve their academic and career goals.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-royal-500 hover:bg-royal-400 text-white font-bold px-6 py-3.5 text-sm shadow-elevated transition-all"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login?role=student"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-6 py-3.5 text-sm transition-all"
              >
                Explore Mentorship
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 5 Role-Based Portals
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Accessibility className="w-4 h-4 text-amber-300" /> WCAG 2.2 AA Focused
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-royal-300" /> Interactive Frontend Demo
              </span>
            </div>
          </div>

          {/* Platform Preview Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-white/95 dark:bg-slate-900 text-slate-900 dark:text-white p-6 shadow-elevated border border-white/20">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-royal-600 dark:text-royal-400">
                    Platform Preview
                  </p>
                  <h2 className="text-base font-extrabold mt-0.5">Student Mentorship Snapshot</h2>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Sample View
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy-700 to-royal-600 text-white font-bold flex items-center justify-center text-xs">
                      MK
                    </div>
                    <div>
                      <p className="text-sm font-bold">Dr. Meera Krishnan</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Assigned Mentor · WCAG & DSA</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-royal-600 dark:text-royal-400">★ 4.9</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-royal-50/70 dark:bg-royal-950/40 border border-royal-100 dark:border-royal-900">
                    <p className="text-[11px] font-semibold text-royal-700 dark:text-royal-300">Next Session</p>
                    <p className="text-sm font-bold mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Nov 24 · 4:30 PM
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-violet-50/70 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900">
                    <p className="text-[11px] font-semibold text-violet-700 dark:text-violet-300">Learning Plan</p>
                    <p className="text-sm font-bold mt-1">84% On Track</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    Accessibility Mode: Captions + High Focus
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                    Active
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">Try any of the 5 demo portals</span>
                <Link to="/login" className="btn-primary text-xs px-3.5 py-2">
                  Launch Demo <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About & Mission */}
      <motion.section {...fadeUp} className="py-16 bg-white dark:bg-slate-900 border-b border-slate-200/70 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-royal-600 dark:text-royal-400">
              About UDAAN & Our Mission
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-950 dark:text-white mt-2">
              Bridging Mentorship, Accessibility, and Academic Success
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed">
              Many specially abled college students navigate fragmented tools for finding mentors, requesting exam accommodations, and accessing study materials. UDAAN unifies students, mentors, faculty members, support coordinators, and college administrators into one accessible, respectful ecosystem.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/about" className="btn-secondary">
                Read Our Story
              </Link>
              <Link to="/how-it-works" className="btn-ghost text-royal-600 dark:text-royal-400">
                See How It Works <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card-surface p-5">
              <p className="text-3xl font-extrabold text-royal-600 dark:text-royal-400">5</p>
              <p className="text-sm font-bold mt-1">Dedicated Role Portals</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Student, Mentor, Faculty, Support Coordinator, Administrator.
              </p>
            </div>
            <div className="card-surface p-5">
              <p className="text-3xl font-extrabold text-violet-600 dark:text-violet-400">WCAG</p>
              <p className="text-sm font-bold mt-1">2.2 AA Centered</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Font scaling, contrast, dyslexia font, TTS & keyboard focus.
              </p>
            </div>
            <div className="card-surface p-5">
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">1:1</p>
              <p className="text-sm font-bold mt-1">Structured Mentorship</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Guided matching, session notes, and milestone learning plans.
              </p>
            </div>
            <div className="card-surface p-5">
              <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">100%</p>
              <p className="text-sm font-bold mt-1">Interactive Frontend</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Demo persistence powered by localStorage for seamless demos.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Platform Features */}
      <motion.section {...fadeUp} className="py-16 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-royal-600 dark:text-royal-400">
              Platform Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-950 dark:text-white mt-2">
              Everything Required for Inclusive College Mentorship
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="card-surface p-6 hover:shadow-elevated">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{f.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Benefits for Students & Mentors */}
      <motion.section {...fadeUp} className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200/70 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8">
          <div className="rounded-2xl p-7 bg-gradient-to-br from-royal-50 to-white dark:from-royal-950/40 dark:to-slate-900 border border-royal-100 dark:border-royal-900">
            <span className="text-xs font-bold uppercase tracking-wider text-royal-700 dark:text-royal-300">
              Benefits for Students
            </span>
            <h3 className="text-xl font-extrabold text-navy-950 dark:text-white mt-1.5">
              Confident Learning Without Barriers
            </h3>
            <ul className="mt-5 space-y-3 text-sm text-slate-700 dark:text-slate-300">
              {[
                'Match with vetted mentors by subject, schedule, and preferred communication mode',
                'Track weekly academic tasks, semester exams, and personalized career milestones',
                'Use built-in Text-to-Speech, Dyslexia-friendly fonts, and High Contrast at any time',
                'Submit and monitor exam or assistive technology support requests transparently',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-royal-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl p-7 bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/40 dark:to-slate-900 border border-violet-100 dark:border-violet-900">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
              Benefits for Mentors
            </span>
            <h3 className="text-xl font-extrabold text-navy-950 dark:text-white mt-1.5">
              High-Impact, Organized Guidance
            </h3>
            <ul className="mt-5 space-y-3 text-sm text-slate-700 dark:text-slate-300">
              {[
                'Review student mentorship requests with learning preferences upfront',
                'Create personalized learning plans, weekly tasks, and skill milestones',
                'Document session notes and share accessible recommendations in one place',
                'Monitor mentee progress trends across semesters with clarity',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.section>

      {/* Testimonials */}
      <motion.section {...fadeUp} className="py-16 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-royal-600 dark:text-royal-400">
              Community Voices (Sample Content)
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-950 dark:text-white mt-2">
              Designed Around Real Campus Workflows
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="card-surface p-6 flex flex-col justify-between">
                <div>
                  <Quote className="w-6 h-6 text-royal-500 mb-3" aria-hidden="true" />
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">“{t.quote}”</p>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-navy-900 via-royal-800 to-violet-800 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-4xl font-extrabold">
            Ready to Experience Inclusive College Mentorship?
          </h2>
          <p className="mt-3 text-slate-200 max-w-2xl mx-auto text-sm sm:text-base">
            Sign in instantly with any of the 5 demo roles—Student, Mentor, Faculty, Support Coordinator, or Administrator—and explore every workflow live.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3.5">
            <Link to="/login" className="inline-flex items-center gap-2 rounded-xl bg-white text-navy-950 hover:bg-slate-100 font-bold px-6 py-3 text-sm">
              Try Interactive Demo <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white font-semibold px-6 py-3 text-sm">
              Create Demo Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
