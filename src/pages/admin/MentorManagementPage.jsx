import React, { useState } from 'react';
import { Plus, Star, Search } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';

export default function MentorManagementPage() {
  const { mentors, addMentorRecord } = useAppData();
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [qualification, setQualification] = useState('');
  const [experienceYears, setExperienceYears] = useState(6);

  const filtered = mentors.filter(
    (m) =>
      !query ||
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.department.toLowerCase().includes(query.toLowerCase())
  );

  const handleAdd = (e) => {
    e.preventDefault();
    addMentorRecord({
      name,
      title,
      department,
      qualification,
      experienceYears: Number(experienceYears),
      subjects: [department],
      expertise: ['Academic Mentoring', 'Career Readiness'],
      languages: ['English', 'Hindi'],
      availability: ['Sat 11:00 AM - 1:00 PM'],
      description: 'Onboarded via College Administrator portal.',
    });
    showToast(`Mentor ${name} added to UDAAN directory.`, 'success');
    setOpen(false);
    setName('');
    setTitle('');
    setQualification('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Admin · Mentor Roster"
        title="Mentor Management"
        description="Oversee mentor capacity, qualifications, ratings, and onboard new mentors."
        actions={
          <button type="button" onClick={() => setOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Onboard Mentor
          </button>
        }
      />

      <div className="card-surface p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search mentors by name or department..."
            aria-label="Search mentors"
            className="input-field pl-10"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((m) => (
          <div key={m.id} className="card-surface p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar name={m.name} color={m.avatarColor} />
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{m.name}</h2>
                <p className="text-xs text-slate-500 truncate">{m.title}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">{m.qualification}</p>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                <Star className="w-3.5 h-3.5 fill-current" /> {m.rating}
              </span>
              <Badge variant="info">{m.activeMentees}/{m.maxStudents} Mentees</Badge>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Onboard New Mentor">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label htmlFor="am-name" className="block text-sm font-semibold mb-1.5">Mentor Name</label>
            <input id="am-name" value={name} onChange={(e) => setName(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label htmlFor="am-title" className="block text-sm font-semibold mb-1.5">Professional Title</label>
            <input id="am-title" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="am-dept" className="block text-sm font-semibold mb-1.5">Department</label>
              <input id="am-dept" value={department} onChange={(e) => setDepartment(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label htmlFor="am-exp" className="block text-sm font-semibold mb-1.5">Experience (Years)</label>
              <input id="am-exp" type="number" min="1" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} className="input-field" required />
            </div>
          </div>
          <div>
            <label htmlFor="am-qual" className="block text-sm font-semibold mb-1.5">Qualification</label>
            <input id="am-qual" value={qualification} onChange={(e) => setQualification(e.target.value)} className="input-field" required />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Onboard Mentor</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
