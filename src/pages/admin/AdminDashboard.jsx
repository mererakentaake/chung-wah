// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, GraduationCap, UserPlus, BarChart3, Settings, LogOut,
  ShieldCheck, ChevronRight, TrendingUp, FileText, ClipboardList, DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import { logoutUser } from '../../services/auth';
import { adminGetStats, getFinancialReports } from '../../services/firestore';
import { ROUTES } from '../../utils/constants';

function StatChip({ label, value, color }) {
  return (
    <div className="flex-1 p-3 rounded-2xl flex flex-col items-center gap-1"
      style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
      <p className="font-display font-extrabold text-2xl" style={{ color }}>{value ?? '…'}</p>
      <p className="text-white/40 text-xs font-body text-center leading-tight">{label}</p>
    </div>
  );
}

function NavRow({ icon: Icon, label, sub, color, route, badge }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(route)}
      className="w-full flex items-center gap-3.5 p-4 glass-card active:scale-[0.98] transition-all text-left">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }}>
        <Icon size={19} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-display font-semibold text-sm">{label}</p>
        {sub && <p className="text-white/40 text-xs font-body mt-0.5 truncate">{sub}</p>}
      </div>
      {badge != null && (
        <span className="text-xs font-display font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 shrink-0 mr-1">
          {badge}
        </span>
      )}
      <ChevronRight size={15} className="text-white/20 shrink-0" />
    </button>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats]     = useState(null);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    adminGetStats().then(setStats).catch(() => {});
    const unsub = getFinancialReports(setReports);
    return unsub;
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    toast.success('Signed out');
    navigate(ROUTES.WELCOME, { replace: true });
  };

  const latestReport = reports[0];

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      {/* Header */}
      <div className="px-5 pt-14 pb-5 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <ShieldCheck size={16} className="text-purple-400" />
            </div>
            <span className="text-purple-400 text-xs font-body font-semibold uppercase tracking-wider">Admin Panel</span>
          </div>
          <h1 className="font-display font-extrabold text-white text-2xl">Dashboard</h1>
        </div>
        <button onClick={handleLogout}
          className="w-10 h-10 rounded-xl glass-card flex items-center justify-center">
          <LogOut size={17} className="text-white/60" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-10">
        {/* Stats */}
        <div className="flex gap-3 mb-6">
          <StatChip label="Students"  value={stats?.totalStudents}  color="#F4A334" />
          <StatChip label="Teachers"  value={stats?.totalTeachers}  color="#F9C61F" />
          <StatChip label="Parents"   value={stats?.totalParents}   color="#E84545" />
        </div>

        {/* Latest financial report from Accounts */}
        {latestReport && (
          <div className="glass-card p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/50 text-xs font-body font-semibold uppercase tracking-wider">Latest Financial Report</p>
              <span className="text-white/30 text-xs font-body">{latestReport.generatedDate}</span>
            </div>
            <p className="text-white font-display font-semibold text-sm mb-3">{latestReport.title}</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-xl bg-white/5">
                <p className="text-emerald-400 font-display font-bold">RM {(latestReport.totalRevenue||0).toFixed(0)}</p>
                <p className="text-white/30 text-[10px] font-body">Collected</p>
              </div>
              <div className="text-center p-2 rounded-xl bg-white/5">
                <p className="text-red-400 font-display font-bold">RM {(latestReport.totalExpenses||0).toFixed(0)}</p>
                <p className="text-white/30 text-[10px] font-body">Expenses</p>
              </div>
              <div className="text-center p-2 rounded-xl bg-white/5">
                <p className={`font-display font-bold ${(latestReport.netBalance||0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  RM {(latestReport.netBalance||0).toFixed(0)}
                </p>
                <p className="text-white/30 text-[10px] font-body">Net</p>
              </div>
            </div>
            {latestReport.notes && (
              <p className="text-white/30 text-xs font-body mt-3 pt-3 border-t border-white/5 line-clamp-2">
                {latestReport.notes}
              </p>
            )}
          </div>
        )}

        {/* User management */}
        <p className="text-white/30 text-xs font-body font-semibold uppercase tracking-wider mb-3">User Management</p>
        <div className="flex flex-col gap-3 mb-5">
          <NavRow icon={GraduationCap} label="Manage Students"
            sub="View, add and edit student accounts" color="#F4A334"
            route={ROUTES.ADMIN_STUDENTS} />
          <NavRow icon={Users} label="Manage Teachers & Parents"
            sub="View, add and edit teacher/parent accounts" color="#F9C61F"
            route={ROUTES.ADMIN_TEACHERS} />
          <NavRow icon={UserPlus} label="Create New User"
            sub="Add a student, teacher or parent" color="#22c55e"
            route={ROUTES.ADMIN_CREATE_USER} />
        </div>

        {/* Reports */}
        <p className="text-white/30 text-xs font-body font-semibold uppercase tracking-wider mb-3">Reports & Finance</p>
        <div className="flex flex-col gap-3 mb-5">
          <NavRow icon={BarChart3}    label="Financial Reports"
            sub="View all reports submitted by Accounts" color="#a855f7"
            route={ROUTES.ADMIN_FINANCIAL_REPORTS}
            badge={reports.length > 0 ? reports.length : null} />
          <NavRow icon={ClipboardList} label="School Announcements"
            sub="View and manage all school posts" color="#6366f1"
            route={ROUTES.ANNOUNCEMENTS} />
          <NavRow icon={DollarSign} label="Fee Overview"
            sub="School-wide fee and payment status" color="#10b981"
            route={ROUTES.FEES} />
        </div>

        {/* Settings */}
        <p className="text-white/30 text-xs font-body font-semibold uppercase tracking-wider mb-3">System</p>
        <NavRow icon={Settings} label="Settings"
          sub="Manage school settings and preferences" color="#94a3b8"
          route={ROUTES.SETTINGS} />
      </div>
    </div>
  );
}
