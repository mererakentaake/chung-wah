// src/pages/ECard.jsx
import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  GraduationCap, School, Droplet, Phone, Calendar,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getProfile, getParentGuardianLinks, adminGetStudents
} from '../services/firestore';
import { USER_TYPES } from '../utils/constants';
import TopBar from '../components/layout/TopBar';
import BottomNav from '../components/layout/BottomNav';

function formatDob(dob) {
  if (!dob) return '—';
  try {
    return new Date(dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dob;
  }
}

function IdCard({ profile, studentId }) {
  const qrPayload = JSON.stringify({
    id: studentId,
    enrollNo: profile?.enrollNo || '',
    name: profile?.displayName || '',
    schoolClass: profile?.schoolClass || '',
  });

  return (
    <div className="w-full max-w-sm relative">
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
        <div className="flex items-center justify-between mb-5 relative">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-red-500 flex items-center justify-center">
              <School size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-display font-bold text-sm leading-tight">Chung Wah</p>
              <p className="text-white/40 text-[10px] font-body">E-School Student ID</p>
            </div>
          </div>
          <span className="text-[10px] font-body font-semibold px-2 py-1 rounded-full border border-yellow-500/30 text-yellow-400">
            STUDENT
          </span>
        </div>

        {/* Avatar + name */}
        <div className="flex items-center gap-4 mb-5 relative">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-yellow-500/30 shrink-0">
            {profile?.photoUrl && profile.photoUrl !== 'default' ? (
              <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-yellow-500/30 to-red-500/30 flex items-center justify-center">
                <GraduationCap size={28} className="text-white/60" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white font-display font-bold text-lg leading-tight truncate">
              {profile?.displayName || 'Student Name'}
            </p>
            {profile?.schoolClass && (
              <p className="text-white/60 text-sm font-body mt-0.5">{profile.schoolClass}</p>
            )}
            {profile?.enrollNo && (
              <p className="text-yellow-400/80 text-xs font-body font-semibold mt-0.5">{profile.enrollNo}</p>
            )}
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-5 relative">
          <div className="bg-white/5 rounded-xl p-2.5">
            <p className="text-white/30 text-[10px] font-body flex items-center gap-1">
              <Calendar size={9} /> Date of Birth
            </p>
            <p className="text-white text-xs font-body font-semibold mt-0.5">{formatDob(profile?.dob)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5">
            <p className="text-white/30 text-[10px] font-body flex items-center gap-1">
              <Droplet size={9} /> Blood Group
            </p>
            <p className="text-white text-xs font-body font-semibold mt-0.5">{profile?.bloodGroup || '—'}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5">
            <p className="text-white/30 text-[10px] font-body">Gender</p>
            <p className="text-white text-xs font-body font-semibold mt-0.5">{profile?.gender || '—'}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5">
            <p className="text-white/30 text-[10px] font-body">Phone</p>
            <p className="text-white text-xs font-body font-semibold mt-0.5 truncate">{profile?.mobileNo || '—'}</p>
          </div>
        </div>

        {/* Emergency contact */}
        {(profile?.emergencyContactName || profile?.emergencyContactPhone) && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-5 relative">
            <p className="text-red-300/80 text-[10px] font-body font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
              <Phone size={9} /> Emergency Contact
            </p>
            <p className="text-white text-sm font-body font-semibold">
              {profile?.emergencyContactName || '—'}
            </p>
            {profile?.emergencyContactPhone && (
              <p className="text-white/60 text-xs font-body">{profile.emergencyContactPhone}</p>
            )}
          </div>
        )}

        {/* QR Code */}
        <div className="flex items-center justify-center gap-4 bg-white/5 rounded-xl p-3 mb-4 relative">
          <div className="bg-white rounded-lg p-2">
            <QRCodeSVG value={qrPayload} size={64} bgColor="#ffffff" fgColor="#1e1b4b" />
          </div>
          <div>
            <p className="text-white/40 text-[10px] font-body">Scan for verification</p>
            <p className="text-white/70 text-xs font-body font-semibold mt-0.5">{profile?.enrollNo || studentId?.slice(0, 8)}</p>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="h-1 rounded-full w-full relative" style={{ background: 'linear-gradient(90deg, #F9C61F, #E84545, #8b5cf6)' }} />
      </div>
    </div>
  );
}

export default function ECard() {
  const { userType, userId } = useAuth();
  const [profile, setProfile] = useState(null);
  const [children, setChildren] = useState([]);
  const [childIndex, setChildIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const isParent = userType === USER_TYPES.PARENT;

  // Student / Teacher: load own profile
  useEffect(() => {
    if (isParent || !userId) return;
    getProfile(userId).then(p => { setProfile(p); setLoading(false); }).catch(() => setLoading(false));
  }, [isParent, userId]);

  // Parent: load confirmed children's full profiles
  useEffect(() => {
    if (!isParent || !userId) return;
    const unsub = getParentGuardianLinks(userId, async links => {
      const confirmed = links.filter(l => l.status === 'confirmed');
      if (confirmed.length) {
        try {
          const all = await adminGetStudents();
          const mapped = confirmed
            .map(l => all.find(s => s.id === l.studentDocId))
            .filter(Boolean);
          setChildren(mapped);
        } catch {}
      }
      setLoading(false);
    });
    return unsub;
  }, [isParent, userId]);

  const activeProfile = isParent ? children[childIndex] : profile;
  const activeId = isParent ? children[childIndex]?.id : userId;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title="E-Card" showBack />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 flex flex-col items-center">

        {loading ? (
          <div className="w-full max-w-sm h-80 rounded-3xl bg-gray-200 animate-pulse mt-4" />
        ) : isParent && children.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <GraduationCap size={32} className="text-gray-300" />
            <p className="text-gray-400 font-body">No linked children found</p>
          </div>
        ) : (
          <>
            {/* Child switcher for parents with multiple children */}
            {isParent && children.length > 1 && (
              <div className="flex items-center gap-3 mb-4 mt-2">
                <button onClick={() => setChildIndex(i => Math.max(0, i - 1))}
                  disabled={childIndex === 0}
                  className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center disabled:opacity-30">
                  <ChevronLeft size={16} className="text-gray-500" />
                </button>
                <p className="text-gray-500 text-sm font-body font-semibold">
                  {childIndex + 1} of {children.length}
                </p>
                <button onClick={() => setChildIndex(i => Math.min(children.length - 1, i + 1))}
                  disabled={childIndex === children.length - 1}
                  className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center disabled:opacity-30">
                  <ChevronRight size={16} className="text-gray-500" />
                </button>
              </div>
            )}

            <div className="mt-2">
              <IdCard profile={activeProfile} studentId={activeId} />
            </div>

            <p className="text-gray-400 text-xs font-body mt-4 text-center">
              Present this card for school identification
            </p>
          </>
        )}
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
