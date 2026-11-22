import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Star, Languages, Clock, Sparkles, Send } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';

export default function FindMentorPage() {
  const { mentors, mentorshipRequests, sendMentorshipRequest } = useAppData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [expertiseFilter, setExpertiseFilter] = useState('All');
  const [minExp, setMinExp] = useState('0');

  const [requestTarget, setRequestTarget] = useState(null);
  const [reqSubject, setReqSubject] = useState('');
  const [reqMethod, setReqMethod] = useState('Video with Captions');
  const [reqMessage, setReqMessage] = useState('');

  const allSubjects = useMemo(() => {
    const set = new Set();
    mentors.forEach((m) => (m.subjects || []).forEach((s) => set.add(s)));
    return ['All', ...Array.from(set)];
  }, [mentors]);

  const allExpertise = useMemo(() => {
    const set = new Set();
    mentors.forEach((m) => (m.expertise || []).forEach((e) => set.add(e)));
    return ['All', ...Array.from(set)];
  }, [mentors]);

  const filteredMentors = useMemo(() => {
    return mentors.filter((m) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q) ||
        (m.expertise || []).some((e) => e.toLowerCase().includes(q));
      const matchesSubject = subjectFilter === 'All' || (m.subjects || []).includes(subjectFilter);
      const matchesExpertise = expertiseFilter === 'All' || (m.expertise || []).includes(expertiseFilter);
      const matchesExp = (m.experienceYears || 0) >= Number(minExp);
      return matchesQuery && matchesSubject && matchesExpertise && matchesExp;
    });
  }, [mentors, query, subjectFilter, expertiseFilter, minExp]);

  const openRequestModal = (mentor) => {
    setRequestTarget(mentor);
    setReqSubject(mentor.subjects?.[0] || 'Academic & Career Mentorship');
    setReqMethod(mentor.communicationMethods?.[0] || 'Video with Captions');
    setReqMessage('');
  };

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    if (!requestTarget) return;
    sendMentorshipRequest({
      studentId: currentUser?.id || 'stu-101',
      studentName: currentUser?.name || 'Aarav Sharma',
      studentCourse: `${currentUser?.course || 'B.Tech CSE'} (${currentUser?.semester || 'Sem 5'})`,
      mentorId: requestTarget.id,
      mentorName: requestTarget.name,
      subject: reqSubject,
      message: reqMessage || 'Seeking personalized mentorship and structured study guidance.',
      preferredMethod: reqMethod,
    });
    showToast(`Mentorship request sent to ${requestTarget.name}!`, 'success');
    setRequestTarget(null);
  };

  return (
    <div>
      <PageHeader
        badge="Mentorship Discovery"
        title="Find a Mentor"
        description="Search and filter mentors by subject, expertise, experience, and accessible communication modes."
        actions={
          <Link to="/student/matching" className="btn-primary">
            <Sparkles className="w-4 h-4" /> Guided Mentor Matching
          </Link>
        }
      />

      {/* Search & Filters */}
      <div className="card-surface p-4 sm:p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, skill, department..."
              aria-label="Search mentors"
              className="input-field pl-10"
            />
          </div>

          <div>
            <label htmlFor="sub-filter" className="sr-only">Filter by subject</label>
            <select id="sub-filter" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="input-field">
              {allSubjects.map((s) => (
                <option key={s} value={s}>{s === 'All' ? 'All Subjects' : s}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="exp-filter" className="sr-only">Filter by expertise</label>
            <select id="exp-filter" value={expertiseFilter} onChange={(e) => setExpertiseFilter(e.target.value)} className="input-field">
              {allExpertise.map((ex) => (
                <option key={ex} value={ex}>{ex === 'All' ? 'All Expertise Areas' : ex}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            <label htmlFor="years-filter" className="sr-only">Minimum experience</label>
            <select id="years-filter" value={minExp} onChange={(e) => setMinExp(e.target.value)} className="input-field">
              <option value="0">Any Experience</option>
              <option value="5">5+ Years Experience</option>
              <option value="10">10+ Years Experience</option>
              <option value="12">12+ Years Experience</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {filteredMentors.length === 0 ? (
        <EmptyState
          title="No mentors match your current filters"
          description="Try clearing the search query or broadening your subject/experience filters."
          action={
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSubjectFilter('All');
                setExpertiseFilter('All');
                setMinExp('0');
              }}
              className="btn-secondary"
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMentors.map((mentor) => {
            const existingReq = mentorshipRequests.find(
              (r) =>
                r.mentorId === mentor.id &&
                (r.studentId === currentUser?.id || r.studentId === 'stu-101')
            );

            return (
              <article key={mentor.id} className="card-surface p-6 flex flex-col justify-between hover:shadow-elevated">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <Avatar name={mentor.name} color={mentor.avatarColor} size="lg" />
                      <div>
                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{mentor.name}</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{mentor.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                            <Star className="w-3.5 h-3.5 fill-current" /> {mentor.rating}
                          </span>
                          <span className="text-slate-400">({mentor.reviewCount} reviews)</span>
                          <span className="text-slate-400">· {mentor.experienceYears} yrs</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-4 leading-relaxed line-clamp-3">
                    {mentor.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {(mentor.expertise || []).slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-royal-50 text-royal-700 dark:bg-royal-950/60 dark:text-royal-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <p className="flex items-center gap-2">
                      <Languages className="w-3.5 h-3.5 shrink-0" /> {(mentor.languages || []).join(', ')}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 shrink-0" /> {mentor.availability?.[0] || 'Flexible Slots'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <Link to={`/student/mentors/${mentor.id}`} className="btn-secondary text-xs flex-1">
                    View Profile
                  </Link>
                  {existingReq ? (
                    <Badge status={existingReq.status} withIcon className="px-3 py-2">
                      {existingReq.status}
                    </Badge>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openRequestModal(mentor)}
                      className="btn-primary text-xs flex-1"
                    >
                      <Send className="w-3.5 h-3.5" /> Request
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Mentorship Request Modal */}
      <Modal
        isOpen={Boolean(requestTarget)}
        onClose={() => setRequestTarget(null)}
        title={`Send Mentorship Request`}
        subtitle={requestTarget ? `To ${requestTarget.name} · ${requestTarget.department}` : ''}
      >
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          <div>
            <label htmlFor="req-sub" className="block text-sm font-semibold mb-1.5">Focus Subject / Goal</label>
            <input
              id="req-sub"
              value={reqSubject}
              onChange={(e) => setReqSubject(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label htmlFor="req-mode" className="block text-sm font-semibold mb-1.5">Preferred Communication Method</label>
            <select id="req-mode" value={reqMethod} onChange={(e) => setReqMethod(e.target.value)} className="input-field">
              <option>Video with Captions</option>
              <option>Text Chat & Written Feedback</option>
              <option>Audio Call + Transcript</option>
              <option>Screen-Reader Friendly Notes</option>
            </select>
          </div>
          <div>
            <label htmlFor="req-msg" className="block text-sm font-semibold mb-1.5">Message to Mentor</label>
            <textarea
              id="req-msg"
              rows={3}
              value={reqMessage}
              onChange={(e) => setReqMessage(e.target.value)}
              className="input-field"
              placeholder="Share your semester courses, learning goals, and preferred communication style..."
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setRequestTarget(null)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Send Mentorship Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
