import React from 'react';
import { Download } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import { ADMIN_ANALYTICS_DATA } from '../../data/mockSupportAndComms';
import PageHeader from '../../components/common/PageHeader';
import { exportToCSV } from '../../utils/helpers';

export default function AnalyticsReportsPage() {
  const { students, supportRequests, sessions, departments } = useAppData();
  const { showToast } = useToast();

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Institutional Reports"
        title="Analytics & Exportable Reports"
        description="Analyze mentorship engagement, support ticket turnaround, and export CSV reports for academic reviews."
        actions={
          <button
            type="button"
            onClick={() => {
              exportToCSV('udaan-department-report.csv', departments);
              showToast('Department compliance report downloaded.', 'success');
            }}
            className="btn-primary"
          >
            <Download className="w-4 h-4" /> Download Department Report
          </button>
        }
      />

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card-surface p-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold">Student Progress CSV</p>
            <p className="text-xs text-slate-500">{students.length} records</p>
          </div>
          <button
            type="button"
            onClick={() => {
              exportToCSV('udaan-students-progress.csv', students);
              showToast('Student progress CSV exported.', 'success');
            }}
            className="btn-secondary text-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>

        <div className="card-surface p-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold">Mentorship Sessions CSV</p>
            <p className="text-xs text-slate-500">{sessions.length} records</p>
          </div>
          <button
            type="button"
            onClick={() => {
              exportToCSV('udaan-sessions-log.csv', sessions);
              showToast('Sessions log CSV exported.', 'success');
            }}
            className="btn-secondary text-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>

        <div className="card-surface p-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold">Support Requests CSV</p>
            <p className="text-xs text-slate-500">{supportRequests.length} records</p>
          </div>
          <button
            type="button"
            onClick={() => {
              exportToCSV('udaan-support-tickets.csv', supportRequests);
              showToast('Support requests CSV exported.', 'success');
            }}
            className="btn-secondary text-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      <div className="card-surface p-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Monthly Completed vs Total Sessions
        </h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ADMIN_ANALYTICS_DATA.monthlySessions} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="sessions" name="Scheduled" fill="#254aeb" radius={[6, 6, 0, 0]} />
              <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
