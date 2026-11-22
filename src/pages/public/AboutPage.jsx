import React from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake, ShieldCheck, Accessibility, Users, ArrowRight } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <PageHeader
        badge="About UDAAN"
        title="Empowering Abilities. Enabling Futures."
        description="UDAAN is an inclusive student mentorship platform built to help specially abled college students thrive academically, socially, and professionally."
        actions={
          <Link to="/login" className="btn-primary">
            Explore Demo Portals <ArrowRight className="w-4 h-4" />
          </Link>
        }
      />

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="card-surface p-6">
          <HeartHandshake className="w-7 h-7 text-royal-600 mb-3" aria-hidden="true" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Our Mission</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            To ensure every specially abled college student has structured access to caring mentors, accessible study materials, timely academic accommodations, and career readiness—without administrative friction.
          </p>
        </div>
        <div className="card-surface p-6">
          <Accessibility className="w-7 h-7 text-violet-600 mb-3" aria-hidden="true" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Accessibility by Design</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            Accessibility is not an add-on inside UDAAN. Every page supports keyboard navigation, font scaling, high contrast, dyslexia-friendly typography, reduced motion, and browser-native Text-to-Speech.
          </p>
        </div>
      </div>

      <div className="card-surface p-7">
        <h2 className="text-xl font-extrabold text-navy-950 dark:text-white mb-4">
          Five Connected Roles in One Campus Ecosystem
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          {[
            { role: 'Students', desc: 'Discover mentors, follow personalized learning plans, use assistive study tools, and track support tickets.' },
            { role: 'Mentors', desc: 'Accept mentorship requests, run accessible sessions, write session notes, and guide student milestones.' },
            { role: 'Faculty Members', desc: 'Share screen-reader tagged PDFs, transcripts, and manage course & exam accommodations.' },
            { role: 'Support Coordinators', desc: 'Review and fulfill mobility, assistive tech, and exam accommodation requests end-to-end.' },
            { role: 'College Administrators', desc: 'Monitor mentorship impact, department compliance, and institutional inclusion analytics.' },
          ].map((item) => (
            <div key={item.role} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Users className="w-4 h-4 text-royal-600" aria-hidden="true" />
                {item.role}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center gap-3 text-xs text-amber-900 dark:text-amber-200">
          <ShieldCheck className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>
            <strong>Frontend Demo Notice:</strong> All authentication, records, and interactive updates in this build are simulated client-side using React state and localStorage.
          </span>
        </div>
      </div>
    </div>
  );
}
