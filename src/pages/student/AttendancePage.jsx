import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ACADEMIC_OVERVIEW } from '../../data/mockAcademics';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';

export default function AttendancePage() {
  const avgAttendance = Math.round(
    ACADEMIC_OVERVIEW.subjectPerformance.reduce((sum, s) => sum + s.attendance, 0) /
      ACADEMIC_OVERVIEW.subjectPerformance.length
  );

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Attendance Tracker"
        title="Overall & Subject-Wise Attendance"
        description={`Overall Semester Attendance: ${avgAttendance}% (Minimum required: 75%, medical/accommodation exemptions supported).`}
      />

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 card-surface p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Attendance Comparison (%)</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ACADEMIC_OVERVIEW.subjectPerformance} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="attendance" name="Attendance %" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-6 card-surface p-6 overflow-x-auto">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Subject Breakdown</h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                <th className="pb-2.5 font-bold">Subject</th>
                <th className="pb-2.5 font-bold">Faculty</th>
                <th className="pb-2.5 font-bold">Attendance</th>
                <th className="pb-2.5 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {ACADEMIC_OVERVIEW.subjectPerformance.map((s) => (
                <tr key={s.code}>
                  <td className="py-3 font-semibold">{s.subject}</td>
                  <td className="py-3 text-xs text-slate-500">{s.faculty}</td>
                  <td className="py-3 font-bold">{s.attendance}%</td>
                  <td className="py-3">
                    <Badge variant={s.attendance >= 85 ? 'success' : 'warning'} withIcon>
                      {s.attendance >= 85 ? 'Good Standing' : 'Monitor'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
