// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, GraduationCap, UserCheck, ShieldCheck,
  Plus, LogOut, ChevronRight, School
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../services/auth';
import { adminGetStats } from '../../services/firestore';
import { ROUTES } from '../../utils/constants';

export default function AdminDashboard() {
  const { user, schoolCode } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalStudents: 0, totalTeachers: 0, totalParents: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    toast.success('Logged out');
    navigate(ROUTES.WELCOME, { replace: true });
  };

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      {/* Header */}
      <div className="px-5 pt-14 pb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <ShieldCheck size={16} className="text-purple-400" />
            </div>
            <span className="text-purple-400 text-xs font-body font-semibold uppercase tracking-wider">Admin Panel</span>
          </div>
          <h1 className="font-display font-extrabold text-white text-2xl">Dashboard</h1>
          <p className="text-white/40 text-sm font-body mt-0.5">
            School Code: <span className="text-white/70 font-semibold">{schoolCode}</span>
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center"
        >
          <LogOut size={16} className="text-white/60" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-10">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard label="Students" value={loading ? '—' : stats.totalStudents} color="#F4A334" icon={GraduationCap} />
          <StatCard label="Teachers" value={loading ? '—' : stats.totalTeachers} color="#F9C61F" icon={UserCheck} />
          <StatCard label="Parents" value={loading ? '—' : stats.totalParents} color="#E84545" icon={Users} />
        </div>

        {/* Quick actions */}
        <p className="text-white/40 text-xs font-body font-semibold uppercase tracking-wider mb-3">Manage Users</p>
        <div className="flex flex-col gap-3 mb-6">
          <NavCard
            icon={GraduationCap}
            color="#F4A334"
            title="Students"
            subtitle="Add, edit or remove students"
            onPress={() => navigate(ROUTES.ADMIN_STUDENTS)}
          />
          <NavCard
            icon={UserCheck}
            color="#F9C61F"
            title="Teachers & Parents"
            subtitle="Add, edit or remove staff and parents"
            onPress={() => navigate(ROUTES.ADMIN_TEACHERS)}
          />
        </div>

        {/* Quick add */}
        <p className="text-white/40 text-xs font-body font-semibold uppercase tracking-wider mb-3">Quick Add</p>
        <div className="grid grid-cols-2 gap-3">
          <QuickAddCard
            label="Add Student"
            color="#F4A334"
            onPress={() => navigate(`${ROUTES.ADMIN_CREATE_USER}?type=student`)}
          />
          <QuickAddCard
            label="Add Teacher"
            color="#F9C61F"
            onPress={() => navigate(`${ROUTES.ADMIN_CREATE_USER}?type=teacher`)}
          />
          <QuickAddCard
            label="Add Parent"
            color="#E84545"
            onPress={() => navigate(`${ROUTES.ADMIN_CREATE_USER}?type=parent`)}
          />
        </div>

        {/* Admin info */}
        <div className="mt-6 p-4 rounded-2xl bg-white/4 border border-white/8">
          <div className="flex items-center gap-2 mb-1">
            <School size={14} className="text-white/40" />
            <p className="text-white/40 text-xs font-body">Signed in as admin</p>
          </div>
          <p className="text-white/80 text-sm font-body">{user?.email}</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div className="rounded-2xl p-4 bg-white/5 border border-white/8 flex flex-col gap-2">
      <Icon size={18} style={{ color }} />
      <p className="font-display font-bold text-white text-xl leading-none">{value}</p>
      <p className="text-white/40 text-xs font-body">{label}</p>
    </div>
  );
}

function NavCard({ icon: Icon, color, title, subtitle, onPress }) {
  return (
    <button
      onClick={onPress}
      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/8
                 hover:bg-white/8 active:scale-98 transition-all text-left"
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}22`, border: `1px solid ${color}33` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-white text-sm">{title}</p>
        <p className="text-white/40 text-xs font-body mt-0.5 truncate">{subtitle}</p>
      </div>
      <ChevronRight size={16} className="text-white/30 shrink-0" />
    </button>
  );
}

function QuickAddCard({ label, color, onPress }) {
  return (
    <button
      onClick={onPress}
      className="flex items-center gap-2 p-4 rounded-2xl border active:scale-95 transition-all"
      style={{ background: `${color}15`, borderColor: `${color}30` }}
    >
      <Plus size={16} style={{ color }} />
      <span className="font-display font-semibold text-sm" style={{ color }}>{label}</span>
    </button>
  );
}
