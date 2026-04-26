// src/pages/TimeTable.jsx
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTimeTable } from '../services/firestore';
import TopBar from '../components/layout/TopBar';
import BottomNav from '../components/layout/BottomNav';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_COLORS = ['#6366f1','#F9C61F','#E84545','#22c55e','#f97316','#8b5cf6'];

// Demo fallback timetable
const DEMO_TT = {
  Monday: [
    { subject: 'Mathematics', time: '8:00 - 9:00', teacher: 'Mr. Chen' },
    { subject: 'English', time: '9:00 - 10:00', teacher: 'Ms. Wong' },
    { subject: 'Science', time: '10:30 - 11:30', teacher: 'Dr. Lee' },
    { subject: 'History', time: '11:30 - 12:30', teacher: 'Mr. Tan' },
    { subject: 'Physical Ed', time: '2:00 - 3:00', teacher: 'Coach Liu' },
  ],
  Tuesday: [
    { subject: 'English', time: '8:00 - 9:00', teacher: 'Ms. Wong' },
    { subject: 'Chemistry', time: '9:00 - 10:00', teacher: 'Dr. Zhao' },
    { subject: 'Mathematics', time: '10:30 - 11:30', teacher: 'Mr. Chen' },
    { subject: 'Art', time: '2:00 - 3:00', teacher: 'Mrs. Park' },
  ],
};

export default function TimeTable() {
  const { userType, userId } = useAuth();
  const [timetable, setTimetable] = useState(null);
  const [activeDay, setActiveDay] = useState(new Date().getDay() || 1);
  const [standard, setStandard] = useState('');
  const [division, setDivision] = useState('');

  const dayIdx = activeDay === 0 ? 0 : activeDay - 1; // mon=0

  useEffect(() => {
    if (standard && division) {
      getTimeTable(standard, division).then(data => {
        setTimetable(data || DEMO_TT);
      }).catch(() => setTimetable(DEMO_TT));
    } else {
      setTimetable(DEMO_TT);
    }
  }, [standard, division]);

  const dayName = DAYS[dayIdx] || 'Monday';
  const classes = timetable?.[dayName] || [];

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <TopBar title="Time Table" showBack />

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-28">
        {/* Filter */}
        <div className="flex gap-2 mb-4">
          <input className="field-dark flex-1 py-2.5 text-sm" placeholder="Class (e.g. 9)"
            value={standard} onChange={e => setStandard(e.target.value)} />
          <input className="field-dark flex-1 py-2.5 text-sm" placeholder="Div (A/B)"
            value={division} onChange={e => setDivision(e.target.value)} />
        </div>

        {/* Day tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 hide-scrollbar">
          {DAYS.map((d, i) => {
            const active = i === dayIdx;
            return (
              <button key={d} onClick={() => setActiveDay(i + 1)}
                className={`flex flex-col items-center px-4 py-2 rounded-xl shrink-0 transition-all
                  ${active ? 'text-navy-900 font-bold' : 'bg-white/5 text-white/50 border border-white/8'}`}
                style={active ? { background: DAY_COLORS[i] } : {}}>
                <span className="text-[11px]">{d.slice(0, 3)}</span>
              </button>
            );
          })}
        </div>

        {/* Classes */}
        <div className="flex flex-col gap-3">
          {classes.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Clock size={32} className="text-white/20" />
              <p className="text-white/30 font-body">No classes for {dayName}</p>
            </div>
          ) : (
            classes.map((cls, i) => (
              <div key={i} className="flex items-center gap-4 p-4 glass-card">
                <div className="text-center shrink-0 min-w-[52px]">
                  <p className="text-xs font-body text-white/40">{cls.time?.split('-')[0]?.trim()}</p>
                  <div className="w-0.5 h-6 mx-auto my-1 rounded-full" style={{ background: DAY_COLORS[dayIdx] }} />
                  <p className="text-xs font-body text-white/40">{cls.time?.split('-')[1]?.trim()}</p>
                </div>
                <div className="flex-1">
                  <p className="text-white font-display font-semibold text-sm">{cls.subject}</p>
                  {cls.teacher && <p className="text-white/40 text-xs font-body mt-0.5">{cls.teacher}</p>}
                  {cls.room && <p className="text-white/30 text-xs font-body">Room {cls.room}</p>}
                </div>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: DAY_COLORS[dayIdx] }} />
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav userType={userType} />
    </div>
  );
}
