// src/pages/accounts/FinancialReports.jsx
import React, { useState, useEffect } from 'react';
import { BarChart3, Send, CheckCircle, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllFees, getExpenses, saveFinancialReport, getFinancialReports } from '../../services/firestore';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';
import { USER_TYPES } from '../../utils/constants';

export default function FinancialReports() {
  const [fees, setFees]         = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [title, setTitle]       = useState('');
  const [notes, setNotes]       = useState('');

  useEffect(() => {
    const u1 = getAllFees(setFees);
    const u2 = getExpenses(setExpenses);
    const u3 = getFinancialReports((data) => { setReports(data); setLoading(false); });
    return () => { u1(); u2(); u3(); };
  }, []);

  const totalRevenue     = fees.reduce((s, f) => s + (f.totalPaid || 0), 0);
  const totalOutstanding = fees.reduce((s, f) => s + Math.max(0, (f.balance ?? ((f.amount||0) - (f.totalPaid||0)))), 0);
  const totalExpenses    = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const netBalance       = totalRevenue - totalExpenses;

  const paidCount    = fees.filter(f => f.status === 'paid').length;
  const pendingCount = fees.filter(f => f.status === 'pending' || f.status === 'partial').length;
  const overdueCount = fees.filter(f => f.status === 'overdue').length;

  const handleGenerate = async () => {
    if (!title.trim()) { toast.error('Enter a report title'); return; }
    setSending(true);
    try {
      await saveFinancialReport({
        title: title.trim(),
        notes: notes.trim(),
        totalRevenue,
        totalOutstanding,
        totalExpenses,
        netBalance,
        feeStats: { paidCount, pendingCount, overdueCount, total: fees.length },
        generatedDate: new Date().toISOString().slice(0, 10),
      });
      toast.success('Report sent to Admin!');
      setTitle('');
      setNotes('');
    } catch (err) {
      toast.error(err.message || 'Failed to send report');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title="Financial Reports" showBack />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        {/* Live summary */}
        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm mb-5">
          <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider mb-4">Current Financial Summary</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[
              { label: 'Total Collected', value: totalRevenue,     color: '#22c55e' },
              { label: 'Outstanding',     value: totalOutstanding, color: '#ef4444' },
              { label: 'Total Expenses',  value: totalExpenses,    color: '#f59e0b' },
              { label: 'Net Balance',     value: netBalance,       color: netBalance >= 0 ? '#22c55e' : '#ef4444' },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-xl bg-gray-50">
                <p className="text-gray-400 text-[10px] font-body">{item.label}</p>
                <p className="font-display font-bold text-base" style={{ color: item.color }}>
                  RM {item.value.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            {[
              { label: 'Paid',     value: paidCount,    color: '#22c55e' },
              { label: 'Pending',  value: pendingCount, color: '#f59e0b' },
              { label: 'Overdue',  value: overdueCount, color: '#ef4444' },
            ].map(item => (
              <div key={item.label} className="flex-1 text-center">
                <p className="font-display font-bold text-lg" style={{ color: item.color }}>{item.value}</p>
                <p className="text-gray-300 text-[10px] font-body">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Generate report form */}
        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm mb-5">
          <p className="font-display font-semibold text-gray-800 mb-4">Generate & Send to Admin</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-gray-500 text-xs font-body mb-1 block">Report Title *</label>
              <input className="field" placeholder="e.g. Term 1 Financial Report – 2025"
                value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-body mb-1 block">Notes / Summary</label>
              <textarea className="field min-h-[90px] resize-none" placeholder="Add any comments or observations..."
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <button onClick={handleGenerate} disabled={sending}
              className="w-full h-12 rounded-2xl font-display font-bold text-white flex items-center justify-center gap-2 mt-1 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
              {sending
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Send size={16} /> Send Report to Admin</>
              }
            </button>
          </div>
        </div>

        {/* Past reports */}
        <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider mb-3">Sent Reports</p>
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2].map(i => <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-body text-sm">No reports sent yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map(r => (
              <div key={r.id} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-gray-800 text-sm">{r.title}</p>
                    <p className="text-gray-400 text-xs font-body">{r.generatedDate}</p>
                    {r.notes && <p className="text-gray-500 text-xs font-body mt-1 line-clamp-2">{r.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 text-emerald-500 text-xs font-body shrink-0">
                    <CheckCircle size={13} /> Sent
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-emerald-600 font-display font-bold text-sm">RM {(r.totalRevenue||0).toFixed(0)}</p>
                    <p className="text-gray-300 text-[10px]">Collected</p>
                  </div>
                  <div className="text-center">
                    <p className="text-red-500 font-display font-bold text-sm">RM {(r.totalExpenses||0).toFixed(0)}</p>
                    <p className="text-gray-300 text-[10px]">Expenses</p>
                  </div>
                  <div className="text-center">
                    <p className={`font-display font-bold text-sm ${(r.netBalance||0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      RM {(r.netBalance||0).toFixed(0)}
                    </p>
                    <p className="text-gray-300 text-[10px]">Net</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav userType={USER_TYPES.ACCOUNTS} />
    </div>
  );
}
