// src/pages/Announcements.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus, X, Image, Megaphone, Globe, Users, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { USER_TYPES, SCHOOL_STRUCTURE } from '../utils/constants';
import {
  getAnnouncementsForClass, getAllAnnouncements,
  createAnnouncement, deleteAnnouncement, uploadFile,
  getProfile, getParentGuardianLinks, adminGetStudents
} from '../services/firestore';
import TopBar from '../components/layout/TopBar';
import BottomNav from '../components/layout/BottomNav';
import { formatDistanceToNow } from 'date-fns';

const TYPE_COLORS = {
  general:    '#F9C61F',
  exam:       '#E84545',
  holiday:    '#22c55e',
  assignment: '#3b82f6',
};

function AnnouncementCard({ item, canDelete, onDelete }) {
  const date = item.createdAt?.toDate?.() || new Date();
  const color = TYPE_COLORS[item.type] || TYPE_COLORS.general;
  const isSchoolWide = item.scope === 'school';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center"
            style={{ background: `${color}18` }}>
            {isSchoolWide
              ? <Globe size={16} style={{ color }} />
              : <Megaphone size={16} style={{ color }} />}
          </div>
          <div className="min-w-0">
            <p className="text-gray-800 font-display font-semibold text-sm truncate">{item.title || 'Announcement'}</p>
            <p className="text-gray-400 text-xs font-body">{item.authorName || 'Staff'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isSchoolWide ? (
            <span className="text-[10px] font-body font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
              School-Wide
            </span>
          ) : item.schoolClass ? (
            <span className="text-[10px] font-body font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${color}18`, color }}>
              {item.schoolClass}
            </span>
          ) : null}
          {canDelete && (
            <button onClick={() => onDelete(item)} className="p-1 text-gray-300 hover:text-red-400">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {item.imageUrl && (
        <div className="rounded-xl overflow-hidden mb-3 -mx-1">
          <img src={item.imageUrl} alt="" className="w-full max-h-48 object-cover" />
        </div>
      )}

      {item.body && <p className="text-gray-600 text-sm font-body leading-relaxed mb-3">{item.body}</p>}

      <div className="flex items-center justify-between">
        <span className="text-gray-300 text-xs font-body">{formatDistanceToNow(date, { addSuffix: true })}</span>
        {item.type && (
          <span className="text-[10px] px-2 py-0.5 rounded-full capitalize font-body"
            style={{ background: `${color}14`, color }}>
            {item.type}
          </span>
        )}
      </div>
    </div>
  );
}

function CreateModal({ schoolClass, canPostSchoolWide, isAdmin, onClose, onSuccess }) {
  const { userId } = useAuth();
  const [form, setForm] = useState({ title: '', body: '', type: 'general', scope: isAdmin ? 'school' : 'class', targetClass: schoolClass });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.title.trim()) return;
    if (isAdmin && form.scope === 'class' && !form.targetClass) {
      toast.error('Select a class');
      return;
    }
    setLoading(true);
    try {
      let imageUrl = null;
      if (file) {
        imageUrl = await uploadFile(file, `announcements/${Date.now()}`);
      }
      const profile = await getProfile(userId).catch(() => null);
      await createAnnouncement({
        title: form.title.trim(),
        body: form.body.trim(),
        type: form.type,
        imageUrl,
        scope: form.scope,
        schoolClass: form.scope === 'class' ? (isAdmin ? form.targetClass : schoolClass) : null,
        authorName: profile?.displayName || '',
      });
      toast.success(form.scope === 'school' ? 'Posted school-wide!' : `Posted to ${isAdmin ? form.targetClass : schoolClass}!`);
      onSuccess();
    } catch (e) {
      toast.error('Failed to post announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
      <div className="w-full bg-white rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-gray-800 text-lg">Create Post</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Scope selector */}
          {canPostSchoolWide && (
            <div>
              <label className="text-gray-500 text-xs font-body mb-1.5 block">Audience</label>
              <div className="flex gap-2">
                <button onClick={() => setForm(f => ({ ...f, scope: 'class' }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-display font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    form.scope === 'class' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-100 text-gray-500'
                  }`}>
                  <Users size={14} /> {isAdmin ? 'Specific Class' : `My Class (${schoolClass})`}
                </button>
                <button onClick={() => setForm(f => ({ ...f, scope: 'school' }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-display font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    form.scope === 'school' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                  <Globe size={14} /> School-Wide
                </button>
              </div>
            </div>
          )}

          {/* Admin: class picker when posting to a specific class */}
          {isAdmin && form.scope === 'class' && (
            <div>
              <label className="text-gray-500 text-xs font-body mb-1.5 block">Select Class</label>
              <select className="field" value={form.targetClass}
                onChange={e => setForm(f => ({ ...f, targetClass: e.target.value }))}>
                <option value="">Select class...</option>
                {Object.values(SCHOOL_STRUCTURE).map(section => (
                  <optgroup key={section.label} label={section.label}>
                    {section.classes.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}
          {!canPostSchoolWide && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50">
              <Users size={14} className="text-gray-400" />
              <p className="text-gray-500 text-xs font-body">
                Posting to <span className="font-semibold">{schoolClass}</span> only
              </p>
            </div>
          )}

          <input className="field" placeholder="Title" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <textarea className="field min-h-[90px] resize-none text-sm" placeholder="Write your announcement..."
            value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />

          <div className="flex gap-2 flex-wrap">
            {['general','exam','holiday','assignment'].map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-body capitalize transition-all ${
                  form.type === t ? 'bg-gray-800 text-white font-semibold' : 'bg-gray-100 text-gray-500'
                }`}>
                {t}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:bg-gray-50">
            <Image size={17} className="text-gray-400" />
            <span className="text-gray-400 text-sm font-body">{file ? file.name : 'Add image (optional)'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files[0])} />
          </label>

          <button onClick={submit} disabled={loading || !form.title.trim()}
            className="h-12 rounded-2xl font-display font-bold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #F4A334, #F9C61F)', color: '#1a1f36' }}>
            {loading ? 'Posting...' : 'Post Announcement'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Announcements() {
  const { userType, userId } = useAuth();
  const [searchParams] = useSearchParams();
  const [announcements, setAnnouncements] = useState([]);
  const [showCreate, setShowCreate] = useState(searchParams.get('create') === '1');
  const [schoolClass, setSchoolClass] = useState('');
  const [isAppointed, setIsAppointed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);

  const isTeacher = userType === USER_TYPES.TEACHER;
  const isAdmin   = userType === USER_TYPES.ADMIN;
  const isStudent = userType === USER_TYPES.STUDENT;
  const isParent  = userType === USER_TYPES.PARENT;
  const canPost   = isTeacher || isAdmin;
  const canPostSchoolWide = isAdmin || isAppointed;

  // Load profile to get schoolClass and appointed status (student/teacher)
  useEffect(() => {
    if (!userId || isParent) return;
    getProfile(userId).then(profile => {
      setSchoolClass(profile?.schoolClass || '');
      setIsAppointed(!!profile?.isAppointedAnnouncer);
    }).catch(() => {});
  }, [userId, isParent]);

  // Parent: load confirmed children and use first child's class
  useEffect(() => {
    if (!isParent || !userId) return;
    const unsub = getParentGuardianLinks(userId, async links => {
      const confirmed = links.filter(l => l.status === 'confirmed');
      if (confirmed.length) {
        try {
          const all = await adminGetStudents();
          const mapped = confirmed.map(l => {
            const data = all.find(s => s.id === l.studentDocId);
            return { id: l.studentDocId, name: l.studentName, schoolClass: data?.schoolClass || '' };
          }).filter(c => c.id);
          setChildren(mapped);
          if (mapped.length) {
            setSelectedChild(mapped[0]);
            setSchoolClass(mapped[0].schoolClass);
          }
        } catch {}
      }
    });
    return unsub;
  }, [isParent, userId]);

  // Load announcements
  useEffect(() => {
    let unsub;
    if (isAdmin) {
      unsub = getAllAnnouncements(data => { setAnnouncements(data); setLoading(false); });
    } else if (schoolClass) {
      unsub = getAnnouncementsForClass(schoolClass, data => { setAnnouncements(data); setLoading(false); });
    } else {
      setLoading(false);
    }
    return unsub;
  }, [isAdmin, schoolClass]);

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    try {
      await deleteAnnouncement(item.id);
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title="Announcements" showBack>
        {canPost && (
          <button onClick={() => setShowCreate(true)}
            className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center shadow-sm">
            <Plus size={18} className="text-white" />
          </button>
        )}
      </TopBar>

      {isParent && children.length > 1 && (
        <div className="flex gap-2 px-4 pt-3 overflow-x-auto">
          {children.map(c => (
            <button key={c.id} onClick={() => { setSelectedChild(c); setSchoolClass(c.schoolClass); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-display font-semibold whitespace-nowrap transition-all ${
                selectedChild?.id === c.id ? 'bg-red-500 text-white' : 'bg-white border border-gray-200 text-gray-500'
              }`}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-28">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Megaphone size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-400 font-body">No announcements yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {announcements.map(item => (
              <AnnouncementCard key={item.id} item={item}
                canDelete={isAdmin || item.authorId === userId}
                onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateModal
          schoolClass={schoolClass}
          canPostSchoolWide={canPostSchoolWide}
          isAdmin={isAdmin}
          onClose={() => setShowCreate(false)}
          onSuccess={() => setShowCreate(false)}
        />
      )}
      <BottomNav userType={userType} />
    </div>
  );
}
