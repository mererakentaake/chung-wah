// src/pages/admin/ManageTeachers.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, UserCheck, Users, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminGetTeachersParents, adminDeleteTeacherParent } from '../../services/firestore';
import { ROUTES } from '../../utils/constants';

export default function ManageTeachers() {
  const navigate = useNavigate();
  const [people, setPeople] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('teacher'); // 'teacher' | 'parent'
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminGetTeachersParents();
      data.sort((a, b) => (a.displayName || a.name || '').localeCompare(b.displayName || b.name || ''));
      setPeople(data);
    } catch {
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    const pool = people.filter(p => tab === 'teacher' ? p.isATeacher : !p.isATeacher);
    setFiltered(
      pool.filter(p =>
        (p.displayName || p.name || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q) ||
        (p.subject || '').toLowerCase().includes(q)
      )
    );
  }, [search, people, tab]);

  const handleDelete = async (person) => {
    if (!window.confirm(`Remove ${person.displayName || person.email}?`)) return;
    setDeletingId(person.id);
    try {
      await adminDeleteTeacherParent(person.id);
      toast.success('Removed successfully');
      setPeople(prev => prev.filter(p => p.id !== person.id));
    } catch {
      toast.error('Failed to remove');
    } finally {
      setDeletingId(null);
    }
  };

  const isTeacherTab = tab === 'teacher';
  const color = isTeacherTab ? '#F9C61F' : '#E84545';
  const type = isTeacherTab ? 'teacher' : 'parent';

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}
            className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-white/80" />
          </button>
          <div className="flex-1">
            <h1 className="font-display font-bold text-white text-xl">Teachers & Parents</h1>
            <p className="text-white/40 text-xs font-body">{filtered.length} records</p>
          </div>
          <button
            onClick={() => navigate(`${ROUTES.ADMIN_CREATE_USER}?type=${type}`)}
            className="flex items-center gap-1.5 px-3 h-9 rounded-xl font-display font-semibold text-sm text-navy-900"
            style={{ background: color }}
          >
            <Plus size={16} />
            Add
          </button>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-2 p-1 rounded-2xl bg-white/5 border border-white/8 mb-3">
          {[
            { label: 'Teachers', value: 'teacher', icon: UserCheck },
            { label: 'Parents', value: 'parent', icon: Users },
          ].map(({ label, value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => { setTab(value); setSearch(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-display font-semibold text-sm transition-all duration-200
                ${tab === value ? 'text-navy-900 shadow-sm' : 'text-white/50'}`}
              style={tab === value ? { background: value === 'teacher' ? '#F9C61F' : '#E84545' } : {}}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            className="field-dark pl-10"
            placeholder={`Search ${isTeacherTab ? 'teachers' : 'parents'}…`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-10">
        {loading ? (
          <div className="flex flex-col gap-3 mt-2">
            {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={isTeacherTab ? UserCheck : Users}
            title={search ? 'No results found' : `No ${isTeacherTab ? 'teachers' : 'parents'} yet`}
            subtitle={search ? 'Try a different search term' : `Tap + Add to register a ${isTeacherTab ? 'teacher' : 'parent'}`}
            color={color}
          />
        ) : (
          <div className="flex flex-col gap-3 mt-2">
            {filtered.map(person => (
              <PersonCard
                key={person.id}
                person={person}
                color={color}
                deleting={deletingId === person.id}
                onEdit={() => navigate(`${ROUTES.ADMIN_EDIT_USER}?type=${type}&id=${person.id}`)}
                onDelete={() => handleDelete(person)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PersonCard({ person, color, deleting, onEdit, onDelete }) {
  const name = person.displayName || person.name || '—';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/8">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
        <span className="font-display font-bold text-sm" style={{ color }}>{initials || '?'}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-white text-sm truncate">{name}</p>
        <p className="text-white/40 text-xs font-body truncate">{person.email}</p>
        {person.subject && (
          <p className="text-xs font-body mt-0.5" style={{ color: `${color}cc` }}>{person.subject}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onEdit}
          className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center hover:bg-white/12 transition-colors"
        >
          <Pencil size={14} className="text-white/60" />
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center hover:bg-red-500/25 transition-colors disabled:opacity-40"
        >
          {deleting
            ? <div className="w-3.5 h-3.5 border border-red-400/60 border-t-red-400 rounded-full animate-spin" />
            : <Trash2 size={14} className="text-red-400" />
          }
        </button>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle, color }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
        <Icon size={28} style={{ color }} />
      </div>
      <div className="text-center">
        <p className="font-display font-semibold text-white/80 text-base">{title}</p>
        <p className="text-white/40 text-sm font-body mt-1">{subtitle}</p>
      </div>
    </div>
  );
}
