import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  HeartHandshake,
  CheckCircle2,
  LifeBuoy,
  Target,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { ADMIN_ANALYTICS_DATA } from '../../data/mockSupportAndComms';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';

export default function AdminDashboard() {
  const { students, mentors, mentorshipRequests, sessions, supportRequests, learningPlans, departments } = useAppData();
  const { showToast } = useToast();

  // Real-time notification when a new student registers anywhere in the system
  useRealtimeSync({
    'student.registered': (newStudent) => {
      showToast(
        `Live: Student ${newStudent.fullName || newStudent.name} (${newStudent.studentId || newStudent.student_id}) enrolled. Count updated!`,
        'info'
      );
    },
  });

  const activeMentorships = mentorshipRequests.filter((r) => r.status === 'Accepted').length;
  const completedSessions = sessions.filter((s) => s.status === 'Completed').length;
  const pendingSupport = supportRequests.filter((r) => !['Completed', 'Approved', 'Rejected'].includes(r.status)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        badge="College Administrator"
        title="Institutional Inclusion & Mentorship Overview"
        description="Monitor campus-wide mentorship activity, department accessibility compliance, and support resolution trends."
        actions={
          <Link to="/admin/reports" className="btn-primary">
            <BarChart3 className="w-4 h-4" /> Export Reports
          </Link>
        }
      />

      {/* 6 Required Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Registered Students" value={students.length} subtitle="Across 4 departments" icon={GraduationCap} accent="royal" />
        <StatCard title="Registered Mentors" value={mentors.length} subtitle="Faculty & industry mentors" icon={Users} accent="violet" />
        <StatCard title="Active Mentorships" value={activeMentorships} subtitle="Verified active matches" icon={HeartHandshake} accent="emerald" />
        <StatCard title="Completed Sessions" value={completedSessions} subtitle="Documented with notes" icon={CheckCircle2} accent="navy" />
        <StatCard title="Pending Support Requests" value={pendingSupport} subtitle="In coordinator queue" icon={LifeBuoy} accent="amber" />
        <StatCard title="Total Learning Plans" value={learningPlans.length} subtitle="Personalized roadmaps" icon={Target} accent="royal" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 card-surface p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Monthly Mentorship Session Trends
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ADMIN_ANALYTICS_DATA.monthlySessions} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="sessions" name="Total Sessions" stroke="#254aeb" strokeWidth={2.5} />
                <Line type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 card-surface p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Support Request Distribution
          </h2>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ADMIN_ANALYTICS_DATA.supportDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={78}
                  paddingAngle={3}
                >
                  {ADMIN_ANALYTICS_DATA.supportDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] mt-2">
            {ADMIN_ANALYTICS_DATA.supportDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate text-slate-600 dark:text-slate-300">{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 card-surface p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Department Mentorship & Accessibility Compliance
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departments} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="code" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="studentsCount" name="Students" fill="#254aeb" radius={[6, 6, 0, 0]} />
                <Bar dataKey="activeMentorships" name="Active Mentorships" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-6 card-surface p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Average Student Learning Progress Trend (%)
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ADMIN_ANALYTICS_DATA.studentProgressTrend} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="avgProgress" name="Avg Progress %" stroke="#7c3aed" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
