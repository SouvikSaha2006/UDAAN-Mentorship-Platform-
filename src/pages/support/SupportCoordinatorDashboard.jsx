import React from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy, Clock, CheckCircle2, Users, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../utils/helpers';

export default function SupportCoordinatorDashboard() {
  const { currentUser } = useAuth();
  const { supportRequests, students } = useAppData();

  const total = supportRequests.length;
  const pending = supportRequests.filter((r) => ['Submitted', 'Under Review', 'In Progress'].includes(r.status)).length;
  const resolved = supportRequests.filter((r) => ['Approved', 'Completed'].includes(r.status)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Inclusion & Equal Opportunity Cell"
        title={`Welcome, ${currentUser?.name || 'Ananya Deshmukh'}`}
        description="Coordinate student accommodation requests, assign support specialists, and verify accessibility fulfillment."
        actions={
          <Link to="/support/requests" className="btn-primary">
            Manage Support Queue <ArrowRight className="w-4 h-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Support Requests" value={total} subtitle="All logged tickets" icon={LifeBuoy} accent="royal" />
        <StatCard title="Pending Requests" value={pending} subtitle="Requires action / tracking" icon={Clock} accent="amber" />
        <StatCard title="Approved & Resolved" value={resolved} subtitle="Fulfilled requests" icon={CheckCircle2} accent="emerald" />
        <StatCard title="Active Students Supported" value={students.length} subtitle="Individualized plans" icon={Users} accent="violet" />
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 card-surface p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Support Tickets</h2>
            <Link to="/support/requests" className="text-xs font-semibold text-royal-600 hover:underline">
              Open Full Queue
            </Link>
          </div>
          <div className="space-y-3">
            {supportRequests.slice(0, 4).map((req) => (
              <div key={req.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="violet">{req.category}</Badge>
                    <Badge status={req.status} withIcon>{req.status}</Badge>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">{req.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {req.studentName} · Assigned: {req.assignedTo} · {formatDate(req.updatedAt)}
                  </p>
                </div>
                <Link to="/support/requests" className="btn-secondary text-xs shrink-0">
                  Update
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 card-surface p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Student Support Overview</h2>
          <div className="space-y-3">
            {students.map((stu) => (
              <div key={stu.id} className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-700">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{stu.name}</p>
                <p className="text-xs text-royal-600 dark:text-royal-400 font-medium">{stu.accessibilityProfile}</p>
                <p className="text-[11px] text-slate-500 mt-1">{stu.accommodations.join(' · ')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
