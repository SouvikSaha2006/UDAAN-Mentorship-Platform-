import React, { useState, useEffect } from 'react';
import { Plus, Building2, BookOpen } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { apiClient } from '../../services/apiClient';

export default function DepartmentManagementPage() {
  const { departments: localDepts, addDepartmentRecord } = useAppData();
  const { showToast } = useToast();

  const [deptList, setDeptList] = useState(localDepts);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [hod, setHod] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feature 8: Fetch active departments from API on mount
  useEffect(() => {
    let isMounted = true;
    async function loadDepts() {
      try {
        const data = await apiClient.academics.getDepartments();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setDeptList(data);
        }
      } catch {
        // Fallback to localDepts silently
      }
    }
    loadDepts();
    return () => { isMounted = false; };
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      name,
      code: code.toUpperCase(),
      hod,
      description: description || `Department of ${name}`,
      accessibilityCompliance: 96,
      isActive: true,
    };

    try {
      // Feature 8: Admin-protected API call
      const created = await apiClient.academics.createDepartment(payload);
      setDeptList((prev) => [...prev, created]);
      showToast(`Department ${name} registered successfully in database.`, 'success');
      setOpen(false);
      setName('');
      setCode('');
      setHod('');
      setDescription('');
    } catch (err) {
      showToast(err.message || `Failed to create department: ${err.status === 403 ? 'Admin authorization required.' : ''}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Admin · Feature 8 Academics"
        title="Department Management"
        description="Track academic curricula, nested courses, and accessibility compliance across college departments."
        actions={
          <button type="button" onClick={() => setOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Department
          </button>
        }
      />

      <div className="grid md:grid-cols-2 gap-5">
        {deptList.map((dept) => (
          <div key={dept.id || dept.code} className="card-surface p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-royal-50 dark:bg-royal-950/60 text-royal-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{dept.name}</h2>
                  <p className="text-xs text-slate-500">Code: {dept.code} · HoD: {dept.hod || 'Department Coordinator'}</p>
                </div>
              </div>
              <Badge variant="success">{dept.accessibilityCompliance || dept.accessibility_compliance || 96}% Compliant</Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-lg font-extrabold">{dept.studentsCount ?? dept.students_count ?? 15}</p>
                <p className="text-[11px] text-slate-500">Students</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-lg font-extrabold">{dept.coursesCount ?? (dept.courses ? dept.courses.length : 2)}</p>
                <p className="text-[11px] text-slate-500">Active Courses</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-lg font-extrabold text-royal-600">{dept.activeMentorships ?? dept.active_mentorships ?? 12}</p>
                <p className="text-[11px] text-slate-500">Mentorships</p>
              </div>
            </div>

            {dept.courses && dept.courses.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <p className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-royal-600" /> Academic Programs:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {dept.courses.map((c) => (
                    <span
                      key={c.id || c.code}
                      className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                    >
                      {c.name} ({c.totalSemesters || c.total_semesters} Sem)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Register Academic Department">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label htmlFor="dp-name" className="block text-sm font-semibold mb-1.5">Department Name</label>
            <input id="dp-name" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="e.g., Mechanical Engineering" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="dp-code" className="block text-sm font-semibold mb-1.5">Department Code</label>
              <input id="dp-code" value={code} onChange={(e) => setCode(e.target.value)} className="input-field" placeholder="MECH" required />
            </div>
            <div>
              <label htmlFor="dp-hod" className="block text-sm font-semibold mb-1.5">Head of Department</label>
              <input id="dp-hod" value={hod} onChange={(e) => setHod(e.target.value)} className="input-field" placeholder="Dr. S. K. Verma" required />
            </div>
          </div>
          <div>
            <label htmlFor="dp-desc" className="block text-sm font-semibold mb-1.5">Description (Optional)</label>
            <textarea id="dp-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" placeholder="Focus areas and lab accommodations" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-60">
              {isSubmitting ? 'Registering...' : 'Add Department'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
