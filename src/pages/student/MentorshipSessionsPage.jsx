import React, { useState, useMemo } from 'react';
import { Calendar, Plus, Clock, FileText, XCircle, RefreshCw } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/helpers';

export default function MentorshipSessionsPage() {
  const { mentors, sessions, bookSession, updateSession } = useAppData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [tab, setTab] = useState('upcoming');
  const [bookOpen, setBookOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [newDate, setNewDate] = useState('2026-11-30');
  const [newTime, setNewTime] = useState('4:30 PM - 5:15 PM');

  // Book form state
  const [mentorId, setMentorId] = useState(mentors[0]?.id || 'men-201');
  const [topic, setTopic] = useState('');
  const [date, setDate] = useState('2026-11-28');
  const [time, setTime] = useState('5:00 PM - 5:45 PM');
  const [mode, setMode] = useState('Video with Live Captions');
  const [notes, setNotes] = useState('');

  const mySessions = useMemo(
    () => sessions.filter((s) => s.studentId === currentUser?.id || s.studentId === 'stu-101'),
    [sessions, currentUser]
  );

  const displayedSessions = useMemo(() => {
    if (tab === 'upcoming') return mySessions.filter((s) => s.status === 'Scheduled');
    if (tab === 'history') return mySessions.filter((s) => s.status !== 'Scheduled');
    return mySessions;
  }, [mySessions, tab]);

  const handleBook = (e) => {
    e.preventDefault();
    const mentor = mentors.find((m) => m.id === mentorId) || mentors[0];
    bookSession({
      studentId: currentUser?.id || 'stu-101',
      studentName: currentUser?.name || 'Aarav Sharma',
      mentorId: mentor.id,
      mentorName: mentor.name,
      topic,
      date,
      time,
      mode,
      notes,
    });
    showToast(`Session booked with ${mentor.name}!`, 'success');
    setBookOpen(false);
    setTopic('');
    setNotes('');
  };

  const handleReschedule = (e) => {
    e.preventDefault();
    if (!rescheduleTarget) return;
    updateSession(rescheduleTarget.id, { date: newDate, time: newTime, status: 'Scheduled' });
    showToast('Session rescheduled successfully.', 'success');
    setRescheduleTarget(null);
  };

  const handleCancel = (id) => {
    updateSession(id, { status: 'Cancelled' });
    showToast('Session marked as cancelled.', 'info');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Mentorship Sessions"
        title="Session Calendar & History"
        description="Book accessible 1:1 sessions, reschedule slots, review agendas, and read mentor session notes."
        actions={
          <button type="button" onClick={() => setBookOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Book New Session
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Session views">
        {[
          { id: 'upcoming', label: `Upcoming (${mySessions.filter((s) => s.status === 'Scheduled').length})` },
          { id: 'history', label: `History & Past (${mySessions.filter((s) => s.status !== 'Scheduled').length})` },
          { id: 'all', label: `All Sessions (${mySessions.length})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === t.id
                ? 'bg-royal-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      {displayedSessions.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No sessions in this view"
          description="Book a new mentorship session using your preferred communication format."
          action={
            <button type="button" onClick={() => setBookOpen(true)} className="btn-primary">
              Book a Session
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {displayedSessions.map((ses) => (
            <div key={ses.id} className="card-surface p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{ses.topic}</h2>
                    <Badge status={ses.status} withIcon>{ses.status}</Badge>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Mentor: <strong>{ses.mentorName}</strong> · Mode: <span className="text-royal-600 dark:text-royal-400 font-semibold">{ses.mode}</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> {formatDate(ses.date)} · {ses.time}
                  </p>
                </div>

                {ses.status === 'Scheduled' && (
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setRescheduleTarget(ses);
                        setNewDate(ses.date);
                        setNewTime(ses.time);
                      }}
                      className="btn-secondary text-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reschedule
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancel(ses.id)}
                      className="btn-ghost text-xs text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid md:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-royal-600" /> Session Notes & Outcomes
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{ses.notes}</p>
                </div>
                {ses.agenda && ses.agenda.length > 0 && (
                  <div>
                    <p className="font-bold text-slate-700 dark:text-slate-200 mb-1.5">Agenda</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                      {ses.agenda.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Book Modal */}
      <Modal isOpen={bookOpen} onClose={() => setBookOpen(false)} title="Book Mentorship Session">
        <form onSubmit={handleBook} className="space-y-4">
          <div>
            <label htmlFor="bk-mentor" className="block text-sm font-semibold mb-1.5">Select Mentor</label>
            <select id="bk-mentor" value={mentorId} onChange={(e) => setMentorId(e.target.value)} className="input-field">
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.department})</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="bk-topic" className="block text-sm font-semibold mb-1.5">Session Topic</label>
            <input
              id="bk-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="input-field"
              placeholder="e.g., Graph Algorithms & Mock Technical Q&A"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="bk-date" className="block text-sm font-semibold mb-1.5">Date</label>
              <input id="bk-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label htmlFor="bk-time" className="block text-sm font-semibold mb-1.5">Time Slot</label>
              <select id="bk-time" value={time} onChange={(e) => setTime(e.target.value)} className="input-field">
                <option>4:00 PM - 4:45 PM</option>
                <option>5:00 PM - 5:45 PM</option>
                <option>6:00 PM - 6:45 PM</option>
                <option>10:30 AM - 11:15 AM</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="bk-mode" className="block text-sm font-semibold mb-1.5">Accessible Format</label>
            <select id="bk-mode" value={mode} onChange={(e) => setMode(e.target.value)} className="input-field">
              <option>Video with Live Captions</option>
              <option>Audio + Shared Accessible Doc</option>
              <option>Text Chat + Screen-Reader Notes</option>
            </select>
          </div>
          <div>
            <label htmlFor="bk-notes" className="block text-sm font-semibold mb-1.5">Preparation Notes</label>
            <textarea id="bk-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" placeholder="Questions or topics to cover..." />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setBookOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Confirm Booking</button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        title="Reschedule Session"
        subtitle={rescheduleTarget?.topic}
      >
        <form onSubmit={handleReschedule} className="space-y-4">
          <div>
            <label htmlFor="rs-date" className="block text-sm font-semibold mb-1.5">New Date</label>
            <input id="rs-date" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label htmlFor="rs-time" className="block text-sm font-semibold mb-1.5">New Time Slot</label>
            <select id="rs-time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="input-field">
              <option>4:00 PM - 4:45 PM</option>
              <option>4:30 PM - 5:15 PM</option>
              <option>5:00 PM - 5:45 PM</option>
              <option>6:00 PM - 6:45 PM</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setRescheduleTarget(null)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save New Time</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
