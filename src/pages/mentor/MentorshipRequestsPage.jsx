import React from 'react';
import { Check, X, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/helpers';

export default function MentorshipRequestsPage() {
  const { currentUser } = useAuth();
  const { mentorshipRequests, updateMentorshipRequestStatus } = useAppData();
  const { showToast } = useToast();

  const requests = mentorshipRequests.filter(
    (r) => r.mentorId === (currentUser?.id || 'men-201') || r.mentorId === 'men-201'
  );

  const handleDecision = (id, status, studentName) => {
    updateMentorshipRequestStatus(id, status);
    showToast(`Mentorship request from ${studentName} ${status.toLowerCase()}.`, status === 'Accepted' ? 'success' : 'info');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Mentorship Requests"
        title="Incoming Mentorship Requests"
        description="Review student learning objectives, communication preferences, and accept or decline requests."
      />

      {requests.length === 0 ? (
        <EmptyState icon={UserCheck} title="No mentorship requests" description="New student requests will appear here." />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="card-surface p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{req.studentName}</h2>
                  <Badge status={req.status} withIcon>{req.status}</Badge>
                </div>
                <p className="text-xs text-slate-500">{req.studentCourse} · Requested {formatDate(req.createdAt)}</p>
                <p className="text-sm font-semibold text-royal-600 dark:text-royal-400">{req.subject}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">{req.message}</p>
                <p className="text-xs font-medium text-slate-500">Preferred Mode: {req.preferredMethod}</p>
              </div>

              {req.status === 'Pending' && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDecision(req.id, 'Accepted', req.studentName)}
                    className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Check className="w-4 h-4" /> Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision(req.id, 'Rejected', req.studentName)}
                    className="btn-secondary text-xs text-rose-600 border-rose-200"
                  >
                    <X className="w-4 h-4" /> Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
