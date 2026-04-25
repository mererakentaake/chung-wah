// src/utils/constants.js

export const USER_TYPES = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
  UNKNOWN: 'UNKNOWN',
};

export const USER_COLORS = {
  ADMIN: '#a855f7',
  TEACHER: '#F9C61F',
  STUDENT: '#F4A334',
  PARENT: '#E84545',
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
  // Admin routes
  ADMIN_DASHBOARD: '/admin',
  ADMIN_STUDENTS: '/admin/students',
  ADMIN_TEACHERS: '/admin/teachers',
  ADMIN_CREATE_USER: '/admin/create-user',
  ADMIN_EDIT_USER: '/admin/edit-user',
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
