import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, ClipboardCheck, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { ACADEMIC_OVERVIEW, EXAMINATIONS_DATA } from '../../data/mockAcademics';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';

export default function FacultyDashboard() {
  const { currentUser } = useAuth();
  const { students, materials } = useAppData();

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Faculty Inclusion Portal"
        title={`Welcome, ${currentUser?.name || 'Prof. Rajeshwari Kulkarni'}`}
        description="Publish screen-reader tagged study materials, review student accommodation needs, and coordinate exam accessibility."
        actions={
          <>
            <Link to="/faculty/materials" className="btn-secondary">
              Upload Material
            </Link>
            <Link to="/faculty/courses" className="btn-primary">
              View Enrolled Students
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Active Courses" value={3} subtitle="CSE Autumn Semester" icon={BookOpen} accent="royal" />
        <StatCard title="Students Supported" value={students.length} subtitle="Accommodation profiles active" icon={Users} accent="violet" />
        <StatCard title="Accessible Materials" value={materials.length} subtitle="Tagged PDFs & transcripts" icon={ShieldCheck} accent="emerald" />
        <StatCard title="Upcoming Exams" value={EXAMINATIONS_DATA.length} subtitle="Extra-time verified" icon={ClipboardCheck} accent="amber" />
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 card-surface p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Assigned Courses & Progress</h2>
            <Link to="/faculty/courses" className="text-xs font-semibold text-royal-600 hover:underline">
              Details
            </Link>
          </div>
          {ACADEMIC_OVERVIEW.subjectPerformance.slice(0, 3).map((c) => (
            <div key={c.code} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold">{c.code} · {c.subject}</p>
                <p className="text-xs text-slate-500">Avg Score: {c.score}% · Attendance: {c.attendance}%</p>
              </div>
              <Badge variant="success">Accessible Resources Ready</Badge>
            </div>
          ))}
        </div>

        <div className="lg:col-span-5 card-surface p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Quick Faculty Actions</h2>
          <div className="space-y-2.5">
            <Link to="/faculty/materials" className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-royal-50/50 text-sm font-semibold">
              <span>Publish Tagged Study Material</span>
              <ArrowRight className="w-4 h-4 text-royal-600" />
            </Link>
            <Link to="/faculty/examinations" className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-royal-50/50 text-sm font-semibold">
              <span>Verify Exam Accommodations</span>
              <ArrowRight className="w-4 h-4 text-royal-600" />
            </Link>
            <Link to="/faculty/messages" className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-royal-50/50 text-sm font-semibold">
              <span>Message Students & Support Cell</span>
              <ArrowRight className="w-4 h-4 text-royal-600" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
