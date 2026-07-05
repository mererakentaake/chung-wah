// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { USER_TYPES, ROUTES } from './utils/constants';

// Auth
import Welcome      from './pages/Welcome';
import Login        from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';

// Core pages
import Home         from './pages/Home';
import Profile      from './pages/Profile';
import Settings     from './pages/Settings';
import Announcements from './pages/Announcements';
import Chat         from './pages/Chat';
import Assignments  from './pages/Assignments';
import Holidays     from './pages/Holidays';
import TimeTable    from './pages/TimeTable';
import Children     from './pages/Children';
import ParentEditChildProfile from './pages/ParentEditChildProfile';
import ECard        from './pages/ECard';
import Fees         from './pages/Fees';
import EBooks       from './pages/EBooks';
import Exams        from './pages/Exams';
import Transportation from './pages/Transportation';
import Parenting    from './pages/Parenting';
import StudentReports from './pages/StudentReports';
import LinkGuardian from './pages/LinkGuardian';

// Attendance
import TakeAttendance    from './pages/attendance/TakeAttendance';
import AttendanceRecords from './pages/attendance/AttendanceRecords';

// Accounts
import AccountsDashboard from './pages/accounts/AccountsDashboard';
import ManageFees        from './pages/accounts/ManageFees';
import RecordPayment     from './pages/accounts/RecordPayment';
import ManageExpenses    from './pages/accounts/ManageExpenses';
import FinancialReports  from './pages/accounts/FinancialReports';

// Admin
import AdminDashboard        from './pages/admin/AdminDashboard';
import AdminFinancialReports from './pages/admin/AdminFinancialReports';
import CreateEditUser        from './pages/admin/CreateEditUser';
import ManageStudents        from './pages/admin/ManageStudents';
import ManageTeachers        from './pages/admin/ManageTeachers';

// Syllabus
import SyllabusManager from './pages/syllabus/SyllabusManager';
import SyllabusEditor  from './pages/syllabus/SyllabusEditor';
import SyllabusView    from './pages/syllabus/SyllabusView';

// Assessment
import AssessmentManager  from './pages/assessment/AssessmentManager';
import CreateAssessment   from './pages/assessment/CreateAssessment';
import EnterMarks         from './pages/assessment/EnterMarks';
import AssessmentView     from './pages/assessment/AssessmentView';
import ReportCard         from './pages/assessment/ReportCard';

// Clubs
import ClubsList              from './pages/clubs/ClubsList';
import ClubDetail             from './pages/clubs/ClubDetail';
import CreateEditClub         from './pages/clubs/CreateEditClub';
import PendingAnnouncements   from './pages/clubs/PendingAnnouncements';

// Permission Forms
import PermissionFormsList    from './pages/permissions/PermissionFormsList';
import CreatePermissionForm   from './pages/permissions/CreatePermissionForm';
import PermissionFormDetail   from './pages/permissions/PermissionFormDetail';
import ParentPermissionForms  from './pages/permissions/ParentPermissionForms';

function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function RequireAuth({ allow, children }) {
  const { user, userType, loading } = useAuth();
  if (loading) return <Loader />;
  if (userType === USER_TYPES.UNKNOWN) return <Navigate to={ROUTES.LOGIN} replace />;
  if (allow && !allow.includes(userType)) {
    if (userType === USER_TYPES.ADMIN)    return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
    if (userType === USER_TYPES.ACCOUNTS) return <Navigate to={ROUTES.ACCOUNTS_DASHBOARD} replace />;
    return <Navigate to={ROUTES.HOME} replace />;
  }
  return children;
}

function RedirectIfAuthed({ children }) {
  const { user, userType, loading } = useAuth();
  if (loading) return <Loader />;
  if (user && userType !== USER_TYPES.UNKNOWN) {
    if (userType === USER_TYPES.ADMIN)    return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
    if (userType === USER_TYPES.ACCOUNTS) return <Navigate to={ROUTES.ACCOUNTS_DASHBOARD} replace />;
    return <Navigate to={ROUTES.HOME} replace />;
  }
  return children;
}

const ALL_AUTH   = [USER_TYPES.STUDENT, USER_TYPES.TEACHER, USER_TYPES.PARENT, USER_TYPES.ADMIN, USER_TYPES.ACCOUNTS];
const STU_TEA_PAR = [USER_TYPES.STUDENT, USER_TYPES.TEACHER, USER_TYPES.PARENT];
const ADM_TEA    = [USER_TYPES.ADMIN, USER_TYPES.TEACHER];
const ADM_ONLY   = [USER_TYPES.ADMIN];
const PAR_ONLY   = [USER_TYPES.PARENT];
const ALL_EXCEPT_ACCOUNTS = [USER_TYPES.STUDENT, USER_TYPES.TEACHER, USER_TYPES.PARENT, USER_TYPES.ADMIN];

