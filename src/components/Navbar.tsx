import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { WorkerUser } from '../types';

interface NavbarProps {
  onOpenAuth: (initialTab: 'customer' | 'worker', isSignUp?: boolean) => void;
  onNavigateTab: (tab: any) => void;
  unreadCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onNavigateTab, unreadCount }) => {
  const { user, role, logout, updateUserInState } = useAuth();
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isWorker = role === 'worker' && user && 'serviceCategory' in user;
  const workerUser = isWorker ? (user as WorkerUser) : null;

  const handleToggleAvailability = async () => {
    if (!workerUser) return;
    setIsTogglingAvailability(true);
    try {
      const res = await api.toggleAvailability();
      updateUserInState({ isAvailable: res.isAvailable });
    } catch (err) {
      console.error('Failed to toggle status:', err);
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigateTab(isWorker ? 'dashboard' : 'explore')}>
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-lg tracking-wider">
            N
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-white">NagrikAI</span>
              {role && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    role === 'worker'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                  }`}
                >
                  {role === 'worker' ? 'Provider Portal' : 'Customer Portal'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-normal hidden sm:block">Smart Local Service Connect</p>
          </div>
        </div>

        {/* Center / Navigation Links */}
        <div className="hidden md:flex items-center space-x-3">
          <button
            onClick={() => onNavigateTab('community')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white border border-slate-700/80 transition flex items-center space-x-1.5"
          >
            <span>👥</span>
            <span>Community Network</span>
          </button>

          {isWorker && workerUser && (
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <span className="text-xs text-slate-300">Live Status:</span>
              <button
                onClick={handleToggleAvailability}
                disabled={isTogglingAvailability}
                className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors flex items-center space-x-1.5 ${
                  workerUser.isAvailable
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${workerUser.isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                <span>{workerUser.isAvailable ? 'Available Now' : 'Offline'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-3">
          {user ? (
            <>
              {/* Notification Bell */}
              <button
                onClick={() => onNavigateTab('notifications')}
                className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-800 transition text-left"
                >
                  <img
                    src={user.avatarUrl || (user as any).photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName)}`}
                    alt={user.fullName}
                    className="w-8 h-8 rounded-full bg-slate-700 object-cover border border-slate-700"
                  />
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-semibold text-white leading-tight">{user.fullName}</p>
                    <p className="text-[10px] text-slate-400">{user.city}</p>
                  </div>
                  <svg className="w-3.5 h-3.5 text-slate-400 hidden lg:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {profileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-slate-900 rounded-lg shadow-xl border border-slate-800 py-1.5 z-50 text-sm"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="font-semibold text-white truncate">{user.fullName}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Public Profile Active
                      </span>
                    </div>

                    <button
                      onClick={() => onNavigateTab('community')}
                      className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center space-x-2"
                    >
                      <span>👥 Community Network</span>
                    </button>

                    <button
                      onClick={() => onNavigateTab('profile')}
                      className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center space-x-2"
                    >
                      <span>⚙️ My Profile & Visibility</span>
                    </button>

                    {role === 'customer' ? (
                      <button
                        onClick={() => onNavigateTab('my-bookings')}
                        className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center space-x-2"
                      >
                        <span>📅 My Bookings</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigateTab('requests')}
                        className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center space-x-2"
                      >
                        <span>🔔 Booking Requests</span>
                      </button>
                    )}

                    <div className="border-t border-slate-800 my-1" />

                    <button
                      onClick={() => logout()}
                      className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onOpenAuth('customer', false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                Login as Customer
              </button>
              <button
                onClick={() => onOpenAuth('worker', false)}
                className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shadow-sm"
              >
                Login as Provider
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
