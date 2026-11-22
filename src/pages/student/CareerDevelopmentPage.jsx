import React, { useState } from 'react';
import { Briefcase, MapPin, CheckCircle2, FileCheck, Compass, Sparkles } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import { CAREER_PATHWAYS } from '../../data/mockAcademics';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../utils/helpers';

export default function CareerDevelopmentPage() {
  const { careerJobs, applyCareerOpportunity } = useAppData();
  const { showToast } = useToast();

  const [resumeChecks, setResumeChecks] = useState([
    { id: 'rc-1', label: 'Highlight accessible web & coursework projects with clear impact metrics', done: true },
    { id: 'rc-2', label: 'Export resume as clean single-column screen-reader-friendly PDF', done: true },
    { id: 'rc-3', label: 'Prepare 2-minute project walkthrough and accommodation preference script', done: false },
    { id: 'rc-4', label: 'Complete 2 mock interviews with Career Mentor Priya Nambiar', done: false },
  ]);

  const toggleCheck = (id) => {
    setResumeChecks((prev) => prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c)));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Career Readiness"
        title="Career Development & Inclusive Internships"
        description="Explore inclusive internship partners, structured career pathways, resume prep checklists, and mentor advice."
      />

      {/* Pathways & Checklist */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-royal-600" /> Recommended Learning Pathways
          </h2>
          {CAREER_PATHWAYS.map((pw) => (
            <div key={pw.id} className="card-surface p-5 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{pw.title}</h3>
                <Badge variant="violet">{pw.match}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {pw.steps.map((st, idx) => (
                  <span key={st} className="px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold border border-slate-200 dark:border-slate-700">
                    {idx + 1}. {st}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 bg-amber-50/60 dark:bg-amber-950/20 p-3 rounded-xl">
                <strong>Mentor Advice:</strong> {pw.mentorAdvice}
              </p>
            </div>
          ))}
        </div>

        <div className="lg:col-span-5 card-surface p-6 space-y-4 h-fit">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-600" /> Resume & Interview Readiness
          </h2>
          <div className="space-y-2.5">
            {resumeChecks.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleCheck(item.id)}
                aria-pressed={item.done}
                className={`w-full flex items-start gap-2.5 p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                  item.done
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${item.done ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className={item.done ? 'line-through opacity-80' : ''}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Internships */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-royal-600" /> Sample Inclusive Internship Opportunities
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {careerJobs.map((job) => (
            <div key={job.id} className="card-surface p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="info">{job.type}</Badge>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{job.stipend}</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{job.title}</h3>
                <p className="text-xs font-semibold text-royal-600 dark:text-royal-400 mt-0.5">{job.company}</p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {job.location} · Deadline {formatDate(job.deadline)}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.skills.map((sk) => (
                    <span key={sk} className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium">
                      {sk}
                    </span>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Workplace Accommodations
                  </p>
                  <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                    {job.accommodations.map((acc) => (
                      <li key={acc}>• {acc}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-5">
                {job.applied ? (
                  <Badge variant="success" withIcon className="w-full justify-center py-2">
                    Applied (Demo)
                  </Badge>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      applyCareerOpportunity(job.id);
                      showToast(`Demo application sent for ${job.title}!`, 'success');
                    }}
                    className="btn-primary w-full text-xs"
                  >
                    Apply (Demo)
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
