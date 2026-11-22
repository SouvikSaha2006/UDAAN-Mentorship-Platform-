import React, { useState } from 'react';
import { CheckCircle2, Clock, Upload } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../utils/helpers';

export default function AssignmentsPage() {
  const { assignments, updateAssignmentStatus } = useAppData();
  const { showToast } = useToast();
  const [subjectFilter, setSubjectFilter] = useState('All');

  const subjects = ['All', ...Array.from(new Set(assignments.map((a) => a.subject)))];
  const filtered =
    subjectFilter === 'All'
      ? assignments
      : assignments.filter((a) => a.subject === subjectFilter);

  const handleSubmitDemo = (id, title) => {
    updateAssignmentStatus(id, 'Submitted');
    showToast(`Demo submission recorded for "${title}".`, 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Coursework"
        title="Assignments & Submissions"
        description="Filter by subject, review accessible submission options, and mark assignments submitted in demo mode."
      />

      <div className="flex flex-wrap gap-2">
        {subjects.map((sub) => (
          <button
            key={sub}
            type="button"
            onClick={() => setSubjectFilter(sub)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              subjectFilter === sub
                ? 'bg-royal-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((a) => (
          <div key={a.id} className="card-surface p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-bold text-royal-600 dark:text-royal-400">{a.code} · {a.subject}</span>
                <Badge status={a.status} withIcon>{a.status}</Badge>
              </div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{a.title}</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">{a.description}</p>
              <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Due: {formatDate(a.dueDate)}</span>
                <span>Format: {a.submissionFormat}</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">Note: {a.accommodationNote}</span>
              </div>
            </div>

            <div className="shrink-0">
              {a.status === 'Submitted' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Submitted
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmitDemo(a.id, a.title)}
                  className="btn-primary text-xs"
                >
                  <Upload className="w-3.5 h-3.5" /> Mark Submitted (Demo)
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
