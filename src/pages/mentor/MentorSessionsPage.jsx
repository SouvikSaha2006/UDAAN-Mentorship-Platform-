import React, { useState } from 'react';
import { Calendar, Plus, CheckCircle2, FileEdit } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { formatDate } from '../../utils/helpers';

export default function MentorSessionsPage() {
  const { currentUser } = useAuth();
  const { students, sessions, bookSession, updateSession } = useAppData();
  const { showToast } = useToast();

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [studentId, setStudentId] = useState(students[0]?.id || 'stu-101');
  const [topic, setTopic] = useState('');
  const [date, setDate] = useState('2026-11-29');
  const [time, setTime] = useState('5:00 PM - 5:45 PM');
  const [mode, setMode] = useState('Video with Live Captions');

  const [noteTarget, setNoteTarget] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');

  const mySessions = sessions.filter(
    (s) => s.mentorId === (currentUser?.id || 'men-201') || s.mentorId === 'men-201'
  );

  const handleSchedule = (e) => {
    e.preventDefault();
    const stu = students.find((s) => s.id === studentId) || students[0];
    bookSession({
      studentId: stu.id,
      studentName: stu.name,
      mentorId: currentUser?.id || 'men-201',
      mentorName: currentUser?.name || 'Dr. Meera Krishnan',
      topic,
      date,
      time,
      mode,
      notes: 'Scheduled by mentor.',
    });
    showToast(`Session scheduled with ${stu.name}.`, 'success');
    setScheduleOpen(false);
    setTopic('');
  };

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!noteTarget) return;
    updateSession(noteTarget.id, { notes: noteDraft });
    showToast('Session notes updated.', 'success');
    setNoteTarget(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Session Management"
        title="Schedule & Session Notes"
        description="Schedule sessions with mentees, record completion, and maintain accessible written session notes."
        actions={
          <button type="button" onClick={() => setScheduleOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Schedule Session
          </button>
        }
      />

      <div className="space-y-4">
        {mySessions.map((ses) => (
          <div key={ses.id} className="card-surface p-6 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{ses.topic}</h2>
                  <Badge status={ses.status} withIcon>{ses.status}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Student: <strong>{ses.studentName}</strong> · {formatDate(ses.date)} · {ses.time} · {ses.mode}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNoteTarget(ses);
                    setNoteDraft(ses.notes || '');
                  }}
                  className="btn-secondary text-xs"
                >
                  <FileEdit className="w-3.5 h-3.5" /> Edit Notes
                </button>
                {ses.status === 'Scheduled' && (
                  <button
                    type="button"
                    onClick={() => {
                      updateSession(ses.id, { status: 'Completed' });
                      showToast('Session marked completed.', 'success');
                    }}
                    className="btn-primary text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl">
              <strong>Notes:</strong> {ses.notes}
            </p>
          </div>
        ))}
      </div>

      <Modal isOpen={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Schedule Mentorship Session">
        <form onSubmit={handleSchedule} className="space-y-4">
          <div>
            <label htmlFor="ms-stu" className="block text-sm font-semibold mb-1.5">Student</label>
            <select id="ms-stu" value={studentId} onChange={(e) => setStudentId(e.target.value)} className="input-field">
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.course})</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ms-top" className="block text-sm font-semibold mb-1.5">Topic</label>
            <input id="ms-top" value={topic} onChange={(e) => setTopic(e.target.value)} className="input-field" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ms-dt" className="block text-sm font-semibold mb-1.5">Date</label>
              <input id="ms-dt" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label htmlFor="ms-tm" className="block text-sm font-semibold mb-1.5">Time</label>
              <input id="ms-tm" value={time} onChange={(e) => setTime(e.target.value)} className="input-field" required />
            </div>
          </div>
          <div>
            <label htmlFor="ms-md" className="block text-sm font-semibold mb-1.5">Communication Format</label>
            <select id="ms-md" value={mode} onChange={(e) => setMode(e.target.value)} className="input-field">
              <option>Video with Live Captions</option>
              <option>Audio + Shared Accessible Doc</option>
              <option>Text Chat + Screen-Reader Notes</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setScheduleOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">
              <Calendar className="w-4 h-4" /> Schedule
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(noteTarget)}
        onClose={() => setNoteTarget(null)}
        title="Update Session Notes"
        subtitle={noteTarget?.topic}
      >
        <form onSubmit={handleSaveNote} className="space-y-4">
          <textarea
            rows={4}
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            className="input-field"
            required
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setNoteTarget(null)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Notes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
