// src/utils/constants.js

export const USER_TYPES = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
  ACCOUNTS: 'ACCOUNTS',
  UNKNOWN: 'UNKNOWN',
};

export const USER_COLORS = {
  ADMIN: '#a855f7',
  TEACHER: '#F9C61F',
  STUDENT: '#F4A334',
  PARENT: '#E84545',
  ACCOUNTS: '#10b981',
};

// Hardcoded school code — avoids exposing it in the login UI
export const SCHOOL_CODE = import.meta.env.VITE_SCHOOL_CODE || 'CHUNGWAH';

export const ROUTES = {
  WELCOME: '/',
  LOGIN: '/login',
  HOME: '/home',
  DASHBOARD: '/dashboard',
  ANNOUNCEMENTS: '/announcements',
  CHAT: '/chat',
  ASSIGNMENTS: '/assignments',
  HOLIDAYS: '/holidays',
  TIMETABLE: '/timetable',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  CHILDREN: '/children',
  ECARD: '/ecard',
  FEES: '/fees',
  EBOOKS: '/ebooks',
  EXAMS: '/exams',
  TRANSPORTATION: '/transportation',
  PARENTING: '/parenting',
  STUDENT_REPORTS: '/student-reports',
  LINK_GUARDIAN: '/link-guardian',
  // Attendance
  TAKE_ATTENDANCE: '/attendance/take',
  ATTENDANCE_RECORDS: '/attendance/records',
  // Accounts panel
  ACCOUNTS_DASHBOARD: '/accounts',
  ACCOUNTS_FEES: '/accounts/fees',
  ACCOUNTS_PAYMENT: '/accounts/payment',
  ACCOUNTS_EXPENSES: '/accounts/expenses',
  ACCOUNTS_REPORTS: '/accounts/reports',
  // Admin routes
  ADMIN_DASHBOARD: '/admin',
  ADMIN_STUDENTS: '/admin/students',
  ADMIN_TEACHERS: '/admin/teachers',
  ADMIN_CREATE_USER: '/admin/create-user',
  ADMIN_EDIT_USER: '/admin/edit-user',
  ADMIN_FINANCIAL_REPORTS: '/admin/financial-reports',
};

export const STRINGS = {
  appName: 'Chung Wah E-School',
  tagline: 'Connecting students, teachers & parents',
  teacher: 'Teachers',
  teacherWelcome: 'Create posts, notify students and parents to keep them updated.',
  student: 'Students',
  studentWelcome: 'Check school posts, take quizzes and stay updated with school news.',
  parents: 'Parents',
  parentWelcome: "Stay in touch with your child's teachers and school updates.",
};

export const TITLES = ['Mr', 'Mrs', 'Miss'];
export const GENDERS = ['Male', 'Female'];
export const RELATIONSHIP_TYPES = ['Parent', 'Guardian'];
export const REPORT_TYPES = ['Marks / Assessment', 'Behaviour', 'Performance', 'General Improvement'];

export const SUBJECTS = [
  'English',
  'Mathematics',
  'Science',
  'Social Studies',
  'Business Studies',
  'Agriculture',
  'Industrial Arts',
  'Home Economics',
  'Christian Education',
  'Physical Education',
  'ICT / Computer Studies',
  'Health Education',
];

// ─── Attendance Statuses ────────────────────────────────────────────────────
// Main statuses — always visible
export const ATTENDANCE_STATUSES = {
  PRESENT:         'present',
  ABSENT:          'absent',
  LATE:            'late',
  EXCUSED:         'excused',
  SICK:            'sick',
  LEFT_EARLY:      'left_early',
  SCHOOL_ACTIVITY: 'school_activity',
  UNEXPLAINED:     'unexplained',
  // Extra — admin-enabled
  MEDICAL_APPT:    'medical_appt',
  ON_LEAVE:        'on_leave',
  SUSPENDED:       'suspended',
  PARTIAL:         'partial',
  ONLINE_PRESENT:  'online_present',
};

export const ATTENDANCE_STATUS_CONFIG = {
  [ATTENDANCE_STATUSES.PRESENT]: {
    label: 'P', full: 'Present', color: '#22c55e',
    bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.35)',
    isMain: true,
  },
  [ATTENDANCE_STATUSES.ABSENT]: {
    label: 'A', full: 'Absent', color: '#ef4444',
    bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.35)',
    isMain: true,
  },
  [ATTENDANCE_STATUSES.LATE]: {
    label: 'L', full: 'Late', color: '#f59e0b',
    bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)',
    isMain: true,
  },
  [ATTENDANCE_STATUSES.EXCUSED]: {
    label: 'E', full: 'Excused', color: '#3b82f6',
    bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.35)',
    isMain: true,
  },
  [ATTENDANCE_STATUSES.SICK]: {
    label: 'S', full: 'Sick', color: '#f97316',
    bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.35)',
    isMain: true,
  },
  [ATTENDANCE_STATUSES.LEFT_EARLY]: {
    label: 'LE', full: 'Left Early', color: '#a78bfa',
    bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.35)',
    isMain: true,
  },
  [ATTENDANCE_STATUSES.SCHOOL_ACTIVITY]: {
    label: 'SA', full: 'Activity', color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.35)',
    isMain: true,
  },
  [ATTENDANCE_STATUSES.UNEXPLAINED]: {
    label: 'U', full: 'Unexplained', color: '#94a3b8',
    bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.35)',
    isMain: true,
  },
  // Extra statuses
  [ATTENDANCE_STATUSES.MEDICAL_APPT]: {
    label: 'MA', full: 'Medical Appt', color: '#06b6d4',
    bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.35)',
    isMain: false,
  },
  [ATTENDANCE_STATUSES.ON_LEAVE]: {
    label: 'OL', full: 'On Leave', color: '#64748b',
    bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.35)',
    isMain: false,
  },
  [ATTENDANCE_STATUSES.SUSPENDED]: {
    label: 'SU', full: 'Suspended', color: '#dc2626',
    bg: 'rgba(220,38,38,0.12)', border: 'rgba(220,38,38,0.3)',
    isMain: false,
  },
  [ATTENDANCE_STATUSES.PARTIAL]: {
    label: 'PA', full: 'Partial', color: '#d97706',
    bg: 'rgba(217,119,6,0.15)', border: 'rgba(217,119,6,0.35)',
    isMain: false,
  },
  [ATTENDANCE_STATUSES.ONLINE_PRESENT]: {
    label: 'OP', full: 'Online', color: '#10b981',
    bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)',
    isMain: false,
  },
};

export const MAIN_STATUSES   = Object.keys(ATTENDANCE_STATUS_CONFIG).filter(k => ATTENDANCE_STATUS_CONFIG[k].isMain);
export const EXTRA_STATUSES  = Object.keys(ATTENDANCE_STATUS_CONFIG).filter(k => !ATTENDANCE_STATUS_CONFIG[k].isMain);

// Statuses that warrant a welfare flag if repeated
export const WELFARE_STATUSES = [
  ATTENDANCE_STATUSES.ABSENT,
  ATTENDANCE_STATUSES.UNEXPLAINED,
  ATTENDANCE_STATUSES.SUSPENDED,
];

export const FEE_STATUSES = {
  PAID: 'paid',
  PENDING: 'pending',
  OVERDUE: 'overdue',
  PARTIAL: 'partial',
};

export const EXPENSE_CATEGORIES = [
  'Salaries',
  'Utilities',
  'Maintenance',
  'Supplies',
  'Events',
  'Transport',
  'Other',
];
