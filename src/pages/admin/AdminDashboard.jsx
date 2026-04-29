// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, GraduationCap, UserPlus, BarChart3, Settings, LogOut,
  ShieldCheck, ChevronRight, FileText, ClipboardList, DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import useBackGuard from '../../hooks/useBackGuard';
import { logoutUser } from '../../services/auth';
import { adminGetStats, getFinancialReports } from '../../services/firestore';
import { ROUTES } from '../../utils/constants';

function StatCard({ label, value, color }) {
  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
      <p className="font-display font-extrabold text-2xl" style={{ color }}>{value != null ? value : "..."}</p>
      <p className="text-gray-400 text-xs font-body mt-0.5">{label}</p>
    </div>
  );
}

function NavRow({ icon: Icon, label, sub, color, route, badge }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(route)}
      className="w-full flex items-center gap-3.5 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: color + "18" }}>
        <Icon size={19} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-800 font-display font-semibold text-sm">{label}</p>
        {sub && <p className="text-gray-400 text-xs font-body mt-0.5 truncate">{sub}</p>}
      </div>
      {badge != null && (
        <span className="text-xs font-display font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200 shrink-0 mr-1">
          {badge}
        </span>
      )}
      <ChevronRight size={15} className="text-gray-300 shrink-0" />
    </button>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  useBackGuard(); // Prevent device back going to Login
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-5 flex items-start justify-between shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
              <ShieldCheck size={16} className="text-purple-600" />
            </div>
            <span className="text-purple-600 text-xs font-body font-semibold uppercase tracking-wider">Admin Panel</span>
          </div>
          <h1 className="font-display font-extrabold text-gray-900 text-2xl">Dashboard</h1>
        </div>
        <button onClick={handleLogout}
          className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-200 transition-all">
          <LogOut size={16} className="text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-10">
        {/* Stats */}
        <div className="flex gap-3 mb-6">
          <StatCard label="Students" value={stats && stats.totalStudents} color="#F4A334" />
          <StatCard label="Teachers" value={stats && stats.totalTeachers} color="#6366f1" />
          <StatCard label="Parents"  value={stats && stats.totalParents}  color="#E84545" />
        </div>

        {/* Latest financial report from Accounts */}
        {latestReport && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider">Latest Financial Report</p>
              <span className="text-gray-300 text-xs font-body">{latestReport.generatedDate}</span>
            </div>
            <p className="text-gray-800 font-display font-semibold text-sm mb-3">{latestReport.title}</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-xl bg-emerald-50">
                <p className="text-emerald-600 font-display font-bold">RM {(latestReport.totalRevenue || 0).toFixed(0)}</p>
                <p className="text-gray-400 text-[10px] font-body">Collected</p>
              </div>
              <div className="text-center p-2 rounded-xl bg-red-50">
                <p className="text-red-500 font-display font-bold">RM {(latestReport.totalExpenses || 0).toFixed(0)}</p>
                <p className="text-gray-400 text-[10px] font-body">Expenses</p>
              </div>
              <div className={"text-center p-2 rounded-xl " + ((latestReport.netBalance || 0) >= 0 ? 'bg-emerald-50' : 'bg-red-50')}>
                <p className={"font-display font-bold " + ((latestReport.netBalance || 0) >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                  RM {(latestReport.netBalance || 0).toFixed(0)}
                </p>
                <p className="text-gray-400 text-[10px] font-body">Net</p>
              </div>
            </div>
          </div>
        )}

        {/* User management */}
        <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider mb-3">User Management</p>
        <div className="flex flex-col gap-3 mb-6">
          <NavRow icon={GraduationCap} label="Manage Students"
            sub="View, add and edit student accounts" color="#F4A334" route={ROUTES.ADMIN_STUDENTS} />
          <NavRow icon={Users} label="Manage Teachers & Parents"
            sub="View, add and edit accounts" color="#6366f1" route={ROUTES.ADMIN_TEACHERS} />
          <NavRow icon={UserPlus} label="Create New User"
            sub="Add a student, teacher or parent" color="#22c55e" route={ROUTES.ADMIN_CREATE_USER} />
        </div>

        {/* Reports */}
        <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider mb-3">Reports & Finance</p>
        <div className="flex flex-col gap-3 mb-6">
          <NavRow icon={BarChart3} label="Financial Reports"
            sub="Reports submitted by Accounts team" color="#a855f7" route={ROUTES.ADMIN_FINANCIAL_REPORTS}
            badge={reports.length > 0 ? reports.length : null} />
          <NavRow icon={ClipboardList} label="Announcements"
            sub="View and manage all school posts" color="#f59e0b" route={ROUTES.ANNOUNCEMENTS} />
          <NavRow icon={DollarSign} label="Fee Overview"
            sub="School-wide fee and payment status" color="#10b981" route={ROUTES.FEES} />
        </div>

        <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider mb-3">System</p>
        <NavRow icon={Settings} label="Settings"
          sub="Manage school settings and preferences" color="#94a3b8" route={ROUTES.SETTINGS} />
      </div>
    </div>
  );
}
