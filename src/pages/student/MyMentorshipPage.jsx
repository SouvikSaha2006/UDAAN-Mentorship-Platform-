import React from 'react';
import { Link } from 'react-router-dom';
import { Users, MessageSquare, Calendar, Trash2, Search } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/helpers';

export default function MyMentorshipPage() {
  const { mentors, mentorshipRequests, cancelMentorshipRequest } = useAppData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const assignedMentor = mentors.find((m) => m.id === (currentUser?.assignedMentorId || 'men-201')) || mentors[0];
  const myRequests = mentorshipRequests.filter(
    (r) => r.studentId === currentUser?.id || r.studentId === 'stu-101'
  );

  const handleCancel = (id) => {
    cancelMentorshipRequest(id);
    showToast('Pending mentorship request cancelled.', 'info');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="My Mentorship"
        title="Active Mentorship & Requests"
        description="Manage your primary mentor connection, review request statuses, or cancel pending requests."
        actions={
          <Link to="/student/mentors" className="btn-primary">
            <Search className="w-4 h-4" /> Find Another Mentor
          </Link>
        }
      />

      {/* Primary Assigned Mentor */}
      <section className="card-surface p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <Avatar name={assignedMentor.name} color={assignedMentor.avatarColor} size="xl" />
            <div>
              <Badge variant="success" withIcon className="mb-2">Primary Assigned Mentor</Badge>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{assignedMentor.name}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">{assignedMentor.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {assignedMentor.department} · Languages: {(assignedMentor.languages || []).join(', ')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link to={`/student/mentors/${assignedMentor.id}`} className="btn-secondary text-xs">
              View Mentor Profile
            </Link>
            <Link to="/student/sessions" className="btn-secondary text-xs">
              <Calendar className="w-4 h-4" /> Schedule Session
            </Link>
            <Link to="/student/messages" className="btn-primary text-xs">
              <MessageSquare className="w-4 h-4" /> Open Chat
            </Link>
          </div>
        </div>
      </section>

      {/* Sent Requests */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-royal-600" /> Mentorship Requests ({myRequests.length})
        </h2>

        {myRequests.length === 0 ? (
          <EmptyState
            title="No mentorship requests yet"
            description="Browse our mentor directory or run Guided Mentor Matching to send a request."
            action={
              <Link to="/student/mentors" className="btn-primary">Browse Mentors</Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {myRequests.map((req) => (
              <div key={req.id} className="card-surface p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{req.mentorName}</h3>
                    <Badge status={req.status} withIcon>{req.status}</Badge>
                  </div>
                  <p className="text-sm font-medium text-royal-700 dark:text-royal-300">{req.subject}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{req.message}</p>
                  <p className="text-[11px] text-slate-400">
                    Preferred Mode: {req.preferredMethod} · Sent {formatDate(req.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link to={`/student/mentors/${req.mentorId}`} className="btn-secondary text-xs">
                    Mentor Profile
                  </Link>
                  {req.status === 'Pending' && (
                    <button
                      type="button"
                      onClick={() => handleCancel(req.id)}
                      className="btn-ghost text-xs text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Cancel Request
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
