import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, ShieldCheck, LifeBuoy } from 'lucide-react';
import { EXAMINATIONS_DATA } from '../../data/mockAcademics';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../utils/helpers';

export default function ExaminationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        badge="End-Semester Examinations"
        title="Examination Calendar & Accommodations"
        description="Review upcoming exam dates, accessible ground-floor seating rooms, and approved accommodation provisions."
        actions={
          <Link to="/student/support" className="btn-primary">
            <LifeBuoy className="w-4 h-4" /> Request Exam Accommodation
          </Link>
        }
      />

      <div className="grid md:grid-cols-2 gap-5">
        {EXAMINATIONS_DATA.map((ex) => (
          <div key={ex.id} className="card-surface p-6 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{ex.subject}</h2>
              <Badge status={ex.status} withIcon>{ex.status}</Badge>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-royal-600 shrink-0" /> {formatDate(ex.date)} · {ex.time}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-violet-600 shrink-0" /> {ex.venue}
            </p>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Approved Provisions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ex.accommodations.map((acc) => (
                  <Badge key={acc} variant="success">{acc}</Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
