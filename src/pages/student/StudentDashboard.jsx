import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Target,
  TrendingUp,
  Users,
  Search,
  LifeBuoy,
  BookOpen,
  Headphones,
  ArrowRight,
  Clock,
  CheckCircle2,
  Bell,
  FileText,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { ACADEMIC_OVERVIEW } from '../../data/mockAcademics';
import Avatar from '../../components/common/Avatar';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../utils/helpers';

export default function StudentDashboard() {
  const { currentUser } = useAuth();
  const {
    mentors,
    sessions,
    learningPlans,
    assignments,
    notifications,
    materials,
  } = useAppData();

  const assignedMentor =
    mentors.find((m) => m.id === (currentUser?.assignedMentorId || 'men-201')) || mentors[0];

  const mySessions = sessions.filter(
    (s) => s.studentId === currentUser?.id || s.studentId === 'stu-101'
  );
  const upcomingSessions = mySessions.filter((s) => s.status === 'Scheduled');
  const myPlan =
    learningPlans.find((lp) => lp.studentId === currentUser?.id) || learningPlans[0];

  const completedTasks = myPlan?.weeklyTasks?.filter((t) => t.completed).length || 0;
  const totalTasks = myPlan?.weeklyTasks?.length || 1;
  const goalProgressPct = Math.round((completedTasks / totalTasks) * 100);

  const upcomingAssignments = assignments.filter((a) => a.status !== 'Submitted').slice(0, 3);
  const recentNotifications = notifications.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <section className="card-surface p-6 bg-gradient-to-r from-navy-900 via-navy-800 to-royal-900 text-white border-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <Avatar name={currentUser?.name || 'Aarav Sharma'} color={currentUser?.avatarColor} size="xl" />
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/15 text-amber-200 mb-2">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Student Dashboard
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold">
                Welcome back, {currentUser?.name || 'Aarav Sharma'}
              </h1>
              <p className="text-sm text-slate-200 mt-1">
                {currentUser?.course || 'B.Tech Computer Science'} · {currentUser?.semester || '5th Semester'} · Assigned Mentor:{' '}
                <strong className="text-white">{assignedMentor?.name}</strong>
              </p>
            </div>
          </div>

          <div className="bg-white/10 rounded-2xl p-4 min-w-[220px] border border-white/15">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span>Profile Completion</span>
              <span>{currentUser?.profileCompletion || 88}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full"
                style={{ width: `${currentUser?.profileCompletion || 88}%` }}
              />
            </div>
            <Link
              to="/student/profile"
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-200 hover:text-white mt-2"
            >
              Update Accessibility & Bio <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap gap-2.5">
          <Link to="/student/mentors" className="inline-flex items-center gap-2 rounded-xl bg-white text-navy-950 hover:bg-slate-100 font-bold px-4 py-2 text-xs">
            <Search className="w-3.5 h-3.5" /> Find a Mentor
          </Link>
          <Link to="/student/sessions" className="inline-flex items-center gap-2 rounded-xl bg-royal-500 hover:bg-royal-400 text-white font-bold px-4 py-2 text-xs">
            <Calendar className="w-3.5 h-3.5" /> Book a Session
          </Link>
          <Link to="/student/support" className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold px-4 py-2 text-xs">
            <LifeBuoy className="w-3.5 h-3.5" /> Ask for Help
          </Link>
          <Link to="/student/learning-plan" className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold px-4 py-2 text-xs">
            <Target className="w-3.5 h-3.5" /> View Learning Plan
          </Link>
          <Link to="/student/assistive-hub" className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold px-4 py-2 text-xs">
            <Headphones className="w-3.5 h-3.5" /> Access Study Resources
          </Link>
        </div>
      </section>

      {/* Statistics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" aria-label="Student key statistics">
        <StatCard
          title="Mentorship Sessions"
          value={mySessions.length}
          subtitle={`${mySessions.filter((s) => s.status === 'Completed').length} completed`}
          icon={Users}
          trend="Active"
          accent="royal"
        />
        <StatCard
          title="Academic Progress"
          value={`${ACADEMIC_OVERVIEW.currentCgpa} CGPA`}
          subtitle={`${ACADEMIC_OVERVIEW.semesterProgress}% sem completed`}
          icon={TrendingUp}
          trend="+0.19"
          accent="emerald"
        />
        <StatCard
          title="Active Learning Goals"
          value={(myPlan?.academicGoals?.length || 0) + (myPlan?.careerGoals?.length || 0)}
          subtitle={`${goalProgressPct}% weekly tasks done`}
          icon={Target}
          accent="violet"
        />
        <StatCard
          title="Upcoming Sessions"
          value={upcomingSessions.length}
          subtitle={upcomingSessions[0] ? `Next: ${formatDate(upcomingSessions[0].date)}` : 'None scheduled'}
          icon={Calendar}
          accent="amber"
        />
      </section>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left 8 cols */}
        <div className="lg:col-span-8 space-y-6">
          {/* My Mentor + Upcoming Sessions */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card-surface p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">My Mentor</h2>
                  <Badge variant="success" withIcon>Matched</Badge>
                </div>
                <div className="flex items-center gap-3.5">
                  <Avatar name={assignedMentor.name} color={assignedMentor.avatarColor} size="lg" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{assignedMentor.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{assignedMentor.title}</p>
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                      ★ {assignedMentor.rating} ({assignedMentor.reviewCount} reviews)
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {assignedMentor.expertise.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Link to={`/student/mentors/${assignedMentor.id}`} className="btn-secondary text-xs flex-1">
                  View Profile
                </Link>
                <Link to="/student/messages" className="btn-primary text-xs flex-1">
                  Message Mentor
                </Link>
              </div>
            </div>

            <div className="card-surface p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Upcoming Sessions</h2>
                <Link to="/student/sessions" className="text-xs font-semibold text-royal-600 dark:text-royal-400 hover:underline">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {upcomingSessions.slice(0, 2).map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{s.topic}</p>
                      <Badge status={s.status}>{s.status}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {formatDate(s.date)} · {s.time}
                    </p>
                    <p className="text-xs text-royal-600 dark:text-royal-400 font-medium mt-1">
                      {s.mode}
                    </p>
                  </div>
                ))}
                {upcomingSessions.length === 0 && (
                  <p className="text-xs text-slate-500 py-4">No upcoming sessions. Book one to stay on track.</p>
                )}
              </div>
            </div>
          </div>

          {/* Academic Progress Chart */}
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Academic Progress (SGPA Trend)</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Semester-over-semester performance vs target</p>
              </div>
              <Link to="/student/academics" className="text-xs font-semibold text-royal-600 dark:text-royal-400 hover:underline">
                Full Academic Report
              </Link>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ACADEMIC_OVERVIEW.gpaTrend} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sgpaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#254aeb" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#254aeb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="semester" tick={{ fontSize: 12 }} />
                  <YAxis domain={[7.5, 9.5]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="sgpa" name="SGPA" stroke="#254aeb" strokeWidth={2.5} fill="url(#sgpaFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Learning Goals & Recent Activities */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card-surface p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Learning Goals</h2>
                <Link to="/student/learning-plan" className="text-xs font-semibold text-royal-600 dark:text-royal-400 hover:underline">
                  Manage
                </Link>
              </div>
              <div className="space-y-3">
                {[...(myPlan?.academicGoals || []), ...(myPlan?.careerGoals || [])].slice(0, 3).map((goal) => (
                  <div key={goal.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-200 line-clamp-1">{goal.title}</span>
                      <span className="text-royal-600 dark:text-royal-400 shrink-0 ml-2">{goal.progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-royal-600 rounded-full" style={{ width: `${goal.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-surface p-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">Recent Activities</h2>
              <ul className="space-y-3 text-xs">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Completed session: <strong>Semantic HTML & WCAG 2.2 AA Audit</strong></span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-royal-600 shrink-0 mt-0.5" />
                  <span>Submitted assignment: <strong>WCAG 2.2 Evaluation Report</strong></span>
                </li>
                <li className="flex items-start gap-2.5">
                  <LifeBuoy className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Exam accommodation pass approved for <strong>Room 101</strong></span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right 4 cols */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upcoming Assignments */}
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Upcoming Assignments</h2>
              <Link to="/student/assignments" className="text-xs font-semibold text-royal-600 dark:text-royal-400 hover:underline">
                All
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingAssignments.map((a) => (
                <div key={a.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-royal-600 dark:text-royal-400">{a.code}</span>
                    <Badge status={a.status}>{a.status}</Badge>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{a.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Due {formatDate(a.dueDate)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-royal-600" /> Notifications
              </h2>
              <Link to="/student/notifications" className="text-xs font-semibold text-royal-600 dark:text-royal-400 hover:underline">
                Open Center
              </Link>
            </div>
            <div className="space-y-2.5">
              {recentNotifications.map((n) => (
                <div key={n.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">{n.title}</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Learning Resources */}
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-600" /> Recommended Resources
              </h2>
              <Link to="/student/materials" className="text-xs font-semibold text-royal-600 dark:text-royal-400 hover:underline">
                Library
              </Link>
            </div>
            <div className="space-y-2.5">
              {materials.slice(0, 3).map((m) => (
                <Link
                  key={m.id}
                  to="/student/assistive-hub"
                  className="block p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-royal-50/50 dark:hover:bg-royal-950/30 transition-colors"
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{m.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{m.durationOrPages}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
