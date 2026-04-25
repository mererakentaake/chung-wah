// src/pages/Parenting.jsx  (also used for Health Tips, Vaccinations)
import React, { useState } from 'react';
import { Heart, Stethoscope, Syringe, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/layout/TopBar';
import BottomNav from '../components/layout/BottomNav';

const GUIDES = [
  {
    category: 'Parenting Guide', icon: Heart, color: '#ec4899',
    articles: [
      { title: 'Supporting Your Child Through Exams', body: 'Create a quiet study space, set regular breaks, and encourage healthy sleep habits during exam season.' },
      { title: 'Building Healthy Screen Time Habits', body: 'Set clear boundaries around devices, use parental controls, and model healthy tech behaviour yourself.' },
      { title: 'Encouraging Reading at Home', body: "Read with your child daily, visit libraries, and let them choose books they enjoy to build a love for reading." },
    ]
  },
  {
    category: 'Health Tips', icon: Stethoscope, color: '#ef4444',
    articles: [
      { title: 'Importance of Breakfast for Students', body: 'A nutritious breakfast improves concentration, energy levels, and academic performance.' },
      { title: 'Staying Hydrated at School', body: 'Ensure children carry a water bottle and drink 6-8 glasses of water throughout the day.' },
    ]
  },
  {
    category: 'Vaccinations', icon: Syringe, color: '#3b82f6',
    articles: [
      { title: '2024 School Vaccination Schedule', body: 'Annual flu vaccine recommended for all students. HPV vaccination for students aged 12-13. Check with your school nurse.' },
      { title: 'COVID-19 Booster Update', body: 'Latest guidance on booster doses for school-age children. Consult your healthcare provider.' },
    ]
  },
];

export default function Parenting() {
  const { userType } = useAuth();
  const [selected, setSelected] = useState(null);
  const [activeCategory, setActiveCategory] = useState(0);

  const group = GUIDES[activeCategory];

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <TopBar title="Parent Resource Hub" showBack />
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-28">
        {/* Category tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {GUIDES.map((g, i) => {
            const active = i === activeCategory;
            const Icon = g.icon;
            return (
              <button key={i} onClick={() => setActiveCategory(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl shrink-0 text-xs font-body font-semibold transition-all
                  ${active ? 'text-navy-900' : 'bg-white/5 text-white/50 border border-white/8'}`}
                style={active ? { background: g.color } : {}}>
                <Icon size={14} /> {g.category}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          {group.articles.map((a, i) => {
            const Icon = group.icon;
            return (
              <button key={i} onClick={() => setSelected({ ...a, color: group.color, Icon })}
                className="glass-card p-4 flex items-start gap-3 text-left active:scale-[0.98] transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `${group.color}20` }}>
                  <Icon size={18} style={{ color: group.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-white font-display font-semibold text-sm leading-snug">{a.title}</p>
                  <p className="text-white/40 text-xs font-body mt-1 line-clamp-2">{a.body}</p>
                </div>
                <ChevronRight size={16} className="text-white/25 shrink-0 mt-1" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Article modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end">
          <div className="w-full max-h-[80vh] overflow-y-auto rounded-t-3xl p-6" style={{ background: '#0f1530' }}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <h3 className="font-display font-bold text-white text-lg leading-snug flex-1">{selected.title}</h3>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <X size={16} className="text-white/70" />
              </button>
            </div>
            <p className="text-white/70 font-body leading-relaxed">{selected.body}</p>
          </div>
        </div>
      )}

      <BottomNav userType={userType} />
    </div>
  );
}
