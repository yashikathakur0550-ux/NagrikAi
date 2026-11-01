import React from 'react';
import { CustomerTab, WorkerTab, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: CustomerTab | WorkerTab;
  onSelectTab: (tab: any) => void;
  pendingRequestsCount?: number;
  activeBookingsCount?: number;
  pendingConnectionsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingRequestsCount = 0,
  activeBookingsCount = 0,
  pendingConnectionsCount = 0,
}) => {
  const { role, user, logout } = useAuth();

  if (!role || !user) return null;

  const customerNavItems: { id: CustomerTab; label: string; badge?: number }[] = [
    { id: 'explore', label: 'Explore & Search' },
    { id: 'community', label: 'Community Network' },
    { id: 'categories', label: 'Service Categories' },
    { id: 'nearby-map', label: 'Nearby Map (GPS)' },
    { id: 'my-bookings', label: 'My Bookings', badge: activeBookingsCount },
    { id: 'saved-workers', label: 'Saved Workers' },
    { id: 'ai-advisor', label: 'AI Service Diagnostic' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'profile', label: 'Profile & Settings', badge: pendingConnectionsCount },
  ];

  const workerNavItems: { id: WorkerTab; label: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Provider Overview' },
    { id: 'community', label: 'Community Network' },
    { id: 'requests', label: 'Booking Requests', badge: pendingRequestsCount },
    { id: 'active-jobs', label: 'Active Jobs' },
    { id: 'earnings', label: 'My Earnings' },
    { id: 'reviews', label: 'Customer Reviews' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'profile', label: 'Profile & Services', badge: pendingConnectionsCount },
  ];

  const navItems = role === 'worker' ? workerNavItems : customerNavItems;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* User summary card */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <img
            src={user.avatarUrl || (user as any).photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName)}`}
            alt={user.fullName}
            className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 object-cover"
          />
          <div className="overflow-hidden">
            <h3 className="text-sm font-semibold text-white truncate">{user.fullName}</h3>
            <p className="text-xs text-slate-400 capitalize">{role === 'worker' ? (user as any).serviceCategory : user.city}</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <span>{item.label}</span>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white text-blue-700' : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info & Sign out */}
      <div className="p-4 border-t border-slate-800/80 space-y-2">
        <div className="text-[11px] text-slate-400">
          <p className="font-semibold text-slate-300">NagrikAI v3.0</p>
          <p>Local Service Network</p>
        </div>
        <button
          onClick={() => logout()}
          className="w-full text-left text-xs text-slate-400 hover:text-rose-400 py-1.5 transition"
        >
          Sign Out ({user.email})
        </button>
      </div>
    </aside>
  );
};
