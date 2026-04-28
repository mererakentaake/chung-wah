// src/pages/accounts/ManageFees.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, DollarSign, CheckCircle, AlertTriangle, Clock, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getAllFees, adminGetStudents, upsertStudentFee } from '../../services/firestore';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';
import { USER_TYPES, FEE_STATUSES } from '../../utils/constants';

const STATUS_CFG = {
  paid:    { label: 'Paid',    color: '#22c55e', bg: 'bg-emerald-500/10 text-emerald-700' },
  pending: { label: 'Pending', color: '#f59e0b', bg: 'bg-yellow-50 text-yellow-700' },
  overdue: { label: 'Overdue', color: '#ef4444', bg: 'bg-red-50 text-red-700' },
  partial: { label: 'Partial', color: '#3b82f6', bg: 'bg-blue-50 text-blue-700' },
};

function FeeFormModal({ student, onClose, onSaved }) {
  const [form, setForm] = useState({
    term: '', label: '', amount: '', dueDate: '', status: 'pending',
  });
  const [saving, setSaving] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.term || !form.amount) {
      toast.error('Term and amount are required');
      return;
    }
    setSaving(true);
    try {
      await upsertStudentFee(student.id, {
        term: form.term,
        label: form.label || form.term,
        amount: parseFloat(form.amount),
        dueDate: form.dueDate,
        status: form.status,
        studentName: student.displayName || student.name || '',
      });
      toast.success('Fee record saved');
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center">
      <div className="w-full max-w-lg bg-white rounded-t-3xl p-6 safe-bottom">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-gray-900 text-lg">Add Fee</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <p className="text-gray-500 text-sm font-body mb-4">{student?.displayName || student?.name}</p>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-gray-500 text-xs font-body mb-1 block">Term / Period *</label>
            <input className="field" placeholder="e.g. Term 1 – Jan/Feb" value={form.term} onChange={set('term')} />
          </div>
          <div>
            <label className="text-gray-500 text-xs font-body mb-1 block">Label (optional)</label>
            <input className="field" placeholder="e.g. School Fees" value={form.label} onChange={set('label')} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-gray-500 text-xs font-body mb-1 block">Amount (RM) *</label>
              <input className="field" type="number" placeholder="0.00" value={form.amount} onChange={set('amount')} />
            </div>
            <div className="flex-1">
              <label className="text-gray-500 text-xs font-body mb-1 block">Due Date</label>
              <input className="field" type="date" value={form.dueDate} onChange={set('dueDate')} />
            </div>
          </div>
          <div>
            <label className="text-gray-500 text-xs font-body mb-1 block">Status</label>
            <select className="field" value={form.status} onChange={set('status')}>
              {Object.entries(FEE_STATUSES).map(([k, v]) => (
                <option key={k} value={v}>{STATUS_CFG[v]?.label || v}</option>
              ))}
            </select>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="w-full h-12 rounded-2xl font-display font-bold text-white flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            {saving
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : 'Save Fee Record'
            }
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManageFees() {
  const { userType } = useAuth();
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalStudent, setModalStudent] = useState(null);
  const [view, setView] = useState('fees'); // 'fees' | 'students'

  useEffect(() => {
    const unsub = getAllFees((data) => { setFees(data); setLoading(false); });
    adminGetStudents().then(setStudents).catch(() => {});
    return unsub;
  }, []);

  const filtered = fees.filter(f => {
    const nameMatch = (f.studentName || '').toLowerCase().includes(search.toLowerCase()) ||
                      (f.term || '').toLowerCase().includes(search.toLowerCase());
    const statusMatch = !filterStatus || f.status === filterStatus;
    return nameMatch && statusMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title="Manage Fees" showBack />

      {/* Tab toggle */}
      <div className="flex gap-2 px-4 pt-3">
        <button onClick={() => setView('fees')}
          className={`flex-1 py-2 rounded-xl text-sm font-display font-semibold transition-all ${
            view === 'fees' ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-500'
          }`}>
          All Fee Records
        </button>
        <button onClick={() => setView('students')}
          className={`flex-1 py-2 rounded-xl text-sm font-display font-semibold transition-all ${
            view === 'students' ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-500'
          }`}>
          Add by Student
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        {view === 'fees' ? (
          <>
            {/* Search + filter */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="field pl-9 !py-2.5 text-sm" placeholder="Search by name or term..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="field !py-2.5 text-sm !w-auto"
                value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All</option>
                {Object.values(FEE_STATUSES).map(v => (
                  <option key={v} value={v}>{STATUS_CFG[v]?.label || v}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-200 animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <DollarSign size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-body">No fee records found</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map(fee => {
                  const cfg = STATUS_CFG[fee.status] || STATUS_CFG.pending;
                  const balance = fee.balance ?? ((fee.amount || 0) - (fee.totalPaid || 0));
                  return (
                    <div key={fee.id} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-semibold text-gray-800 text-sm">{fee.studentName || 'Unknown Student'}</p>
                          <p className="text-gray-400 text-xs font-body">{fee.term}</p>
                        </div>
                        <span className={`text-xs font-body font-semibold px-2 py-0.5 rounded-full ml-2 ${cfg.bg}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-4">
                          <div>
                            <p className="text-gray-300 text-[10px] font-body">Amount</p>
                            <p className="text-gray-700 text-sm font-display font-bold">RM {(fee.amount || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-300 text-[10px] font-body">Paid</p>
                            <p className="text-emerald-600 text-sm font-display font-bold">RM {(fee.totalPaid || 0).toFixed(2)}</p>
                          </div>
                          {balance > 0 && (
                            <div>
                              <p className="text-gray-300 text-[10px] font-body">Balance</p>
                              <p className="text-red-500 text-sm font-display font-bold">RM {balance.toFixed(2)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {fee.dueDate && (
                        <p className="text-gray-300 text-xs font-body mt-1">Due: {fee.dueDate}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* Students list for adding fees */
          <>
            <div className="relative mb-4">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="field pl-9 !py-2.5 text-sm" placeholder="Search students..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              {students
                .filter(s => (s.displayName || s.name || '').toLowerCase().includes(search.toLowerCase()))
                .map(s => (
                  <button key={s.id} onClick={() => setModalStudent(s)}
                    className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <span className="text-emerald-600 font-display font-bold text-sm">
                        {(s.displayName || s.name || 'S')[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-gray-800 text-sm">{s.displayName || s.name}</p>
                      {s.standard && <p className="text-gray-400 text-xs font-body">Std {s.standard} – {s.division} • {s.enrollNo}</p>}
                    </div>
                    <Plus size={16} className="text-emerald-500 shrink-0" />
                  </button>
                ))
              }
            </div>
          </>
        )}
      </div>

      {modalStudent && (
        <FeeFormModal
          student={modalStudent}
          onClose={() => setModalStudent(null)}
          onSaved={() => { setModalStudent(null); setView('fees'); }}
        />
      )}

      <BottomNav userType={USER_TYPES.ACCOUNTS} />
    </div>
  );
}
