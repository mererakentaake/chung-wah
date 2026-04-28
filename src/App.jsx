// src/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { USER_TYPES, ROUTES } from './utils/constants';

// Auth
import Login         from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';

// Shared / common
import Welcome  from './pages/Welcome';
import Profile  from './pages/Profile';
import Settings from './pages/Settings';

// Home (role-aware)
import Home from './pages/Home';

// Student / Teacher / Parent shared
import Announcements  from './pages/Announcements';
import Chat           from './pages/Chat';
import Assignments    from './pages/Assignments';
import Holidays       from './pages/Holidays';
import TimeTable      from './pages/TimeTable';
import ECard          from './pages/ECard';
import Fees           from './pages/Fees';
import EBooks         from './pages/EBooks';
import Exams          from './pages/Exams';
import Transportation from './pages/Transportation';
import Parenting      from './pages/Parenting';
import Children       from './pages/Children';
import StudentReports from './pages/StudentReports';
import LinkGuardian   from './pages/LinkGuardian';

// Attendance
import TakeAttendance     from './pages/attendance/TakeAttendance';
import AttendanceRecords  from './pages/attendance/AttendanceRecords';

// Accounts panel
import AccountsDashboard from './pages/accounts/AccountsDashboard';
import ManageFees        from './pages/accounts/ManageFees';
import RecordPayment     from './pages/accounts/RecordPayment';
import ManageExpenses    from './pages/accounts/ManageExpenses';
import FinancialReports  from './pages/accounts/FinancialReports';

// Admin panel
import AdminDashboard        from './pages/admin/AdminDashboard';
import ManageStudents        from './pages/admin/ManageStudents';
import ManageTeachers        from './pages/admin/ManageTeachers';
import CreateEditUser        from './pages/admin/CreateEditUser';
import AdminFinancialReports from './pages/admin/AdminFinancialReports';

