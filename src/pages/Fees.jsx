// src/pages/Fees.jsx
import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, AlertTriangle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { USER_TYPES } from '../utils/constants';
import TopBar from '../components/layout/TopBar';
import BottomNav from '../components/layout/BottomNav';
import { getStudentFees, getParentGuardianLinks, adminGetStudents } from '../services/firestore';

const STATUS_CONFIG = {
  paid:    { color: '#22c55e', bgClass: 'bg-emerald-50', label: 'Paid',    Icon: CheckCircle },
  pending: { color: '#f59e0b', bgClass: 'bg-yellow-50',  label: 'Pending', Icon: Clock },
  overdue: { color: '#ef4444', bgClass: 'bg-red-50',     label: 'Overdue', Icon: AlertTriangle },
  partial: { color: '#3b82f6', bgClass: 'bg-blue-50',    label: 'Partial', Icon: DollarSign },
};

function FeeCard({ fee }) {
  const [expanded, setExpanded] = useState(false);
  const status   = fee.status || 'pending';
  const paid     = fee.totalPaid || 0;
  const balance  = fee.balance ?? ((fee.amount || 0) - paid);
  const payments = fee.payments || [];
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.Icon;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button className="w-full flex items-center gap-3.5 p-4 text-left"
        onClick={() => payments.length > 0 && setExpanded(v => !v)}>
        <div className={"w-10 h-10 rounded-xl flex items-center justify-center shrink-0 " + cfg.bgClass}>
          <Icon size={20} style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-800 font-display font-semibold text-sm truncate">{fee.term || fee.label || 'Fee'}</p>
          <p className="text-gray-400 text-xs font-body mt-0.5">{fee.dueDate ? "Due " + fee.dueDate : ""}</p>
        </div>
        <div className="text-right shrink-0 mr-1">
          <p className="text-gray-800 font-display font-bold text-sm">RM {(fee.amount || 0).toFixed(2)}</p>
          <span className="text-[10px] font-body font-semibold px-2 py-0.5 rounded-full"
            style={{ background: cfg.color + "15", color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
        {payments.length > 0 && (expanded ? <ChevronUp size={16} className="text-gray-300 shrink-0" /> : <ChevronDown size={16} className="text-gray-300 shrink-0" />)}
      </button>

      {expanded && payments.length > 0 && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <p className="text-gray-400 text-xs font-body font-semibold mb-2 mt-3">Payment History</p>
          {payments.map((p, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <div>
                <p className="text-gray-600 text-xs font-body">{p.method || 'Cash'}</p>
                <p className="text-gray-300 text-[10px] font-body">{p.recordedAt ? p.recordedAt.slice(0,10) : ""}</p>
              </div>
              <p className="text-emerald-600 text-sm font-display font-semibold">RM {p.amount ? p.amount.toFixed(2) : "0.00"}</p>
            </div>
          ))}
          {balance > 0 && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <p className="text-gray-400 text-xs font-body">Outstanding</p>
              <p className="text-red-500 text-sm font-display font-bold">RM {balance.toFixed(2)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StudentFeesView({ studentId, studentName }) {
  const [fees, setFees]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    const unsub = getStudentFees(studentId, data => { setFees(data); setLoading(false); });
    return unsub;
  }, [studentId]);

  const totalAmount  = fees.reduce((s, f) => s + (f.amount || 0), 0);
  const totalPaid    = fees.reduce((s, f) => s + (f.totalPaid || 0), 0);
  const totalBalance = totalAmount - totalPaid;

  if (loading) return (
    <div className="flex flex-col gap-3">
      {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />)}
    </div>
  );

  if (fees.length === 0) return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
        <DollarSign size={24} className="text-gray-300" />
      </div>
      <p className="text-gray-400 font-body">No fee records found</p>
      <p className="text-gray-300 text-xs font-body">Contact the accounts office if you have questions</p>
    </div>
  );

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        {studentName && <p className="text-gray-400 text-xs font-body mb-3">{studentName}</p>}
        <div className="flex justify-between">
          <div>
            <p className="text-gray-400 text-xs font-body">Total Paid</p>
            <p className="text-emerald-600 font-display font-bold text-xl">RM {totalPaid.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs font-body">Outstanding</p>
            <p className="text-red-500 font-display font-bold text-xl">RM {totalBalance.toFixed(2)}</p>
          </div>
        </div>
        {totalAmount > 0 && (
          <div className="mt-3">
            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all"
                style={{ width: Math.min((totalPaid / totalAmount) * 100, 100) + "%" }} />
            </div>
            <p className="text-gray-400 text-xs font-body mt-1.5 text-right">
              {Math.round((totalPaid / totalAmount) * 100)}% paid
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {fees.map(fee => <FeeCard key={fee.id} fee={fee} />)}
      </div>
    </>
  );
}

export default function Fees() {
  const { userType, userId } = useAuth();
  const [children, setChildren]               = useState([]);
  const [selectedChild, setSelectedChild]     = useState(null);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const isParent  = userType === USER_TYPES.PARENT;
  const isStudent = userType === USER_TYPES.STUDENT;

  useEffect(() => {
    if (!isParent || !userId) return;
    setLoadingChildren(true);
    const unsub = getParentGuardianLinks(userId, async links => {
      const confirmed = links.filter(l => l.status === 'confirmed');
      if (confirmed.length > 0) {
        try {
          const all = await adminGetStudents();
          const mapped = confirmed.map(l => ({ id: l.studentDocId, name: l.studentName })).filter(c => c.id);
          setChildren(mapped);
          if (mapped.length > 0) setSelectedChild(prev => prev || mapped[0]);
        } catch {}
      }
      setLoadingChildren(false);
    });
    return unsub;
  }, [isParent, userId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title="School Fees" showBack />
      {isParent && children.length > 1 && (
        <div className="flex gap-2 px-4 pt-3 overflow-x-auto">
          {children.map(c => (
            <button key={c.id} onClick={() => setSelectedChild(c)}
              className={"px-3 py-1.5 rounded-xl text-xs font-display font-semibold whitespace-nowrap transition-all " +
                (selectedChild && selectedChild.id === c.id ? 'bg-red-500 text-white' : 'bg-white border border-gray-200 text-gray-500')}>
              {c.name}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        {isStudent && <StudentFeesView studentId={userId} />}
        {isParent && (loadingChildren
          ? <div className="flex flex-col gap-3">{[1,2].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />)}</div>
          : selectedChild
            ? <StudentFeesView studentId={selectedChild.id} studentName={selectedChild.name} />
            : <div className="flex flex-col items-center gap-3 py-20 text-center"><DollarSign size={32} className="text-gray-300" /><p className="text-gray-400 font-body">No linked children found</p></div>
        )}
        {!isStudent && !isParent && <StudentFeesView studentId={userId} />}
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
