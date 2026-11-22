export const ACADEMIC_OVERVIEW = {
  semester: '5th Semester (Autumn 2026)',
  course: 'B.Tech Computer Science & Engineering',
  currentCgpa: 8.74,
  creditsCompleted: 112,
  totalCredits: 160,
  semesterProgress: 74,
  gpaTrend: [
    { semester: 'Sem 1', sgpa: 8.35, target: 8.2 },
    { semester: 'Sem 2', sgpa: 8.58, target: 8.4 },
    { semester: 'Sem 3', sgpa: 8.72, target: 8.6 },
    { semester: 'Sem 4', sgpa: 8.91, target: 8.7 },
    { semester: 'Sem 5 (Est)', sgpa: 9.04, target: 8.8 },
  ],
  subjectPerformance: [
    { subject: 'DBMS', score: 91, attendance: 94, faculty: 'Prof. Rajeshwari Kulkarni', code: 'CS501' },
    { subject: 'Operating Systems', score: 86, attendance: 89, faculty: 'Prof. Rajeshwari Kulkarni', code: 'CS502' },
    { subject: 'Computer Networks', score: 84, attendance: 90, faculty: 'Dr. Harishankar Iyer', code: 'CS503' },
    { subject: 'Inclusive Design Studio', score: 95, attendance: 96, faculty: 'Prof. Deepak Chawla', code: 'CS504' },
    { subject: 'Software Engineering', score: 88, attendance: 87, faculty: 'Prof. Nandini Bose', code: 'CS505' },
  ],
};

export const TIMETABLE_DATA = [
  {
    day: 'Monday',
    slots: [
      { time: '09:00 AM - 10:00 AM', subject: 'Database Management Systems', code: 'CS501', room: 'LH-102 (Ground Floor, Ramp Access)', faculty: 'Prof. Rajeshwari Kulkarni', type: 'Lecture' },
      { time: '10:15 AM - 11:15 AM', subject: 'Operating Systems', code: 'CS502', room: 'LH-104 (Caption Screen Enabled)', faculty: 'Prof. Rajeshwari Kulkarni', type: 'Lecture' },
      { time: '02:00 PM - 04:00 PM', subject: 'DBMS Practical Lab', code: 'CS501L', room: 'Accessible Lab B1', faculty: 'Prof. Rajeshwari Kulkarni', type: 'Lab' },
    ],
  },
  {
    day: 'Tuesday',
    slots: [
      { time: '09:30 AM - 10:30 AM', subject: 'Computer Networks', code: 'CS503', room: 'LH-105', faculty: 'Dr. Harishankar Iyer', type: 'Lecture' },
      { time: '11:30 AM - 12:30 PM', subject: 'Software Engineering', code: 'CS505', room: 'LH-102', faculty: 'Prof. Nandini Bose', type: 'Lecture' },
      { time: '03:00 PM - 04:30 PM', subject: 'Inclusive Design Studio', code: 'CS504', room: 'Studio 2 (Elevator Access)', faculty: 'Prof. Deepak Chawla', type: 'Seminar' },
    ],
  },
  {
    day: 'Wednesday',
    slots: [
      { time: '09:00 AM - 10:00 AM', subject: 'Operating Systems', code: 'CS502', room: 'LH-104', faculty: 'Prof. Rajeshwari Kulkarni', type: 'Lecture' },
      { time: '10:15 AM - 11:15 AM', subject: 'Database Management Systems', code: 'CS501', room: 'LH-102', faculty: 'Prof. Rajeshwari Kulkarni', type: 'Tutorial' },
      { time: '05:00 PM - 05:45 PM', subject: 'UDAAN Weekly Mentorship Slot', code: 'MENTOR', room: 'Online (Captioned Room)', faculty: 'Dr. Meera Krishnan', type: 'Mentorship' },
    ],
  },
  {
    day: 'Thursday',
    slots: [
      { time: '10:00 AM - 12:00 PM', subject: 'OS & Systems Lab', code: 'CS502L', room: 'Accessible Lab B1', faculty: 'Prof. Rajeshwari Kulkarni', type: 'Lab' },
      { time: '02:00 PM - 03:00 PM', subject: 'Computer Networks', code: 'CS503', room: 'LH-105', faculty: 'Dr. Harishankar Iyer', type: 'Lecture' },
    ],
  },
  {
    day: 'Friday',
    slots: [
      { time: '09:30 AM - 10:30 AM', subject: 'Software Engineering', code: 'CS505', room: 'LH-102', faculty: 'Prof. Nandini Bose', type: 'Lecture' },
      { time: '11:00 AM - 12:30 PM', subject: 'Inclusive Design Studio Critique', code: 'CS504', room: 'Studio 2', faculty: 'Prof. Deepak Chawla', type: 'Workshop' },
      { time: '03:00 PM - 04:00 PM', subject: 'Career & Assistive Tech Drop-in', code: 'CAREER', room: 'Inclusion Cell / Online', faculty: 'Ananya Deshmukh', type: 'Support' },
    ],
  },
];

