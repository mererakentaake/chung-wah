// src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { Camera, Lock, Send, GraduationCap, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfilePhoto, requestProfileCorrection, uploadFile } from '../services/firestore';
import TopBar from '../components/layout/TopBar';
import BottomNav from '../components/layout/BottomNav';
import { USER_TYPES } from '../utils/constants';

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-white/5 last:border-0">
      <span className="text-white/40 text-xs font-body font-medium shrink-0 pt-0.5">{label}</span>
      <span className="text-white text-sm font-body text-right">{value}</span>
    </div>
  );
}

export default function Profile() {
  const { userType, userId, user } = useAuth();
  const isStudent = userType === USER_TYPES.STUDENT;
  const isTeacher = userType === USER_TYPES.TEACHER;

  const [profile, setProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionMsg, setCorrectionMsg] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (userId) getProfile(userId).then(setProfile).catch(() => {});
  }, [userId]);

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, `schools/${localStorage.getItem('schoolCode')}/profiles/${userId}`);
      await updateProfilePhoto(userId, url);
      setProfile(p => ({ ...p, photoUrl: url }));
      toast.success('Photo updated!');
    } catch { toast.error('Photo upload failed'); }
    finally { setUploading(false); }
  };

  const sendCorrection = async () => {
    if (!correctionMsg.trim()) { toast.error('Please describe what needs correcting'); return; }
    setSending(true);
    try {
      await requestProfileCorrection(correctionMsg);
      toast.success('Correction request sent to admin!');
      setShowCorrection(false);
      setCorrectionMsg('');
    } catch { toast.error('Failed to send request'); }
    finally { setSending(false); }
  };

  const titlePrefix = profile?.title ? `${profile.title} ` : '';

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <TopBar title="My Profile" showBack />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-white/15">
              {profile?.photoUrl && profile.photoUrl !== 'default' ? (
                <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-yellow-500/40 to-orange-500/40 flex items-center justify-center">
                  <GraduationCap size={40} className="text-white/60" />
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-yellow-400 flex items-center justify-center cursor-pointer shadow-lg">
              <Camera size={15} className="text-gray-900" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
          </div>
          <p className="text-white font-display font-bold text-lg mt-4">
            {titlePrefix}{profile?.displayName || 'Your Name'}
          </p>
          <p className="text-white/40 text-sm font-body">{user?.email}</p>
          {isStudent && profile?.standard && (
            <span className="mt-1.5 px-3 py-1 rounded-full text-xs font-body font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20">
              Std {profile.standard} – {profile.division}
            </span>
          )}
          {isTeacher && profile?.subject && (
            <span className="mt-1.5 px-3 py-1 rounded-full text-xs font-body font-semibold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20">
              {profile.subject}
            </span>
          )}
        </div>

        {/* Read-only profile card */}
        <div className="glass-card p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Lock size={12} className="text-white/30" />
            <span className="text-white/30 text-xs font-body">Profile set by school admin</span>
          </div>
          <InfoRow label="Full Name" value={profile?.displayName} />
          {(isTeacher || !isStudent) && <InfoRow label="Title" value={profile?.title} />}
          {isStudent && <InfoRow label="Gender" value={profile?.gender} />}
          {isStudent && <InfoRow label="Standard" value={profile?.standard && profile?.division ? `Std ${profile.standard} – ${profile.division}` : null} />}
          {isStudent && <InfoRow label="Enroll No." value={profile?.enrollNo} />}
          {isStudent && <InfoRow label="Date of Birth" value={profile?.dob} />}
          {isStudent && <InfoRow label="Blood Group" value={profile?.bloodGroup} />}
          {isTeacher && <InfoRow label="Subject" value={profile?.subject} />}
          <InfoRow label="Mobile No." value={profile?.mobileNo} />
          {!isStudent && <InfoRow label="Relationship" value={profile?.relationshipType} />}
        </div>

        {/* Request correction button */}
        <button
          onClick={() => setShowCorrection(true)}
          className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-display font-semibold text-sm transition-all"
          style={{ background: 'rgba(249,198,31,0.10)', border: '1px solid rgba(249,198,31,0.25)', color: '#F9C61F' }}
        >
          <Send size={15} />
          Request to Correct Profile Details
        </button>
      </div>

      {/* Correction modal */}
      {showCorrection && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={() => setShowCorrection(false)}>
          <div
            className="w-full rounded-t-3xl p-6 flex flex-col gap-4"
            style={{ background: '#141829', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-white text-lg">Request Profile Correction</h3>
              <button onClick={() => setShowCorrection(false)} className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center">
                <X size={16} className="text-white/60" />
              </button>
            </div>
            <p className="text-white/50 text-sm font-body">
              Describe which details are incorrect. The school admin will review and update your profile.
            </p>
            <textarea
              className="field-dark resize-none"
              rows={4}
              placeholder="e.g. My date of birth is incorrect, it should be 15/03/2005…"
              value={correctionMsg}
              onChange={e => setCorrectionMsg(e.target.value)}
            />
            <button
              onClick={sendCorrection}
              disabled={sending}
              className="w-full h-12 rounded-2xl font-display font-bold text-sm text-gray-900 flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #F9C61F, #f59e0b)' }}
            >
              {sending
                ? <div className="w-4 h-4 border-2 border-gray-700/40 border-t-gray-700 rounded-full animate-spin" />
                : <><Send size={15} />Send Request</>
              }
            </button>
          </div>
        </div>
      )}

      <BottomNav userType={userType} />
    </div>
  );
}
