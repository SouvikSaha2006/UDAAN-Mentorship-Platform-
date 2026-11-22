import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, UserCheck, CheckCircle2, TrendingUp, Megaphone, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../utils/helpers';

export default function MentorDashboard() {
  const { currentUser } = useAuth();
  const { students, mentorshipRequests, sessions } = useAppData();

  const myStudents = students.filter((s) => s.assignedMentorId === (currentUser?.id || 'men-201'));
  const myRequests = mentorshipRequests.filter(
    (r) => r.mentorId === (currentUser?.id || 'men-201') || r.mentorId === 'men-201'
  );
  const pendingRequests = myRequests.filter((r) => r.status === 'Pending');
  const mySessions = sessions.filter(
    (s) => s.mentorId === (currentUser?.id || 'men-201') || s.mentorId === 'men-201'
  );
  const upcomingSessions = mySessions.filter((s) => s.status === 'Scheduled');
  const completedSessions = mySessions.filter((s) => s.status === 'Completed');

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Mentor Workspace"
        title={`Welcome, ${currentUser?.name || 'Dr. Meera Krishnan'}`}
        description="Guide assigned students, respond to mentorship requests, document session notes, and manage personalized learning plans."
        actions={
          <>
            <Link to="/mentor/requests" className="btn-secondary">
              Review Requests ({pendingRequests.length})
            </Link>
            <Link to="/mentor/sessions" className="btn-primary">
              Schedule Session
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Assigned Students" value={myStudents.length} subtitle="Active mentees" icon={Users} accent="royal" />
        <StatCard title="Upcoming Sessions" value={upcomingSessions.length} subtitle="Scheduled this week" icon={Calendar} accent="violet" />
        <StatCard title="Pending Requests" value={pendingRequests.length} subtitle="Awaiting decision" icon={UserCheck} accent="amber" />
        <StatCard title="Completed Sessions" value={completedSessions.length} subtitle="100% documented" icon={CheckCircle2} accent="emerald" />
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          {/* Student Progress Overview */}
          <div className="card-surface p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-royal-600" /> Student Progress Overview
              </h2>
              <Link to="/mentor/progress" className="text-xs font-semibold text-royal-600 hover:underline">
                Detailed Analytics
              </Link>
            </div>
            <div className="space-y-4">
              {myStudents.map((stu) => (
                <div key={stu.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={stu.name} size="sm" />
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{stu.name}</p>
                        <p className="text-xs text-slate-500">{stu.course} · {stu.semester}</p>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-royal-600 dark:text-royal-400">{stu.progressScore}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full bg-royal-600 rounded-full" style={{ width: `${stu.progressScore}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Sessions */}
          <div className="card-surface p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Upcoming Sessions</h2>
              <Link to="/mentor/sessions" className="text-xs font-semibold text-royal-600 hover:underline">
                Manage All
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingSessions.map((ses) => (
                <div key={ses.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{ses.topic}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Student: <strong>{ses.studentName}</strong> · {formatDate(ses.date)} ({ses.time})
                    </p>
                  </div>
                  <Badge status={ses.status}>{ses.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          {/* Pending Requests */}
          <div className="card-surface p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Pending Mentorship Requests</h2>
              <Link to="/mentor/requests" className="text-xs font-semibold text-royal-600 hover:underline">
                Review All
              </Link>
            </div>
            <div className="space-y-3">
              {pendingRequests.slice(0, 3).map((req) => (
                <div key={req.id} className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40">
                  <p className="text-sm font-bold">{req.studentName}</p>
                  <p className="text-xs text-royal-700 dark:text-royal-300 font-medium">{req.subject}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">{req.message}</p>
                </div>
              ))}
              {pendingRequests.length === 0 && (
                <p className="text-xs text-slate-500">All mentorship requests have been reviewed.</p>
              )}
            </div>
          </div>

          {/* Announcements */}
          <div className="card-surface p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-violet-600" /> Campus Announcements
            </h2>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="font-bold text-slate-900 dark:text-white">End-Sem Exam Accommodation Window</p>
                <p className="mt-1">Please review student learning plans and confirm assistive notes prior to Dec 5.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="font-bold text-slate-900 dark:text-white">Captioning Standard Reminder</p>
                <p className="mt-1">All video mentoring sessions should keep live captions enabled by default.</p>
              </div>
            </div>
            <Link to="/mentor/learning-plans" className="btn-secondary w-full mt-4 text-xs">
              Open Learning Plan Manager <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
