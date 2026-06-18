// src/pages/clubs/ClubsList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Bell, ChevronRight, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getClubs, getPendingClubAnnouncements,
  getParentGuardianLinks, getStudentClubIds
} from '../../services/firestore';
import { ROUTES, USER_TYPES } from '../../utils/constants';
import TopBar from '../../components/layout/TopBar';
import BottomNav from '../../components/layout/BottomNav';

export default function ClubsList() {
  const { userType, userId } = useAuth();
  const navigate = useNavigate();
  const isAdmin   = userType === USER_TYPES.ADMIN;
  const isTeacher = userType === USER_TYPES.TEACHER;
  const isParent  = userType === USER_TYPES.PARENT;

  const [clubs, setClubs]               = useState([]);
  const [pending, setPending]           = useState([]);
  const [search, setSearch]             = useState('');
  const [loading, setLoading]           = useState(true);
  const [childClubIds, setChildClubIds] = useState(new Set());

  useEffect(() => {
    const unsub = getClubs(data => { setClubs(data); setLoading(false); });
    return unsub;
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const unsub = getPendingClubAnnouncements(setPending);
    return unsub;
  }, [isAdmin]);

  // Load which clubs the parent's children are enrolled in
  useEffect(() => {
    if (!isParent || !userId) return;
    getParentGuardianLinks(userId, async links => {
      const confirmed = links.filter(l => l.status === 'confirmed');
      const ids = new Set();
      for (const l of confirmed) {
        const clubIds = await getStudentClubIds(l.studentDocId).catch(() => []);
        clubIds.forEach(id => ids.add(id));
      }
      setChildClubIds(ids);
    });
  }, [isParent, userId]);

  const filtered = clubs.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase()) ||
    c.teacherName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title="School Clubs">
        {isAdmin && (
          <div className="flex items-center gap-2">
            {pending.length > 0 && (
              <button onClick={() => navigate(ROUTES.CLUBS_PENDING)}
                className="relative w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                <Bell size={17} className="text-amber-500" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                  {pending.length}
                </span>
              </button>
            )}
            <button onClick={() => navigate(ROUTES.CLUBS_CREATE)}
              className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
              <Plus size={18} className="text-white" />
            </button>
          </div>
        )}
      </TopBar>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="field pl-9 !py-2.5 text-sm" placeholder="Search clubs..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Star size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-400 font-body">No clubs found</p>
            {isAdmin && (
              <button onClick={() => navigate(ROUTES.CLUBS_CREATE)}
                className="flex items-center gap-1.5 text-emerald-600 text-sm font-display font-semibold">
                <Plus size={15} /> Create first club
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(club => {
              const childEnrolled = childClubIds.has(club.id);
              return (
                <button key={club.id}
                  onClick={() => navigate(`${ROUTES.CLUBS_DETAIL}/${club.id}`)}
                  className="w-full p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.99] transition-all text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 shadow-sm">
                      <Star size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-display font-bold text-gray-800">{club.name}</p>
                        {childEnrolled && (
                          <span className="text-[10px] font-body font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            Enrolled
                          </span>
                        )}
                        {!club.isActive && (
                          <span className="text-[10px] font-body font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs font-body mt-0.5 line-clamp-2">{club.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <Users size={12} className="text-gray-400" />
                          <span className="text-gray-500 text-xs font-body">
                            {club.memberCount || 0} members
                            {club.memberCount > 0 ? ` · ${club.maleCount || 0}M ${club.femaleCount || 0}F` : ''}
                          </span>
                        </div>
                        {club.teacherName && (
                          <span className="text-gray-400 text-xs font-body">· {club.teacherName}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={15} className="text-gray-300 shrink-0 mt-1" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