function Loader() {
  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <img src="/school-crest.png" alt="" className="w-14 h-14 object-contain opacity-80 animate-pulse" />
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-yellow-400 opacity-60"
              style={{ animation: `bounce 1s ease-in-out ${i*0.15}s infinite` }} />
          ))}
        </div>
      </div>
      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }`}</style>
    </div>
  );
}

/* ── Route guards ────────────────────────────────────────────────────── */
function RequireAuth({ children, allow }) {
  const { user, userType, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader />;
  if (!user) return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  if (userType === USER_TYPES.UNKNOWN) return <Navigate to={ROUTES.LOGIN} replace />;

  if (allow && !allow.includes(userType)) {
    // Redirect to correct home based on actual role
    if (userType === USER_TYPES.ADMIN)    return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
    if (userType === USER_TYPES.ACCOUNTS) return <Navigate to={ROUTES.ACCOUNTS_DASHBOARD} replace />;
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return children;
}

function RequireNoAuth({ children }) {
  const { user, userType, loading } = useAuth();
  if (loading) return <Loader />;
  if (user && userType !== USER_TYPES.UNKNOWN) {
    if (userType === USER_TYPES.ADMIN)    return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
    if (userType === USER_TYPES.ACCOUNTS) return <Navigate to={ROUTES.ACCOUNTS_DASHBOARD} replace />;
    return <Navigate to={ROUTES.HOME} replace />;
  }
  return children;
}

/* ── App ─────────────────────────────────────────────────────────────── */
export default function App() {
  const STUDENT_TEACHER_PARENT = [USER_TYPES.STUDENT, USER_TYPES.TEACHER, USER_TYPES.PARENT];
  const TEACHER_ADMIN          = [USER_TYPES.TEACHER, USER_TYPES.ADMIN];
  const ALL_ROLES              = Object.values(USER_TYPES).filter(t => t !== USER_TYPES.UNKNOWN);

  return (
    <Routes>
      {/* Public */}
      <Route path={ROUTES.WELCOME} element={<Welcome />} />
      <Route path={ROUTES.LOGIN} element={<RequireNoAuth><Login /></RequireNoAuth>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Student / Teacher / Parent shared */}
      <Route path={ROUTES.HOME} element={
        <RequireAuth allow={STUDENT_TEACHER_PARENT}><Home /></RequireAuth>
      } />
      <Route path={ROUTES.PROFILE} element={
        <RequireAuth allow={STUDENT_TEACHER_PARENT}><Profile /></RequireAuth>
      } />
      <Route path={ROUTES.SETTINGS} element={
        <RequireAuth><Settings /></RequireAuth>
      } />
      <Route path={ROUTES.ANNOUNCEMENTS} element={
        <RequireAuth allow={STUDENT_TEACHER_PARENT}><Announcements /></RequireAuth>
      } />
      <Route path={ROUTES.CHAT} element={
        <RequireAuth allow={STUDENT_TEACHER_PARENT}><Chat /></RequireAuth>
      } />
      <Route path={`${ROUTES.CHAT}/:chatId`} element={
        <RequireAuth allow={STUDENT_TEACHER_PARENT}><Chat /></RequireAuth>
      } />
      <Route path={ROUTES.ASSIGNMENTS} element={
        <RequireAuth allow={STUDENT_TEACHER_PARENT}><Assignments /></RequireAuth>
      } />
      <Route path={ROUTES.HOLIDAYS} element={
        <RequireAuth allow={STUDENT_TEACHER_PARENT}><Holidays /></RequireAuth>
      } />
      <Route path={ROUTES.TIMETABLE} element={
        <RequireAuth allow={STUDENT_TEACHER_PARENT}><TimeTable /></RequireAuth>
      } />
      <Route path={ROUTES.ECARD} element={
        <RequireAuth allow={STUDENT_TEACHER_PARENT}><ECard /></RequireAuth>
      } />
      <Route path={ROUTES.FEES} element={
        <RequireAuth allow={[...STUDENT_TEACHER_PARENT, USER_TYPES.ADMIN]}><Fees /></RequireAuth>
      } />
      <Route path={ROUTES.EBOOKS} element={
        <RequireAuth allow={STUDENT_TEACHER_PARENT}><EBooks /></RequireAuth>
      } />
      <Route path={ROUTES.EXAMS} element={
        <RequireAuth allow={STUDENT_TEACHER_PARENT}><Exams /></RequireAuth>
      } />
      <Route path={ROUTES.TRANSPORTATION} element={
        <RequireAuth allow={STUDENT_TEACHER_PARENT}><Transportation /></RequireAuth>
      } />
      <Route path={ROUTES.PARENTING} element={
        <RequireAuth allow={[USER_TYPES.PARENT, USER_TYPES.TEACHER]}><Parenting /></RequireAuth>
      } />
      <Route path={ROUTES.CHILDREN} element={
        <RequireAuth allow={[USER_TYPES.PARENT, USER_TYPES.TEACHER]}><Children /></RequireAuth>
      } />
      <Route path={ROUTES.STUDENT_REPORTS} element={
        <RequireAuth allow={TEACHER_ADMIN}><StudentReports /></RequireAuth>
      } />
      <Route path={ROUTES.LINK_GUARDIAN} element={
        <RequireAuth allow={TEACHER_ADMIN}><LinkGuardian /></RequireAuth>
      } />

      {/* Attendance */}
      <Route path={ROUTES.TAKE_ATTENDANCE} element={
        <RequireAuth allow={TEACHER_ADMIN}><TakeAttendance /></RequireAuth>
      } />
      <Route path={ROUTES.ATTENDANCE_RECORDS} element={
        <RequireAuth allow={STUDENT_TEACHER_PARENT}><AttendanceRecords /></RequireAuth>
      } />

      {/* Accounts Panel */}
      <Route path={ROUTES.ACCOUNTS_DASHBOARD} element={
        <RequireAuth allow={[USER_TYPES.ACCOUNTS, USER_TYPES.ADMIN]}><AccountsDashboard /></RequireAuth>
      } />
      <Route path={ROUTES.ACCOUNTS_FEES} element={
        <RequireAuth allow={[USER_TYPES.ACCOUNTS, USER_TYPES.ADMIN]}><ManageFees /></RequireAuth>
      } />
      <Route path={ROUTES.ACCOUNTS_PAYMENT} element={
        <RequireAuth allow={[USER_TYPES.ACCOUNTS, USER_TYPES.ADMIN]}><RecordPayment /></RequireAuth>
      } />
      <Route path={ROUTES.ACCOUNTS_EXPENSES} element={
        <RequireAuth allow={[USER_TYPES.ACCOUNTS, USER_TYPES.ADMIN]}><ManageExpenses /></RequireAuth>
      } />
      <Route path={ROUTES.ACCOUNTS_REPORTS} element={
        <RequireAuth allow={[USER_TYPES.ACCOUNTS, USER_TYPES.ADMIN]}><FinancialReports /></RequireAuth>
      } />

      {/* Admin Panel */}
      <Route path={ROUTES.ADMIN_DASHBOARD} element={
        <RequireAuth allow={[USER_TYPES.ADMIN]}><AdminDashboard /></RequireAuth>
      } />
      <Route path={ROUTES.ADMIN_STUDENTS} element={
        <RequireAuth allow={[USER_TYPES.ADMIN]}><ManageStudents /></RequireAuth>
      } />
      <Route path={ROUTES.ADMIN_TEACHERS} element={
        <RequireAuth allow={[USER_TYPES.ADMIN]}><ManageTeachers /></RequireAuth>
      } />
      <Route path={ROUTES.ADMIN_CREATE_USER} element={
        <RequireAuth allow={[USER_TYPES.ADMIN, USER_TYPES.TEACHER]}><CreateEditUser /></RequireAuth>
      } />
      <Route path={`${ROUTES.ADMIN_EDIT_USER}/:type/:id`} element={
        <RequireAuth allow={[USER_TYPES.ADMIN]}><CreateEditUser /></RequireAuth>
      } />
      <Route path={ROUTES.ADMIN_FINANCIAL_REPORTS} element={
        <RequireAuth allow={[USER_TYPES.ADMIN]}><AdminFinancialReports /></RequireAuth>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={ROUTES.WELCOME} replace />} />
    </Routes>
  );
}
