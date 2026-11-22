import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';

export default function FacultyManagementPage() {
  const { facultyList, addFacultyRecord } = useAppData();
  const { showToast } = useToast();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [subjects, setSubjects] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    addFacultyRecord({
      name,
      email,
      department,
      designation,
      subjects: subjects.split(',').map((s) => s.trim()).filter(Boolean),
    });
    showToast(`Added ${name} to faculty roster.`, 'success');
    setOpen(false);
    setName('');
    setEmail('');
    setSubjects('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Admin · Faculty"
        title="Faculty Management"
        description="Coordinate academic inclusion advisors and monitor accessible material coverage per faculty member."
        actions={
          <button type="button" onClick={() => setOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Faculty Member
          </button>
        }
      />

      <div className="card-surface p-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              <th className="pb-3 font-bold">Faculty Member</th>
              <th className="pb-3 font-bold">Department & Role</th>
              <th className="pb-3 font-bold">Subjects</th>
              <th className="pb-3 font-bold">Materials Uploaded</th>
              <th className="pb-3 font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {facultyList.map((f) => (
              <tr key={f.id}>
                <td className="py-3.5">
                  <p className="font-bold text-slate-900 dark:text-white">{f.name}</p>
                  <p className="text-xs text-slate-500">{f.email}</p>
                </td>
                <td className="py-3.5 text-xs">
                  <p className="font-semibold">{f.department}</p>
                  <p className="text-slate-500">{f.designation}</p>
                </td>
                <td className="py-3.5 text-xs">{(f.subjects || []).join(', ')}</td>
                <td className="py-3.5 font-bold">{f.materialsUploaded}</td>
                <td className="py-3.5"><Badge status={f.status} withIcon>{f.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add Faculty Member">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label htmlFor="af-name" className="block text-sm font-semibold mb-1.5">Full Name</label>
            <input id="af-name" value={name} onChange={(e) => setName(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label htmlFor="af-email" className="block text-sm font-semibold mb-1.5">Email</label>
            <input id="af-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="af-dept" className="block text-sm font-semibold mb-1.5">Department</label>
              <input id="af-dept" value={department} onChange={(e) => setDepartment(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label htmlFor="af-des" className="block text-sm font-semibold mb-1.5">Designation</label>
              <input id="af-des" value={designation} onChange={(e) => setDesignation(e.target.value)} className="input-field" required />
            </div>
          </div>
          <div>
            <label htmlFor="af-sub" className="block text-sm font-semibold mb-1.5">Subjects (comma-separated)</label>
            <input id="af-sub" value={subjects} onChange={(e) => setSubjects(e.target.value)} className="input-field" placeholder="Cloud Systems, Compilers" required />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add Faculty</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
