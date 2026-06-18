// src/pages/clubs/ClubDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star, Users, Edit2, Megaphone, Send, X,
  CheckCircle, UserPlus, UserMinus, ChevronDown, ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  getClubs, getClubAnnouncements, getClubMembers,
  enrollInClub, unenrollFromClub, postClubAnnouncement,
  getParentGuardianLinks, adminGetStudents
} from '../../services/firestore';
import { ROUTES, USER_TYPES } from '../../utils/constants';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';

function AnnouncementCard({ ann }) {
  const [expanded, setExpanded] = useState(false);
  const date = ann.createdAt?.toDate?.()?.toLocaleDateString() || '';
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button className="w-full flex items-start gap-3 p-3.5 text-left"
        onClick={() => setExpanded(v => !v)}>
        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
          <Megaphone size={15} className="text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-gray-800 text-sm">{ann.title}</p>
          <p className="text-gray-400 text-xs font-body">{ann.teacherName} · {date}</p>
        </div>
        {expanded ? <ChevronUp size={14} className="text-gray-300 shrink-0" />
                  : <ChevronDown size={14} className="text-gray-300 shrink-0" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <p className="text-gray-600 text-sm font-body leading-relaxed whitespace-pre-wrap">{ann.content}</p>
        </div>
      )}
    </div>
  );
}