export default function App() {
  return (
    <>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <Routes>
        {/* Public */}
        <Route path={ROUTES.WELCOME} element={<RedirectIfAuthed><Welcome /></RedirectIfAuthed>} />
        <Route path={ROUTES.LOGIN} element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Core */}
        <Route path={ROUTES.HOME}         element={<RequireAuth allow={ALL_AUTH}><Home /></RequireAuth>} />
        <Route path={ROUTES.PROFILE}      element={<RequireAuth allow={ALL_AUTH}><Profile /></RequireAuth>} />
        <Route path={ROUTES.SETTINGS}     element={<RequireAuth allow={ALL_AUTH}><Settings /></RequireAuth>} />
        <Route path={ROUTES.ANNOUNCEMENTS} element={<RequireAuth allow={ALL_AUTH}><Announcements /></RequireAuth>} />
        <Route path={ROUTES.CHAT}         element={<RequireAuth allow={STU_TEA_PAR}><Chat /></RequireAuth>} />
        <Route path={ROUTES.ASSIGNMENTS}  element={<RequireAuth allow={STU_TEA_PAR}><Assignments /></RequireAuth>} />
        <Route path={ROUTES.HOLIDAYS}     element={<RequireAuth allow={STU_TEA_PAR}><Holidays /></RequireAuth>} />
        <Route path={ROUTES.TIMETABLE}    element={<RequireAuth allow={STU_TEA_PAR}><TimeTable /></RequireAuth>} />
        <Route path={ROUTES.CHILDREN}     element={<RequireAuth allow={[USER_TYPES.PARENT, USER_TYPES.TEACHER]}><Children /></RequireAuth>} />
        <Route path={`${ROUTES.CHILD_PROFILE_EDIT}/:studentId`} element={<RequireAuth allow={PAR_ONLY}><ParentEditChildProfile /></RequireAuth>} />
        <Route path={ROUTES.ECARD}        element={<RequireAuth allow={STU_TEA_PAR}><ECard /></RequireAuth>} />
        <Route path={ROUTES.FEES}         element={<RequireAuth allow={STU_TEA_PAR}><Fees /></RequireAuth>} />
        <Route path={ROUTES.EBOOKS}       element={<RequireAuth allow={STU_TEA_PAR}><EBooks /></RequireAuth>} />
        <Route path={ROUTES.EXAMS}        element={<RequireAuth allow={STU_TEA_PAR}><Exams /></RequireAuth>} />
        <Route path={ROUTES.TRANSPORTATION} element={<RequireAuth allow={STU_TEA_PAR}><Transportation /></RequireAuth>} />
        <Route path={ROUTES.PARENTING}    element={<RequireAuth allow={[USER_TYPES.PARENT]}><Parenting /></RequireAuth>} />
        <Route path={ROUTES.STUDENT_REPORTS} element={<RequireAuth allow={STU_TEA_PAR}><StudentReports /></RequireAuth>} />
        <Route path={ROUTES.LINK_GUARDIAN} element={<RequireAuth allow={[USER_TYPES.TEACHER]}><LinkGuardian /></RequireAuth>} />

        {/* Attendance */}
        <Route path={ROUTES.TAKE_ATTENDANCE}    element={<RequireAuth allow={ADM_TEA}><TakeAttendance /></RequireAuth>} />
        <Route path={ROUTES.ATTENDANCE_RECORDS} element={<RequireAuth allow={ALL_EXCEPT_ACCOUNTS}><AttendanceRecords /></RequireAuth>} />

        {/* Accounts */}
        <Route path={ROUTES.ACCOUNTS_DASHBOARD} element={<RequireAuth allow={[USER_TYPES.ACCOUNTS, USER_TYPES.ADMIN]}><AccountsDashboard /></RequireAuth>} />
        <Route path={ROUTES.ACCOUNTS_FEES}      element={<RequireAuth allow={[USER_TYPES.ACCOUNTS, USER_TYPES.ADMIN]}><ManageFees /></RequireAuth>} />
        <Route path={ROUTES.ACCOUNTS_PAYMENT}   element={<RequireAuth allow={[USER_TYPES.ACCOUNTS, USER_TYPES.ADMIN]}><RecordPayment /></RequireAuth>} />
        <Route path={ROUTES.ACCOUNTS_EXPENSES}  element={<RequireAuth allow={[USER_TYPES.ACCOUNTS, USER_TYPES.ADMIN]}><ManageExpenses /></RequireAuth>} />
        <Route path={ROUTES.ACCOUNTS_REPORTS}   element={<RequireAuth allow={[USER_TYPES.ACCOUNTS, USER_TYPES.ADMIN]}><FinancialReports /></RequireAuth>} />

        {/* Admin */}
        <Route path={ROUTES.ADMIN_DASHBOARD}        element={<RequireAuth allow={ADM_ONLY}><AdminDashboard /></RequireAuth>} />
        <Route path={ROUTES.ADMIN_FINANCIAL_REPORTS} element={<RequireAuth allow={ADM_ONLY}><AdminFinancialReports /></RequireAuth>} />
        <Route path={ROUTES.ADMIN_STUDENTS}         element={<RequireAuth allow={ADM_TEA}><ManageStudents /></RequireAuth>} />
        <Route path={ROUTES.ADMIN_TEACHERS}         element={<RequireAuth allow={ADM_TEA}><ManageTeachers /></RequireAuth>} />
        <Route path={ROUTES.ADMIN_CREATE_USER}      element={<RequireAuth allow={ADM_TEA}><CreateEditUser /></RequireAuth>} />
        <Route path={`${ROUTES.ADMIN_EDIT_USER}/:type/:id`} element={<RequireAuth allow={ADM_TEA}><CreateEditUser /></RequireAuth>} />

        {/* Syllabus */}
        <Route path={ROUTES.SYLLABUS}              element={<RequireAuth allow={ADM_TEA}><SyllabusManager /></RequireAuth>} />
        <Route path={ROUTES.SYLLABUS_CREATE}       element={<RequireAuth allow={ADM_TEA}><SyllabusEditor /></RequireAuth>} />
        <Route path={`${ROUTES.SYLLABUS_EDIT}/:id`} element={<RequireAuth allow={ADM_TEA}><SyllabusEditor /></RequireAuth>} />
        <Route path={ROUTES.SYLLABUS_VIEW}         element={<RequireAuth allow={ALL_EXCEPT_ACCOUNTS}><SyllabusView /></RequireAuth>} />

        {/* Assessment */}
        <Route path={ROUTES.ASSESSMENT}              element={<RequireAuth allow={ADM_TEA}><AssessmentManager /></RequireAuth>} />
        <Route path={ROUTES.ASSESSMENT_CREATE}       element={<RequireAuth allow={ADM_TEA}><CreateAssessment /></RequireAuth>} />
        <Route path={`${ROUTES.ASSESSMENT_MARKS}/:id`} element={<RequireAuth allow={ADM_TEA}><EnterMarks /></RequireAuth>} />
        <Route path={ROUTES.ASSESSMENT_VIEW}         element={<RequireAuth allow={ALL_EXCEPT_ACCOUNTS}><AssessmentView /></RequireAuth>} />
        <Route path={ROUTES.REPORT_CARD}             element={<RequireAuth allow={ALL_EXCEPT_ACCOUNTS}><ReportCard /></RequireAuth>} />

        {/* Clubs */}
        <Route path={ROUTES.CLUBS}                 element={<RequireAuth allow={ALL_EXCEPT_ACCOUNTS}><ClubsList /></RequireAuth>} />
        <Route path={`${ROUTES.CLUBS_DETAIL}/:id`} element={<RequireAuth allow={ALL_EXCEPT_ACCOUNTS}><ClubDetail /></RequireAuth>} />
        <Route path={ROUTES.CLUBS_CREATE}          element={<RequireAuth allow={ADM_ONLY}><CreateEditClub /></RequireAuth>} />
        <Route path={ROUTES.CLUBS_PENDING}         element={<RequireAuth allow={ADM_ONLY}><PendingAnnouncements /></RequireAuth>} />

        {/* Permission Forms */}
        <Route path={ROUTES.PERMISSIONS}              element={<RequireAuth allow={ADM_TEA}><PermissionFormsList /></RequireAuth>} />
        <Route path={ROUTES.PERMISSIONS_CREATE}       element={<RequireAuth allow={ADM_TEA}><CreatePermissionForm /></RequireAuth>} />
        <Route path={`${ROUTES.PERMISSIONS_DETAIL}/:id`} element={<RequireAuth allow={ADM_TEA}><PermissionFormDetail /></RequireAuth>} />
        <Route path={ROUTES.PERMISSIONS_PARENT}       element={<RequireAuth allow={PAR_ONLY}><ParentPermissionForms /></RequireAuth>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={ROUTES.WELCOME} replace />} />
      </Routes>
    </>
  );
}
