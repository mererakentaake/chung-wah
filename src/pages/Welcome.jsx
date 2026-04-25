// src/pages/Welcome.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, GraduationCap, BookOpen, Heart } from 'lucide-react';
import { ROUTES } from '../utils/constants';

const slides = [
  {
    color: '#F9C61F',
    gradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
    icon: GraduationCap,
    emoji: '🎓',
    role: 'Teachers',
    title: 'Empower Your\nClassroom',
    description: 'Create announcements, manage assignments and keep students & parents updated in real time.',
    illustration: (
      <div className="relative w-56 h-56 mx-auto">
        <div className="absolute inset-0 rounded-full bg-yellow-400/10 animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-yellow-400/15" />
        <div className="absolute inset-8 rounded-full bg-yellow-400/20 flex items-center justify-center">
          <GraduationCap size={72} className="text-yellow-400 drop-shadow-lg" />
        </div>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="absolute w-3 h-3 rounded-full bg-yellow-400/50"
            style={{
              top: `${50 - 46 * Math.sin(i * Math.PI / 2)}%`,
              left: `${50 + 46 * Math.cos(i * Math.PI / 2)}%`,
              animation: `orbit 6s linear ${i * 1.5}s infinite`,
            }} />
        ))}
      </div>
    ),
  },
  {
    color: '#F4A334',
    gradient: 'from-orange-500/20 via-amber-500/10 to-transparent',
    icon: BookOpen,
    emoji: '📚',
    role: 'Students',
    title: 'Learn Without\nLimits',
    description: 'Access timetables, take quizzes, submit assignments and stay on top of school news.',
    illustration: (
      <div className="relative w-56 h-56 mx-auto">
        <div className="absolute inset-0 rounded-full bg-orange-400/10 animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-orange-400/15" />
        <div className="absolute inset-8 rounded-full bg-orange-400/20 flex items-center justify-center">
          <BookOpen size={72} className="text-orange-400 drop-shadow-lg" />
        </div>
        {[0, 1, 2].map(i => (
          <div key={i} className="absolute w-2.5 h-2.5 rounded-full bg-orange-400/60"
            style={{
              top: `${50 - 48 * Math.sin(i * (2 * Math.PI / 3))}%`,
              left: `${50 + 48 * Math.cos(i * (2 * Math.PI / 3))}%`,
              animation: `orbit 5s linear ${i * 1.7}s infinite reverse`,
            }} />
        ))}
      </div>
    ),
  },
  {
    color: '#E84545',
    gradient: 'from-red-500/20 via-rose-500/10 to-transparent',
    icon: Heart,
    emoji: '👨‍👩‍👧',
    role: 'Parents',
    title: 'Stay Connected\nWith Your Child',
    description: "Monitor your child's progress, communicate with teachers and never miss a school event.",
    illustration: (
      <div className="relative w-56 h-56 mx-auto">
        <div className="absolute inset-0 rounded-full bg-red-400/10 animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-red-400/15" />
        <div className="absolute inset-8 rounded-full bg-red-400/20 flex items-center justify-center">
          <Heart size={72} className="text-red-400 drop-shadow-lg" />
        </div>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="absolute w-2 h-2 rounded-full bg-red-400/50"
            style={{
              top: `${50 - 47 * Math.sin(i * (2 * Math.PI / 5))}%`,
              left: `${50 + 47 * Math.cos(i * (2 * Math.PI / 5))}%`,
              animation: `orbit 7s linear ${i * 1.4}s infinite`,
            }} />
        ))}
      </div>
    ),
  },
];

export default function Welcome() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const slide = slides[current];

  const next = () => {
    if (current < slides.length - 1) setCurrent(c => c + 1);
    else navigate(ROUTES.LOGIN);
  };
  const prev = () => { if (current > 0) setCurrent(c => c - 1); };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: '#0A0F2C' }}>
      {/* Background glow */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${slide.color}18 0%, transparent 60%)` }}
      />

      {/* Top bar with school crest */}
      <div className="relative flex items-center justify-between px-6 pt-12 pb-4">
        <div className="flex items-center gap-2.5">
          <img
            src="/school-crest.png"
            alt="Chung Wah School"
            className="w-9 h-9 object-contain"
          />
          <div>
            <p className="font-display font-bold text-white text-sm leading-tight">Chung Wah</p>
            <p className="text-white/40 text-xs font-body leading-tight">E-School</p>
          </div>
        </div>
        {current < slides.length - 1 && (
          <button
            onClick={() => navigate(ROUTES.LOGIN)}
            className="text-white/40 text-sm font-body hover:text-white/70 transition-colors"
          >
            Skip
          </button>
        )}
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 gap-8">
        <div className="animate-float">{slide.illustration}</div>

        <div className="text-center animate-fade-in" key={current}>
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-xs font-body font-semibold"
            style={{ background: `${slide.color}22`, color: slide.color }}
          >
            <span>{slide.emoji}</span>
            <span>{slide.role}</span>
          </div>
          <h2 className="font-display font-extrabold text-white text-3xl leading-tight mb-3 whitespace-pre-line">
            {slide.title}
          </h2>
          <p className="text-white/50 font-body text-base leading-relaxed max-w-xs mx-auto">
            {slide.description}
          </p>
        </div>

        {/* Dots */}
        <div className="flex gap-2">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: i === current ? 24 : 8,
                height: 8,
                background: i === current ? slide.color : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="relative flex items-center gap-4 px-6 pb-12 pt-4">
        {current > 0 && (
          <button
            onClick={prev}
            className="w-12 h-12 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center
                       hover:bg-white/12 active:scale-95 transition-all shrink-0"
          >
            <ChevronRight size={20} className="text-white rotate-180" />
          </button>
        )}
        <button
          onClick={next}
          className="flex-1 h-14 rounded-2xl font-display font-bold text-base text-navy-900
                     flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-glow-gold"
          style={{ background: `linear-gradient(135deg, ${slide.color}, ${slides[(current + 1) % slides.length].color})` }}
        >
          {current < slides.length - 1 ? <>Next <ChevronRight size={18} /></> : <>Get Started <ChevronRight size={18} /></>}
        </button>
      </div>

      <style>{`
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(0) rotate(0deg); }
          to { transform: rotate(360deg) translateX(0) rotate(-360deg); }
        }
      `}</style>
    </div>
  );
}
