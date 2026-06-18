// src/pages/clubs/PendingAnnouncements.jsx
// Admin reviews and approves/rejects club announcements
import React, { useState, useEffect } from 'react';
import {
  Bell, CheckCircle, XCircle, Globe, Megaphone, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  getPendingClubAnnouncements,
  approveClubAnnouncement,
  rejectClubAnnouncement
} from '../../services/firestore';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';

export default function PendingAnnouncements() {
  const { userType } = useAuth();
  const [pending, setPending]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState({});

  useEffect(() => {
    const unsub = getPendingClubAnnouncements(data => {
      setPending(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handle = async (id, action) => {
    setActing(prev => ({ ...prev, [id]: action }));
    try {
      if (action === 'approve')       await approveClubAnnouncement(id, false);
      if (action === 'school_wide')   await approveClubAnnouncement(id, true);
      if (action === 'reject')        await rejectClubAnnouncement(id);
      toast.success(
        action === 'approve' ? 'Approved for club members' :
        action === 'school_wide' ? 'Approved & posted school-wide' :
        'Announcement rejected'
      );
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally {
      setActing(prev => ({ ...prev, [id]: null }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title="Pending Announcements" showBack />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2].map(i => <div key={i} className="h-36 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : pending.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Bell size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-400 font-body">No pending announcements</p>
            <p className="text-gray-300 text-sm font-body">
              Club teachers' announcements will appear here for your review
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {pending.map(ann => {
              const busy = acting[ann.id];
              const date = ann.createdAt?.toDate?.()?.toLocaleDateString() || '';
              return (
                <div key={ann.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="flex items-start gap-3 p-4 border-b border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <Clock size={16} className="text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-gray-800 text-sm">{ann.title}</p>
                      <p className="text-gray-400 text-xs font-body mt-0.5">
                        {ann.clubName} · {ann.teacherName} · {date}
                      </p>
                    </div>
                    <span className="text-[10px] font-body font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
                      Pending
                    </span>
                  </div>

                  {/* Content */}
                  <div className="px-4 py-3">
                    <p className="text-gray-600 text-sm font-body leading-relaxed whitespace-pre-wrap">
                      {ann.content}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 border-t border-gray-100">
                    <button
                      onClick={() => handle(ann.id, 'approve')}
                      disabled={!!busy}
                      className="py-3 flex flex-col items-center gap-1 hover:bg-emerald-50 transition-colors disabled:opacity-40">
                      {busy === 'approve'
                        ? <div className="w-4 h-4 border border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        : <CheckCircle size={16} className="text-emerald-500" />}
                      <span className="text-emerald-600 text-[10px] font-body font-semibold">Club Only</span>
                    </button>

                    <button
                      onClick={() => handle(ann.id, 'school_wide')}
                      disabled={!!busy}
                      className="py-3 flex flex-col items-center gap-1 border-x border-gray-100 hover:bg-blue-50 transition-colors disabled:opacity-40">
                      {busy === 'school_wide'
                        ? <div className="w-4 h-4 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                        : <Globe size={16} className="text-blue-500" />}
                      <span className="text-blue-600 text-[10px] font-body font-semibold">School-Wide</span>
                    </button>

                    <button
                      onClick={() => handle(ann.id, 'reject')}
                      disabled={!!busy}
                      className="py-3 flex flex-col items-center gap-1 hover:bg-red-50 transition-colors disabled:opacity-40">
                      {busy === 'reject'
                        ? <div className="w-4 h-4 border border-red-400 border-t-transparent rounded-full animate-spin" />
                        : <XCircle size={16} className="text-red-400" />}
                      <span className="text-red-500 text-[10px] font-body font-semibold">Reject</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