function PostAnnouncementModal({ club, onClose }) {
  const { userId } = useAuth();
  const [title, setTitle]     = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !content.trim()) { toast.error('Enter title and content'); return; }
    setSending(true);
    try {
      await postClubAnnouncement({
        clubId: club.id,
        clubName: club.name,
        title: title.trim(),
        content: content.trim(),
        teacherName: club.teacherName || '',
      });
      toast.success('Announcement sent to Admin for approval');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
      <div className="w-full bg-white rounded-t-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-gray-800">Post Announcement</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
            <X size={15} className="text-gray-500" />
          </button>
        </div>
        <p className="text-gray-400 text-xs font-body mb-4">
          This will be sent to the principal for approval before being shared with club members.
        </p>
        <div className="flex flex-col gap-3">
          <input className="field" placeholder="Announcement title"
            value={title} onChange={e => setTitle(e.target.value)} />
          <textarea className="field min-h-[100px] resize-none text-sm"
            placeholder="Write your announcement here..."
            value={content} onChange={e => setContent(e.target.value)} />
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-600 font-display font-semibold">
              Cancel
            </button>
            <button onClick={handleSend} disabled={sending}
              className="flex-1 h-12 rounded-2xl text-white font-display font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              {sending
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Send size={16} /> Submit</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClubDetail() {
  const { id: clubId } = useParams();
  const navigate = useNavigate();
  const { userType, userId } = useAuth();

  const isAdmin   = userType === USER_TYPES.ADMIN;
  const isTeacher = userType === USER_TYPES.TEACHER;
  const isParent  = userType === USER_TYPES.PARENT;
  const isStudent = userType === USER_TYPES.STUDENT;

  const [club, setClub]                   = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [members, setMembers]             = useState([]);
  const [children, setChildren]           = useState([]);
  const [enrolledIds, setEnrolledIds]     = useState(new Set());
  const [showPostModal, setShowPostModal] = useState(false);
  const [loading, setLoading]             = useState(true);
  const [enrolling, setEnrolling]         = useState({});
  const [showProgramme, setShowProgramme] = useState(false);

  // Load club
  useEffect(() => {
    const unsub = getClubs(all => {
      const found = all.find(c => c.id === clubId);
      setClub(found || null);
      setLoading(false);
    });
    return unsub;
  }, [clubId]);

  // Load announcements and members
  useEffect(() => {
    const u1 = getClubAnnouncements(clubId, setAnnouncements);
    const u2 = getClubMembers(clubId, data => {
      setMembers(data);
      setEnrolledIds(new Set(data.map(m => m.studentId)));
    });
    return () => { u1(); u2(); };
  }, [clubId]);

  // Load parent's confirmed children
  useEffect(() => {
    if (!isParent || !userId) return;
    const unsub = getParentGuardianLinks(userId, async links => {
      const confirmed = links.filter(l => l.status === 'confirmed');
      if (confirmed.length) {
        const all = await adminGetStudents().catch(() => []);
        const mapped = confirmed.map(l => {
          const data = all.find(s => s.id === l.studentDocId);
          return {
            id: l.studentDocId,
            name: l.studentName,
            gender: data?.gender || '',
            schoolClass: data?.schoolClass || '',
          };
        }).filter(c => c.id);
        setChildren(mapped);
      }
    });
    return unsub;
  }, [isParent, userId]);

  const handleEnroll = async (child, enroll) => {
    setEnrolling(prev => ({ ...prev, [child.id]: true }));
    try {
      if (enroll) {
        await enrollInClub(clubId, child.id, {
          studentName: child.name,
          gender: child.gender,
          schoolClass: child.schoolClass,
        });
        toast.success(`${child.name} enrolled in ${club.name}`);
      } else {
        await unenrollFromClub(clubId, child.id);
        toast.success(`${child.name} removed from ${club.name}`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally {
      setEnrolling(prev => ({ ...prev, [child.id]: false }));
    }
  };

  const isAssignedTeacher = isTeacher && club?.teacherId === userId;

  if (loading || !club) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title={club.name} showBack>
        {isAdmin && (
          <button onClick={() => navigate(`${ROUTES.CLUBS_CREATE}?edit=${club.id}`)}
            className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
            <Edit2 size={15} className="text-gray-500" />
          </button>
        )}
      </TopBar>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        {/* Club header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md">
              <Star size={24} className="text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-gray-900 text-xl">{club.name}</h2>
              {club.teacherName && (
                <p className="text-gray-400 text-sm font-body">Managed by {club.teacherName}</p>
              )}
            </div>
          </div>

          {club.description && (
            <p className="text-gray-600 text-sm font-body leading-relaxed mb-4">{club.description}</p>
          )}

          {/* Member stats */}
          <div className="flex gap-3">
            <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
              <p className="font-display font-bold text-gray-800 text-xl">{club.memberCount || 0}</p>
              <p className="text-gray-400 text-xs font-body">Members</p>
            </div>
            <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center">
              <p className="font-display font-bold text-blue-600 text-xl">{club.maleCount || 0}</p>
              <p className="text-gray-400 text-xs font-body">Male</p>
            </div>
            <div className="flex-1 bg-pink-50 rounded-xl p-3 text-center">
              <p className="font-display font-bold text-pink-500 text-xl">{club.femaleCount || 0}</p>
              <p className="text-gray-400 text-xs font-body">Female</p>
            </div>
          </div>
        </div>

        {/* Programme / Curriculum */}
        {club.programme && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4 overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 text-left"
              onClick={() => setShowProgramme(v => !v)}>
              <p className="font-display font-semibold text-gray-800 text-sm">Club Programme / Syllabus</p>
              {showProgramme ? <ChevronUp size={16} className="text-gray-300" />
                             : <ChevronDown size={16} className="text-gray-300" />}
            </button>
            {showProgramme && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                <p className="text-gray-600 text-sm font-body leading-relaxed whitespace-pre-wrap">
                  {club.programme}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Admin: members list */}
        {isAdmin && members.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
            <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider mb-3">
              Members ({members.length})
            </p>
            <div className="flex flex-col gap-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-2 py-1.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <span className="text-emerald-600 text-xs font-bold">
                      {(m.studentName || '?')[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 text-sm font-body">{m.studentName}</p>
                    <p className="text-gray-400 text-xs font-body">{m.schoolClass} · {m.gender}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Parent: enroll/unenroll children */}
        {isParent && children.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
            <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider mb-3">
              My Children
            </p>
            <div className="flex flex-col gap-3">
              {children.map(child => {
                const enrolled = enrolledIds.has(child.id);
                const busy = enrolling[child.id];
                return (
                  <div key={child.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <span className="text-gray-600 text-sm font-bold">{child.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 font-display font-semibold text-sm">{child.name}</p>
                      <p className="text-gray-400 text-xs font-body">{child.schoolClass}</p>
                    </div>
                    <button
                      onClick={() => handleEnroll(child, !enrolled)}
                      disabled={busy}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-display font-semibold transition-all disabled:opacity-50 ${
                        enrolled
                          ? 'bg-red-50 text-red-500 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}>
                      {busy
                        ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        : enrolled
                        ? <><UserMinus size={13} /> Remove</>
                        : <><UserPlus size={13} /> Enroll</>}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Teacher: post announcement button */}
        {isAssignedTeacher && (
          <button onClick={() => setShowPostModal(true)}
            className="w-full py-3.5 rounded-2xl font-display font-bold text-white mb-4 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Megaphone size={17} /> Post Announcement
          </button>
        )}

        {/* Announcements */}
        <p className="text-gray-400 text-xs font-body font-semibold uppercase tracking-wider mb-3">
          Club Announcements ({announcements.length})
        </p>
        {announcements.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400 font-body text-sm">No announcements yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {announcements.map(ann => <AnnouncementCard key={ann.id} ann={ann} />)}
          </div>
        )}
      </div>

      {showPostModal && (
        <PostAnnouncementModal club={club} onClose={() => setShowPostModal(false)} />
      )}

      <BottomNav userType={userType} />
    </div>
  );
}
