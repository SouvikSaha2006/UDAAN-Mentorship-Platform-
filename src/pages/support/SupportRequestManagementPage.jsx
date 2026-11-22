import React, { useState } from 'react';
import { Edit3, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import { SUPPORT_CATEGORIES, SUPPORT_STATUSES } from '../../data/mockSupportAndComms';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { formatDate } from '../../utils/helpers';

export default function SupportRequestManagementPage() {
  const { currentUser } = useAuth();
  const { supportRequests, updateSupportRequest } = useAppData();
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [editingReq, setEditingReq] = useState(null);
  const [nextStatus, setNextStatus] = useState('Under Review');
  const [assignedTo, setAssignedTo] = useState('Ananya Deshmukh');
  const [updateNote, setUpdateNote] = useState('');

  const filtered = supportRequests.filter((r) => {
    const q = query.toLowerCase();
    const matchesQ =
      !q ||
      r.title.toLowerCase().includes(q) ||
      r.studentName.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q);
    const matchesS = statusFilter === 'All' || r.status === statusFilter;
    const matchesC = categoryFilter === 'All' || r.category === categoryFilter;
    return matchesQ && matchesS && matchesC;
  });

  const openManage = (req) => {
    setEditingReq(req);
    setNextStatus(req.status);
    setAssignedTo(req.assignedTo === 'Pending Assignment' ? 'Ananya Deshmukh' : req.assignedTo);
    setUpdateNote('');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!editingReq) return;
    updateSupportRequest(editingReq.id, {
      status: nextStatus,
      assignedTo,
      note: updateNote.trim() || `Status updated to ${nextStatus} by coordinator.`,
      author: currentUser?.name || 'Ananya Deshmukh',
    });
    showToast(`Ticket ${editingReq.id} updated to ${nextStatus}.`, 'success');
    setEditingReq(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Support Queue"
        title="Support Request Management"
        description="Assign coordinators, update ticket statuses, and post transparent progress updates for students."
      />

      <div className="card-surface p-4 grid sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search student, ticket, title..."
            aria-label="Search support requests"
            className="input-field pl-10"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status" className="input-field">
          <option value="All">All Statuses</option>
          {SUPPORT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filter by category" className="input-field">
          <option value="All">All Categories</option>
          {SUPPORT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {filtered.map((req) => (
          <div key={req.id} className="card-surface p-6 space-y-3">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-500">{req.id}</span>
                  <Badge variant="violet">{req.category}</Badge>
                  <Badge status={req.status} withIcon>{req.status}</Badge>
                  <Badge status={req.priority}>{req.priority}</Badge>
                </div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{req.title}</h2>
                <p className="text-xs text-slate-500">
                  Student: <strong>{req.studentName}</strong> ({req.studentCourse}) · Assigned to: <strong>{req.assignedTo}</strong>
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{req.description}</p>
              </div>

              <button type="button" onClick={() => openManage(req)} className="btn-primary text-xs shrink-0">
                <Edit3 className="w-3.5 h-3.5" /> Assign / Update Status
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              {(req.updates || []).map((u, idx) => (
                <p key={idx}>
                  <strong className="text-slate-900 dark:text-white">{formatDate(u.date)} · {u.author}:</strong> {u.note}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={Boolean(editingReq)}
        onClose={() => setEditingReq(null)}
        title={`Manage Request ${editingReq?.id || ''}`}
        subtitle={editingReq?.title}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="srm-status" className="block text-sm font-semibold mb-1.5">Status</label>
            <select id="srm-status" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} className="input-field">
              {SUPPORT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="srm-staff" className="block text-sm font-semibold mb-1.5">Assign Support Staff</label>
            <select id="srm-staff" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="input-field">
              <option>Ananya Deshmukh</option>
              <option>Prof. Rajeshwari Kulkarni</option>
              <option>Campus Assistive Tech Team</option>
              <option>Exam Controller Inclusion Desk</option>
            </select>
          </div>
          <div>
            <label htmlFor="srm-note" className="block text-sm font-semibold mb-1.5">Progress Update Note</label>
            <textarea
              id="srm-note"
              rows={3}
              value={updateNote}
              onChange={(e) => setUpdateNote(e.target.value)}
              className="input-field"
              placeholder="Explain next steps or confirmation details for the student..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditingReq(null)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Update</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
