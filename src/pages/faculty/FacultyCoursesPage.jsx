import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';

export default function FacultyCoursesPage() {
  const { students } = useAppData();

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Course Roster"
        title="Courses & Student Accommodations"
        description="Review enrolled students and classroom/lab accommodations required for inclusive instruction."
      />

      <div className="card-surface p-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              <th className="pb-3 font-bold">Student</th>
              <th className="pb-3 font-bold">Roll No</th>
              <th className="pb-3 font-bold">Accessibility Profile</th>
              <th className="pb-3 font-bold">Classroom Accommodations</th>
              <th className="pb-3 font-bold">Attendance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {students.map((stu) => (
              <tr key={stu.id}>
                <td className="py-3.5 font-bold text-slate-900 dark:text-white">{stu.name}</td>
                <td className="py-3.5 text-xs text-slate-500">{stu.rollNumber}</td>
                <td className="py-3.5 text-xs">{stu.accessibilityProfile}</td>
                <td className="py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {stu.accommodations.map((a) => (
                      <Badge key={a} variant="info">
                        <ShieldCheck className="w-3 h-3" /> {a}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="py-3.5 font-bold">{stu.attendance}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
