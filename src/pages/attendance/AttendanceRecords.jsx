// src/pages/attendance/AttendanceRecords.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, TrendingDown, Calendar, BarChart3, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getStudentAttendance, getProfile } from '../../services/firestore';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';
import {
  ATTENDANCE_STATUS_CONFIG, ATTENDANCE_STATUSES,
  WELFARE_STATUSES,
} from '../../utils/constants';

// Format ISO date string to readable
function fmtDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
}

// Group records by month label
function groupByMonth(records) {
  const groups = {};
  records.forEach(r => {
    if (!r.date) return;
    const [y, m] = r.date.split('-');
    const label = new Date(parseInt(y), parseInt(m) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!groups[label]) groups[label] = [];
    groups[label].push(r);
  });
  return groups;
}

// ─── Summary Stats Component ─────────────────────────────────────────────────
function SummaryStats({ records, standard, division }) {
  const stats = useMemo(() => {
    const total = records.length;
    if (total === 0) return null;

    const counts = {};
    let lateDays = 0;
    let welfareDays = 0;

    records.forEach(r => {
      const s = r.status || ATTENDANCE_STATUSES.PRESENT;
      counts[s] = (counts[s] || 0) + 1;
      if (s === ATTENDANCE_STATUSES.LATE) lateDays++;
      if (WELFARE_STATUSES.includes(s)) welfareDays++;
    });

    const presentLike = (counts[ATTENDANCE_STATUSES.PRESENT] || 0)
      + (counts[ATTENDANCE_STATUSES.ONLINE_PRESENT] || 0)
      + (counts[ATTENDANCE_STATUSES.PARTIAL] || 0);
    const pct = Math.round((presentLike / total) * 100);

    // Most frequent absence reason
    const absenceCounts = {};
    records.forEach(r => {
      if (r.status && r.status !== ATTENDANCE_STATUSES.PRESENT) {
        absenceCounts[r.status] = (absenceCounts[r.status] || 0) + 1;
      }
    });
    const topAbsence = Object.entries(absenceCounts).sort((a, b) => b[1] - a[1])[0];

    return { total, presentLike, pct, counts, lateDays, welfareDays, topAbsence };
  }, [records]);

  if (!stats) return null;

  const alerts = [];
  if (stats.welfareDays >= 3) {
    alerts.push(`${stats.welfareDays} unexplained or concerning absences this period.`);
  }
  if (stats.lateDays >= 3) {
    alerts.push(`Arrived late ${stats.lateDays} times this period.`);
  }

  return (
    <div className="mb-4">
      {/* Class label */}
      {standard && division && (
        <p className="font-display font-extrabold text-white text-center text-lg mb-3 tracking-wide">
          STANDARD {standard} {division}
        </p>
      )}

      {/* Attendance % card */}
      <div className="glass-card p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-white/40" />
            <p className="text-white/50 text-xs font-body font-semibold">Attendance Rate</p>
          </div>
          <p className="font-display font-bold text-2xl"
            style={{ color: stats.pct >= 80 ? '#22c55e' : stats.pct >= 60 ? '#f59e0b' : '#ef4444' }}>
            {stats.pct}%
          </p>
        </div>
        {/* Progress bar */}
        <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-3">
          <div className="h-full rounded-full transition-all"
            style={{
              width: `${stats.pct}%`,
              background: stats.pct >= 80 ? '#22c55e' : stats.pct >= 60 ? '#f59e0b' : '#ef4444',
            }} />
        </div>
        <div className="flex items-center justify-between text-xs font-body">
          <span className="text-white/40">{stats.presentLike} of {stats.total} days present</span>
          {stats.pct < 80 && (
            <span className="text-yellow-400 font-semibold">Below 80% threshold</span>
          )}
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="glass-card p-3 text-center">
          <p className="font-display font-bold text-lg text-white">{stats.total}</p>
          <p className="text-white/40 text-[10px] font-body">Total Days</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="font-display font-bold text-lg" style={{ color: '#22c55e' }}>{stats.presentLike}</p>
          <p className="text-white/40 text-[10px] font-body">Days Present</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="font-display font-bold text-lg" style={{ color: '#ef4444' }}>
            {stats.counts[ATTENDANCE_STATUSES.ABSENT] || 0}
          </p>
          <p className="text-white/40 text-[10px] font-body">Absences</p>
        </div>
      </div>

      {/* Most frequent absence */}
      {stats.topAbsence && (
        <div className="glass-card p-3 mb-3 flex items-center gap-3">
          <TrendingDown size={15} className="text-white/40 shrink-0" />
          <div>
            <p className="text-white/40 text-[10px] font-body">Most Frequent Status (non-present)</p>
            <div className="flex items-center gap-2 mt-0.5">
              {(() => {
                const cfg = ATTENDANCE_STATUS_CONFIG[stats.topAbsence[0]];
                return cfg ? (
                  <span className="px-2 py-0.5 rounded-lg text-xs font-display font-bold"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.full}
                  </span>
                ) : null;
              })()}
              <span className="text-white/60 text-xs font-body">{stats.topAbsence[1]}×</span>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-red-400" />
            <p className="text-red-400 text-xs font-body font-semibold">Attention Required</p>
          </div>
          {alerts.map((a, i) => (
            <p key={i} className="text-red-300/70 text-xs font-body">{a}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── History Record Row ───────────────────────────────────────────────────────
function RecordRow({ record }) {
  const cfg = ATTENDANCE_STATUS_CONFIG[record.status] || ATTENDANCE_STATUS_CONFIG[ATTENDANCE_STATUSES.PRESENT];
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/6 last:border-0">
      <div className="mt-0.5 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-white/80 text-sm font-body">{fmtDate(record.date)}</p>
          <span className="px-2 py-0.5 rounded-lg text-[11px] font-display font-bold shrink-0"
            style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.full}
          </span>
        </div>
        {record.subject && (
          <p className="text-white/30 text-xs font-body mt-0.5">{record.subject}</p>
        )}
        {record.minutesLate > 0 && (
          <p className="text-yellow-400/70 text-xs font-body flex items-center gap-1 mt-0.5">
            <Clock size={10} /> {record.minutesLate} min late
          </p>
        )}
        {(record.checkInTime || record.checkOutTime) && (
          <p className="text-white/30 text-xs font-body mt-0.5">
            {record.checkInTime && `In: ${record.checkInTime}`}
            {record.checkInTime && record.checkOutTime && ' · '}
            {record.checkOutTime && `Out: ${record.checkOutTime}`}
          </p>
        )}
        {record.note && (
          <p className="text-white/40 text-xs font-body italic mt-0.5">"{record.note}"</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AttendanceRecords() {
  const { userId, userType } = useAuth();
  const [records,  setRecords]  = useState([]);
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [view,     setView]     = useState('monthly'); // monthly | weekly

  useEffect(() => {
    if (!userId) return;
    // Load profile to get standard/division
    getProfile(userId).then(setProfile).catch(() => {});
    // Live attendance listener
    const unsub = getStudentAttendance(userId, data => {
      setRecords(data);
      setLoading(false);
    });
    return unsub;
  }, [userId]);

  const grouped = useMemo(() => groupByMonth(records), [records]);

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <TopBar title="My Attendance" />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        {/* Centered page title */}
        <h2 className="text-white font-display font-extrabold text-xl text-center mb-4">
          My Attendance
        </h2>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : (
          <>
            <SummaryStats
              records={records}
              standard={profile?.standard}
              division={profile?.division}
            />

            {/* History */}
            {Object.keys(grouped).length === 0 ? (
              <div className="text-center py-12">
                <Calendar size={32} className="text-white/20 mx-auto mb-3" />
                <p className="text-white/30 font-body">No attendance records yet</p>
              </div>
            ) : (
              Object.entries(grouped).map(([month, recs]) => (
                <div key={month} className="mb-4">
                  <p className="text-white/40 text-xs font-body font-semibold uppercase tracking-wider mb-2">
                    {month}
                  </p>
                  <div className="glass-card px-4 py-1">
                    {recs.map(r => <RecordRow key={r.id} record={r} />)}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      <BottomNav userType={userType} />
    </div>
  );
}
