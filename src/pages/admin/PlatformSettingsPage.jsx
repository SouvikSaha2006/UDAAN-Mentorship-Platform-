import React, { useState } from 'react';
import { Save, RotateCcw, ShieldAlert } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';

export default function PlatformSettingsPage() {
  const { platformSettings, setPlatformSettings, resetDemoData } = useAppData();
  const { showToast } = useToast();

  const [form, setForm] = useState(platformSettings);

  const handleSave = (e) => {
    e.preventDefault();
    setPlatformSettings(form);
    showToast('Platform settings saved to localStorage!', 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Admin · Configuration"
        title="Platform Settings"
        description="Configure institutional mentorship policies, default accessibility provisions, and demo storage controls."
      />

      <div className="grid lg:grid-cols-12 gap-6">
        <form onSubmit={handleSave} className="lg:col-span-8 card-surface p-6 space-y-5">
          <div>
            <label htmlFor="ps-inst" className="block text-sm font-semibold mb-1.5">Institution Name</label>
            <input
              id="ps-inst"
              value={form.institutionName}
              onChange={(e) => setForm({ ...form, institutionName: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="ps-yr" className="block text-sm font-semibold mb-1.5">Academic Year</label>
              <input
                id="ps-yr"
                value={form.academicYear}
                onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="ps-max" className="block text-sm font-semibold mb-1.5">Max Mentees / Mentor</label>
              <input
                id="ps-max"
                type="number"
                min="1"
                max="15"
                value={form.maxMenteesPerMentor}
                onChange={(e) => setForm({ ...form, maxMenteesPerMentor: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="ps-ext" className="block text-sm font-semibold mb-1.5">Default Extra Exam Time (mins)</label>
              <input
                id="ps-ext"
                type="number"
                min="10"
                max="90"
                value={form.extendedExamDefaultMins}
                onChange={(e) => setForm({ ...form, extendedExamDefaultMins: Number(e.target.value) })}
                className="input-field"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
              <span className="text-sm font-semibold">Enable Live Captions by Default on Video Sessions</span>
              <input
                type="checkbox"
                checked={form.autoCaptionsEnabled}
                onChange={(e) => setForm({ ...form, autoCaptionsEnabled: e.target.checked })}
                className="w-4 h-4 accent-royal-600"
              />
            </label>
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
              <span className="text-sm font-semibold">Allow Students to Use Guided Mentor Matching</span>
              <input
                type="checkbox"
                checked={form.allowStudentSelfMatching}
                onChange={(e) => setForm({ ...form, allowStudentSelfMatching: e.target.checked })}
                className="w-4 h-4 accent-royal-600"
              />
            </label>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary">
              <Save className="w-4 h-4" /> Save Settings
            </button>
          </div>
        </form>

        <div className="lg:col-span-4 card-surface p-6 space-y-4 h-fit border-amber-200 dark:border-amber-800/60">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" /> Demo Data Controls
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            All UDAAN demo mutations—requests, sessions, learning plans, support tickets, and messages—are saved in browser localStorage. Reset below to restore initial sample data.
          </p>
          <button type="button" onClick={resetDemoData} className="btn-secondary w-full text-xs text-rose-600 border-rose-200">
            <RotateCcw className="w-4 h-4" /> Reset All Demo Data
          </button>
        </div>
      </div>
    </div>
  );
}