export const INITIAL_ASSIGNMENTS = [
  {
    id: 'asg-1',
    title: 'B+ Tree Indexing & Query Optimization Report',
    subject: 'Database Management Systems',
    code: 'CS501',
    dueDate: '2026-11-26',
    status: 'Pending',
    submissionFormat: 'Accessible PDF / Markdown',
    accommodationNote: '+48 hrs flexible extension available on request',
    description: 'Analyze query execution plans and submit structured comparison tables with alt-text for diagrams.',
  },
  {
    id: 'asg-2',
    title: 'CPU Scheduling & Deadlock Simulation',
    subject: 'Operating Systems',
    code: 'CS502',
    dueDate: '2026-11-29',
    status: 'In Progress',
    submissionFormat: 'GitHub Repo / Code Archive',
    accommodationNote: 'Screen-reader friendly CLI output accepted',
    description: 'Implement Round Robin and Banker’s Algorithm with clear tabular text output.',
  },
  {
    id: 'asg-3',
    title: 'WCAG 2.2 Evaluation of Campus Web Portal',
    subject: 'Inclusive Design Studio',
    code: 'CS504',
    dueDate: '2026-11-18',
    status: 'Submitted',
    submissionFormat: 'Structured Audit Report',
    accommodationNote: 'Voice-recorded walkthrough accepted alongside report',
    description: 'Evaluate keyboard navigation, color contrast, and form error messaging across 5 flows.',
  },
  {
    id: 'asg-4',
    title: 'TCP Congestion Control Case Study',
    subject: 'Computer Networks',
    code: 'CS503',
    dueDate: '2026-12-03',
    status: 'Pending',
    submissionFormat: 'Accessible PDF',
    accommodationNote: 'Braille / Large print worksheet available in Lab B1',
    description: 'Compare Tahoe, Reno, and CUBIC throughput curves with written narrative summaries.',
  },
];

export const EXAMINATIONS_DATA = [
  {
    id: 'exm-1',
    subject: 'Database Management Systems (CS501)',
    date: '2026-12-10',
    time: '09:30 AM - 01:00 PM (Includes +30 min accommodation)',
    venue: 'Accessible Exam Block A - Room 101 (Ground Floor)',
    accommodations: ['+30 Minutes Extra Time', 'Large-Print Question Paper (18pt)', 'Screen Reader Digital Option'],
    status: 'Confirmed',
  },
  {
    id: 'exm-2',
    subject: 'Operating Systems (CS502)',
    date: '2026-12-14',
    time: '09:30 AM - 01:00 PM (Includes +30 min accommodation)',
    venue: 'Accessible Exam Block A - Room 101 (Ground Floor)',
    accommodations: ['+30 Minutes Extra Time', 'Quiet Separate Seating', 'Assistive Keyboard Workstation'],
    status: 'Confirmed',
  },
  {
    id: 'exm-3',
    subject: 'Computer Networks (CS503)',
    date: '2026-12-17',
    time: '09:30 AM - 01:00 PM (Includes +30 min accommodation)',
    venue: 'Accessible Exam Block A - Room 103',
    accommodations: ['+30 Minutes Extra Time', 'Verbal Diagram Descriptions Attached'],
    status: 'Pending Verification',
  },
  {
    id: 'exm-4',
    subject: 'Software Engineering (CS505)',
    date: '2026-12-21',
    time: '09:30 AM - 01:00 PM (Includes +30 min accommodation)',
    venue: 'Accessible Exam Block A - Room 101',
    accommodations: ['+30 Minutes Extra Time', 'Digital Submission Option'],
    status: 'Confirmed',
  },
];

