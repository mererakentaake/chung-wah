// src/pages/attendance/TakeAttendance.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Save, AlertCircle, ChevronDown, ChevronUp, SlidersHorizontal,
  X, Clock, MessageSquare, AlertTriangle, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  adminGetStudents, submitAttendance, getClassAttendance,
} from '../../services/firestore';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';
import {
  ATTENDANCE_STATUSES, ATTENDANCE_STATUS_CONFIG,
  MAIN_STATUSES, EXTRA_STATUSES, SUBJECTS, USER_TYPES,
} from '../../utils/constants';

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

// Counts per status from attendance map
function computeStats(attendance) {
  const counts = {};
  Object.values(attendance).forEach(r => {
    const s = r.status || ATTENDANCE_STATUSES.PRESENT;
    counts[s] = (counts[s] || 0) + 1;
  });
  return counts;
}

// ─── Status Picker Sheet ─────────────────────────────────────────────────────
function StatusSheet({ student, record, showExtra, onClose, onSave }) {
  const [status, setStatus]       = useState(record.status || ATTENDANCE_STATUSES.PRESENT);
  const [note, setNote]           = useState(record.note || '');
  const [checkIn, setCheckIn]     = useState(record.checkInTime || '');
  const [checkOut, setCheckOut]   = useState(record.checkOutTime || '');
  const [minsLate, setMinsLate]   = useState(record.minutesLate ? String(record.minutesLate) : '');

  const showTime   = [ATTENDANCE_STATUSES.LATE, ATTENDANCE_STATUSES.LEFT_EARLY, ATTENDANCE_STATUSES.PARTIAL].includes(status);
  const showMinLate = status === ATTENDANCE_STATUSES.LATE;

  const handleSave = () => {
    onSave(student.id, {
      status,
      note: note.trim(),
      checkInTime: checkIn,
      checkOutTime: checkOut,
      minutesLate: minsLate ? parseInt(minsLate, 10) : 0,
    });
    onClose();
  };

  const StatusChip = ({ s }) => {
    const cfg = ATTENDANCE_STATUS_CONFIG[s];
    const active = status === s;
    return (
      <button
        onClick={() => setStatus(s)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-2xl font-display font-bold text-xs transition-all active:scale-95"
        style={{
          background: active ? cfg.bg : 'rgba(255,255,255,0.05)',
          color: active ? cfg.color : 'rgba(255,255,255,0.45)',
          border: active ? `1.5px solid ${cfg.border}` : '1.5px solid transparent',
        }}
      >
        <span className="font-bold">{cfg.label}</span>
        <span>{cfg.full}</span>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full rounded-t-3xl overflow-hidden"
        style={{ background: '#0f1529', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="px-4 pb-6 pt-2">
          {/* Student name */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white font-display font-bold text-base">
                {student.displayName || student.name || 'Student'}
              </p>
              {student.enrollNo && (
                <p className="text-white/40 text-xs font-body">{student.enrollNo}</p>
              )}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center">
              <X size={14} className="text-white/60" />
            </button>
          </div>

          {/* Main statuses */}
          <p className="text-white/40 text-[10px] font-body font-semibold uppercase tracking-wider mb-2">Status</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {MAIN_STATUSES.map(s => <StatusChip key={s} s={s} />)}
          </div>

          {/* Extra statuses */}
          {showExtra && (
            <>
              <p className="text-white/30 text-[10px] font-body font-semibold uppercase tracking-wider mb-2">Additional</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {EXTRA_STATUSES.map(s => <StatusChip key={s} s={s} />)}
              </div>
            </>
          )}

          {/* Time fields — contextual */}
          {showTime && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-white/40 text-xs font-body mb-1 block">Check-in Time</label>
                <input type="time"
                  className="w-full bg-white/8 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm font-body focus:outline-none focus:border-white/25"
                  value={checkIn} onChange={e => setCheckIn(e.target.value)} />
              </div>
              <div>
                <label className="text-white/40 text-xs font-body mb-1 block">Check-out Time</label>
                <input type="time"
                  className="w-full bg-white/8 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm font-body focus:outline-none focus:border-white/25"
                  value={checkOut} onChange={e => setCheckOut(e.target.value)} />
              </div>
            </div>
          )}

          {showMinLate && (
            <div className="mb-3">
              <label className="text-white/40 text-xs font-body mb-1 block">Minutes Late</label>
              <input type="number" min="1" max="300"
                className="w-full bg-white/8 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm font-body focus:outline-none focus:border-white/25"
                placeholder="e.g. 15"
                value={minsLate} onChange={e => setMinsLate(e.target.value)} />
            </div>
          )}

          {/* Note */}
          <div className="mb-5">
            <label className="text-white/40 text-xs font-body mb-1 block">Note (optional)</label>
            <textarea
              className="w-full bg-white/8 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm font-body focus:outline-none focus:border-white/25 resize-none"
              rows={2} placeholder="e.g. parent called, doctor note submitted…"
              value={note} onChange={e => setNote(e.target.value)} />
          </div>

          <button onClick={handleSave}
            className="w-full h-12 rounded-2xl font-display font-bold text-sm text-white flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${ATTENDANCE_STATUS_CONFIG[status].color}cc, ${ATTENDANCE_STATUS_CONFIG[status].color})` }}>
            <CheckCircle2 size={16} />
            Set {ATTENDANCE_STATUS_CONFIG[status].full}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TakeAttendance() {
  const { userType, userId } = useAuth();
  const isAdmin = userType === USER_TYPES.ADMIN;

  const [students,         setStudents]         = useState([]);
  const [attendance,       setAttendance]        = useState({});
  const [filter,           setFilter]            = useState({ standard: '', division: '' });
  const [subject,          setSubject]           = useState('');
  const [date,             setDate]              = useState(getToday());
  const [loading,          setLoading]           = useState(false);
  const [saving,           setSaving]            = useState(false);
  const [alreadySubmitted, setAlreadySubmitted]  = useState(false);
  const [showExtra,        setShowExtra]         = useState(false);
  const [activeStudent,    setActiveStudent]     = useState(null); // for sheet
  const [welfareFlags,     setWelfareFlags]      = useState([]);   // student ids

  // Load students for selected class
  useEffect(() => {
    if (!filter.standard) { setStudents([]); return; }
    setLoading(true);
    adminGetStudents().then(all => {
      let filtered = all;
      if (filter.standard) filtered = filtered.filter(s => String(s.standard) === String(filter.standard));
      if (filter.division) filtered = filtered.filter(s => s.division?.toUpperCase() === filter.division.toUpperCase());
      filtered.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
      setStudents(filtered);
      // Default all to present, preserve existing edits
      setAttendance(prev => {
        const next = {};
        filtered.forEach(s => {
          next[s.id] = prev[s.id] || { status: ATTENDANCE_STATUSES.PRESENT };
        });
        return next;
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filter]);

  // Check if already submitted; load existing data
  useEffect(() => {
    if (!filter.standard || !filter.division) { setAlreadySubmitted(false); return; }
    getClassAttendance(date, filter.standard, filter.division).then(existing => {
      setAlreadySubmitted(!!existing);
      if (existing?.records) {
        const map = {};
        existing.records.forEach(r => {
          map[r.studentId] = {
            status:      r.status || ATTENDANCE_STATUSES.PRESENT,
            note:        r.note || '',
            checkInTime: r.checkInTime || '',
            checkOutTime: r.checkOutTime || '',
            minutesLate: r.minutesLate || 0,
          };
        });
        setAttendance(map);
      }
    }).catch(() => {});
  }, [date, filter]);

  // Welfare flag detection — 3+ absences or unexplained in last records
  useEffect(() => {
    // Simplified: flag students currently marked with welfare-concern statuses
    const flags = students
      .filter(s => {
        const r = attendance[s.id];
        return r && [ATTENDANCE_STATUSES.ABSENT, ATTENDANCE_STATUSES.UNEXPLAINED, ATTENDANCE_STATUSES.SUSPENDED].includes(r.status);
      })
      .map(s => s.id);
    setWelfareFlags(flags);
  }, [attendance, students]);

  const updateRecord = useCallback((studentId, fields) => {
    setAttendance(prev => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), ...fields } }));
  }, []);

  const handleSave = async () => {
    if (!filter.standard || !filter.division) {
      toast.error('Please select standard and division');
      return;
    }
    if (students.length === 0) {
      toast.error('No students found for this class');
      return;
    }
    setSaving(true);
    try {
      const records = students.map(s => {
        const r = attendance[s.id] || { status: ATTENDANCE_STATUSES.PRESENT };
        return {
          studentId:    s.id,
          studentName:  s.displayName || s.name || 'Student',
          status:       r.status || ATTENDANCE_STATUSES.PRESENT,
          note:         r.note || '',
          checkInTime:  r.checkInTime || '',
          checkOutTime: r.checkOutTime || '',
          minutesLate:  r.minutesLate || 0,
        };
      });
      await submitAttendance({ date, standard: filter.standard, division: filter.division, subject, records });
      toast.success(alreadySubmitted ? 'Attendance updated!' : 'Attendance saved!');
      setAlreadySubmitted(true);
    } catch (err) {
      toast.error(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const stats = computeStats(attendance);
  const total = students.length;

  const presentCount = (stats[ATTENDANCE_STATUSES.PRESENT] || 0)
    + (stats[ATTENDANCE_STATUSES.ONLINE_PRESENT] || 0)
    + (stats[ATTENDANCE_STATUSES.PARTIAL] || 0);
  const pct = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <TopBar title="Take Attendance" />

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-28">
        {/* Class & Date Filters */}
        <div className="glass-card p-4 mb-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-white/40 text-xs font-body mb-1 block">Standard</label>
              <input
                className="w-full bg-white/8 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm font-body placeholder-white/25 focus:outline-none focus:border-white/25"
                placeholder="e.g. 9" value={filter.standard}
                onChange={e => setFilter(f => ({ ...f, standard: e.target.value }))} />
            </div>
            <div>
              <label className="text-white/40 text-xs font-body mb-1 block">Division</label>
              <input
                className="w-full bg-white/8 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm font-body placeholder-white/25 focus:outline-none focus:border-white/25"
                placeholder="e.g. A" value={filter.division}
                onChange={e => setFilter(f => ({ ...f, division: e.target.value.toUpperCase() }))} />
            </div>
          </div>
          <div className="mb-3">
            <label className="text-white/40 text-xs font-body mb-1 block">Date</label>
            <input type="date"
              className="w-full bg-white/8 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm font-body focus:outline-none focus:border-white/25"
              value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="text-white/40 text-xs font-body mb-1 block">Subject (optional)</label>
            <select
              className="w-full bg-white/8 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm font-body focus:outline-none focus:border-white/25"
              value={subject} onChange={e => setSubject(e.target.value)}>
              <option value="">General / All day</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Already submitted notice */}
        {alreadySubmitted && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
            <AlertCircle size={15} className="text-yellow-400 shrink-0" />
            <p className="text-yellow-400 text-xs font-body">
              Attendance already submitted for this date. You can re-save to update records.
            </p>
          </div>
        )}

        {/* Welfare flags */}
        {welfareFlags.length > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
            <AlertTriangle size={15} className="text-red-400 shrink-0" />
            <p className="text-red-400 text-xs font-body">
              {welfareFlags.length} student{welfareFlags.length > 1 ? 's' : ''} marked with a welfare concern today. Consider following up.
            </p>
          </div>
        )}

        {/* Stats bar */}
        {students.length > 0 && (
          <div className="glass-card p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/50 text-xs font-body font-semibold">
                {filter.standard && filter.division
                  ? `STD ${filter.standard} ${filter.division} — ${date}`
                  : 'Summary'}
              </p>
              <p className="font-display font-bold text-sm" style={{ color: pct >= 80 ? '#22c55e' : '#f59e0b' }}>
                {pct}% present
              </p>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-white/10 mb-3 overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: pct >= 80 ? '#22c55e' : '#f59e0b' }} />
            </div>
            {/* Status counts */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats).map(([key, val]) => {
                const cfg = ATTENDANCE_STATUS_CONFIG[key];
                if (!cfg) return null;
                return (
                  <div key={key} className="flex items-center gap-1 px-2 py-1 rounded-lg"
                    style={{ background: cfg.bg }}>
                    <span className="font-display font-bold text-xs" style={{ color: cfg.color }}>{val}</span>
                    <span className="text-white/40 text-[10px] font-body">{cfg.full}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Extra statuses toggle (admin only) */}
        {students.length > 0 && (
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/30 text-xs font-body">Tap a student to set their status</p>
            {isAdmin && (
              <button onClick={() => setShowExtra(v => !v)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-display font-semibold transition-all"
                style={{ background: showExtra ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)', color: showExtra ? '#a78bfa' : 'rgba(255,255,255,0.4)' }}>
                <SlidersHorizontal size={12} />
                {showExtra ? 'Hide Extra' : 'Extra Statuses'}
              </button>
            )}
          </div>
        )}

        {/* Student list */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : students.length === 0 && filter.standard ? (
          <div className="text-center py-12">
            <p className="text-white/30 font-body">No students found for Std {filter.standard}{filter.division ? `-${filter.division}` : ''}</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/30 font-body">Enter a standard to load students</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {students.map((s, i) => {
              const rec = attendance[s.id] || { status: ATTENDANCE_STATUSES.PRESENT };
              const cfg = ATTENDANCE_STATUS_CONFIG[rec.status] || ATTENDANCE_STATUS_CONFIG[ATTENDANCE_STATUSES.PRESENT];
              const hasNote = rec.note && rec.note.length > 0;
              const hasTime = rec.checkInTime || rec.checkOutTime;
              const isWelfare = welfareFlags.includes(s.id);

              return (
                <button key={s.id} onClick={() => setActiveStudent(s)}
                  className="w-full flex items-center gap-3 p-3.5 glass-card active:scale-[0.98] transition-all text-left">
                  <span className="text-white/30 text-xs font-body w-5 shrink-0 text-center">{i + 1}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-white font-display font-medium text-sm truncate">
                        {s.displayName || s.name || 'Student'}
                      </p>
                      {isWelfare && (
                        <AlertTriangle size={12} className="text-red-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {s.enrollNo && <p className="text-white/30 text-xs font-body">{s.enrollNo}</p>}
                      {hasNote && <MessageSquare size={10} className="text-white/25" />}
                      {hasTime && <Clock size={10} className="text-white/25" />}
                      {rec.minutesLate > 0 && (
                        <span className="text-yellow-400/70 text-[10px] font-body">{rec.minutesLate}m late</span>
                      )}
                    </div>
                  </div>

                  {/* Status chip */}
                  <div className="px-3 py-1.5 rounded-xl font-display font-bold text-xs shrink-0 flex items-center gap-1"
                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                    {cfg.label}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Save button */}
        {students.length > 0 && (
          <button onClick={handleSave} disabled={saving}
            className="w-full mt-5 h-14 rounded-2xl font-display font-bold text-base text-white
                       flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
            {saving
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Save size={18} /> {alreadySubmitted ? 'Update Attendance' : 'Save Attendance'}</>
            }
          </button>
        )}
      </div>

      <BottomNav userType={userType} />

      {/* Per-student status sheet */}
      {activeStudent && (
        <StatusSheet
          student={activeStudent}
          record={attendance[activeStudent.id] || { status: ATTENDANCE_STATUSES.PRESENT }}
          showExtra={showExtra || isAdmin}
          onClose={() => setActiveStudent(null)}
          onSave={updateRecord}
        />
      )}
    </div>
  );
}
