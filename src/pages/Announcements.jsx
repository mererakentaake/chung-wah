// src/pages/Announcements.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, X, Image, Filter, Megaphone, Calendar, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { USER_TYPES, ROUTES } from '../utils/constants';
import { getAnnouncements, createAnnouncement, uploadFile } from '../services/firestore';
import TopBar from '../components/layout/TopBar';
import BottomNav from '../components/layout/BottomNav';
import { formatDistanceToNow } from 'date-fns';

function AnnouncementCard({ item }) {
  const date = item.createdAt?.toDate?.() || new Date();
  const typeColors = {
    general: '#F9C61F',
    exam: '#E84545',
    holiday: '#22c55e',
    assignment: '#3b82f6',
  };
  const color = typeColors[item.type] || typeColors.general;

  return (
    <div className="glass-card p-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center" style={{ background: `${color}22` }}>
            <Megaphone size={17} style={{ color }} />
          </div>
          <div className="min-w-0">
            <p className="text-white font-display font-semibold text-sm truncate">{item.title || 'Announcement'}</p>
            <p className="text-white/40 text-xs font-body">{item.authorName || 'Staff'}</p>
          </div>
        </div>
        <div>
          {item.standard && (
            <span className="text-[10px] font-body font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${color}22`, color }}>
              Std {item.standard}{item.division}
            </span>
          )}
        </div>
      </div>

      {/* Image */}
      {item.imageUrl && (
        <div className="rounded-xl overflow-hidden mb-3 -mx-1">
          <img src={item.imageUrl} alt="" className="w-full max-h-48 object-cover" />
        </div>
      )}

      {/* Body */}
      {item.body && <p className="text-white/70 text-sm font-body leading-relaxed mb-3">{item.body}</p>}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-white/30 text-xs font-body">{formatDistanceToNow(date, { addSuffix: true })}</span>
        {item.type && (
          <span className="text-[10px] px-2 py-0.5 rounded-full capitalize font-body"
            style={{ background: `${color}18`, color }}>
            {item.type}
          </span>
        )}
      </div>
    </div>
  );
}

function CreateModal({ onClose, onSuccess }) {
  const { userId } = useAuth();
  const [form, setForm] = useState({ title: '', body: '', standard: '', division: '', type: 'general' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      let imageUrl = null;
      if (file) {
        imageUrl = await uploadFile(file, `schools/${localStorage.getItem('schoolCode')}/announcements/${Date.now()}`);
      }
      await createAnnouncement({ ...form, imageUrl, standard: form.standard.trim(), division: form.division.trim().toUpperCase() });
      toast.success('Announcement posted!');
      onSuccess();
    } catch (e) {
      toast.error('Failed to post announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end">
      <div className="w-full bg-navy-800 rounded-t-3xl p-5 pb-safe max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-white text-lg">Create Post</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
            <X size={18} className="text-white/70" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <input className="field-dark" placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <textarea className="field-dark min-h-[80px] resize-none" placeholder="Write your announcement..." value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />

          <div className="flex gap-3">
            <input className="field-dark flex-1" placeholder="Standard (e.g. 9)" value={form.standard} onChange={e => setForm(f => ({ ...f, standard: e.target.value }))} />
            <input className="field-dark flex-1" placeholder="Division (A/B)" value={form.division} onChange={e => setForm(f => ({ ...f, division: e.target.value }))} />
          </div>

          <div className="flex gap-2">
            {['general','exam','holiday','assignment'].map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-body capitalize transition-all
                  ${form.type === t ? 'bg-gold-500 text-navy-900 font-semibold' : 'bg-white/8 text-white/50'}`}>
                {t}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 p-3 rounded-xl border border-white/10 border-dashed cursor-pointer hover:bg-white/5">
            <Image size={18} className="text-white/40" />
            <span className="text-white/40 text-sm">{file ? file.name : 'Add image (optional)'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files[0])} />
          </label>

          <button onClick={submit} disabled={loading || !form.title.trim()}
            className="h-12 rounded-2xl btn-gradient font-display font-bold text-navy-900 disabled:opacity-50">
            {loading ? 'Posting...' : 'Post Announcement'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Announcements() {
  const { userType } = useAuth();
  const [searchParams] = useSearchParams();
  const [announcements, setAnnouncements] = useState([]);
  const [showCreate, setShowCreate] = useState(searchParams.get('create') === '1');
  const [filter, setFilter] = useState({ standard: '', division: '' });
  const isTeacher = userType === USER_TYPES.TEACHER;

  useEffect(() => {
    const unsub = getAnnouncements(filter.standard, filter.division, setAnnouncements);
    return unsub;
  }, [filter.standard, filter.division]);

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <TopBar title="Announcements" showBack>
        {isTeacher && (
          <button onClick={() => setShowCreate(true)}
            className="w-9 h-9 rounded-xl bg-coral-500 flex items-center justify-center">
            <Plus size={18} className="text-white" />
          </button>
        )}
      </TopBar>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-24">
        {/* Filter row */}
        <div className="flex gap-2 mb-4">
          <input className="field-dark flex-1 py-2 text-sm" placeholder="Class (e.g. 9)"
            value={filter.standard} onChange={e => setFilter(f => ({ ...f, standard: e.target.value }))} />
          <input className="field-dark flex-1 py-2 text-sm" placeholder="Div (A/B)"
            value={filter.division} onChange={e => setFilter(f => ({ ...f, division: e.target.value }))} />
          {(filter.standard || filter.division) && (
            <button onClick={() => setFilter({ standard: '', division: '' })}
              className="px-3 rounded-xl bg-white/8 text-white/60 text-sm">Clear</button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {announcements.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                <Megaphone size={28} className="text-white/20" />
              </div>
              <p className="text-white/30 font-body">No announcements yet</p>
            </div>
          ) : (
            announcements.map(item => <AnnouncementCard key={item.id} item={item} />)
          )}
        </div>
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onSuccess={() => setShowCreate(false)} />}
      <BottomNav userType={userType} />
    </div>
  );
}
