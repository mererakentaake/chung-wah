// src/pages/attendance/AttendanceRecords.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardList, CheckCircle, XCircle, Clock, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getStudentAttendance, getParentGuardianLinks, adminGetStudents } from '../../services/firestore';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';
import { USER_TYPES, ATTENDANCE_STATUSES } from '../../utils/constants';

const STATUS_CONFIG = {
  [ATTENDANCE_STATUSES.PRESENT]: { label: 'Present', color: '#22c55e', bgClass: 'bg-emerald-50',  icon: CheckCircle },
  [ATTENDANCE_STATUSES.ABSENT]:  { label: 'Absent',  color: '#ef4444', bgClass: 'bg-red-50',      icon: XCircle },
  [ATTENDANCE_STATUSES.LATE]:    { label: 'Late',    color: '#f59e0b', bgClass: 'bg-yellow-50',   icon: Clock },
  [ATTENDANCE_STATUSES.EXCUSED]: { label: 'Excused', color: '#3b82f6', bgClass: 'bg-blue-50',     icon: BookOpen },
};

function RecordsList({ studentId, studentName }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    const unsub = getStudentAttendance(studentId, data => { setRecords(data); setLoading(false); });
    return unsub;
  }, [studentId]);

  const presentCount = records.filter(r => r.status === ATTENDANCE_STATUSES.PRESENT).length;
  const absentCount  = records.filter(r => r.status === ATTENDANCE_STATUSES.ABSENT).length;
  const lateCount    = records.filter(r => r.status === ATTENDANCE_STATUSES.LATE).length;
  const pct = records.length > 0 ? Math.round((presentCount / records.length) * 100) : null;

  if (loading) return (
    <div className="flex flex-col gap-3">
      {[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />)}
    </div>
  );

  if (records.length === 0) return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
        <ClipboardList size={24} className="text-gray-300" />
      </div>
      <p className="text-gray-400 font-body">No attendance records yet</p>
      <p className="text-gray-300 text-xs font-body">Records appear once your teacher marks roll-call</p>
    </div>
  );

  return (
    <>
      {studentName && (
        <p className="text-gray-500 text-sm font-body mb-3">{studentName}</p>
      )}

      {/* Summary card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider">Summary</p>
          {pct !== null && (
            <span className={`text-xl font-display font-bold ${pct >= 80 ? 'text-emerald-500' : pct >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
              {pct}%
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Present', value: presentCount, color: '#22c55e', bg: 'bg-emerald-50' },
            { label: 'Absent',  value: absentCount,  color: '#ef4444', bg: 'bg-red-50' },
            { label: 'Late',    value: lateCount,    color: '#f59e0b', bg: 'bg-yellow-50' },
          ].map(item => (
            <div key={item.label} className={`text-center p-2 rounded-xl ${item.bg}`}>
              <p className="font-display font-bold text-xl" style={{ color: item.color }}>{item.value}</p>
              <p className="text-gray-500 text-xs font-body">{item.label}</p>
            </div>
          ))}
        </div>
        {pct !== null && (
          <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444',
              }} />
          </div>
        )}
      </div>

      {/* Records list */}
      <div className="flex flex-col gap-2">
        {records.map(r => {
          const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG[ATTENDANCE_STATUSES.ABSENT];
          const Icon = cfg.icon;
          return (
            <div key={r.id} className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bgClass}`}>
                <Icon size={17} style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 font-display font-medium text-sm">{r.date}</p>
                {r.subject && <p className="text-gray-400 text-xs font-body">{r.subject}</p>}
              </div>
              <span className="text-xs font-body font-semibold px-2 py-1 rounded-lg"
                style={{ background: `${cfg.color}14`, color: cfg.color }}>
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function AttendanceRecords() {
  const { userType, userId } = useAuth();
  const [searchParams] = useSearchParams();
  const [children, setChildren]             = useState([]);
  const [selectedChild, setSelectedChild]   = useState(null);
  const [loadingChildren, setLoadingChildren] = useState(false);

  const isParent  = userType === USER_TYPES.PARENT;
  const isStudent = userType === USER_TYPES.STUDENT;
  const paramStudentId = searchParams.get('studentId');
  const paramName      = searchParams.get('name');

  useEffect(() => {
    if (!isParent || !userId) return;
    if (paramStudentId) { setSelectedChild({ id: paramStudentId, name: paramName || 'Student' }); return; }
    setLoadingChildren(true);
    const unsub = getParentGuardianLinks(userId, async links => {
      const confirmed = links.filter(l => l.status === 'confirmed');
      if (confirmed.length > 0) {
        try {
          const all = await adminGetStudents();
          const mapped = confirmed.map(l => {
            const data = all.find(s => s.id === l.studentDocId);
            return { id: l.studentDocId, name: l.studentName, data };
          }).filter(c => c.id);
          setChildren(mapped);
          if (mapped.length > 0) setSelectedChild(mapped[0]);
        } catch {}
      }
      setLoadingChildren(false);
    });
    return unsub;
  }, [isParent, userId, paramStudentId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title={isStudent ? 'My Attendance' : 'Attendance Records'} showBack />

      {/* Child selector for parents with multiple children */}
      {isParent && children.length > 1 && !paramStudentId && (
        <div className="flex gap-2 px-4 pt-3 overflow-x-auto">
          {children.map(c => (
            <button key={c.id} onClick={() => setSelectedChild(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-display font-semibold whitespace-nowrap transition-all ${
                selectedChild?.id === c.id
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-500'
              }`}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        {isStudent && <RecordsList studentId={userId} />}
        {isParent && (
          loadingChildren ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : selectedChild ? (
            <RecordsList studentId={selectedChild.id} studentName={selectedChild.name} />
          ) : (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <ClipboardList size={32} className="text-gray-300" />
              <p className="text-gray-400 font-body">No linked children found</p>
            </div>
          )
        )}
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
