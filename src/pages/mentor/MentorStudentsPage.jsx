import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Target, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import PageHeader from '../../components/common/PageHeader';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';

export default function MentorStudentsPage() {
  const { currentUser } = useAuth();
  const { students, startConversation } = useAppData();
  const navigate = useNavigate();

  const myStudents = students.filter((s) => s.assignedMentorId === (currentUser?.id || 'men-201'));

  const handleChat = (student) => {
    startConversation({
      participantName: student.name,
      participantRole: `Student · ${student.course}`,
      participantId: student.id,
      senderName: currentUser?.name || 'Dr. Meera Krishnan',
    });
    navigate('/mentor/messages');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Assigned Mentees"
        title="My Students"
        description="View student profiles with permissioned accessibility accommodation summaries and jump directly to learning plans or messaging."
      />

      <div className="grid md:grid-cols-2 gap-6">
        {myStudents.map((stu) => (
          <div key={stu.id} className="card-surface p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <Avatar name={stu.name} size="lg" />
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{stu.name}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {stu.rollNumber} · {stu.course} ({stu.semester})
                  </p>
                  <p className="text-xs font-semibold text-royal-600 dark:text-royal-400 mt-0.5">
                    CGPA: {stu.cgpa} · Attendance: {stu.attendance}%
                  </p>
                </div>
              </div>
              <Badge status={stu.status} withIcon>{stu.status}</Badge>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Permissioned Accessibility Profile
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">{stu.accessibilityProfile}</p>
              <div className="flex flex-wrap gap-1.5">
                {stu.accommodations.map((acc) => (
                  <Badge key={acc} variant="info">{acc}</Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2.5">
              <button type="button" onClick={() => handleChat(stu)} className="btn-primary text-xs flex-1">
                <MessageSquare className="w-3.5 h-3.5" /> Message Student
              </button>
              <Link to="/mentor/learning-plans" className="btn-secondary text-xs flex-1">
                <Target className="w-3.5 h-3.5" /> Learning Plan
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
