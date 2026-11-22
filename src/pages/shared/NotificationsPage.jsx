import React, { useState } from 'react';
import { Bell, CheckCheck, Trash2, Check } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead, deleteNotification } = useAppData();
  const { showToast } = useToast();
  const [filter, setFilter] = useState('All');

  const categories = ['All', 'Unread', 'Mentorship', 'Session', 'Support', 'Academic', 'Assignment', 'Career'];

  const filtered = notifications.filter((n) => {
    if (filter === 'All') return true;
    if (filter === 'Unread') return !n.read;
    return n.category === filter;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Notification Center"
        title="Notifications & Reminders"
        description="Stay informed on mentorship requests, session reminders, assignment deadlines, and support status changes."
        actions={
          <button
            type="button"
            onClick={() => {
              markAllNotificationsRead();
              showToast('All notifications marked as read.', 'info');
            }}
            className="btn-secondary"
          >
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === c
                ? 'bg-royal-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications in this filter" description="You are all caught up!" />
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`card-surface p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                !n.read ? 'border-l-4 border-l-royal-600' : 'opacity-85'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={n.read ? 'neutral' : 'info'}>{n.category}</Badge>
                  {!n.read && <Badge variant="warning">Unread</Badge>}
                  <span className="text-xs text-slate-400">{n.time}</span>
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">{n.title}</h2>
                <p className="text-xs text-slate-600 dark:text-slate-300">{n.message}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => markNotificationRead(n.id)}
                    className="btn-secondary text-xs"
                  >
                    <Check className="w-3.5 h-3.5" /> Mark Read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    deleteNotification(n.id);
                    showToast('Notification deleted.', 'info');
                  }}
                  aria-label={`Delete notification ${n.title}`}
                  className="btn-ghost text-xs text-rose-600 dark:text-rose-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
