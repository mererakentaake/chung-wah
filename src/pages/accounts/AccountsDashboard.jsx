// src/pages/accounts/AccountsDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, TrendingUp, TrendingDown, BarChart3,
  ClipboardList, Receipt, LogOut, Calculator, ChevronRight, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import useBackGuard from '../../hooks/useBackGuard';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../services/auth';
import { getAllFees, getExpenses } from '../../services/firestore';
import { ROUTES } from '../../utils/constants';
import BottomNav from '../../components/layout/BottomNav';
import { USER_TYPES } from '../../utils/constants';

function StatCard({ label, value, color, icon: Icon, sub }) {
  return (
    <div className="rounded-2xl p-4 bg-white border border-gray-100 shadow-sm flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <p className="font-display font-bold text-gray-900 text-xl leading-tight">{value}</p>
      <p className="text-gray-400 text-xs font-body">{label}</p>
      {sub && <p className="text-gray-300 text-xs font-body">{sub}</p>}
    </div>
  );
}

function NavCard({ icon: Icon, color, title, subtitle, route }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(route)}
      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm
                 hover:shadow-md active:scale-[0.98] transition-all text-left">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-gray-800 text-sm">{title}</p>
        <p className="text-gray-400 text-xs font-body mt-0.5 truncate">{subtitle}</p>
      </div>
      <ChevronRight size={16} className="text-gray-300 shrink-0" />
    </button>
  );
}

export default function AccountsDashboard() {
  const { user, schoolCode, userType } = useAuth();
  useBackGuard(); // Prevent device back going to Login
  const navigate = useNavigate();
  const [fees, setFees] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub1 = getAllFees(setFees);
    const unsub2 = getExpenses(setExpenses);
    setLoading(false);
    return () => { unsub1(); unsub2(); };
  }, []);

  const totalRevenue = fees.reduce((s, f) => s + (f.totalPaid || 0), 0);
  const totalOutstanding = fees.reduce((s, f) => s + Math.max(0, (f.balance ?? (f.amount - (f.totalPaid || 0)))), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const netBalance = totalRevenue - totalExpenses;
  const overdueCount = fees.filter(f => f.status === 'overdue').length;

  const handleLogout = async () => {
    await logoutUser();
    toast.success('Logged out');
    navigate(ROUTES.WELCOME, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-5 flex items-start justify-between shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Calculator size={16} className="text-emerald-600" />
            </div>
            <span className="text-emerald-600 text-xs font-body font-semibold uppercase tracking-wider">Accounts Panel</span>
          </div>
          <h1 className="font-display font-extrabold text-gray-900 text-2xl">Dashboard</h1>
          <p className="text-gray-400 text-sm font-body mt-0.5">
            School: <span className="text-gray-700 font-semibold">{schoolCode}</span>
          </p>
        </div>
        <button onClick={handleLogout}
          className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-200 transition-all">
          <LogOut size={16} className="text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-28">
        {/* Overdue alert */}
        {overdueCount > 0 && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 mb-5">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <p className="text-red-600 text-sm font-body">
              <span className="font-semibold">{overdueCount}</span> overdue fee record{overdueCount > 1 ? 's' : ''} require attention.
            </p>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="Total Collected" value={`RM ${totalRevenue.toFixed(2)}`} color="#10b981" icon={TrendingUp} />
          <StatCard label="Outstanding" value={`RM ${totalOutstanding.toFixed(2)}`} color="#ef4444" icon={TrendingDown} />
          <StatCard label="Total Expenses" value={`RM ${totalExpenses.toFixed(2)}`} color="#f59e0b" icon={Receipt} />
          <StatCard label="Net Balance" value={`RM ${netBalance.toFixed(2)}`} color={netBalance >= 0 ? '#10b981' : '#ef4444'} icon={BarChart3} />
        </div>

        {/* Navigation */}
        <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider mb-3">Fee Management</p>
        <div className="flex flex-col gap-3 mb-6">
          <NavCard icon={DollarSign} color="#10b981" title="Manage Student Fees"
            subtitle="Create, update and track all fee records" route={ROUTES.ACCOUNTS_FEES} />
          <NavCard icon={Receipt} color="#f59e0b" title="Record Payment"
            subtitle="Log payments against student fee accounts" route={ROUTES.ACCOUNTS_PAYMENT} />
          <NavCard icon={TrendingDown} color="#6366f1" title="School Expenses"
            subtitle="Track and record school expenditure" route={ROUTES.ACCOUNTS_EXPENSES} />
        </div>

        <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider mb-3">Reports</p>
        <NavCard icon={BarChart3} color="#a855f7" title="Financial Reports"
          subtitle="Generate and send reports to Admin" route={ROUTES.ACCOUNTS_REPORTS} />

        <p className="text-gray-400 text-xs font-body mt-6">{user?.email}</p>
      </div>

      <BottomNav userType={USER_TYPES.ACCOUNTS} />
    </div>
  );
}
