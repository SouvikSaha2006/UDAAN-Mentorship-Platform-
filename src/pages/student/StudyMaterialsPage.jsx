import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Headphones, Search } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';

export default function StudyMaterialsPage() {
  const { materials } = useAppData();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('All');

  const subjects = ['All', ...Array.from(new Set(materials.map((m) => m.subject)))];

  const filtered = materials.filter((m) => {
    const matchesQ =
      !query ||
      m.title.toLowerCase().includes(query.toLowerCase()) ||
      m.summary.toLowerCase().includes(query.toLowerCase());
    const matchesS = subject === 'All' || m.subject === subject;
    return matchesQ && matchesS;
  });

  const handleDownloadTranscript = (mat) => {
    const blob = new Blob([`${mat.title}\n\n${mat.summary}\n\n${mat.content}`], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mat.id}-accessible-notes.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded accessible transcript for "${mat.title}".`, 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Accessible Library"
        title="Study Materials & Resources"
        description="Browse screen-reader tagged PDFs, captioned lecture notes, and downloadable accessible transcripts."
        actions={
          <Link to="/student/assistive-hub" className="btn-primary">
            <Headphones className="w-4 h-4" /> Open in Assistive Hub
          </Link>
        }
      />

      <div className="card-surface p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search study materials..."
            aria-label="Search study materials"
            className="input-field pl-10"
          />
        </div>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          aria-label="Filter study materials by subject"
          className="input-field sm:w-64"
        >
          {subjects.map((s) => (
            <option key={s} value={s}>{s === 'All' ? 'All Subjects' : s}</option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {filtered.map((mat) => (
          <div key={mat.id} className="card-surface p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <Badge variant="violet">{mat.type}</Badge>
                {mat.hasTranscript && <Badge variant="success">Transcript Ready</Badge>}
              </div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{mat.title}</h2>
              <p className="text-xs text-royal-600 dark:text-royal-400 font-semibold mt-1">{mat.subject}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{mat.summary}</p>
              <p className="text-[11px] text-slate-400 mt-3">{mat.durationOrPages} · By {mat.faculty}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <button type="button" onClick={() => handleDownloadTranscript(mat)} className="btn-secondary text-xs flex-1">
                <Download className="w-3.5 h-3.5" /> Download Accessible Text
              </button>
              <Link to="/student/assistive-hub" className="btn-primary text-xs flex-1">
                <Headphones className="w-3.5 h-3.5" /> Listen Aloud
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
