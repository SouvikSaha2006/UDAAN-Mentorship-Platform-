import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, CheckCircle2, Info, Send } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';

export default function MentorMatchingPage() {
  const { mentors, sendMentorshipRequest, mentorshipRequests } = useAppData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [academicInterest, setAcademicInterest] = useState('Computer Science');
  const [careerGoal, setCareerGoal] = useState('Internship & Interview Preparation');
  const [communicationMethod, setCommunicationMethod] = useState('Video with Captions');
  const [learningPref, setLearningPref] = useState('Structured Written Notes & Transcripts');
  const [assistanceAreas, setAssistanceAreas] = useState(['Web Accessibility (WCAG)', 'Interview Preparation']);
  const [schedule, setSchedule] = useState('Weekday Evenings');
  const [matchedRun, setMatchedRun] = useState(true);

  const toggleArea = (area) => {
    setAssistanceAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const rankedMentors = useMemo(() => {
    return mentors
      .map((mentor) => {
        let score = 62;
        const reasons = [];

        if (
          mentor.department.toLowerCase().includes(academicInterest.toLowerCase()) ||
          (mentor.subjects || []).some((s) => s.toLowerCase().includes(academicInterest.toLowerCase()))
        ) {
          score += 16;
          reasons.push(`Subject fit: ${academicInterest}`);
        }
        if ((mentor.communicationMethods || []).some((m) => m.toLowerCase().includes(communicationMethod.split(' ')[0].toLowerCase()))) {
          score += 10;
          reasons.push(`Supports ${communicationMethod}`);
        }
        if ((mentor.schedulePreference || '').toLowerCase().includes(schedule.split(' ')[0].toLowerCase())) {
          score += 7;
          reasons.push(`Available ${mentor.schedulePreference}`);
        }
        const overlappingSkills = (mentor.expertise || []).filter((e) =>
          assistanceAreas.some((a) => e.toLowerCase().includes(a.split(' ')[0].toLowerCase()))
        );
        if (overlappingSkills.length > 0) {
          score += Math.min(12, overlappingSkills.length * 6);
          reasons.push(`Expertise: ${overlappingSkills.join(', ')}`);
        }

        return {
          ...mentor,
          matchScore: Math.min(98, score),
          reasons: reasons.length ? reasons : ['General academic & career mentoring availability'],
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [mentors, academicInterest, communicationMethod, schedule, assistanceAreas]);

  const handleRequest = (mentor) => {
    sendMentorshipRequest({
      studentId: currentUser?.id || 'stu-101',
      studentName: currentUser?.name || 'Aarav Sharma',
      studentCourse: `${currentUser?.course || 'B.Tech CSE'} (${currentUser?.semester || 'Sem 5'})`,
      mentorId: mentor.id,
      mentorName: mentor.name,
      subject: `${academicInterest} · ${careerGoal}`,
      message: `Matched via UDAAN Demo Matcher. Learning preference: ${learningPref}. Schedule: ${schedule}.`,
      preferredMethod: communicationMethod,
    });
    showToast(`Mentorship request sent to ${mentor.name}!`, 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Interactive Demo Matcher"
        title="Mentor Matching"
        description="Specify your learning preferences, schedule, and career goals to view compatible mentors from our sample directory."
      />

      <div className="p-4 rounded-2xl bg-royal-50 dark:bg-royal-950/40 border border-royal-200 dark:border-royal-800 flex items-start gap-3 text-xs text-royal-900 dark:text-royal-200">
        <Info className="w-5 h-5 shrink-0 text-royal-600" aria-hidden="true" />
        <span>
          <strong>Frontend Demo Notice:</strong> This matching experience uses deterministic frontend scoring over sample mentor profiles—no external AI service is called.
        </span>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Preferences Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setMatchedRun(true);
            showToast('Updated mentor compatibility ranking!', 'info');
          }}
          className="lg:col-span-5 card-surface p-6 space-y-4 h-fit"
        >
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Your Matching Preferences</h2>

          <div>
            <label htmlFor="mm-interest" className="block text-xs font-bold mb-1.5">Academic Interest</label>
            <select id="mm-interest" value={academicInterest} onChange={(e) => setAcademicInterest(e.target.value)} className="input-field">
              <option>Computer Science</option>
              <option>Mathematics</option>
              <option>Electronics</option>
              <option>Design</option>
              <option>Career Planning</option>
            </select>
          </div>

          <div>
            <label htmlFor="mm-goal" className="block text-xs font-bold mb-1.5">Primary Career Goal</label>
            <select id="mm-goal" value={careerGoal} onChange={(e) => setCareerGoal(e.target.value)} className="input-field">
              <option>Internship & Interview Preparation</option>
              <option>Semester Exam Mastery</option>
              <option>Portfolio & Project Guidance</option>
              <option>Research & Higher Studies</option>
            </select>
          </div>

          <div>
            <label htmlFor="mm-comm" className="block text-xs font-bold mb-1.5">Preferred Communication Method</label>
            <select id="mm-comm" value={communicationMethod} onChange={(e) => setCommunicationMethod(e.target.value)} className="input-field">
              <option>Video with Captions</option>
              <option>Text Chat</option>
              <option>Audio Call</option>
              <option>Screen-Reader Friendly Notes</option>
            </select>
          </div>

          <div>
            <label htmlFor="mm-learn" className="block text-xs font-bold mb-1.5">Learning Preference</label>
            <select id="mm-learn" value={learningPref} onChange={(e) => setLearningPref(e.target.value)} className="input-field">
              <option>Structured Written Notes & Transcripts</option>
              <option>Step-by-Step Verbal Walkthroughs</option>
              <option>Hands-on Code & Project Reviews</option>
              <option>Asynchronous Q&A Check-ins</option>
            </select>
          </div>

          <div>
            <label htmlFor="mm-sched" className="block text-xs font-bold mb-1.5">Preferred Schedule</label>
            <select id="mm-sched" value={schedule} onChange={(e) => setSchedule(e.target.value)} className="input-field">
              <option>Weekday Evenings</option>
              <option>Weekends</option>
              <option>Weekday Afternoons</option>
            </select>
          </div>

          <div>
            <p className="text-xs font-bold mb-2">Areas Where You Need Assistance</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Web Accessibility (WCAG)',
                'Data Structures',
                'Interview Preparation',
                'Exam Strategy',
                'Cloud Architecture',
                'Portfolio Building',
              ].map((area) => {
                const active = assistanceAreas.includes(area);
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleArea(area)}
                    aria-pressed={active}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      active
                        ? 'bg-royal-600 text-white border-royal-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {area}
                  </button>
                );
              })}
            </div>
          </div>

          <button type="submit" className="btn-primary w-full">
            <Sparkles className="w-4 h-4" /> Find Compatible Mentors
          </button>
        </form>

        {/* Ranked Results */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {matchedRun ? 'Recommended Demo Matches' : 'Available Mentors'}
            </h2>
            <span className="text-xs text-slate-500">{rankedMentors.length} mentors evaluated</span>
          </div>

          {rankedMentors.map((m) => {
            const alreadySent = mentorshipRequests.some(
              (r) => r.mentorId === m.id && (r.studentId === currentUser?.id || r.studentId === 'stu-101')
            );
            return (
              <div key={m.id} className="card-surface p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <Avatar name={m.name} color={m.avatarColor} size="lg" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{m.name}</h3>
                        <Badge variant="success">{m.matchScore}% Fit</Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{m.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/student/mentors/${m.id}`} className="btn-secondary text-xs">
                      Profile
                    </Link>
                    {alreadySent ? (
                      <Badge variant="info" withIcon>Requested</Badge>
                    ) : (
                      <button type="button" onClick={() => handleRequest(m)} className="btn-primary text-xs">
                        <Send className="w-3.5 h-3.5" /> Request
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
                  {m.reasons.map((reason) => (
                    <span
                      key={reason}
                      className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> {reason}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
