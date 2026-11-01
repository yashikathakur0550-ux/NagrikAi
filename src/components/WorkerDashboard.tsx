import React, { useState, useEffect } from 'react';
import { WorkerUser, Booking, ServiceReview, CommunityConnectionMessage } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface WorkerDashboardProps {
  worker: WorkerUser;
  onNavigateTab: (tab: any) => void;
  onOpenPublicProfile?: (userId: string) => void;
}

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({ worker, onNavigateTab, onOpenPublicProfile }) => {
  const { updateUserInState } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);

  // Profile Connection requests
  const [incomingConnections, setIncomingConnections] = useState<CommunityConnectionMessage[]>([]);
  const [actionConnLoading, setActionConnLoading] = useState<string | null>(null);
  const [denyModalConn, setDenyModalConn] = useState<CommunityConnectionMessage | null>(null);
  const [connDenyReason, setConnDenyReason] = useState('');
  const [connFeedback, setConnFeedback] = useState<string | null>(null);

  // Decline modal
  const [declineBookingId, setDeclineBookingId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  // Complete job modal
  const [completeBookingId, setCompleteBookingId] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, workerRes, connsRes] = await Promise.all([
        api.getBookings(),
        api.getWorkerById(worker.id),
        api.getConnectionRequests().catch(() => ({ incoming: [] })),
      ]);
      setBookings(bookingsRes.bookings || []);
      setReviews(workerRes.reviews || []);
      setIncomingConnections(connsRes.incoming || []);
    } catch (err) {
      console.error('Failed to load worker dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [worker.id]);

  const handleAcceptConnection = async (connId: string) => {
    setActionConnLoading(connId);
    setConnFeedback(null);
    try {
      await api.respondToConnectionRequest(connId, 'accepted');
      setConnFeedback('Connection request accepted! You are now connected with direct contact unlocked.');
      await fetchData();
    } catch (err: any) {
      setConnFeedback(err.message || 'Failed to accept connection request');
    } finally {
      setActionConnLoading(null);
    }
  };

  const handleConfirmDenyConnection = async () => {
    if (!denyModalConn) return;
    setActionConnLoading(denyModalConn.id);
    setConnFeedback(null);
    try {
      await api.respondToConnectionRequest(denyModalConn.id, 'declined', connDenyReason.trim() || undefined);
      setConnFeedback('Connection request declined.');
      setDenyModalConn(null);
      setConnDenyReason('');
      await fetchData();
    } catch (err: any) {
      setConnFeedback(err.message || 'Failed to decline connection request');
    } finally {
      setActionConnLoading(null);
    }
  };

  const handleToggleAvailability = async () => {
    setIsTogglingAvailability(true);
    try {
      const res = await api.toggleAvailability();
      updateUserInState({ isAvailable: res.isAvailable });
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    setActionLoading(true);
    try {
      await api.updateBookingStatus(bookingId, 'Accepted');
      await fetchData();
    } catch (err) {
      console.error('Failed to accept booking:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declineBookingId) return;

    setActionLoading(true);
    try {
      await api.updateBookingStatus(declineBookingId, 'Rejected', declineReason || 'Provider unavailable at requested time');
      setDeclineBookingId(null);
      setDeclineReason('');
      await fetchData();
    } catch (err) {
      console.error('Failed to reject booking:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartJob = async (bookingId: string) => {
    setActionLoading(true);
    try {
      await api.updateBookingStatus(bookingId, 'In Progress');
      await fetchData();
    } catch (err) {
      console.error('Failed to start job:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeBookingId) return;

    setActionLoading(true);
    try {
      await api.updateBookingStatus(completeBookingId, 'Completed', completionNotes || 'Job completed successfully');
      setCompleteBookingId(null);
      setCompletionNotes('');
      // Refresh worker state for earnings update
      const workerRes = await api.getWorkerById(worker.id);
      updateUserInState({
        totalCompletedJobs: workerRes.worker.totalCompletedJobs,
        totalEarnings: workerRes.worker.totalEarnings,
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to complete job:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingRequests = bookings.filter((b) => b.status === 'Requested');
  const activeJobs = bookings.filter((b) => b.status === 'Accepted' || b.status === 'In Progress');
  const completedJobs = bookings.filter((b) => b.status === 'Completed');

  return (
    <div className="space-y-6">
      {/* Top Banner with Profile & Availability */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <img
              src={worker.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(worker.fullName)}`}
              alt={worker.fullName}
              className="w-14 h-14 rounded-xl bg-slate-800 object-cover border border-slate-700"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {worker.fullName}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  {worker.serviceCategory}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {worker.city} • Inspection Charge: <span className="text-white font-semibold">₹{worker.serviceCharge}</span> • {worker.experienceYears} Years Exp
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleToggleAvailability}
              disabled={isTogglingAvailability}
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition ${
                worker.isAvailable
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-600/30'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${worker.isAvailable ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span>{worker.isAvailable ? 'Online (Accepting Jobs)' : 'Offline (Not Visible)'}</span>
            </button>

            <button
              onClick={() => onNavigateTab('profile')}
              className="px-3.5 py-2.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              Edit Services & Rates
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Revenue</p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">₹{worker.totalEarnings.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{completedJobs.length} completed jobs</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">New Requests</p>
          <p className="text-2xl font-extrabold text-blue-400 mt-1">{pendingRequests.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Awaiting your response</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">In Progress</p>
          <p className="text-2xl font-extrabold text-amber-400 mt-1">{activeJobs.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Accepted & active jobs</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Client Rating</p>
          <p className="text-2xl font-extrabold text-amber-400 mt-1">★ {worker.rating.toFixed(1)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{reviews.length} customer reviews</p>
        </div>
      </div>

      {/* INCOMING PROFILE & NETWORK REQUESTS ON WORKER DASHBOARD */}
      {incomingConnections.filter((c) => c.status === 'pending').length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/50 via-slate-900 to-blue-950/50 border border-amber-500/40 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-3">
              <span className="text-2xl p-2 rounded-xl bg-amber-500/20 border border-amber-500/30">🤝</span>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Incoming Profile & Network Requests
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                    {incomingConnections.filter((c) => c.status === 'pending').length} Direct Inquiries
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Customers or local citizens who sent a connection or inquiry request directly to your profile.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('profile')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1"
            >
              <span>Manage in Profile</span>
              <span>→</span>
            </button>
          </div>

          {connFeedback && (
            <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
              <span>{connFeedback}</span>
              <button onClick={() => setConnFeedback(null)} className="text-emerald-400 hover:text-white text-xs">✕</button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {incomingConnections
              .filter((c) => c.status === 'pending')
              .map((conn) => (
                <div
                  key={conn.id}
                  className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 hover:border-amber-500/40 transition flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src={conn.fromUserAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(conn.fromUserName)}`}
                        alt={conn.fromUserName}
                        className="w-11 h-11 rounded-xl bg-slate-800 object-cover border border-slate-700 flex-shrink-0"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-white">{conn.fromUserName}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            conn.fromUserRole === 'worker'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          }`}>
                            {conn.fromUserRole === 'worker' ? 'Fellow Professional' : 'Client / Citizen'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {conn.fromUserNeighborhood ? `${conn.fromUserNeighborhood}, ` : ''}{conn.fromUserCity || 'Nearby'} •{' '}
                          {new Date(conn.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {onOpenPublicProfile && (
                      <button
                        onClick={() => onOpenPublicProfile(conn.fromUserId)}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-medium whitespace-nowrap"
                        title="View Full Profile"
                      >
                        View Profile
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 text-xs">
                    <p className="font-semibold text-slate-200 mb-1">{conn.subject}</p>
                    <p className="text-slate-400 leading-relaxed italic line-clamp-3">"{conn.message}"</p>
                  </div>

                  {/* Accept / Deny Action Buttons */}
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => handleAcceptConnection(conn.id)}
                      disabled={actionConnLoading === conn.id}
                      className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-sm"
                    >
                      <span>✓</span>
                      <span>{actionConnLoading === conn.id ? 'Accepting...' : 'Accept Connection'}</span>
                    </button>

                    <button
                      onClick={() => setDenyModalConn(conn)}
                      disabled={actionConnLoading === conn.id}
                      className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-800 text-xs font-semibold transition"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Booking Requests (Action Required) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Incoming Booking Requests ({pendingRequests.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Customers who have specifically requested your services. Accept to confirm time slot.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-4">Checking for requests...</p>
        ) : pendingRequests.length === 0 ? (
          <div className="text-center py-8 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <p className="text-sm font-medium text-slate-300">No pending booking requests right now</p>
            <p className="text-xs text-slate-400 mt-1">
              Ensure your live status is set to "Online" so nearby customers can discover and book you.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((b) => (
              <div
                key={b.id}
                className="p-4 bg-slate-950 rounded-xl border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{b.customerName}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">
                      {b.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-1">{b.serviceRequired}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Date: <strong className="text-slate-300">{b.bookingDate}</strong> • Slot: <strong className="text-slate-300">{b.preferredTime}</strong>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Address: {b.customerAddress}, {b.customerCity} • Phone: {b.customerPhone}
                  </p>
                  <p className="text-xs text-slate-400 mt-2 bg-slate-900/90 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 font-semibold">Problem: </span>{b.problemDescription}
                  </p>
                </div>

                <div className="flex md:flex-col items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAcceptBooking(b.id)}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
                  >
                    Accept Request
                  </button>
                  <button
                    onClick={() => setDeclineBookingId(b.id)}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-rose-900/30 text-rose-400 border border-slate-700 hover:border-rose-700/50 transition"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Jobs in Progress */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Active Scheduled Jobs ({activeJobs.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Accepted service appointments. Mark as completed after service is finished to receive payment.
            </p>
          </div>
        </div>

        {activeJobs.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 italic">No jobs currently in progress.</p>
        ) : (
          <div className="space-y-3">
            {activeJobs.map((b) => (
              <div
                key={b.id}
                className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{b.customerName}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        b.status === 'In Progress'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-1">{b.serviceRequired}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Scheduled: {b.bookingDate} ({b.preferredTime})
                  </p>
                  <p className="text-xs text-slate-400">
                    Location: {b.customerAddress}, {b.customerCity} • Phone: {b.customerPhone}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 italic">
                    "{b.problemDescription}"
                  </p>
                </div>

                <div className="flex md:flex-col items-center gap-2 shrink-0">
                  {b.status === 'Accepted' && (
                    <button
                      onClick={() => handleStartJob(b.id)}
                      disabled={actionLoading}
                      className="w-full px-4 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition"
                    >
                      Start Job
                    </button>
                  )}
                  <button
                    onClick={() => setCompleteBookingId(b.id)}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition"
                  >
                    Mark as Completed (+₹{b.estimatedCost})
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer Reviews Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-base font-bold text-white tracking-tight mb-3">
          Customer Reviews & Ratings ({reviews.length})
        </h2>
        {reviews.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No customer reviews yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reviews.map((r) => (
              <div key={r.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-white">{r.customerName}</span>
                  <span className="text-amber-400 font-bold">★ {r.rating}</span>
                </div>
                <p className="text-slate-300 leading-relaxed">{r.comment}</p>
                <p className="text-[10px] text-slate-400 mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Decline Modal */}
      {declineBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Decline Booking Request</h3>
            <p className="text-xs text-slate-400">
              Provide a brief reason so the customer can be notified and choose another technician or time.
            </p>
            <form onSubmit={handleConfirmDecline} className="space-y-4">
              <textarea
                rows={3}
                required
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g. Fully booked during requested slot, or outside service boundary..."
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeclineBookingId(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white"
                >
                  Confirm Decline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Job Modal */}
      {completeBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Complete Service Job</h3>
            <p className="text-xs text-slate-400">
              Enter any notes or parts replaced. The booking fee will be added to your total earnings.
            </p>
            <form onSubmit={handleConfirmCompletion} className="space-y-4">
              <textarea
                rows={3}
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="e.g. Replaced rubber washer and tightened valve. Tested water flow without leakage."
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCompleteBookingId(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Mark Completed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deny Connection Modal */}
      {denyModalConn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Decline Profile Request</h3>
              <button
                onClick={() => setDenyModalConn(null)}
                className="text-slate-400 hover:text-white p-1 text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to decline the connection request from{' '}
              <strong className="text-white">{denyModalConn.fromUserName}</strong>?
            </p>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Optional Reason / Note
              </label>
              <textarea
                rows={2}
                value={connDenyReason}
                onChange={(e) => setConnDenyReason(e.target.value)}
                placeholder="e.g. Schedule currently full, not accepting new inquiries..."
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setDenyModalConn(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDenyConnection}
                disabled={actionConnLoading === denyModalConn.id}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition"
              >
                {actionConnLoading === denyModalConn.id ? 'Declining...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
