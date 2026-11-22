import React, { useState } from 'react';
import { Plus, Target, Lightbulb } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';

export default function MentorLearningPlansPage() {
  const { currentUser } = useAuth();
  const { students, learningPlans, addLearningPlanItem, updateGoalProgress, createLearningPlan } = useAppData();
  const { showToast } = useToast();

  const [selectedPlanId, setSelectedPlanId] = useState(learningPlans[0]?.id || 'lp-101');
  const [newTask, setNewTask] = useState('');
  const [newRec, setNewRec] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const [newPlanStudent, setNewPlanStudent] = useState(students[2]?.id || 'stu-103');
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanObj, setNewPlanObj] = useState('');

  const activePlan = learningPlans.find((lp) => lp.id === selectedPlanId) || learningPlans[0];

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.trim() || !activePlan) return;
    addLearningPlanItem(activePlan.id, 'weeklyTasks', {
      id: `wt-${Date.now()}`,
      title: newTask.trim(),
      dueDate: '2026-12-05',
      completed: false,
    });
    setNewTask('');
    showToast('Task added to student learning plan.', 'success');
  };

  const handleAddRec = (e) => {
    e.preventDefault();
    if (!newRec.trim() || !activePlan) return;
    addLearningPlanItem(activePlan.id, 'mentorRecommendations', newRec.trim());
    setNewRec('');
    showToast('Recommendation added.', 'success');
  };

  const handleCreatePlan = (e) => {
    e.preventDefault();
    const stu = students.find((s) => s.id === newPlanStudent) || students[0];
    const created = createLearningPlan({
      studentId: stu.id,
      studentName: stu.name,
      mentorId: currentUser?.id || 'men-201',
      mentorName: currentUser?.name || 'Dr. Meera Krishnan',
      title: newPlanTitle,
      learningObjectives: [newPlanObj],
      academicGoals: [{ id: `ag-${Date.now()}`, title: 'Complete Semester Core Milestone', progress: 20, targetDate: '2026-12-20' }],
      careerGoals: [{ id: `cg-${Date.now()}`, title: 'Build Accessible Portfolio Project', progress: 15, targetDate: '2027-01-15' }],
      weeklyTasks: [{ id: `wt-${Date.now()}`, title: 'Initial Goal & Accessibility Audit', dueDate: '2026-11-30', completed: false }],
      milestones: [{ id: `ms-${Date.now()}`, title: 'Roadmap Kickoff', status: 'In Progress', date: '2026-11-28' }],
      mentorRecommendations: ['Schedule weekly 30-minute check-ins with captioned notes.'],
    });
    setSelectedPlanId(created.id);
    setCreateOpen(false);
    setNewPlanTitle('');
    setNewPlanObj('');
    showToast(`Learning plan created for ${stu.name}.`, 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Mentor Learning Plan Manager"
        title="Manage Student Learning Plans"
        description="Create roadmaps, adjust goal completion percentages, add weekly tasks, and post mentor recommendations."
        actions={
          <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Create New Plan
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {learningPlans.map((lp) => (
          <button
            key={lp.id}
            type="button"
            onClick={() => setSelectedPlanId(lp.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activePlan?.id === lp.id
                ? 'bg-royal-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {lp.studentName} · {lp.title.slice(0, 28)}...
          </button>
        ))}
      </div>

      {activePlan && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 card-surface p-6 space-y-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{activePlan.title}</h2>
              <p className="text-xs text-slate-500">Student: {activePlan.studentName}</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Target className="w-4 h-4 text-royal-600" /> Update Goal Progress
              </h3>
              {activePlan.academicGoals.map((g) => (
                <div key={g.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{g.title}</span>
                    <span>{g.progress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={g.progress}
                    aria-label={`Progress for ${g.title}`}
                    onChange={(e) => updateGoalProgress(activePlan.id, 'academicGoals', g.id, Number(e.target.value))}
                    className="w-full accent-royal-600"
                  />
                </div>
              ))}
            </div>

            <form onSubmit={handleAddTask} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label htmlFor="add-wt" className="block text-sm font-bold">Add Weekly Task</label>
              <div className="flex gap-2">
                <input
                  id="add-wt"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  className="input-field flex-1"
                  placeholder="e.g., Complete 4 accessible form validation drills"
                />
                <button type="submit" className="btn-primary text-xs">Add Task</button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-5 card-surface p-6 space-y-4 h-fit">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" /> Recommendations
            </h3>
            <ul className="space-y-2 text-xs">
              {activePlan.mentorRecommendations.map((r, i) => (
                <li key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">{r}</li>
              ))}
            </ul>
            <form onSubmit={handleAddRec} className="space-y-2 pt-2">
              <label htmlFor="add-rec" className="block text-xs font-bold">Post New Recommendation</label>
              <textarea
                id="add-rec"
                rows={2}
                value={newRec}
                onChange={(e) => setNewRec(e.target.value)}
                className="input-field"
                placeholder="Write actionable advice..."
              />
              <button type="submit" className="btn-secondary w-full text-xs">Add Recommendation</button>
            </form>
          </div>
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Learning Plan">
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <div>
            <label htmlFor="cp-stu" className="block text-sm font-semibold mb-1.5">Student</label>
            <select id="cp-stu" value={newPlanStudent} onChange={(e) => setNewPlanStudent(e.target.value)} className="input-field">
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.course})</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cp-title" className="block text-sm font-semibold mb-1.5">Plan Title</label>
            <input id="cp-title" value={newPlanTitle} onChange={(e) => setNewPlanTitle(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label htmlFor="cp-obj" className="block text-sm font-semibold mb-1.5">Primary Learning Objective</label>
            <textarea id="cp-obj" rows={2} value={newPlanObj} onChange={(e) => setNewPlanObj(e.target.value)} className="input-field" required />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Plan</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
