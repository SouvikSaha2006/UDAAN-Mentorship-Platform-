import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';

export default function MentorProgressPage() {
  const { students, addNotification } = useAppData();
  const { showToast } = useToast();
  const [selectedStudent, setSelectedStudent] = useState(students[0]?.id || 'stu-101');
  const [feedback, setFeedback] = useState('');

  const handleSendFeedback = (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    const stu = students.find((s) => s.id === selectedStudent);
    addNotification({
      category: 'Mentorship',
      title: `Mentor Feedback for ${stu?.name || 'Student'}`,
      message: feedback.trim(),
    });
    showToast(`Feedback recorded for ${stu?.name}.`, 'success');
    setFeedback('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Mentee Analytics"
        title="Student Progress Tracking"
        description="Monitor mentee progress scores, attendance standing, and send constructive mentor feedback."
      />

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 card-surface p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Mentee Progress & Attendance Comparison
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={students} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="progressScore" name="Learning Progress %" fill="#254aeb" radius={[6, 6, 0, 0]} />
                <Bar dataKey="attendance" name="Attendance %" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <form onSubmit={handleSendFeedback} className="lg:col-span-5 card-surface p-6 space-y-4 h-fit">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Give Constructive Feedback</h2>
          <div>
            <label htmlFor="fb-stu" className="block text-sm font-semibold mb-1.5">Select Student</label>
            <select id="fb-stu" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="input-field">
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.course})</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="fb-txt" className="block text-sm font-semibold mb-1.5">Feedback & Encouragement</label>
            <textarea
              id="fb-txt"
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="input-field"
              placeholder="Share progress highlights and next week's focus..."
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full">Send Feedback Notification</button>
        </form>
      </div>
    </div>
  );
}
