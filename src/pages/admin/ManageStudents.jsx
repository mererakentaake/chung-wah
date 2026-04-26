// src/pages/admin/ManageStudents.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, GraduationCap, ArrowLeft, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminGetStudents, adminDeleteStudent } from '../../services/firestore';
import { ROUTES } from '../../utils/constants';

export default function ManageStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminGetStudents();
      // Sort by name
      data.sort((a, b) => (a.displayName || a.name || '').localeCompare(b.displayName || b.name || ''));
      setStudents(data);
      setFiltered(data);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      students.filter(s =>
        (s.displayName || s.name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.standard || '').toString().includes(q) ||
        (s.division || '').toLowerCase().includes(q)
      )
    );
  }, [search, students]);

  const handleDelete = async (student) => {
    if (!window.confirm(`Remove ${student.displayName || student.email} from the school?`)) return;
    setDeletingId(student.id);
    try {
      await adminDeleteStudent(student.id);
      toast.success('Student removed');
      setStudents(prev => prev.filter(s => s.id !== student.id));
    } catch {
      toast.error('Failed to remove student');
    } finally {
      setDeletingId(null);
    }
  };

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
            <h1 className="font-display font-bold text-white text-xl">Students</h1>
            <p className="text-white/40 text-xs font-body">{students.length} registered</p>
          </div>
          <button
            onClick={() => navigate(`${ROUTES.ADMIN_CREATE_USER}?type=student`)}
            className="flex items-center gap-1.5 px-3 h-9 rounded-xl font-display font-semibold text-sm text-navy-900"
            style={{ background: '#F4A334' }}
          >
            <Plus size={16} />
            Add
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            className="field-dark pl-10"
            placeholder="Search by name, email, class…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-10">
        {loading ? (
          <div className="flex flex-col gap-3 mt-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title={search ? 'No results found' : 'No students yet'}
            subtitle={search ? 'Try a different search term' : 'Tap + Add to register the first student'}
            color="#F4A334"
          />
        ) : (
          <div className="flex flex-col gap-3 mt-2">
            {filtered.map(student => (
              <StudentCard
                key={student.id}
                student={student}
                deleting={deletingId === student.id}
                onEdit={() => navigate(`${ROUTES.ADMIN_EDIT_USER}?type=student&id=${student.id}`)}
                onDelete={() => handleDelete(student)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StudentCard({ student, deleting, onEdit, onDelete }) {
  const name = student.displayName || student.name || '—';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const cls = student.standard && student.division
    ? `Std ${student.standard} – ${student.division.toUpperCase()}`
    : 'No class assigned';

  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/8">
      {/* Avatar */}
      <div className="w-11 h-11 rounded-xl bg-orange-500/20 border border-orange-500/25 flex items-center justify-center shrink-0">
        <span className="font-display font-bold text-orange-400 text-sm">{initials || '?'}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-white text-sm truncate">{name}</p>
        <p className="text-white/40 text-xs font-body truncate">{student.email}</p>
        <p className="text-orange-400/80 text-xs font-body mt-0.5">{cls}</p>
      </div>

      {/* Actions */}
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
