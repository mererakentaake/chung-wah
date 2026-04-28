// src/pages/accounts/RecordPayment.jsx
import React, { useState, useEffect } from 'react';
import { Search, Receipt, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllFees, adminGetStudents, recordPayment } from '../../services/firestore';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';
import { USER_TYPES, FEE_STATUSES } from '../../utils/constants';

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'Online', 'Other'];

const STATUS_CFG = {
  paid:    { label: 'Paid',    color: '#22c55e' },
  pending: { label: 'Pending', color: '#f59e0b' },
  overdue: { label: 'Overdue', color: '#ef4444' },
  partial: { label: 'Partial', color: '#3b82f6' },
};

export default function RecordPayment() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFee, setSelectedFee] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', method: 'Cash', reference: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = getAllFees((data) => {
      setFees(data.filter(f => f.status !== 'paid'));
      setLoading(false);
    });
    adminGetStudents().then(setStudents).catch(() => {});
    return unsub;
  }, []);

  const getStudentName = (fee) => fee.studentName || 'Unknown';

  const filtered = fees.filter(f => {
    const name = getStudentName(f).toLowerCase();
    const term = (f.term || '').toLowerCase();
    return name.includes(search.toLowerCase()) || term.includes(search.toLowerCase());
  });

  const handlePayment = async () => {
    if (!payForm.amount || isNaN(parseFloat(payForm.amount))) {
      toast.error('Enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      await recordPayment(selectedFee.id, {
        amount: parseFloat(payForm.amount),
        method: payForm.method,
        reference: payForm.reference,
        notes: payForm.notes,
        date: new Date().toISOString().slice(0, 10),
      });
      toast.success('Payment recorded!');
      setSelectedFee(null);
      setPayForm({ amount: '', method: 'Cash', reference: '', notes: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title="Record Payment" showBack />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        {!selectedFee ? (
          <>
            <p className="text-gray-500 text-sm font-body mb-4">Select a fee record to record a payment against:</p>
            <div className="relative mb-4">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="field pl-9 !py-2.5 text-sm" placeholder="Search by student name or term..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <Receipt size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-body">No outstanding fees found</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map(fee => {
                  const cfg = STATUS_CFG[fee.status] || STATUS_CFG.pending;
                  const balance = fee.balance ?? ((fee.amount || 0) - (fee.totalPaid || 0));
                  return (
                    <button key={fee.id} onClick={() => setSelectedFee(fee)}
                      className="w-full p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-display font-semibold text-gray-800">{getStudentName(fee)}</p>
                        <span className="text-xs font-body font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${cfg.color}18`, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs font-body mb-2">{fee.term}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-4">
                          <div>
                            <p className="text-gray-300 text-[10px]">Total</p>
                            <p className="text-gray-700 text-sm font-display font-bold">RM {(fee.amount || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-300 text-[10px]">Balance</p>
                            <p className="text-red-500 text-sm font-display font-bold">RM {balance.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-600 text-xs font-display font-semibold">
                          <Receipt size={13} /> Pay
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* Payment form */
          <div>
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm mb-5">
              <p className="text-gray-400 text-xs font-body mb-1">Recording payment for</p>
              <p className="font-display font-bold text-gray-800">{getStudentName(selectedFee)}</p>
              <p className="text-gray-400 text-sm font-body">{selectedFee.term}</p>
              <div className="flex gap-4 mt-2 pt-2 border-t border-gray-100">
                <div>
                  <p className="text-gray-300 text-[10px]">Total</p>
                  <p className="text-gray-700 text-sm font-display font-bold">RM {(selectedFee.amount || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-300 text-[10px]">Balance</p>
                  <p className="text-red-500 text-sm font-display font-bold">
                    RM {(selectedFee.balance ?? ((selectedFee.amount || 0) - (selectedFee.totalPaid || 0))).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-gray-500 text-xs font-body mb-1 block">Payment Amount (RM) *</label>
                <input className="field" type="number" placeholder="0.00"
                  value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <label className="text-gray-500 text-xs font-body mb-1 block">Payment Method</label>
                <select className="field" value={payForm.method}
                  onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-500 text-xs font-body mb-1 block">Reference / Receipt No.</label>
                <input className="field" placeholder="Optional reference number"
                  value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))} />
              </div>
              <div>
                <label className="text-gray-500 text-xs font-body mb-1 block">Notes</label>
                <textarea className="field min-h-[80px] resize-none" placeholder="Optional notes..."
                  value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setSelectedFee(null)}
                  className="flex-1 h-12 rounded-2xl font-display font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all">
                  Cancel
                </button>
                <button onClick={handlePayment} disabled={saving}
                  className="flex-1 h-12 rounded-2xl font-display font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  {saving
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><CheckCircle size={16} /> Record Payment</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <BottomNav userType={USER_TYPES.ACCOUNTS} />
    </div>
  );
}
