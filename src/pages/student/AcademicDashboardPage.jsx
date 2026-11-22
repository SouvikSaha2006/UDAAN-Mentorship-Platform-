import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, Calendar, ClipboardCheck, CheckSquare } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ACADEMIC_OVERVIEW } from '../../data/mockAcademics';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';

export default function AcademicDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        badge="Academic Management"
        title="Academic Dashboard"
        description={`${ACADEMIC_OVERVIEW.course} · ${ACADEMIC_OVERVIEW.semester}`}
        actions={
          <Link to="/student/timetable" className="btn-secondary">
            <Calendar className="w-4 h-4" /> View Timetable
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Current CGPA" value={ACADEMIC_OVERVIEW.currentCgpa} subtitle="Out of 10.00" icon={GraduationCap} trend="Dean's List" accent="royal" />
        <StatCard title="Credits Earned" value={`${ACADEMIC_OVERVIEW.creditsCompleted}/${ACADEMIC_OVERVIEW.totalCredits}`} subtitle="70% degree progress" icon={BookOpen} accent="violet" />
        <StatCard title="Semester Progress" value={`${ACADEMIC_OVERVIEW.semesterProgress}%`} subtitle="Week 11 of 15" icon={CheckSquare} accent="emerald" />
        <StatCard title="Upcoming Exams" value="4" subtitle="Accommodations confirmed" icon={ClipboardCheck} accent="amber" />
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 card-surface p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Subject-Wise Performance (%)
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ACADEMIC_OVERVIEW.subjectPerformance} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="score" name="Score %" fill="#254aeb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 card-surface p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Enrolled Courses</h2>
          {ACADEMIC_OVERVIEW.subjectPerformance.map((sub) => (
            <div key={sub.code} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {sub.code} · {sub.subject}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{sub.faculty}</p>
              </div>
              <span className="text-sm font-extrabold text-royal-600 dark:text-royal-400">{sub.score}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
