// src/pages/Children.jsx
import React, { useState, useEffect } from 'react';
import { Users, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getChildren, getProfile } from '../services/firestore';
import TopBar from '../components/layout/TopBar';
import BottomNav from '../components/layout/BottomNav';

function ChildCard({ child }) {
  const initials = child.displayName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';
  const colors = ['#F9C61F','#E84545','#8b5cf6','#22c55e','#3b82f6'];
  const color = colors[child.displayName?.charCodeAt(0) % colors.length || 0];
  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-bold text-xl text-white shrink-0"
        style={{ background: `${color}30`, color }}>
        {initials}
      </div>
      <div className="flex-1">
        <p className="text-white font-display font-semibold">{child.displayName || 'Student'}</p>
        <p className="text-white/40 text-sm font-body">
          {child.standard && child.division ? `Std ${child.standard} – ${child.division}` : ''}
        </p>
        {child.enrollNo && <p className="text-white/30 text-xs font-body mt-0.5">ID: {child.enrollNo}</p>}
      </div>
      <div className="w-2 h-2 rounded-full bg-emerald-400" />
    </div>
  );
}

export default function Children() {
  const { userType, userId } = useAuth();
  const [children, setChildren] = useState([]);

  useEffect(() => {
    getProfile(userId).then(profile => {
      if (profile?.childIds) {
        getChildren(profile.childIds).then(setChildren);
      }
    });
  }, [userId]);

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <TopBar title="Children / Students" showBack />
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-28">
        {children.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <Users size={28} className="text-white/20" />
            </div>
            <p className="text-white/30 font-body">No children linked to this account</p>
            <p className="text-white/20 text-sm font-body">Contact your school administrator to link accounts</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {children.map(c => <ChildCard key={c.id} child={c} />)}
          </div>
        )}
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
