import React, { useState } from 'react';
import { Plus, Building2 } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';

export default function DepartmentManagementPage() {
  const { departments, addDepartmentRecord } = useAppData();
  const { showToast } = useToast();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [hod, setHod] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    addDepartmentRecord({
      name,
      code: code.toUpperCase(),
      hod,
      studentsCount: 15,
      mentorsCount: 4,
      activeMentorships: 12,
    });
    showToast(`Department ${name} added.`, 'success');
    setOpen(false);
    setName('');
    setCode('');
    setHod('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Admin · Departments"
        title="Department Management"
        description="Track mentorship coverage and accessibility compliance across academic departments."
        actions={
          <button type="button" onClick={() => setOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Department
          </button>
        }
      />

      <div className="grid md:grid-cols-2 gap-5">
        {departments.map((dept) => (
          <div key={dept.id} className="card-surface p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-royal-50 dark:bg-royal-950/60 text-royal-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{dept.name}</h2>
                  <p className="text-xs text-slate-500">Code: {dept.code} · HoD: {dept.hod}</p>
                </div>
              </div>
              <Badge variant="success">{dept.accessibilityCompliance}% Compliant</Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-lg font-extrabold">{dept.studentsCount}</p>
                <p className="text-[11px] text-slate-500">Students</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-lg font-extrabold">{dept.mentorsCount}</p>
                <p className="text-[11px] text-slate-500">Mentors</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-lg font-extrabold text-royal-600">{dept.activeMentorships}</p>
                <p className="text-[11px] text-slate-500">Mentorships</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add Department">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label htmlFor="dp-name" className="block text-sm font-semibold mb-1.5">Department Name</label>
            <input id="dp-name" value={name} onChange={(e) => setName(e.target.value)} className="input-field" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="dp-code" className="block text-sm font-semibold mb-1.5">Department Code</label>
              <input id="dp-code" value={code} onChange={(e) => setCode(e.target.value)} className="input-field" placeholder="MECH" required />
            </div>
            <div>
              <label htmlFor="dp-hod" className="block text-sm font-semibold mb-1.5">Head of Department</label>
              <input id="dp-hod" value={hod} onChange={(e) => setHod(e.target.value)} className="input-field" required />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add Department</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
