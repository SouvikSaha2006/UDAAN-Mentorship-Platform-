import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Languages, Clock, Award, MessageSquare, Calendar, Send } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { formatDate } from '../../utils/helpers';

export default function MentorProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { mentors, mentorshipRequests, sendMentorshipRequest, addMentorReview, startConversation } = useAppData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const mentor = mentors.find((m) => m.id === id) || mentors[0];

  const [reqModalOpen, setReqModalOpen] = useState(false);
  const [reqSubject, setReqSubject] = useState(mentor.subjects?.[0] || 'Academic Mentorship');
  const [reqMethod, setReqMethod] = useState('Video with Captions');
  const [reqMessage, setReqMessage] = useState('');

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const existingReq = mentorshipRequests.find(
    (r) => r.mentorId === mentor.id && (r.studentId === currentUser?.id || r.studentId === 'stu-101')
  );

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    sendMentorshipRequest({
      studentId: currentUser?.id || 'stu-101',
      studentName: currentUser?.name || 'Aarav Sharma',
      studentCourse: `${currentUser?.course || 'B.Tech CSE'} (${currentUser?.semester || 'Sem 5'})`,
      mentorId: mentor.id,
      mentorName: mentor.name,
      subject: reqSubject,
      message: reqMessage,
      preferredMethod: reqMethod,
    });
    showToast(`Mentorship request sent to ${mentor.name}!`, 'success');
    setReqModalOpen(false);
    setReqMessage('');
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    addMentorReview(mentor.id, {
      studentName: `${currentUser?.name || 'Student'} (Demo)`,
      rating: Number(rating),
      comment: comment.trim(),
    });
    showToast('Thank you! Your sample review has been added.', 'success');
    setComment('');
  };

  const handleMessageMentor = () => {
    startConversation({
      participantName: mentor.name,
      participantRole: `Mentor · ${mentor.department}`,
      participantId: mentor.id,
      senderName: currentUser?.name || 'Aarav Sharma',
    });
    navigate('/student/messages');
  };

  return (
    <div className="space-y-6">
      <Link to="/student/mentors" className="inline-flex items-center gap-1.5 text-xs font-bold text-royal-600 dark:text-royal-400 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Find a Mentor
      </Link>

      {/* Header Card */}
      <div className="card-surface p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <Avatar name={mentor.name} color={mentor.avatarColor} size="xl" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-navy-950 dark:text-white">{mentor.name}</h1>
                <Badge variant="info">{mentor.experienceYears} yrs exp</Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{mentor.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-royal-600" /> {mentor.qualification}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs">
                <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                  <Star className="w-4 h-4 fill-current" /> {mentor.rating} / 5.0
                </span>
                <span className="text-slate-500">({mentor.reviewCount} sample student reviews)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button type="button" onClick={handleMessageMentor} className="btn-secondary">
              <MessageSquare className="w-4 h-4" /> Message
            </button>
            <Link to="/student/sessions" className="btn-secondary">
              <Calendar className="w-4 h-4" /> Book Session
            </Link>
            {existingReq ? (
              <Badge status={existingReq.status} withIcon className="px-4 py-2.5 text-sm">
                Request {existingReq.status}
              </Badge>
            ) : (
              <button type="button" onClick={() => setReqModalOpen(true)} className="btn-primary">
                <Send className="w-4 h-4" /> Request Mentorship
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card-surface p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Mentorship Approach</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              {mentor.description}
            </p>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-5 mb-2">Expertise Areas</h3>
            <div className="flex flex-wrap gap-2">
              {(mentor.expertise || []).map((ex) => (
                <Badge key={ex} variant="violet">{ex}</Badge>
              ))}
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-5 mb-2">Subjects Guided</h3>
            <div className="flex flex-wrap gap-2">
              {(mentor.subjects || []).map((sub) => (
                <Badge key={sub} variant="neutral">{sub}</Badge>
              ))}
            </div>
          </div>

          <div className="card-surface p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Student Reviews (Sample Feedback)
            </h2>
            <div className="space-y-4">
              {(mentor.reviews || []).map((rev) => (
                <div key={rev.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{rev.studentName}</p>
                    <span className="text-xs font-bold text-amber-600">★ {rev.rating}.0 · {formatDate(rev.date)}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleReviewSubmit} className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Sample Review</h3>
              <div className="flex items-center gap-3">
                <label htmlFor="rev-rating" className="text-xs font-semibold">Rating:</label>
                <select id="rev-rating" value={rating} onChange={(e) => setRating(e.target.value)} className="input-field w-32">
                  <option value={5}>5 Stars</option>
                  <option value={4}>4 Stars</option>
                  <option value={3}>3 Stars</option>
                </select>
              </div>
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="input-field"
                placeholder="Write a helpful review about accessibility & mentoring clarity..."
                required
              />
              <button type="submit" className="btn-secondary text-xs">Submit Review</button>
            </form>
          </div>
        </div>

        {/* Availability & Languages */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card-surface p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Availability & Communication</h2>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Weekly Mentoring Slots
              </p>
              <ul className="space-y-2">
                {(mentor.availability || []).map((slot) => (
                  <li key={slot} className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold">
                    {slot}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5" /> Spoken Languages
              </p>
              <p className="text-sm font-medium">{(mentor.languages || []).join(', ')}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Accessible Communication Modes
              </p>
              <div className="flex flex-wrap gap-2">
                {(mentor.communicationMethods || ['Video with Captions', 'Text Chat']).map((mode) => (
                  <Badge key={mode} variant="success">{mode}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={reqModalOpen}
        onClose={() => setReqModalOpen(false)}
        title={`Request Mentorship from ${mentor.name}`}
      >
        <form onSubmit={handleRequestSubmit} className="space-y-4">
          <div>
            <label htmlFor="mp-sub" className="block text-sm font-semibold mb-1.5">Topic / Subject</label>
            <input id="mp-sub" value={reqSubject} onChange={(e) => setReqSubject(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label htmlFor="mp-mode" className="block text-sm font-semibold mb-1.5">Preferred Mode</label>
            <select id="mp-mode" value={reqMethod} onChange={(e) => setReqMethod(e.target.value)} className="input-field">
              <option>Video with Captions</option>
              <option>Text Chat & Written Feedback</option>
              <option>Audio Call + Transcript</option>
            </select>
          </div>
          <div>
            <label htmlFor="mp-msg" className="block text-sm font-semibold mb-1.5">Introduction Message</label>
            <textarea
              id="mp-msg"
              rows={3}
              value={reqMessage}
              onChange={(e) => setReqMessage(e.target.value)}
              className="input-field"
              placeholder="Share what you hope to learn..."
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setReqModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Send Request</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
