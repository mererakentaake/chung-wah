// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Megaphone, Calendar, FileText, Bus, BookOpen,
  Baby, CreditCard, Clock, FlaskConical, DollarSign,
  Heart, Stethoscope, Syringe, Tag, Plus, GraduationCap, ClipboardList
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { USER_TYPES, ROUTES } from '../utils/constants';
import TopBar from '../components/layout/TopBar';
import BottomNav from '../components/layout/BottomNav';
import { DashboardCardFull, DashboardCardHalf, DashboardCardBanner } from '../components/ui/DashboardCard';
import { getProfile } from '../services/firestore';

function TeacherDashboard({ user, userType }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-3 pb-2 page-enter">
      <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-100">
        <p className="text-gray-400 text-sm font-body mb-1">Good morning 👋</p>
        <h2 className="font-display font-extrabold text-gray-900 text-xl">{user?.displayName || 'Welcome back'}</h2>
        <p className="text-gray-400 text-xs font-body mt-0.5">{userType === USER_TYPES.TEACHER ? 'Teacher' : 'Parent'} • {user?.id || ''}</p>
      </div>

      <DashboardCardFull icon={Users} label="Children / Students" color="#8b5cf6" route={ROUTES.CHILDREN} description="View your connected students" />
      <div className="flex gap-3">
        <DashboardCardHalf icon={CreditCard} label="E-Card"     color="#f97316" route={ROUTES.ECARD} />
        <DashboardCardHalf icon={Clock}      label="Time Table" color="#6366f1" route={ROUTES.TIMETABLE} />
      </div>
      <DashboardCardFull icon={Megaphone} label="Announcements" color="#f59e0b" route={ROUTES.ANNOUNCEMENTS} description="School posts and updates" />
      <div className="flex gap-3">
        <DashboardCardHalf icon={Calendar}      label="Holidays"    color="#64748b" route={ROUTES.HOLIDAYS} />
        <DashboardCardHalf icon={ClipboardList} label="Assignments" color="#22c55e" route={ROUTES.ASSIGNMENTS} />
      </div>
      <DashboardCardFull icon={Bus} label="Transportation" color="#94a3b8" route={ROUTES.TRANSPORTATION} description="Bus routes & schedules" />
      <div className="overflow-x-auto pb-1 -mx-4 px-4">
        <div className="flex gap-3 w-max">
          <DashboardCardBanner icon={Heart}        label="Parenting Guide" color="#ec4899" route={ROUTES.PARENTING} />
          <DashboardCardBanner icon={Stethoscope}  label="Health Tips"     color="#ef4444" route={ROUTES.PARENTING} />
          <DashboardCardBanner icon={Syringe}      label="Vaccinations"    color="#3b82f6" route={ROUTES.PARENTING} />
        </div>
      </div>
      <DashboardCardFull icon={Tag}       label="Offers & Discounts" color="#10b981" route="#"           description="Special deals for school families" />
      <DashboardCardFull icon={DollarSign} label="Fees"              color="#f59e0b" route={ROUTES.FEES} description="Track fee payments" />
    </div>
  );
}

function StudentDashboard({ user }) {
  return (
    <div className="flex flex-col gap-3 pb-2 page-enter">
      <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-100">
        <p className="text-gray-400 text-sm font-body mb-1">Good morning 👋</p>
        <h2 className="font-display font-extrabold text-gray-900 text-xl">{user?.displayName || 'Student'}</h2>
        <p className="text-gray-400 text-xs font-body mt-0.5">
          {user?.standard && user?.division ? `Std ${user.standard} – ${user.division}` : 'Student'}
        </p>
      </div>

      <DashboardCardFull icon={Megaphone} label="Announcements" color="#f59e0b" route={ROUTES.ANNOUNCEMENTS} description="Latest school posts" />
      <div className="flex gap-3">
        <DashboardCardHalf icon={Clock}        label="Time Table"   color="#6366f1" route={ROUTES.TIMETABLE} />
        <DashboardCardHalf icon={FlaskConical} label="Exams / Quiz" color="#ec4899" route={ROUTES.EXAMS} />
      </div>
      <div className="flex gap-3">
        <DashboardCardHalf icon={ClipboardList} label="Assignments" color="#22c55e" route={ROUTES.ASSIGNMENTS} />
        <DashboardCardHalf icon={Calendar}      label="Holidays"    color="#64748b" route={ROUTES.HOLIDAYS} />
      </div>
      <DashboardCardFull icon={BookOpen} label="E-Books" color="#06b6d4" route={ROUTES.EBOOKS} description="Digital library" />
      <div className="flex gap-3">
        <DashboardCardHalf icon={CreditCard}  label="E-Card" color="#f97316" route={ROUTES.ECARD} />
        <DashboardCardHalf icon={DollarSign}  label="Fees"   color="#f59e0b" route={ROUTES.FEES} />
      </div>
      <DashboardCardFull icon={Bus} label="Transportation" color="#94a3b8" route={ROUTES.TRANSPORTATION} description="Bus routes & schedules" />
    </div>
  );
}

export default function Home() {
  const { user, userType, userId } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (userId) getProfile(userId).then(setProfile).catch(() => {});
  }, [userId]);

  const isTeacher = userType === USER_TYPES.TEACHER;
  const isStudent = userType === USER_TYPES.STUDENT;
  const title = isStudent ? 'Student Dashboard' : isTeacher ? 'Teacher Dashboard' : 'Dashboard';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title={title}>
        <button onClick={() => navigate(ROUTES.PROFILE)}
          className="w-9 h-9 rounded-xl overflow-hidden border-2 border-yellow-300 shrink-0">
          {profile?.photoUrl && profile.photoUrl !== 'default' ? (
            <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center">
              <GraduationCap size={16} className="text-white" />
            </div>
          )}
        </button>
        {isTeacher && (
          <button onClick={() => navigate(ROUTES.ANNOUNCEMENTS + '?create=1')}
            className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center shadow-md">
            <Plus size={18} className="text-white" />
          </button>
        )}
      </TopBar>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-28">
        {isStudent ? <StudentDashboard user={profile} /> : <TeacherDashboard user={profile} userType={userType} />}
      </div>

      <BottomNav userType={userType} />
    </div>
  );
}
