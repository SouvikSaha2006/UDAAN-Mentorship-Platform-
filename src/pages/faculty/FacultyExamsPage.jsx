import React, { useState } from 'react';
import { CheckCircle2, Calendar, MapPin } from 'lucide-react';
import { EXAMINATIONS_DATA } from '../../data/mockAcademics';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../utils/helpers';

export default function FacultyExamsPage() {
  const [exams, setExams] = useState(EXAMINATIONS_DATA);
  const { showToast } = useToast();

  const confirmExam = (id) => {
    setExams((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'Confirmed' } : e)));
    showToast('Exam accommodation confirmed for student cohort.', 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Examination Coordination"
        title="Exam Accommodation Verification"
        description="Verify large-print papers, screen-reader digital copies, and extra-time schedules."
      />

      <div className="grid md:grid-cols-2 gap-5">
        {exams.map((ex) => (
          <div key={ex.id} className="card-surface p-6 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{ex.subject}</h2>
              <Badge status={ex.status} withIcon>{ex.status}</Badge>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> {formatDate(ex.date)} · {ex.time}
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> {ex.venue}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {ex.accommodations.map((a) => (
                <Badge key={a} variant="info">{a}</Badge>
              ))}
            </div>
            {ex.status !== 'Confirmed' && (
              <button type="button" onClick={() => confirmExam(ex.id)} className="btn-primary text-xs mt-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Diagram & Extra-Time Pack
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
