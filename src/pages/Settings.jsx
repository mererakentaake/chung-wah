// src/pages/Settings.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Moon, Sun, Info, ChevronRight, Shield, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { logoutUser } from '../services/auth';
import { ROUTES } from '../utils/constants';
import TopBar from '../components/layout/TopBar';
import BottomNav from '../components/layout/BottomNav';

function SettingRow({ icon: Icon, label, subtitle, onClick, danger, iconColor, right }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3.5 p-4 rounded-2xl transition-all active:scale-[0.98]
        ${danger ? 'bg-coral-500/10 border border-coral-500/20 hover:bg-coral-500/15'
                 : 'glass-card hover:bg-white/10'}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0`}
        style={{ background: `${iconColor || '#F9C61F'}20` }}>
        <Icon size={19} style={{ color: iconColor || '#F9C61F' }} />
      </div>
      <div className="flex-1 text-left">
        <p className={`font-display font-semibold text-sm ${danger ? 'text-coral-400' : 'text-white'}`}>{label}</p>
        {subtitle && <p className="text-white/40 text-xs font-body mt-0.5">{subtitle}</p>}
      </div>
      {right || <ChevronRight size={16} className={danger ? 'text-coral-400/50' : 'text-white/25'} />}
    </button>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { userType, user } = useAuth();
  const { isDark, toggle } = useTheme();

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success('Signed out successfully');
      navigate(ROUTES.WELCOME, { replace: true });
    } catch { toast.error('Logout failed'); }
  };

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <TopBar title="Settings" />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">

        {/* Account section */}
        <p className="text-white/30 text-xs font-body font-semibold uppercase tracking-widest mb-3 px-1">Account</p>
        <div className="flex flex-col gap-2 mb-6">
          <SettingRow icon={User} label="Profile" subtitle="Edit your personal information"
            iconColor="#F9C61F" onClick={() => navigate(ROUTES.PROFILE)} />
          <SettingRow icon={Bell} label="Notifications" subtitle="Manage push notifications"
            iconColor="#8b5cf6" onClick={() => toast('Coming soon', { icon: '🔔' })} />
          <SettingRow icon={Shield} label="Privacy & Security" subtitle="Password and account security"
            iconColor="#22c55e" onClick={() => toast('Coming soon', { icon: '🔒' })} />
        </div>

        {/* Preferences section */}
        <p className="text-white/30 text-xs font-body font-semibold uppercase tracking-widest mb-3 px-1">Preferences</p>
        <div className="flex flex-col gap-2 mb-6">
          <SettingRow
            icon={isDark ? Moon : Sun}
            label={isDark ? 'Dark Mode' : 'Light Mode'}
            subtitle="Tap to change theme"
            iconColor="#f97316"
            onClick={toggle}
            right={
              <div className={`w-11 h-6 rounded-full transition-colors relative ${isDark ? 'bg-gold-500' : 'bg-white/20'}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isDark ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
              </div>
            }
          />
        </div>

        {/* About */}
        <p className="text-white/30 text-xs font-body font-semibold uppercase tracking-widest mb-3 px-1">About</p>
        <div className="flex flex-col gap-2 mb-6">
          <SettingRow icon={Info} label="About Chung Wah E-School"
            subtitle="Version 1.0.0 · Made with ❤️"
            iconColor="#3b82f6" onClick={() => {}} />
        </div>

        {/* Logout */}
        <SettingRow icon={LogOut} label="Sign Out" subtitle="You can sign in on multiple devices"
          danger onClick={handleLogout} />

        {/* User info chip */}
        <div className="mt-6 flex items-center justify-center">
          <div className="px-4 py-2 rounded-full bg-white/5 border border-white/8">
            <p className="text-white/30 text-xs font-body text-center">{user?.email}</p>
          </div>
        </div>
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
