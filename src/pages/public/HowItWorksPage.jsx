import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles, Calendar, Target, LifeBuoy, ArrowRight } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';

export default function HowItWorksPage() {
  const steps = [
    {
      step: '01',
      icon: Search,
      title: 'Create Your Profile & Accessibility Preferences',
      desc: 'Sign in or register as a student or mentor. Set visual, reading, motor, or hearing preferences that persist across every screen.',
    },
    {
      step: '02',
      icon: Sparkles,
      title: 'Match With the Right Mentor',
      desc: 'Use Mentor Discovery filters or our interactive Mentor Matching flow based on academic interests, career goals, schedule, and preferred communication mode.',
    },
    {
      step: '03',
      icon: Calendar,
      title: 'Book Accessible Sessions & Collaborate',
      desc: 'Schedule captioned video, audio, or text-based sessions. Review agendas beforehand and read mentor session notes afterwards.',
    },
    {
      step: '04',
      icon: Target,
      title: 'Follow Your Personalized Learning Plan',
      desc: 'Check off weekly tasks, monitor academic and career goals, and earn milestones curated jointly with your mentor.',
    },
    {
      step: '05',
      icon: LifeBuoy,
      title: 'Coordinate Academic & Campus Support',
      desc: 'Submit support tickets for exam extra time, tagged PDFs, or assistive devices and follow real-time status updates from Support Coordinators.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <PageHeader
        badge="Workflow Guide"
        title="How UDAAN Mentorship Works"
        description="A transparent, accessible five-step journey connecting students with mentors, faculty, and support teams."
        actions={
          <Link to="/register" className="btn-primary">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        }
      />

      <div className="space-y-4">
        {steps.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.step} className="card-surface p-6 flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-2xl font-extrabold text-royal-600/30 dark:text-royal-400/40 w-8">
                  {item.step}
                </span>
                <div className="w-12 h-12 rounded-2xl bg-royal-50 dark:bg-royal-950/60 text-royal-600 dark:text-royal-400 flex items-center justify-center">
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{item.title}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
