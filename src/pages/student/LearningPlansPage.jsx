import React from 'react';
import { Target, CheckCircle2, Circle, Award, Lightbulb, Calendar } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../utils/helpers';

export default function LearningPlansPage() {
  const { learningPlans, toggleLearningTask } = useAppData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const plan = learningPlans.find((lp) => lp.studentId === currentUser?.id) || learningPlans[0];

  if (!plan) {
    return (
      <div>
        <PageHeader title="Personalized Learning Plan" description="No learning plan assigned yet." />
      </div>
    );
  }

  const completedCount = plan.weeklyTasks.filter((t) => t.completed).length;
  const totalCount = plan.weeklyTasks.length || 1;
  const taskProgress = Math.round((completedCount / totalCount) * 100);

  const avgGoalProgress = Math.round(
    [...plan.academicGoals, ...plan.careerGoals].reduce((sum, g) => sum + g.progress, 0) /
      Math.max(1, plan.academicGoals.length + plan.careerGoals.length)
  );
  const overallProgress = Math.round((taskProgress + avgGoalProgress) / 2);

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Personalized Learning Plan"
        title={plan.title}
        description={`Guided by ${plan.mentorName} · Last updated ${formatDate(plan.updatedAt)}`}
      />

      {/* Overall Progress */}
      <section className="card-surface p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Overall Plan Progress</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {completedCount} of {totalCount} weekly tasks completed · {avgGoalProgress}% average goal completion
            </p>
          </div>
          <span className="text-2xl font-extrabold text-royal-600 dark:text-royal-400">{overallProgress}%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden" role="progressbar" aria-valuenow={overallProgress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-gradient-to-r from-royal-600 to-violet-600 rounded-full transition-all duration-300" style={{ width: `${overallProgress}%` }} />
        </div>
      </section>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left 7 cols */}
        <div className="lg:col-span-7 space-y-6">
          {/* Weekly Tasks */}
          <div className="card-surface p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Weekly Action Tasks
            </h2>
            <div className="space-y-2.5">
              {plan.weeklyTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => {
                    toggleLearningTask(plan.id, task.id);
                    showToast(task.completed ? 'Task marked incomplete.' : 'Task completed! Great work.', 'success');
                  }}
                  aria-pressed={task.completed}
                  className={`w-full flex items-start justify-between gap-3 p-3.5 rounded-xl border text-left transition-all ${
                    task.completed
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-royal-400'
                  }`}
                >
                  <span className="flex items-start gap-3">
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm font-semibold ${task.completed ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                      {task.title}
                    </span>
                  </span>
                  <span className="text-xs text-slate-500 shrink-0 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {formatDate(task.dueDate)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Academic & Career Goals */}
          <div className="card-surface p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-royal-600" /> Academic & Career Goals
            </h2>

            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Academic Goals</p>
              {plan.academicGoals.map((g) => (
                <div key={g.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-sm font-semibold">
                    <span>{g.title}</span>
                    <span className="text-royal-600 dark:text-royal-400">{g.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full bg-royal-600 rounded-full" style={{ width: `${g.progress}%` }} />
                  </div>
                  <p className="text-[11px] text-slate-500">Target: {formatDate(g.targetDate)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Career Goals</p>
              {plan.careerGoals.map((g) => (
                <div key={g.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-sm font-semibold">
                    <span>{g.title}</span>
                    <span className="text-violet-600 dark:text-violet-400">{g.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full bg-violet-600 rounded-full" style={{ width: `${g.progress}%` }} />
                  </div>
                  <p className="text-[11px] text-slate-500">Target: {formatDate(g.targetDate)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 cols */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card-surface p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">Learning Objectives</h2>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
              {plan.learningObjectives.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-royal-50 dark:bg-royal-950 text-royal-700 dark:text-royal-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card-surface p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> Learning Milestones
            </h2>
            <div className="space-y-3">
              {plan.milestones.map((ms) => (
                <div key={ms.id} className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{ms.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDate(ms.date)}</p>
                  </div>
                  <Badge status={ms.status} withIcon>{ms.status}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="card-surface p-6 bg-gradient-to-br from-amber-50/70 to-white dark:from-amber-950/20 dark:to-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-600" /> Mentor Recommendations
            </h2>
            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {plan.mentorRecommendations.map((rec, i) => (
                <li key={i} className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/70 border border-amber-200/60 dark:border-amber-800/40">
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
