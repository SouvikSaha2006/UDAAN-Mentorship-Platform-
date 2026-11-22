import React, { useState } from 'react';
import { Save, CheckCircle2, Accessibility, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';

const ACCOMMODATION_OPTIONS = [
  'Screen Reader Support',
  'Extended Exam Time (+30 mins)',
  'High Contrast UI',
  'Live Video Captions & Transcripts',
  'Ground-Floor / Ramp Lab Access',
  'Dyslexia-Friendly Reading Mode',
  'Voice-to-Text Submission Support',
];

export default function StudentProfilePage() {
  const { currentUser, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(currentUser?.name || '');
  const [course, setCourse] = useState(currentUser?.course || 'B.Tech Computer Science');
  const [semester, setSemester] = useState(currentUser?.semester || '5th Semester');
  const [phone, setPhone] = useState(currentUser?.phone || '+91 98765 43210');
  const [careerGoal, setCareerGoal] = useState(currentUser?.careerGoal || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [needs, setNeeds] = useState(currentUser?.accessibilityNeeds || []);

  const toggleNeed = (item) => {
    setNeeds((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSave = (e) => {
    e.preventDefault();
    const completion = Math.min(100, 65 + (bio.length > 15 ? 15 : 0) + (needs.length > 0 ? 15 : 0) + (careerGoal ? 5 : 0));
    updateProfile({
      name,
      course,
      semester,
      phone,
      careerGoal,
      bio,
      accessibilityNeeds: needs,
      profileCompletion: completion,
    });
    showToast('Student profile updated and saved to localStorage.', 'success');
  };

  return (
    <div>
      <PageHeader
        badge="Student Profile"
        title="Personal & Accessibility Profile"
        description="Manage your academic details, career aspirations, and preferred campus & digital accommodations."
      />

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="card-surface p-6 text-center">
            <div className="flex justify-center">
              <Avatar name={name || 'Student'} color={currentUser?.avatarColor} size="xl" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-4">{name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser?.email}</p>
            <div className="mt-3 flex justify-center gap-2">
              <Badge variant="info">{currentUser?.rollNumber || 'CSE-2024-042'}</Badge>
              <Badge variant="success">Active Student</Badge>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Department</span>
                <span className="font-semibold">{currentUser?.department || 'CSE'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CGPA</span>
                <span className="font-semibold">{currentUser?.cgpa || 8.74}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Profile Completion</span>
                <span className="font-bold text-royal-600">{currentUser?.profileCompletion || 88}%</span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="lg:col-span-8 card-surface p-6 space-y-5">
          <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
            <User className="w-5 h-5 text-royal-600" /> Academic & Contact Details
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sp-name" className="block text-sm font-semibold mb-1.5">Full Name</label>
              <input id="sp-name" value={name} onChange={(e) => setName(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label htmlFor="sp-phone" className="block text-sm font-semibold mb-1.5">Phone Number</label>
              <input id="sp-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" />
            </div>
            <div>
              <label htmlFor="sp-course" className="block text-sm font-semibold mb-1.5">Course</label>
              <input id="sp-course" value={course} onChange={(e) => setCourse(e.target.value)} className="input-field" />
            </div>
            <div>
              <label htmlFor="sp-sem" className="block text-sm font-semibold mb-1.5">Semester</label>
              <input id="sp-sem" value={semester} onChange={(e) => setSemester(e.target.value)} className="input-field" />
            </div>
          </div>

          <div>
            <label htmlFor="sp-goal" className="block text-sm font-semibold mb-1.5">Career Goal</label>
            <input id="sp-goal" value={careerGoal} onChange={(e) => setCareerGoal(e.target.value)} className="input-field" placeholder="e.g., Accessibility-focused Full Stack Engineer" />
          </div>

          <div>
            <label htmlFor="sp-bio" className="block text-sm font-semibold mb-1.5">Short Bio & Learning Interests</label>
            <textarea id="sp-bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} className="input-field" />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white mb-3">
              <Accessibility className="w-4 h-4 text-violet-600" /> Preferred Accommodations & Assistive Needs
            </p>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {ACCOMMODATION_OPTIONS.map((opt) => {
                const selected = needs.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleNeed(opt)}
                    aria-pressed={selected}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      selected
                        ? 'bg-royal-50 dark:bg-royal-950/50 border-royal-500 text-royal-800 dark:text-royal-200'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${selected ? 'text-royal-600' : 'text-slate-400'}`} />
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary">
              <Save className="w-4 h-4" /> Save Profile Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
