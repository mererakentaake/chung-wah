// src/components/layout/BottomNav.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, MessageCircle, Settings,
  ClipboardList, DollarSign, BarChart3, BookOpen
} from 'lucide-react';
import { ROUTES, USER_TYPES } from '../../utils/constants';

export default function BottomNav({ userType }) {
  const navigate = useNavigate();
  const location = useLocation();

  let tabs = [];

  if (userType === USER_TYPES.STUDENT) {
    tabs = [
      { label: 'Dashboard', icon: LayoutDashboard, route: ROUTES.HOME,     color: '#F4A334' },
      { label: 'Attendance', icon: ClipboardList,  route: ROUTES.ATTENDANCE_RECORDS, color: '#6366f1' },
      { label: 'Fees',      icon: DollarSign,       route: ROUTES.FEES,     color: '#10b981' },
      { label: 'Settings',  icon: Settings,         route: ROUTES.SETTINGS, color: '#F9C61F' },
    ];
  } else if (userType === USER_TYPES.TEACHER) {
    tabs = [
      { label: 'Dashboard',  icon: LayoutDashboard, route: ROUTES.HOME,            color: '#F9C61F' },
      { label: 'Attendance', icon: ClipboardList,   route: ROUTES.TAKE_ATTENDANCE, color: '#6366f1' },
      { label: 'Chat',       icon: MessageCircle,   route: ROUTES.CHAT,            color: '#8b5cf6' },
      { label: 'Settings',   icon: Settings,        route: ROUTES.SETTINGS,        color: '#F9C61F' },
    ];
  } else if (userType === USER_TYPES.PARENT) {
    tabs = [
      { label: 'Dashboard', icon: LayoutDashboard, route: ROUTES.HOME,     color: '#E84545' },
      { label: 'Children',  icon: BookOpen,        route: ROUTES.CHILDREN, color: '#8b5cf6' },
      { label: 'Chat',      icon: MessageCircle,   route: ROUTES.CHAT,     color: '#6366f1' },
      { label: 'Settings',  icon: Settings,        route: ROUTES.SETTINGS, color: '#F9C61F' },
    ];
  } else if (userType === USER_TYPES.ACCOUNTS) {
    tabs = [
      { label: 'Dashboard', icon: LayoutDashboard, route: ROUTES.ACCOUNTS_DASHBOARD, color: '#10b981' },
      { label: 'Fees',      icon: DollarSign,      route: ROUTES.ACCOUNTS_FEES,      color: '#f59e0b' },
      { label: 'Expenses',  icon: BarChart3,       route: ROUTES.ACCOUNTS_EXPENSES,  color: '#6366f1' },
      { label: 'Reports',   icon: ClipboardList,   route: ROUTES.ACCOUNTS_REPORTS,   color: '#a855f7' },
    ];
  } else {
    // Fallback / admin (admin has its own layout)
    tabs = [
      { label: 'Dashboard', icon: LayoutDashboard, route: ROUTES.HOME,     color: '#F4A334' },
      { label: 'Settings',  icon: Settings,         route: ROUTES.SETTINGS, color: '#F9C61F' },
    ];
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 safe-bottom">
      <div className="mx-3 mb-3">
        <div className="bg-white border border-gray-200 shadow-lg rounded-2xl flex items-stretch justify-around px-2 py-2">
          {tabs.map(({ label, icon: Icon, route, color }) => {
            const active = location.pathname === route ||
              (route === ROUTES.CHAT && location.pathname.startsWith('/chat')) ||
              (route === ROUTES.TAKE_ATTENDANCE && location.pathname.startsWith('/attendance')) ||
              (route === ROUTES.ATTENDANCE_RECORDS && location.pathname.startsWith('/attendance'));
            return (
              <button key={route} onClick={() => navigate(route)}
                className={`flex flex-col items-center gap-1 flex-1 py-1.5 px-2 rounded-xl transition-all duration-200 active:scale-95
                  ${active ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                <div className={`relative transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                  <Icon size={21}
                    style={{ color: active ? color : '#9ca3af' }}
                    strokeWidth={active ? 2.5 : 1.8} />
                  {active && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background: color }} />
                  )}
                </div>
                <span className={`text-[10px] font-body font-medium transition-colors duration-200
                  ${active ? 'text-gray-800' : 'text-gray-400'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
