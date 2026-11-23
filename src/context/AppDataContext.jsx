import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import {
  MENTORS_DIRECTORY,
  STUDENTS_DIRECTORY,
  FACULTY_DIRECTORY,
  DEPARTMENTS_DATA,
} from '../data/mockUsers';
import {
  INITIAL_MENTORSHIP_REQUESTS,
  INITIAL_SESSIONS,
  INITIAL_LEARNING_PLANS,
} from '../data/mockMentorship';
import {
  INITIAL_ASSIGNMENTS,
  STUDY_MATERIALS,
  CAREER_OPPORTUNITIES,
} from '../data/mockAcademics';
import {
  INITIAL_SUPPORT_REQUESTS,
  INITIAL_CONVERSATIONS,
  INITIAL_NOTIFICATIONS,
} from '../data/mockSupportAndComms';

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [mentors, setMentors] = useState(MENTORS_DIRECTORY);
  const [students, setStudents] = useState(STUDENTS_DIRECTORY);
  const [facultyList, setFacultyList] = useState(FACULTY_DIRECTORY);
  const [departments, setDepartments] = useState(DEPARTMENTS_DATA);

  const [mentorshipRequests, setMentorshipRequests] = useState(INITIAL_MENTORSHIP_REQUESTS);
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [learningPlans, setLearningPlans] = useState(INITIAL_LEARNING_PLANS);
  const [assignments, setAssignments] = useState(INITIAL_ASSIGNMENTS);
  const [materials, setMaterials] = useState(STUDY_MATERIALS);
  const [careerJobs, setCareerJobs] = useState(CAREER_OPPORTUNITIES);
  const [supportRequests, setSupportRequests] = useState(INITIAL_SUPPORT_REQUESTS);
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [platformSettings, setPlatformSettings] = useState({
    institutionName: 'UDAAN National Institute of Inclusive Technology',
    academicYear: '2026 - 2027',
    maxMenteesPerMentor: 6,
    autoCaptionsEnabled: true,
    extendedExamDefaultMins: 30,
    allowStudentSelfMatching: true,
    maintenanceMode: false,
  });

  // Sync real academic departments from live Django database
  useEffect(() => {
    let isMounted = true;
    async function loadAcademicMetadata() {
      try {
        const liveDepts = await apiClient.academics.getDepartments();
        if (isMounted && Array.isArray(liveDepts) && liveDepts.length > 0) {
          setDepartments(liveDepts);
        }
      } catch {
        // Fallback silently if unauthenticated or network unavailable
      }
    }
    loadAcademicMetadata();
    return () => {
      isMounted = false;
    };
  }, []);

  // Listen to live database SSE events across sessions
  useRealtimeSync({
    'student.registered': (data) => {
      setStudents((prev) => {
        const sid = data.studentId || data.student_id;
        if (prev.some((s) => s.studentId === sid || s.id === data.id)) {
          return prev;
        }
        const formatted = {
          id: data.id || `stu-${Date.now()}`,
          studentId: sid,
          name: data.fullName || data.name,
          email: data.email || `${sid?.toLowerCase()}@udaan.edu`,
          rollNumber: data.rollNumber || data.roll_number || sid,
          department: data.department || 'General',
          course: data.course || 'B.Tech',
          semester:
            typeof data.semester === 'number'
              ? `${data.semester}${data.semester === 1 ? 'st' : data.semester === 2 ? 'nd' : data.semester === 3 ? 'rd' : 'th'} Semester`
              : data.semester || '1st Semester',
          accessibilityProfile:
            data.disabilityType ||
            (data.assistiveDevices?.length > 0 ? data.assistiveDevices[0] : 'Standard Support'),
          progressScore: data.profileCompletion || 70,
          status: data.isActive ? 'Active' : 'Deactivated',
          attendance: 90,
          cgpa: 8.0,
        };
        return [formatted, ...prev];
      });

      addNotification({
        category: 'Registration',
        title: 'New Student Enrolled',
        message: `${data.fullName || data.name} (${data.studentId || data.student_id}) enrolled in ${data.department || 'UDAAN'}.`,
      });
    },
    'student.updated': (data) => {
      setStudents((prev) =>
        prev.map((s) => {
          if (s.studentId === (data.studentId || data.student_id) || s.id === data.id) {
            return {
              ...s,
              name: data.fullName || data.name || s.name,
              department: data.department || s.department,
              course: data.course || s.course,
              progressScore: data.profileCompletion ?? s.progressScore,
              accessibilityProfile: data.disabilityType || s.accessibilityProfile,
            };
          }
          return s;
        })
      );
    },
    'academics.updated': async () => {
      try {
        const liveDepts = await apiClient.academics.getDepartments();
        if (Array.isArray(liveDepts) && liveDepts.length > 0) {
          setDepartments(liveDepts);
        }
      } catch {
        // Ignored
      }
    },
  });

  const addNotification = useCallback(
    ({ category = 'System', title, message }) => {
      const next = {
        id: `not-${Date.now()}`,
        category,
        title,
        message,
        time: 'Just now',
        read: false,
      };
      setNotifications((prev) => [next, ...prev]);
    },
    [setNotifications]
  );

  // Mentorship requests
  const sendMentorshipRequest = useCallback(
    ({ studentId, studentName, studentCourse, mentorId, mentorName, subject, message, preferredMethod }) => {
      const newReq = {
        id: `req-${Date.now().toString().slice(-5)}`,
        studentId,
        studentName,
        studentCourse,
        mentorId,
        mentorName,
        subject,
        message,
        preferredMethod: preferredMethod || 'Video with Captions',
        status: 'Pending',
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setMentorshipRequests((prev) => [newReq, ...prev]);
      addNotification({
        category: 'Mentorship',
        title: 'Mentorship Request Sent',
        message: `Your request to ${mentorName} regarding "${subject}" is pending review.`,
      });
      return newReq;
    },
    [setMentorshipRequests, addNotification]
  );

  const updateMentorshipRequestStatus = useCallback(
    (requestId, status) => {
      setMentorshipRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status } : r))
      );
      const target = mentorshipRequests.find((r) => r.id === requestId);
      if (target) {
        addNotification({
          category: 'Mentorship',
          title: `Mentorship Request ${status}`,
          message: `Request from ${target.studentName} to ${target.mentorName} is now ${status}.`,
        });
      }
    },
    [mentorshipRequests, setMentorshipRequests, addNotification]
  );

  const cancelMentorshipRequest = useCallback(
    (requestId) => {
      setMentorshipRequests((prev) => prev.filter((r) => r.id !== requestId));
    },
    [setMentorshipRequests]
  );

  // Sessions
  const bookSession = useCallback(
    (sessionData) => {
      const created = {
        id: `ses-${Date.now().toString().slice(-5)}`,
        status: 'Scheduled',
        notes: sessionData.notes || 'Session scheduled via UDAAN.',
        agenda: sessionData.agenda || ['Goal review', 'Q&A and next steps'],
        ...sessionData,
      };
      setSessions((prev) => [created, ...prev]);
      addNotification({
        category: 'Session',
        title: 'Mentorship Session Booked',
        message: `"${created.topic}" with ${created.mentorName} on ${created.date} (${created.time}).`,
      });
      return created;
    },
    [setSessions, addNotification]
  );

  const updateSession = useCallback(
    (sessionId, updates) => {
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, ...updates } : s))
      );
    },
    [setSessions]
  );

  // Learning Plans
  const toggleLearningTask = useCallback(
    (planId, taskId) => {
      setLearningPlans((prev) =>
        prev.map((plan) => {
          if (plan.id !== planId) return plan;
          return {
            ...plan,
            updatedAt: new Date().toISOString().slice(0, 10),
            weeklyTasks: plan.weeklyTasks.map((t) =>
              t.id === taskId ? { ...t, completed: !t.completed } : t
            ),
          };
        })
      );
    },
    [setLearningPlans]
  );

  const addLearningPlanItem = useCallback(
    (planId, field, item) => {
      setLearningPlans((prev) =>
        prev.map((plan) => {
          if (plan.id !== planId) return plan;
          return {
            ...plan,
            updatedAt: new Date().toISOString().slice(0, 10),
            [field]: [...(plan[field] || []), item],
          };
        })
      );
    },
    [setLearningPlans]
  );

  const updateGoalProgress = useCallback(
    (planId, field, goalId, progress) => {
      setLearningPlans((prev) =>
        prev.map((plan) => {
          if (plan.id !== planId) return plan;
          return {
            ...plan,
            updatedAt: new Date().toISOString().slice(0, 10),
            [field]: plan[field].map((g) => (g.id === goalId ? { ...g, progress } : g)),
          };
        })
      );
    },
    [setLearningPlans]
  );

  const createLearningPlan = useCallback(
    (plan) => {
      const created = {
        id: `lp-${Date.now().toString().slice(-4)}`,
        updatedAt: new Date().toISOString().slice(0, 10),
        learningObjectives: plan.learningObjectives || [],
        academicGoals: plan.academicGoals || [],
        careerGoals: plan.careerGoals || [],
        weeklyTasks: plan.weeklyTasks || [],
        milestones: plan.milestones || [],
        mentorRecommendations: plan.mentorRecommendations || [],
        ...plan,
      };
      setLearningPlans((prev) => [created, ...prev]);
      addNotification({
        category: 'Mentorship',
        title: 'New Learning Plan Created',
        message: `"${created.title}" has been assigned for ${created.studentName}.`,
      });
      return created;
    },
    [setLearningPlans, addNotification]
  );

  // Mentor review
  const addMentorReview = useCallback(
    (mentorId, review) => {
      setMentors((prev) =>
        prev.map((m) => {
          if (m.id !== mentorId) return m;
          const nextReviews = [
            { id: `rev-${Date.now()}`, date: new Date().toISOString().slice(0, 10), ...review },
            ...(m.reviews || []),
          ];
          const avg =
            nextReviews.reduce((acc, item) => acc + item.rating, 0) / nextReviews.length;
          return {
            ...m,
            reviews: nextReviews,
            reviewCount: (m.reviewCount || 0) + 1,
            rating: Number(avg.toFixed(1)),
          };
        })
      );
    },
    [setMentors]
  );

  // Assignments
  const updateAssignmentStatus = useCallback(
    (assignmentId, status) => {
      setAssignments((prev) =>
        prev.map((a) => (a.id === assignmentId ? { ...a, status } : a))
      );
      addNotification({
        category: 'Assignment',
        title: `Assignment ${status}`,
        message: `Assignment status updated to ${status}.`,
      });
    },
    [setAssignments, addNotification]
  );

  // Support Requests
  const createSupportRequest = useCallback(
    (reqData) => {
      const created = {
        id: `sup-req-${Date.now().toString().slice(-4)}`,
        status: 'Submitted',
        assignedTo: 'Pending Assignment',
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10),
        updates: [
          {
            date: new Date().toISOString().slice(0, 10),
            author: reqData.studentName,
            note: 'Support request submitted via UDAAN Student Support System.',
          },
        ],
        ...reqData,
      };
      setSupportRequests((prev) => [created, ...prev]);
      addNotification({
        category: 'Support',
        title: 'Support Request Submitted',
        message: `"${created.title}" has been logged with the Inclusion Cell.`,
      });
      return created;
    },
    [setSupportRequests, addNotification]
  );

  const updateSupportRequest = useCallback(
    (requestId, { status, assignedTo, note, author = 'Ananya Deshmukh' }) => {
      const today = new Date().toISOString().slice(0, 10);
      setSupportRequests((prev) =>
        prev.map((req) => {
          if (req.id !== requestId) return req;
          const nextUpdates = note
            ? [...(req.updates || []), { date: today, author, note }]
            : req.updates;
          return {
            ...req,
            status: status || req.status,
            assignedTo: assignedTo ?? req.assignedTo,
            updatedAt: today,
            updates: nextUpdates,
          };
        })
      );
      addNotification({
        category: 'Support',
        title: 'Support Ticket Updated',
        message: `Request ${requestId} updated${status ? ` to ${status}` : ''}.`,
      });
    },
    [setSupportRequests, addNotification]
  );

  // Messaging
  const sendMessage = useCallback(
    (conversationId, text, senderName) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const newMsg = {
        id: `msg-${Date.now()}`,
        sender: senderName,
        isOwn: true,
        time: 'Just now',
        text: trimmed,
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, lastActive: 'Just now', unreadCount: 0, messages: [...c.messages, newMsg] }
            : c
        )
      );
    },
    [setConversations]
  );

  const markConversationRead = useCallback(
    (conversationId) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
      );
    },
    [setConversations]
  );

  const startConversation = useCallback(
    ({ participantName, participantRole, participantId, initialMessage, senderName }) => {
      const existing = conversations.find((c) => c.participantName === participantName);
      if (existing) {
        if (initialMessage) sendMessage(existing.id, initialMessage, senderName);
        return existing.id;
      }
      const newId = `conv-${Date.now()}`;
      const newConv = {
        id: newId,
        participantName,
        participantRole,
        participantId: participantId || newId,
        unreadCount: 0,
        lastActive: 'Just now',
        messages: initialMessage
          ? [{ id: `msg-${Date.now()}`, sender: senderName, isOwn: true, time: 'Just now', text: initialMessage }]
          : [],
      };
      setConversations((prev) => [newConv, ...prev]);
      return newId;
    },
    [conversations, setConversations, sendMessage]
  );

  // Notifications
  const markNotificationRead = useCallback(
    (id) => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    },
    [setNotifications]
  );

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [setNotifications]);

  const deleteNotification = useCallback(
    (id) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    },
    [setNotifications]
  );

  // Career apply toggle
  const applyCareerOpportunity = useCallback(
    (jobId) => {
      setCareerJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, applied: true } : j))
      );
      const job = careerJobs.find((j) => j.id === jobId);
      if (job) {
        addNotification({
          category: 'Career',
          title: 'Demo Application Recorded',
          message: `Applied to "${job.title}" at ${job.company}.`,
        });
      }
    },
    [careerJobs, setCareerJobs, addNotification]
  );

  // Admin & Faculty CRUD helpers
  const addStudyMaterial = useCallback(
    (material) => {
      setMaterials((prev) => [
        { id: `mat-${Date.now()}`, updatedAt: new Date().toISOString().slice(0, 10), hasTranscript: true, ...material },
        ...prev,
      ]);
    },
    [setMaterials]
  );

  const addStudentRecord = useCallback(
    (student) => {
      setStudents((prev) => [{ id: `stu-${Date.now().toString().slice(-3)}`, status: 'Active', progressScore: 75, attendance: 90, ...student }, ...prev]);
    },
    [setStudents]
  );

  const addMentorRecord = useCallback(
    (mentor) => {
      setMentors((prev) => [
        {
          id: `men-${Date.now().toString().slice(-3)}`,
          rating: 4.8,
          reviewCount: 1,
          activeMentees: 0,
          maxStudents: 5,
          avatarColor: 'from-royal-600 to-violet-600',
          reviews: [],
          ...mentor,
        },
        ...prev,
      ]);
    },
    [setMentors]
  );

  const addFacultyRecord = useCallback(
    (faculty) => {
      setFacultyList((prev) => [
        { id: `fac-${Date.now().toString().slice(-3)}`, status: 'Active', accommodatedStudents: 5, materialsUploaded: 4, ...faculty },
        ...prev,
      ]);
    },
    [setFacultyList]
  );

  const addDepartmentRecord = useCallback(
    (dept) => {
      setDepartments((prev) => [
        { id: `dept-${Date.now().toString().slice(-3)}`, accessibilityCompliance: 95, ...dept },
        ...prev,
      ]);
    },
    [setDepartments]
  );

  const resetDemoData = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <AppDataContext.Provider
      value={{
        mentors,
        setMentors,
        students,
        setStudents,
        facultyList,
        setFacultyList,
        departments,
        setDepartments,
        mentorshipRequests,
        sendMentorshipRequest,
        updateMentorshipRequestStatus,
        cancelMentorshipRequest,
        sessions,
        bookSession,
        updateSession,
        learningPlans,
        toggleLearningTask,
        addLearningPlanItem,
        updateGoalProgress,
        createLearningPlan,
        addMentorReview,
        assignments,
        updateAssignmentStatus,
        materials,
        addStudyMaterial,
        careerJobs,
        applyCareerOpportunity,
        supportRequests,
        createSupportRequest,
        updateSupportRequest,
        conversations,
        sendMessage,
        markConversationRead,
        startConversation,
        notifications,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        platformSettings,
        setPlatformSettings,
        addStudentRecord,
        addMentorRecord,
        addFacultyRecord,
        addDepartmentRecord,
        resetDemoData,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
