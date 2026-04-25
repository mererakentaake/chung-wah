// src/pages/Holidays.jsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getHolidays } from '../services/firestore';
import TopBar from '../components/layout/TopBar';
import BottomNav from '../components/layout/BottomNav';

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const MONTH_COLORS = [
  '#E84545','#F97316','#F59E0B','#22C55E','#06B6D4','#3B82F6',
  '#8B5CF6','#EC4899','#14B8A6','#F97316','#84CC16','#F43F5E'
];

export default function Holidays() {
  const { userType } = useAuth();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [holidays, setHolidays] = useState([]);
  const color = MONTH_COLORS[month];

  useEffect(() => {
    getHolidays(year, month + 1).then(setHolidays).catch(() => setHolidays([]));
  }, [year, month]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const holidayDays = new Set(holidays.map(h => h.day));

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <TopBar title="Holidays" showBack />

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-28">
        {/* Month navigator */}
        <div className="glass-card p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center">
              <ChevronLeft size={18} className="text-white/70" />
            </button>
            <div className="text-center">
              <p className="font-display font-bold text-white text-lg">{MONTHS[month]}</p>
              <p className="text-white/40 text-sm font-body">{year}</p>
            </div>
            <button onClick={nextMonth} className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center">
              <ChevronRight size={18} className="text-white/70" />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[11px] font-body font-semibold text-white/30 py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const day = i + 1;
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const isHoliday = holidayDays.has(day);
              const isSunday = new Date(year, month, day).getDay() === 0;
              return (
                <div key={day}
                  className={`aspect-square flex items-center justify-center rounded-xl text-sm font-body font-medium transition-all
                    ${isToday ? 'text-navy-900 font-bold' : ''}
                    ${isHoliday ? 'ring-2' : ''}
                    ${isSunday && !isToday && !isHoliday ? 'text-coral-400/60' : ''}
                    ${!isToday && !isHoliday && !isSunday ? 'text-white/70' : ''}
                  `}
                  style={{
                    background: isToday ? color : isHoliday ? `${color}25` : undefined,
                    color: isToday ? '#0A0F2C' : isHoliday ? color : undefined,
                    ringColor: isHoliday ? color : undefined,
                  }}>
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* Holiday list */}
        {holidays.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-white/50 text-xs font-body font-semibold mb-1 uppercase tracking-wide">
              {MONTHS[month]} Holidays
            </p>
            {holidays.map(h => (
              <div key={h.id} className="flex items-center gap-3 p-3 rounded-2xl glass-card">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-lg"
                  style={{ background: `${color}20`, color }}>
                  {h.day}
                </div>
                <div>
                  <p className="text-white font-display font-semibold text-sm">{h.name || 'Holiday'}</p>
                  <p className="text-white/40 text-xs font-body">{MONTHS[month]} {h.day}, {year}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Calendar size={32} className="text-white/20" />
            <p className="text-white/30 font-body text-sm">No holidays listed for {MONTHS[month]}</p>
          </div>
        )}
      </div>

      <BottomNav userType={userType} />
    </div>
  );
}
