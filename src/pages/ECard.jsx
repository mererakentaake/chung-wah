// src/pages/ECard.jsx
import React, { useEffect, useState } from 'react';
import { CreditCard, GraduationCap, School } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getProfile } from '../services/firestore';
import TopBar from '../components/layout/TopBar';
import BottomNav from '../components/layout/BottomNav';

export default function ECard() {
  const { userType, userId, user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (userId) getProfile(userId).then(setProfile);
  }, [userId]);

  const schoolCode = localStorage.getItem('schoolCode') || 'SCHOOL';

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <TopBar title="E-Card" showBack />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 flex flex-col items-center">

        {/* Card */}
        <div className="w-full max-w-sm relative mt-4">
          {/* Card background */}
          <div className="relative w-full rounded-3xl overflow-hidden p-6 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #0f0e2e 40%, #1a0a0a 100%)',
              border: '1px solid rgba(249,198,31,0.25)'
            }}>
            {/* Decorative circles */}
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, #F9C61F 0%, transparent 70%)' }} />
            <div className="absolute -left-4 -bottom-8 w-32 h-32 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #E84545 0%, transparent 70%)' }} />

            {/* Logo row */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-coral-500 flex items-center justify-center">
                  <School size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-display font-bold text-sm leading-tight">Chung Wah</p>
                  <p className="text-white/40 text-[10px] font-body">E-School</p>
                </div>
              </div>
              <span className="text-[10px] font-body font-semibold px-2 py-1 rounded-full border border-gold-500/30 text-gold-400">
                {userType}
              </span>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-gold-500/30 shrink-0">
                {profile?.photoUrl && profile.photoUrl !== 'default' ? (
                  <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gold-500/30 to-coral-500/30 flex items-center justify-center">
                    <GraduationCap size={28} className="text-white/60" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-white font-display font-bold text-lg">{profile?.displayName || 'Student Name'}</p>
                {profile?.standard && (
                  <p className="text-white/60 text-sm font-body">Std {profile.standard}{profile.division}</p>
                )}
                {profile?.enrollNo && (
                  <p className="text-white/40 text-xs font-body mt-0.5">ID: {profile.enrollNo}</p>
                )}
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'School Code', value: schoolCode },
                { label: 'Blood Group', value: profile?.bloodGroup || '—' },
                { label: 'Guardian', value: profile?.guardianName || '—' },
                { label: 'Mobile', value: profile?.mobileNo || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/5 rounded-xl p-2.5">
                  <p className="text-white/30 text-[10px] font-body">{label}</p>
                  <p className="text-white text-xs font-body font-semibold mt-0.5 truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* Bottom strip */}
            <div className="h-1 rounded-full w-full" style={{ background: 'linear-gradient(90deg, #F9C61F, #E84545, #8b5cf6)' }} />
          </div>
        </div>

        <p className="text-white/30 text-xs font-body mt-4 text-center">
          Present this card for school identification
        </p>
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
