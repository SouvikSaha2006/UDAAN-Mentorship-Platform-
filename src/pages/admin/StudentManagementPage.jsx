import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Download, Search, UserCheck, UserX } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { exportToCSV } from '../../utils/helpers';
import { apiClient } from '../../services/apiClient';

export default function StudentManagementPage() {
  const { students: fallbackStudents, addStudentRecord } = useAppData();
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [apiStudents, setApiStudents] = useState([]);
  const [useBackend, setUseBackend] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [course, setCourse] = useState('B.Tech Computer Science');
  const [semester, setSemester] = useState('3rd Semester');
  const [accessibilityProfile, setAccessibilityProfile] = useState('Visual Support');

  // Feature 4: Load students from backend API with search query
  const loadStudents = useCallback(async (searchQuery = '') => {
    try {
      const data = await apiClient.students.listStudents({ search: searchQuery });
      if (Array.isArray(data)) {
        setApiStudents(data);
        setUseBackend(true);
      }
    } catch {
      setUseBackend(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadStudents(query);
    }, 250);
    return () => clearTimeout(handler);
  }, [query, loadStudents]);

  // Merge backend data with fallback format
  const displayStudents = useBackend && apiStudents.length > 0
    ? apiStudents.map((s) => ({
        id: s.id,
        studentId: s.studentId,
        name: s.fullName || s.name,
        email: s.email || `${s.studentId?.toLowerCase()}@udaan.edu`,
        rollNumber: s.rollNumber || s.studentId,
        department: s.departmentName || s.department || 'General',
        course: s.courseName || s.course || 'B.Tech',
        semester: `${s.semester}${s.semester === 1 ? 'st' : s.semester === 2 ? 'nd' : s.semester === 3 ? 'rd' : 'th'} Semester`,
        accessibilityProfile: s.disabilityType || (s.assistiveDevices?.length > 0 ? s.assistiveDevices[0] : 'Standard Support'),
        progressScore: s.profileCompletion || 75,
        status: s.isActive ? 'Active' : 'Deactivated',
        isActive: s.isActive !== false,
      }))
    : fallbackStudents.filter(
        (s) =>
          !query ||
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.rollNumber.toLowerCase().includes(query.toLowerCase()) ||
          s.department.toLowerCase().includes(query.toLowerCase())
      );

  // Feature 4: Activate / Deactivate student account
  const handleToggleStatus = async (student) => {
    const targetStudentId = student.studentId || student.id;
    const nextActive = !student.isActive;

    try {
      await apiClient.students.updateStatus(targetStudentId, nextActive);
      showToast(
        `Student ${student.name} account ${nextActive ? 'activated' : 'deactivated'}.`,
        nextActive ? 'success' : 'warning'
      );
      loadStudents(query);
    } catch (err) {
      showToast(err.message || 'Unable to update status.', 'error');
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    addStudentRecord({
      name,
      email,
      rollNumber,
      department,
      course,
      semester,
      cgpa: 8.5,
      assignedMentorId: 'men-201',
      accessibilityProfile,
      accommodations: ['Extended Exam Time (+30 mins)'],
    });
    showToast(`Added student ${name} to directory.`, 'success');
    setOpen(false);
    setName('');
    setEmail('');
    setRollNumber('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Admin · Student Directory"
        title="Student Management"
        description="Manage registered students, accessibility accommodation profiles, and mentorship assignment status."
        actions={
          <>
            <button
              type="button"
              onClick={() => {
                exportToCSV('udaan-students.csv', displayStudents);
                showToast('Exported student list as CSV.', 'success');
              }}
              className="btn-secondary"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button type="button" onClick={() => setOpen(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Add Student
            </button>
          </>
        }
      />

      <div className="card-surface p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, roll number, or department..."
            aria-label="Search students"
            className="input-field pl-10"
          />
        </div>
      </div>

      <div className="card-surface p-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              <th className="pb-3 font-bold">Student</th>
              <th className="pb-3 font-bold">Roll / Student ID</th>
              <th className="pb-3 font-bold">Department & Semester</th>
              <th className="pb-3 font-bold">Accessibility Profile</th>
              <th className="pb-3 font-bold">Progress</th>
              <th className="pb-3 font-bold">Status</th>
              <th className="pb-3 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {displayStudents.map((s) => (
              <tr key={s.id || s.studentId}>
                <td className="py-3.5">
                  <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.email}</p>
                </td>
                <td className="py-3.5 text-xs font-mono">{s.rollNumber}</td>
                <td className="py-3.5 text-xs">
                  <p className="font-semibold">{s.department}</p>
                  <p className="text-slate-500">{s.course} · {s.semester}</p>
                </td>
                <td className="py-3.5 text-xs">{s.accessibilityProfile}</td>
                <td className="py-3.5 font-bold text-royal-600">{s.progressScore}%</td>
                <td className="py-3.5">
                  <Badge status={s.status} withIcon>{s.status}</Badge>
                </td>
                <td className="py-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(s)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      s.isActive
                        ? 'border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                        : 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                    }`}
                  >
                    {s.isActive ? (
                      <>
                        <UserX className="w-3.5 h-3.5" /> Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" /> Activate
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Register Demo Student">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="as-name" className="block text-sm font-semibold mb-1.5">Full Name</label>
              <input id="as-name" value={name} onChange={(e) => setName(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label htmlFor="as-roll" className="block text-sm font-semibold mb-1.5">Roll Number</label>
              <input id="as-roll" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} className="input-field" placeholder="CSE-2026-091" required />
            </div>
          </div>
          <div>
            <label htmlFor="as-email" className="block text-sm font-semibold mb-1.5">Email</label>
            <input id="as-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="as-dept" className="block text-sm font-semibold mb-1.5">Department</label>
              <input id="as-dept" value={department} onChange={(e) => setDepartment(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label htmlFor="as-sem" className="block text-sm font-semibold mb-1.5">Semester</label>
              <input id="as-sem" value={semester} onChange={(e) => setSemester(e.target.value)} className="input-field" required />
            </div>
          </div>
          <div>
            <label htmlFor="as-acc" className="block text-sm font-semibold mb-1.5">Accessibility Support Summary</label>
            <input id="as-acc" value={accessibilityProfile} onChange={(e) => setAccessibilityProfile(e.target.value)} className="input-field" required />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add Student</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
