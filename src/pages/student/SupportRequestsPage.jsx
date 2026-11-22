import React, { useState } from 'react';
import { LifeBuoy, Plus, Paperclip, Clock } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SUPPORT_CATEGORIES } from '../../data/mockSupportAndComms';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { formatDate } from '../../utils/helpers';

export default function SupportRequestsPage() {
  const { supportRequests, createSupportRequest } = useAppData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState(SUPPORT_CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [attachmentName, setAttachmentName] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const myRequests = supportRequests.filter(
    (r) => r.studentId === currentUser?.id || r.studentId === 'stu-101'
  );
  const visible =
    statusFilter === 'All'
      ? myRequests
      : myRequests.filter((r) => r.status === statusFilter);

  const handleSubmit = (e) => {
    e.preventDefault();
    createSupportRequest({
      studentId: currentUser?.id || 'stu-101',
      studentName: currentUser?.name || 'Aarav Sharma',
      studentCourse: `${currentUser?.course || 'B.Tech CSE'} · ${currentUser?.semester || 'Sem 5'}`,
      category,
      title,
      description,
      priority,
      attachmentName,
    });
    showToast('Support request submitted to the Inclusion Cell!', 'success');
    setModalOpen(false);
    setTitle('');
    setDescription('');
    setAttachmentName('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Student Support System"
        title="Support & Accommodation Requests"
        description="Submit requests for exam accommodations, assistive technology, mobility support, or accessible materials and track coordinator updates."
        actions={
          <button type="button" onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> New Support Request
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {['All', 'Submitted', 'Under Review', 'Approved', 'In Progress', 'Completed'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === st
                ? 'bg-royal-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {visible.map((req) => (
          <div key={req.id} className="card-surface p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <Badge variant="violet">{req.category}</Badge>
                  <Badge status={req.status} withIcon>{req.status}</Badge>
                  <Badge status={req.priority}>{req.priority} Priority</Badge>
                </div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{req.title}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{req.description}</p>
              </div>
              <div className="text-xs text-slate-500 shrink-0 space-y-1">
                <p>Ticket: <strong>{req.id}</strong></p>
                <p>Assigned: <strong>{req.assignedTo}</strong></p>
                <p className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Updated {formatDate(req.updatedAt)}</p>
              </div>
            </div>

            {req.attachmentName && (
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-royal-600 dark:text-royal-400 bg-royal-50 dark:bg-royal-950/40 px-3 py-1.5 rounded-lg">
                <Paperclip className="w-3.5 h-3.5" /> Sample Attachment: {req.attachmentName}
              </p>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Request History</p>
              <ul className="space-y-2 text-xs">
                {(req.updates || []).map((u, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white shrink-0">{formatDate(u.date)} · {u.author}:</span>
                    <span>{u.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Submit Support Request">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="sr-cat" className="block text-sm font-semibold mb-1.5">Support Category</label>
            <select id="sr-cat" value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
              {SUPPORT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sr-title" className="block text-sm font-semibold mb-1.5">Request Summary</label>
            <input
              id="sr-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="e.g., Large-print lab manual for CS502"
              required
            />
          </div>
          <div>
            <label htmlFor="sr-pri" className="block text-sm font-semibold mb-1.5">Priority</label>
            <select id="sr-pri" value={priority} onChange={(e) => setPriority(e.target.value)} className="input-field">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div>
            <label htmlFor="sr-desc" className="block text-sm font-semibold mb-1.5">Describe Your Needs</label>
            <textarea
              id="sr-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              placeholder="Provide course code, dates, or specific assistive requirement..."
              required
            />
          </div>
          <div>
            <label htmlFor="sr-file" className="block text-sm font-semibold mb-1.5">Optional Sample Attachment</label>
            <input
              id="sr-file"
              type="file"
              onChange={(e) => setAttachmentName(e.target.files?.[0]?.name || '')}
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-royal-50 file:text-royal-700"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">
              <LifeBuoy className="w-4 h-4" /> Submit Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
