import React, { useState, useEffect } from 'react';
import { MarketplaceNotification } from '../types';
import { api } from '../services/api';

interface NotificationsViewProps {
  onRefreshBadge?: () => void;
  onNavigateToBookings?: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  onRefreshBadge,
  onNavigateToBookings,
}) => {
  const [notifications, setNotifications] = useState<MarketplaceNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      if (onRefreshBadge) onRefreshBadge();
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      if (onRefreshBadge) onRefreshBadge();
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      if (onRefreshBadge) onRefreshBadge();
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Notifications & Alerts</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time updates regarding service bookings, schedule acceptances, and payments.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-slate-400 py-8 text-center">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-base font-semibold text-white">No notifications yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Activity on your service requests and bookings will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition flex items-start justify-between gap-4 ${
                n.read
                  ? 'bg-slate-900/50 border-slate-800/80 text-slate-400'
                  : 'bg-slate-900 border-blue-500/40 text-slate-200'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${n.read ? 'bg-slate-600' : 'bg-blue-500'}`} />
                  <h4 className="text-sm font-bold text-white">{n.title}</h4>
                  <span className="text-[10px] text-slate-400">
                    {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pl-4">{n.message}</p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {n.bookingId && onNavigateToBookings && (
                  <button
                    onClick={onNavigateToBookings}
                    className="text-xs font-semibold text-blue-400 hover:underline"
                  >
                    View Booking
                  </button>
                )}

                {!n.read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
