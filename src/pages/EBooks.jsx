// src/pages/EBooks.jsx
import React from 'react';
import { BookOpen, Download, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/layout/TopBar';
import BottomNav from '../components/layout/BottomNav';

const DEMO_BOOKS = [
  { id: '1', title: 'Mathematics Form 4', subject: 'Mathematics', grade: 'Form 4', fileUrl: '#', cover: null },
  { id: '2', title: 'Science Form 3', subject: 'Science', grade: 'Form 3', fileUrl: '#', cover: null },
  { id: '3', title: 'English Language Arts', subject: 'English', grade: 'All', fileUrl: '#', cover: null },
  { id: '4', title: 'History of Malaysia', subject: 'History', grade: 'Form 5', fileUrl: '#', cover: null },
];

const SUBJECT_COLORS = {
  Mathematics: '#6366f1', Science: '#22c55e', English: '#3b82f6',
  History: '#f97316', Default: '#8b5cf6'
};

export default function EBooks() {
  const { userType } = useAuth();
  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <TopBar title="E-Library" showBack />
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-28">
        <div className="grid grid-cols-2 gap-3">
          {DEMO_BOOKS.map(b => {
            const color = SUBJECT_COLORS[b.subject] || SUBJECT_COLORS.Default;
            return (
              <div key={b.id} className="glass-card p-4 flex flex-col gap-3">
                {/* Cover */}
                <div className="w-full aspect-[3/4] rounded-xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${color}30, ${color}10)` }}>
                  <BookOpen size={36} style={{ color }} />
                </div>
                <div>
                  <p className="text-white font-display font-semibold text-sm leading-tight">{b.title}</p>
                  <p className="text-white/40 text-xs font-body mt-0.5">{b.grade}</p>
                </div>
                <a href={b.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 h-8 rounded-xl text-xs font-body font-semibold transition-all"
                  style={{ background: `${color}20`, color }}>
                  <Download size={13} /> Open
                </a>
              </div>
            );
          })}
        </div>
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