export const STUDY_MATERIALS = [
  {
    id: 'mat-1',
    title: 'DBMS Module 4: Normalization & Transactions (Tagged Accessible PDF)',
    subject: 'Database Management Systems',
    type: 'Accessible PDF',
    durationOrPages: '24 pages · Screen-reader tagged',
    faculty: 'Prof. Rajeshwari Kulkarni',
    updatedAt: '2026-11-16',
    hasTranscript: true,
    summary: 'Covers 1NF through BCNF, ACID properties, and concurrency locks with text-described ER diagrams.',
    content:
      'Normalization organizes relational database tables to minimize redundancy and dependency anomalies. First Normal Form ensures atomic column values. Second Normal Form removes partial dependencies on composite primary keys. Third Normal Form eliminates transitive dependencies so every non-key attribute depends solely on the key. Boyce-Codd Normal Form strengthens 3NF by requiring every determinant to be a candidate key. ACID stands for Atomicity, Consistency, Isolation, and Durability, guaranteeing reliable database transactions even during system failures.',
  },
  {
    id: 'mat-2',
    title: 'Operating Systems: Deadlocks & Banker’s Algorithm (Captioned Video + Transcript)',
    subject: 'Operating Systems',
    type: 'Video + Transcript',
    durationOrPages: '32 mins · Closed Captions & Audio Description',
    faculty: 'Prof. Rajeshwari Kulkarni',
    updatedAt: '2026-11-14',
    hasTranscript: true,
    summary: 'Step-by-step walkthrough of deadlock prevention, avoidance, and safe-state matrix traces.',
    content:
      'A deadlock occurs when a set of processes are blocked because each process holds a resource and waits for another resource held by another process. The four Coffman conditions for deadlock are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Banker’s Algorithm prevents unsafe allocations by simulating whether a sequence exists in which every process can complete with available resources plus released allocations.',
  },
  {
    id: 'mat-3',
    title: 'WCAG 2.2 AA Practical Checklist for React Developers (Study Notes)',
    subject: 'Inclusive Design Studio',
    type: 'Study Notes',
    durationOrPages: '14 mins read · Simplified Mode Ready',
    faculty: 'Prof. Deepak Chawla',
    updatedAt: '2026-11-19',
    hasTranscript: true,
    summary: 'Actionable patterns for focus indicators, keyboard navigation, ARIA live regions, and contrast.',
    content:
      'Accessible web applications start with semantic HTML landmarks such as header, nav, main, and footer. Interactive elements must be reachable via Tab and activated using Enter or Space. Focus states must remain clearly visible against any background. Status updates and form validation errors should be announced politely using ARIA live regions, and information must never rely on color alone—always pair color with clear icons or descriptive text.',
  },
  {
    id: 'mat-4',
    title: 'Computer Networks: Subnetting & Routing Protocols Audio Guide',
    subject: 'Computer Networks',
    type: 'Audio / Text Guide',
    durationOrPages: '18 mins · High-clarity narration script',
    faculty: 'Dr. Harishankar Iyer',
    updatedAt: '2026-11-11',
    hasTranscript: true,
    summary: 'Clear mental models for CIDR blocks, OSPF link-state routing, and BGP path selection.',
    content:
      'Classless Inter-Domain Routing, or CIDR, uses slash notation such as /24 to indicate how many bits identify the network prefix. Subnetting divides a larger IP block into smaller, manageable segments. Distance-vector routing protocols like RIP share routing tables with immediate neighbors, whereas link-state protocols like OSPF flood link status across an area so each router computes the shortest path tree using Dijkstra’s algorithm.',
  },
];

export const CAREER_OPPORTUNITIES = [
  {
    id: 'job-1',
    title: 'Software Engineering Intern – Accessibility & Frontend',
    company: 'InclusiveTech Labs (Sample Partner)',
    location: 'Bengaluru / Remote',
    stipend: '₹35,000 / month',
    type: 'Summer Internship (12 Weeks)',
    accommodations: ['Flexible Remote Option', 'Screen-Reader Tooling Budget', 'Dedicated Onboarding Buddy'],
    skills: ['React', 'JavaScript', 'WCAG 2.2', 'HTML/CSS'],
    deadline: '2026-12-15',
    applied: false,
  },
  {
    id: 'job-2',
    title: 'Cloud & Backend Developer Trainee',
    company: 'FinBridge Digital (Sample Partner)',
    location: 'Hyderabad / Hybrid',
    stipend: '₹30,000 / month',
    type: '6-Month Co-op Internship',
    accommodations: ['Accessible Campus Shuttle', 'Ergonomic Workstation', 'Captioned Standups'],
    skills: ['Python', 'SQL', 'REST APIs', 'Git'],
    deadline: '2026-12-22',
    applied: true,
  },
  {
    id: 'job-3',
    title: 'Inclusive UX Research Intern',
    company: 'DesignForAll Studio (Sample Partner)',
    location: 'Remote',
    stipend: '₹25,000 / month',
    type: 'Part-Time Internship',
    accommodations: ['Async Critique Workflows', 'Flexible Deadlines', 'Speech-to-Text Support'],
    skills: ['User Research', 'Usability Testing', 'Figma', 'Accessibility Audits'],
    deadline: '2027-01-05',
    applied: false,
  },
];

export const CAREER_PATHWAYS = [
  {
    id: 'cp-1',
    title: 'Accessibility-First Frontend Engineer',
    match: 'Recommended for your CSE profile',
    steps: ['Semantic HTML & ARIA', 'React Component Architecture', 'Automated & Manual Screen-Reader Audits', '2 Capstone Projects'],
    mentorAdvice: 'Build every project with keyboard-only testing first; recruiters value engineers who treat accessibility as a core engineering standard.',
  },
  {
    id: 'cp-2',
    title: 'Backend & Distributed Systems Engineer',
    match: 'Aligned with CS501 & CS502 strengths',
    steps: ['SQL & Indexing Mastery', 'API Design & Testing', 'Concurrency & Caching', 'System Design Interviews'],
    mentorAdvice: 'Document architecture decisions clearly in READMEs and practice explaining trade-offs concisely.',
  },
];
