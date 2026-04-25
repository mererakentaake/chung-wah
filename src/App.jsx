// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ROUTES, USER_TYPES } from './utils/constants';

import Welcome from './pages/Welcome';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import Home from './pages/Home';
import Announcements from './pages/Announcements';
import Chat from './pages/Chat';
import Assignments from './pages/Assignments';
import Holidays from './pages/Holidays';
import TimeTable from './pages/TimeTable';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Children from './pages/Children';
import ECard from './pages/ECard';
import Fees from './pages/Fees';
import Exams from './pages/Exams';
import Transportation from './pages/Transportation';
import Parenting from './pages/Parenting';
import EBooks from './pages/EBooks';
import LoadingScreen from './components/ui/LoadingScreen';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageStudents from './pages/admin/ManageStudents';
import ManageTeachers from './pages/admin/ManageTeachers';
import CreateEditUser from './pages/admin/CreateEditUser';

function ProtectedRoute({ children }) {
  const { user, loading, userType } = useAuth();
  if (loading) return <LoadingScreen />;
  // Not authenticated at all → Welcome
  if (!user) return <Navigate to={ROUTES.WELCOME} replace />;
  // Firebase Auth restored but no Firestore session doc (fresh install, doc lost,
  // or Firestore wasn't reachable on first launch) → send to Login to re-save session.
  // This prevents the blank/flicker loop that happened when userType stayed UNKNOWN.
  if (userType === USER_TYPES.UNKNOWN) return <Navigate to={ROUTES.LOGIN} replace />;
  // Admins don't belong on regular pages
  if (userType === USER_TYPES.ADMIN) return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading, userType } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to={ROUTES.WELCOME} replace />;
  if (userType === USER_TYPES.UNKNOWN) return <Navigate to={ROUTES.LOGIN} replace />;
  if (userType !== USER_TYPES.ADMIN) return <Navigate to={ROUTES.HOME} replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading, userType } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user && userType !== USER_TYPES.UNKNOWN) {
    // Fully authenticated with a valid session — skip public pages
    return <Navigate to={userType === USER_TYPES.ADMIN ? ROUTES.ADMIN_DASHBOARD : ROUTES.HOME} replace />;
  }
  return children;
}

export default function App() {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* Public */}
      <Route path={ROUTES.WELCOME} element={<PublicRoute><Welcome /></PublicRoute>} />
      <Route path={ROUTES.LOGIN} element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

      {/* Regular user pages */}
      <Route path={ROUTES.HOME} element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path={ROUTES.ANNOUNCEMENTS} element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
      <Route path={ROUTES.CHAT} element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/chat/:chatId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path={ROUTES.ASSIGNMENTS} element={<ProtectedRoute><Assignments /></ProtectedRoute>} />
      <Route path={ROUTES.HOLIDAYS} element={<ProtectedRoute><Holidays /></ProtectedRoute>} />
      <Route path={ROUTES.TIMETABLE} element={<ProtectedRoute><TimeTable /></ProtectedRoute>} />
      <Route path={ROUTES.PROFILE} element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path={ROUTES.SETTINGS} element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path={ROUTES.CHILDREN} element={<ProtectedRoute><Children /></ProtectedRoute>} />
      <Route path={ROUTES.ECARD} element={<ProtectedRoute><ECard /></ProtectedRoute>} />
      <Route path={ROUTES.FEES} element={<ProtectedRoute><Fees /></ProtectedRoute>} />
      <Route path={ROUTES.EXAMS} element={<ProtectedRoute><Exams /></ProtectedRoute>} />
      <Route path={ROUTES.TRANSPORTATION} element={<ProtectedRoute><Transportation /></ProtectedRoute>} />
      <Route path={ROUTES.PARENTING} element={<ProtectedRoute><Parenting /></ProtectedRoute>} />
      <Route path={ROUTES.EBOOKS} element={<ProtectedRoute><EBooks /></ProtectedRoute>} />

      {/* Admin pages */}
      <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path={ROUTES.ADMIN_STUDENTS} element={<AdminRoute><ManageStudents /></AdminRoute>} />
      <Route path={ROUTES.ADMIN_TEACHERS} element={<AdminRoute><ManageTeachers /></AdminRoute>} />
      <Route path={ROUTES.ADMIN_CREATE_USER} element={<AdminRoute><CreateEditUser /></AdminRoute>} />
      <Route path={ROUTES.ADMIN_EDIT_USER} element={<AdminRoute><CreateEditUser /></AdminRoute>} />

      <Route path="*" element={<Navigate to={ROUTES.WELCOME} replace />} />
    </Routes>
  );
}
