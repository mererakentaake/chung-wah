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

export const ATTENDANCE_STATUSES = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused',
};

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
