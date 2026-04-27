// src/App.jsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
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
import StudentReports from './pages/StudentReports';
import LinkGuardian from './pages/LinkGuardian';
import LoadingScreen from './components/ui/LoadingScreen';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageStudents from './pages/admin/ManageStudents';
import ManageTeachers from './pages/admin/ManageTeachers';
import CreateEditUser from './pages/admin/CreateEditUser';

/* ── Exit App Confirmation Modal ─────────────────────────────────────────── */
function ExitModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-5">
      <div
        className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-5"
        style={{ background: '#141829', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-white text-lg">Exit App?</h3>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center"
          >
            <X size={16} className="text-white/60" />
          </button>
        </div>
        <p className="text-white/55 text-sm font-body leading-relaxed">
          Are you sure you want to exit Chung Wah E-School?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-2xl font-display font-bold text-sm text-white/60 transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Stay
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3.5 rounded-2xl font-display font-bold text-sm text-white flex items-center justify-center gap-2 transition-all"
            style={{ background: 'linear-gradient(135deg, #E84545, #c53030)' }}
          >
            <LogOut size={15} /> Exit
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Route Guards ─────────────────────────────────────────────────────────── */
function ProtectedRoute({ children }) {
  const { user, loading, userType } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to={ROUTES.WELCOME} replace />;
  if (userType === USER_TYPES.UNKNOWN) return <Navigate to={ROUTES.LOGIN} replace />;
  if (userType === USER_TYPES.ADMIN) return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
  return children;
}

function TeacherRoute({ children }) {
  const { user, loading, userType } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to={ROUTES.WELCOME} replace />;
  if (userType === USER_TYPES.UNKNOWN) return <Navigate to={ROUTES.LOGIN} replace />;
  if (userType === USER_TYPES.ADMIN) return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
  if (userType !== USER_TYPES.TEACHER) return <Navigate to={ROUTES.HOME} replace />;
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

function TeacherOrAdminRoute({ children }) {
  const { user, loading, userType } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to={ROUTES.WELCOME} replace />;
  if (userType === USER_TYPES.UNKNOWN) return <Navigate to={ROUTES.LOGIN} replace />;
  if (userType !== USER_TYPES.ADMIN && userType !== USER_TYPES.TEACHER) return <Navigate to={ROUTES.HOME} replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading, userType } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user && userType !== USER_TYPES.UNKNOWN) {
    return <Navigate to={userType === USER_TYPES.ADMIN ? ROUTES.ADMIN_DASHBOARD : ROUTES.HOME} replace />;
  }
  return children;
}

/* ── Dashboard paths that should trigger exit-app confirmation ──────────── */
const DASHBOARD_PATHS = [ROUTES.HOME, ROUTES.ADMIN_DASHBOARD, ROUTES.DASHBOARD];

/* ── Main App ─────────────────────────────────────────────────────────────── */
export default function App() {
  const { loading } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [showExitModal, setShowExitModal] = useState(false);

  const isDashboard = DASHBOARD_PATHS.includes(location.pathname);

  // Handle Android / Capacitor hardware back button
  useEffect(() => {
    const handleBack = (e) => {
      if (e?.preventDefault) e.preventDefault();

      if (isDashboard) {
        // On the main dashboard → confirm before exiting the app
        setShowExitModal(true);
      } else {
        // On any child screen → go back to the parent screen
        navigate(-1);
      }
    };

    document.addEventListener('backbutton', handleBack);
    return () => document.removeEventListener('backbutton', handleBack);
  }, [isDashboard, navigate]);

  const handleExitConfirm = () => {
    setShowExitModal(false);
    // Use Capacitor App plugin when running natively; no-op on web/Electron
    try {
      if (window.Capacitor?.Plugins?.App?.exitApp) {
        window.Capacitor.Plugins.App.exitApp();
      } else if (window.navigator?.app?.exitApp) {
        window.navigator.app.exitApp(); // Cordova fallback
      }
    } catch (_) {}
  };

  if (loading) return <LoadingScreen />;

  return (
    <>
      <Routes>
        {/* Public */}
        <Route path={ROUTES.WELCOME}       element={<PublicRoute><Welcome /></PublicRoute>} />
        <Route path={ROUTES.LOGIN}         element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/forgot-password"     element={<PublicRoute><ForgotPassword /></PublicRoute>} />

        {/* All authenticated users */}
        <Route path={ROUTES.HOME}           element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path={ROUTES.ANNOUNCEMENTS}  element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
        <Route path={ROUTES.CHAT}           element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/chat/:chatId"         element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path={ROUTES.ASSIGNMENTS}    element={<ProtectedRoute><Assignments /></ProtectedRoute>} />
        <Route path={ROUTES.HOLIDAYS}       element={<ProtectedRoute><Holidays /></ProtectedRoute>} />
        <Route path={ROUTES.TIMETABLE}      element={<ProtectedRoute><TimeTable /></ProtectedRoute>} />
        <Route path={ROUTES.PROFILE}        element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path={ROUTES.SETTINGS}       element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path={ROUTES.CHILDREN}       element={<ProtectedRoute><Children /></ProtectedRoute>} />
        <Route path={ROUTES.ECARD}          element={<ProtectedRoute><ECard /></ProtectedRoute>} />
        <Route path={ROUTES.FEES}           element={<ProtectedRoute><Fees /></ProtectedRoute>} />
        <Route path={ROUTES.EXAMS}          element={<ProtectedRoute><Exams /></ProtectedRoute>} />
        <Route path={ROUTES.TRANSPORTATION} element={<ProtectedRoute><Transportation /></ProtectedRoute>} />
        <Route path={ROUTES.PARENTING}      element={<ProtectedRoute><Parenting /></ProtectedRoute>} />
        <Route path={ROUTES.EBOOKS}         element={<ProtectedRoute><EBooks /></ProtectedRoute>} />

        {/* Teacher-only */}
        <Route path={ROUTES.STUDENT_REPORTS} element={<TeacherRoute><StudentReports /></TeacherRoute>} />
        <Route path={ROUTES.LINK_GUARDIAN}   element={<TeacherRoute><LinkGuardian /></TeacherRoute>} />

        {/* Admin */}
        <Route path={ROUTES.ADMIN_DASHBOARD}   element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path={ROUTES.ADMIN_STUDENTS}    element={<AdminRoute><ManageStudents /></AdminRoute>} />
        <Route path={ROUTES.ADMIN_TEACHERS}    element={<AdminRoute><ManageTeachers /></AdminRoute>} />
        <Route path={ROUTES.ADMIN_CREATE_USER} element={<TeacherOrAdminRoute><CreateEditUser /></TeacherOrAdminRoute>} />
        <Route path={ROUTES.ADMIN_EDIT_USER}   element={<TeacherOrAdminRoute><CreateEditUser /></TeacherOrAdminRoute>} />

        <Route path="*" element={<Navigate to={ROUTES.WELCOME} replace />} />
      </Routes>

      {/* Exit-app confirmation — rendered outside <Routes> so it always covers everything */}
      {showExitModal && (
        <ExitModal
          onConfirm={handleExitConfirm}
          onCancel={() => setShowExitModal(false)}
        />
      )}
    </>
  );
}
