// src/pages/Children.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, CheckCircle, XCircle, ClipboardList, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getParentGuardianLinks, adminGetStudents, getStudentFees, getStudentAttendance } from '../services/firestore';
import TopBar from '../components/layout/TopBar';
import BottomNav from '../components/layout/BottomNav';
import { USER_TYPES, ROUTES } from '../utils/constants';

function AttendanceMiniBar({ studentId }) {
  const [records, setRecords] = useState([]);
  useEffect(() => {
    const unsub = getStudentAttendance(studentId, setRecords);
    return unsub;
  }, [studentId]);

  const last10      = records.slice(0, 10).reverse();
  const presentCount = records.filter(r => r.status === 'present').length;
  const pct          = records.length > 0 ? Math.round((presentCount / records.length) * 100) : null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-gray-400 text-xs font-body">Recent Attendance</p>
        {pct !== null && (
          <span className={"text-xs font-display font-bold " + (pct >= 80 ? 'text-emerald-500' : pct >= 60 ? 'text-yellow-500' : 'text-red-500')}>
            {pct}%
          </span>
        )}
      </div>
      <div className="flex gap-1">
        {last10.length === 0 && <p className="text-gray-300 text-xs font-body">No records yet</p>}
        {last10.map((r, i) => (
          <div key={i} className={"w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-bold " +
            (r.status === 'present' ? 'bg-emerald-100 text-emerald-600'
              : r.status === 'late' ? 'bg-yellow-100 text-yellow-600'
              : r.status === 'excused' ? 'bg-blue-100 text-blue-600'
              : 'bg-red-100 text-red-500')}>
            {r.status === 'present' ? 'P' : r.status === 'late' ? 'L' : r.status === 'excused' ? 'E' : 'A'}
          </div>
        ))}
      </div>
    </div>
  );
}

function FeeMiniStatus({ studentId }) {
  const [fees, setFees] = useState([]);
  useEffect(() => {
    const unsub = getStudentFees(studentId, setFees);
    return unsub;
  }, [studentId]);

  const totalAmount = fees.reduce((s, f) => s + (f.amount || 0), 0);
  const totalPaid   = fees.reduce((s, f) => s + (f.totalPaid || 0), 0);
  const balance     = totalAmount - totalPaid;
  if (fees.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mt-2">
      <DollarSign size={12} className="text-yellow-500 shrink-0" />
      <span className="text-gray-500 text-xs font-body">
        Fees:{" "}
        <span className={balance > 0 ? 'text-red-500 font-semibold' : 'text-emerald-600 font-semibold'}>
          {balance > 0 ? "RM " + balance.toFixed(2) + " outstanding" : "All paid"}
        </span>
      </span>
    </div>
  );
}

function ChildCard({ link, studentData }) {
  const navigate = useNavigate();
  const isPending   = link.status === 'pending';
  const isConfirmed = link.status === 'confirmed';
  const isRejected  = link.status === 'rejected';

  const name     = link.studentName || (studentData && studentData.displayName) || 'Student';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const palette  = ['#F9C61F', '#E84545', '#8b5cf6', '#22c55e', '#3b82f6'];
  const color    = palette[name.charCodeAt(0) % palette.length];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-bold text-xl shrink-0"
          style={{ background: color + "18", color }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-800 font-display font-semibold">{name}</p>
          {studentData && studentData.standard ? (
            <p className="text-gray-400 text-sm font-body">Std {studentData.standard} – {studentData.division}</p>
          ) : link.studentClass ? (
            <p className="text-gray-400 text-sm font-body">{link.studentClass}</p>
          ) : null}

          {isPending && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Clock size={12} className="text-yellow-500" />
              <span className="text-yellow-600 text-xs font-body font-semibold">Awaiting student confirmation</span>
            </div>
          )}
          {isConfirmed && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <CheckCircle size={12} className="text-emerald-500" />
              <span className="text-emerald-600 text-xs font-body font-semibold">Confirmed</span>
            </div>
          )}
          {isRejected && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <XCircle size={12} className="text-red-400" />
              <span className="text-red-500 text-xs font-body font-semibold">Declined by student</span>
            </div>
          )}
        </div>
      </div>

      {isConfirmed && studentData && (
        <>
          <FeeMiniStatus studentId={link.studentDocId} />
          <AttendanceMiniBar studentId={link.studentDocId} />
          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => navigate(ROUTES.ATTENDANCE_RECORDS + "?studentId=" + link.studentDocId + "&name=" + encodeURIComponent(name))}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-display font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <ClipboardList size={13} /> Attendance
            </button>
            <button
              onClick={() => navigate(ROUTES.FEES + "?studentId=" + link.studentDocId)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-display font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors">
              <DollarSign size={13} /> Fees
            </button>
          </div>
        </>
      )}

      {isPending && (
        <p className="text-gray-400 text-xs font-body mt-3 pt-2 border-t border-gray-100 leading-relaxed">
          The student must log in and confirm this relationship before you can view their profile.
        </p>
      )}
    </div>
  );
}

export default function Children() {
  const { userType, userId } = useAuth();
  const [links, setLinks]     = useState([]);
  const [students, setStudents] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    const unsub = getParentGuardianLinks(userId, async newLinks => {
      setLinks(newLinks);
      const confirmedIds = newLinks.filter(l => l.status === 'confirmed' && l.studentDocId).map(l => l.studentDocId);
      if (confirmedIds.length > 0) {
        try {
          const all = await adminGetStudents();
          const map = {};
          all.forEach(s => { if (confirmedIds.includes(s.id)) map[s.id] = s; });
          setStudents(map);
        } catch {}
      }
      setLoading(false);
    });
    return unsub;
  }, [userId]);

  const confirmed = links.filter(l => l.status === 'confirmed');
  const pending   = links.filter(l => l.status === 'pending');
  const rejected  = links.filter(l => l.status === 'rejected');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title={userType === USER_TYPES.TEACHER ? 'Linked Students' : 'My Children'} showBack />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2].map(i => <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : links.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Users size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-400 font-body">No children linked to this account</p>
            <p className="text-gray-300 text-sm font-body">Contact your school administrator to link accounts</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 text-xs font-body flex-wrap">
              {confirmed.length > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  {confirmed.length} confirmed
                </span>
              )}
              {pending.length > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 font-semibold">
                  {pending.length} pending
                </span>
              )}
            </div>
            {confirmed.map(l => <ChildCard key={l.id} link={l} studentData={students[l.studentDocId]} />)}
            {pending.map(l =>   <ChildCard key={l.id} link={l} studentData={null} />)}
            {rejected.map(l =>  <ChildCard key={l.id} link={l} studentData={null} />)}
          </div>
        )}
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
