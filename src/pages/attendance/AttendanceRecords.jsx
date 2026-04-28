// src/pages/attendance/TakeAttendance.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, BookOpen, Save, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { adminGetStudents, submitAttendance, getClassAttendance } from '../../services/firestore';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';
import { ATTENDANCE_STATUSES, SUBJECTS } from '../../utils/constants';

const STATUS_CONFIG = {
  [ATTENDANCE_STATUSES.PRESENT]:  { label: 'P', full: 'Present', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  [ATTENDANCE_STATUSES.ABSENT]:   { label: 'A', full: 'Absent',  color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  [ATTENDANCE_STATUSES.LATE]:     { label: 'L', full: 'Late',    color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  [ATTENDANCE_STATUSES.EXCUSED]:  { label: 'E', full: 'Excused', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
};

const CYCLE = [
  ATTENDANCE_STATUSES.PRESENT,
  ATTENDANCE_STATUSES.ABSENT,
  ATTENDANCE_STATUSES.LATE,
  ATTENDANCE_STATUSES.EXCUSED,
];

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export default function TakeAttendance() {
  const { userId, userType } = useAuth();
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [filter, setFilter] = useState({ standard: '', division: '' });
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState(getToday());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  // Load students matching selected class
  useEffect(() => {
    setLoading(true);
    adminGetStudents().then(all => {
      let filtered = all;
      if (filter.standard) filtered = filtered.filter(s => String(s.standard) === String(filter.standard));
      if (filter.division) filtered = filtered.filter(s => s.division?.toUpperCase() === filter.division.toUpperCase());
      setStudents(filtered);
      // Default all to present
      const def = {};
      filtered.forEach(s => { def[s.id] = ATTENDANCE_STATUSES.PRESENT; });
      setAttendance(def);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filter]);

  // Check if already submitted for this date/class
  useEffect(() => {
    if (!filter.standard || !filter.division) { setAlreadySubmitted(false); return; }
    getClassAttendance(date, filter.standard, filter.division).then(existing => {
      setAlreadySubmitted(!!existing);
      if (existing?.records) {
        const map = {};
        existing.records.forEach(r => { map[r.studentId] = r.status; });
        setAttendance(map);
      }
    }).catch(() => {});
  }, [date, filter]);

  const cycleStatus = (studentId) => {
    setAttendance(prev => {
      const current = prev[studentId] || ATTENDANCE_STATUSES.PRESENT;
      const nextIdx = (CYCLE.indexOf(current) + 1) % CYCLE.length;
      return { ...prev, [studentId]: CYCLE[nextIdx] };
    });
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach(s => { updated[s.id] = status; });
    setAttendance(updated);
  };

  const handleSave = async () => {
    if (!filter.standard || !filter.division) {
      toast.error('Please select a class first');
      return;
    }
    if (students.length === 0) {
      toast.error('No students found for this class');
      return;
    }
    setSaving(true);
    try {
      const records = students.map(s => ({
        studentId: s.id,
        studentName: s.displayName || s.name || 'Student',
        status: attendance[s.id] || ATTENDANCE_STATUSES.PRESENT,
      }));
      await submitAttendance({
        date,
        standard: filter.standard,
        division: filter.division,
        subject,
        records,
      });
      toast.success('Attendance saved!');
      setAlreadySubmitted(true);
    } catch (err) {
      toast.error(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    present: Object.values(attendance).filter(s => s === ATTENDANCE_STATUSES.PRESENT).length,
    absent:  Object.values(attendance).filter(s => s === ATTENDANCE_STATUSES.ABSENT).length,
    late:    Object.values(attendance).filter(s => s === ATTENDANCE_STATUSES.LATE).length,
    excused: Object.values(attendance).filter(s => s === ATTENDANCE_STATUSES.EXCUSED).length,
  };

  const standards = [...new Set(students.map(s => s.standard).filter(Boolean))].sort();

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <TopBar title="Take Attendance" showBack />

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-28">
        {/* Filters */}
        <div className="glass-card p-4 mb-4">
          <p className="text-white/50 text-xs font-body font-semibold mb-3">CLASS & DATE</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-white/40 text-xs font-body mb-1 block">Standard</label>
              <input
                className="w-full bg-white/8 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm font-body placeholder-white/25 focus:outline-none focus:border-white/25"
                placeholder="e.g. 5" value={filter.standard}
                onChange={e => setFilter(f => ({ ...f, standard: e.target.value }))} />
            </div>
            <div>
              <label className="text-white/40 text-xs font-body mb-1 block">Division</label>
              <input
                className="w-full bg-white/8 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm font-body placeholder-white/25 focus:outline-none focus:border-white/25"
                placeholder="e.g. A" value={filter.division}
                onChange={e => setFilter(f => ({ ...f, division: e.target.value }))} />
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
              <option value="">Select subject...</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {alreadySubmitted && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
            <AlertCircle size={15} className="text-yellow-400 shrink-0" />
            <p className="text-yellow-400 text-xs font-body">Attendance already submitted for this date. You can edit and re-save to update.</p>
          </div>
        )}

        {/* Stats bar */}
        {students.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {Object.entries(stats).map(([key, val]) => {
              const cfg = STATUS_CONFIG[key];
              return (
                <div key={key} className="glass-card p-2.5 text-center">
                  <p className="font-display font-bold text-base" style={{ color: cfg.color }}>{val}</p>
                  <p className="text-white/40 text-[10px] font-body">{cfg.full}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick mark all */}
        {students.length > 0 && (
          <div className="flex gap-2 mb-4">
            <p className="text-white/40 text-xs font-body flex items-center mr-1">Mark all:</p>
            {CYCLE.map(s => {
              const cfg = STATUS_CONFIG[s];
              return (
                <button key={s} onClick={() => markAll(s)}
                  className="px-3 py-1.5 rounded-xl text-xs font-display font-bold"
                  style={{ background: cfg.bg, color: cfg.color }}>
                  {cfg.full}
                </button>
              );
            })}
          </div>
        )}

        {/* Hint */}
        {students.length > 0 && (
          <p className="text-white/25 text-xs font-body mb-3 text-center">Tap a student to cycle status</p>
        )}

        {/* Student list */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />)}
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
              const status = attendance[s.id] || ATTENDANCE_STATUSES.PRESENT;
              const cfg = STATUS_CONFIG[status];
              return (
                <button key={s.id} onClick={() => cycleStatus(s.id)}
                  className="w-full flex items-center gap-3 p-3.5 glass-card active:scale-[0.98] transition-all text-left">
                  <span className="text-white/30 text-xs font-body w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-display font-medium text-sm truncate">
                      {s.displayName || s.name || 'Student'}
                    </p>
                    {s.enrollNo && <p className="text-white/30 text-xs font-body">{s.enrollNo}</p>}
                  </div>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-sm shrink-0"
                    style={{ background: cfg.bg, color: cfg.color }}>
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
              : <><Save size={18} /> Save Attendance</>
            }
          </button>
        )}
      </div>

      <BottomNav userType={userType} />
    </div>
  );
}
