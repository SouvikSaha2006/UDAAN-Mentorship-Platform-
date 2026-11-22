import React, { useState } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';

export default function FacultyMaterialsPage() {
  const { currentUser } = useAuth();
  const { materials, addStudyMaterial } = useAppData();
  const { showToast } = useToast();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Database Management Systems');
  const [type, setType] = useState('Accessible PDF');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');

  const handlePublish = (e) => {
    e.preventDefault();
    addStudyMaterial({
      title,
      subject,
      type,
      durationOrPages: 'Screen-reader verified · Transcript included',
      faculty: currentUser?.name || 'Prof. Rajeshwari Kulkarni',
      summary,
      content: content || summary,
    });
    showToast('Accessible study material published!', 'success');
    setOpen(false);
    setTitle('');
    setSummary('');
    setContent('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Inclusive Curriculum"
        title="Accessible Course Materials"
        description="Publish tagged PDFs, captioned videos, and readable transcripts for students."
        actions={
          <button type="button" onClick={() => setOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Publish Accessible Material
          </button>
        }
      />

      <div className="grid md:grid-cols-2 gap-5">
        {materials.map((m) => (
          <div key={m.id} className="card-surface p-6 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="violet">{m.type}</Badge>
              <Badge variant="success">Transcript Attached</Badge>
            </div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-royal-600 shrink-0" /> {m.title}
            </h2>
            <p className="text-xs font-semibold text-royal-600">{m.subject}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">{m.summary}</p>
            <p className="text-[11px] text-slate-400 pt-1">{m.durationOrPages}</p>
          </div>
        ))}
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Publish Accessible Study Material">
        <form onSubmit={handlePublish} className="space-y-4">
          <div>
            <label htmlFor="fm-title" className="block text-sm font-semibold mb-1.5">Material Title</label>
            <input id="fm-title" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="fm-sub" className="block text-sm font-semibold mb-1.5">Subject</label>
              <input id="fm-sub" value={subject} onChange={(e) => setSubject(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label htmlFor="fm-type" className="block text-sm font-semibold mb-1.5">Format</label>
              <select id="fm-type" value={type} onChange={(e) => setType(e.target.value)} className="input-field">
                <option>Accessible PDF</option>
                <option>Video + Transcript</option>
                <option>Study Notes</option>
                <option>Audio / Text Guide</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="fm-sum" className="block text-sm font-semibold mb-1.5">Short Summary</label>
            <input id="fm-sum" value={summary} onChange={(e) => setSummary(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label htmlFor="fm-cnt" className="block text-sm font-semibold mb-1.5">Transcript / Readable Text (for Assistive Hub TTS)</label>
            <textarea id="fm-cnt" rows={3} value={content} onChange={(e) => setContent(e.target.value)} className="input-field" required />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Publish</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
