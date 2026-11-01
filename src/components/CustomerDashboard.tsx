import React, { useState, useEffect } from 'react';
import { CustomerUser, WorkerUser, ServiceCategory, ServiceReview, CommunityConnectionMessage } from '../types';
import { api } from '../services/api';
import { SERVICE_CATEGORIES, INDIAN_CITIES } from '../data/categories';

interface CustomerDashboardProps {
  customer: CustomerUser;
  onNavigateTab: (tab: any) => void;
  selectedCategoryFromParent?: ServiceCategory | null;
  onClearSelectedCategory?: () => void;
  onOpenPublicProfile?: (userId: string) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  customer,
  onNavigateTab,
  selectedCategoryFromParent,
  onClearSelectedCategory,
  onOpenPublicProfile,
}) => {
  const [workers, setWorkers] = useState<WorkerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(selectedCategoryFromParent || 'All');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'price_low'>('rating');

  // Connection requests received by customer (shown directly on dashboard)
  const [incomingConnections, setIncomingConnections] = useState<CommunityConnectionMessage[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [actionConnLoading, setActionConnLoading] = useState<string | null>(null);
  const [denyModalConn, setDenyModalConn] = useState<CommunityConnectionMessage | null>(null);
  const [denyReason, setDenyReason] = useState('');
  const [connFeedback, setConnFeedback] = useState<string | null>(null);

  // Send request to worker from profile modal state
  const [showWorkerConnectForm, setShowWorkerConnectForm] = useState(false);
  const [workerConnectSubject, setWorkerConnectSubject] = useState('');
  const [workerConnectMessage, setWorkerConnectMessage] = useState('');
  const [sendingWorkerConnect, setSendingWorkerConnect] = useState(false);
  const [workerConnectFeedback, setWorkerConnectFeedback] = useState<string | null>(null);

  // Profile details modal
  const [viewingWorker, setViewingWorker] = useState<WorkerUser | null>(null);
  const [workerReviews, setWorkerReviews] = useState<ServiceReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Booking modal
  const [bookingWorker, setBookingWorker] = useState<WorkerUser | null>(null);
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [preferredTime, setPreferredTime] = useState('10:00 AM - 12:00 PM');
  const [serviceRequired, setServiceRequired] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState('');
  const [bookingErrorMsg, setBookingErrorMsg] = useState('');

  // Saved workers set
  const [savedWorkerIds, setSavedWorkerIds] = useState<string[]>(customer.savedWorkerIds || []);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const res = await api.getWorkers({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        city: selectedCity !== 'All' ? selectedCity : undefined,
        search: searchQuery.trim() || undefined,
        available: availableOnly || undefined,
      });
      setWorkers(res.workers);
    } catch (err) {
      console.error('Failed to fetch workers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCategoryFromParent) {
      setSelectedCategory(selectedCategoryFromParent);
    }
  }, [selectedCategoryFromParent]);

  useEffect(() => {
    fetchWorkers();
  }, [selectedCategory, selectedCity, availableOnly]);

  const fetchConnections = async () => {
    setLoadingConnections(true);
    try {
      const res = await api.getConnectionRequests();
      setIncomingConnections(res.incoming || []);
    } catch (err) {
      console.warn('Failed to fetch connections:', err);
    } finally {
      setLoadingConnections(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleAcceptConnection = async (connId: string) => {
    setActionConnLoading(connId);
    setConnFeedback(null);
    try {
      await api.respondToConnectionRequest(connId, 'accepted');
      setConnFeedback('Connection request accepted! You are now connected with direct contact unlocked.');
      await fetchConnections();
    } catch (err: any) {
      setConnFeedback(err.message || 'Failed to accept connection request');
    } finally {
      setActionConnLoading(null);
    }
  };

  const handleConfirmDeny = async () => {
    if (!denyModalConn) return;
    setActionConnLoading(denyModalConn.id);
    setConnFeedback(null);
    try {
      await api.respondToConnectionRequest(denyModalConn.id, 'declined', denyReason.trim() || undefined);
      setConnFeedback('Connection request declined.');
      setDenyModalConn(null);
      setDenyReason('');
      await fetchConnections();
    } catch (err: any) {
      setConnFeedback(err.message || 'Failed to decline request');
    } finally {
      setActionConnLoading(null);
    }
  };

  const handleSendWorkerProfileRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingWorker || !workerConnectMessage.trim()) return;

    setSendingWorkerConnect(true);
    setWorkerConnectFeedback(null);
    try {
      await api.sendConnectionMessage({
        toUserId: viewingWorker.id,
        subject: workerConnectSubject.trim() || `Inquiry for ${viewingWorker.serviceCategory}`,
        message: workerConnectMessage.trim(),
      });
      setWorkerConnectFeedback('Request sent directly to their profile! It will appear on their dashboard.');
      setWorkerConnectMessage('');
      setWorkerConnectSubject('');
      setTimeout(() => {
        setShowWorkerConnectForm(false);
        setWorkerConnectFeedback(null);
      }, 3000);
    } catch (err: any) {
      setWorkerConnectFeedback(err.message || 'Failed to send profile request');
    } finally {
      setSendingWorkerConnect(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWorkers();
  };

  const handleOpenWorkerProfile = async (worker: WorkerUser) => {
    setViewingWorker(worker);
    setLoadingReviews(true);
    try {
      const res = await api.getWorkerById(worker.id);
      setWorkerReviews(res.reviews || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleOpenBooking = (worker: WorkerUser) => {
    setBookingWorker(worker);
    setServiceRequired(`${worker.serviceCategory} Inspection & Repair`);
    setProblemDescription('');
    setBookingSuccessMsg('');
    setBookingErrorMsg('');
  };

  const handleToggleSaveWorker = async (workerId: string) => {
    try {
      const res = await api.toggleSaveWorker(workerId);
      setSavedWorkerIds(res.savedWorkerIds);
    } catch (err) {
      console.error('Failed to save worker:', err);
    }
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingWorker) return;

    setBookingSubmitting(true);
    setBookingErrorMsg('');
    try {
      await api.createBooking({
        workerId: bookingWorker.id,
        serviceRequired,
        bookingDate,
        preferredTime,
        problemDescription,
        customerAddress: customer.address,
        customerCity: customer.city,
      });

      setBookingSuccessMsg(`Booking request sent to ${bookingWorker.fullName}!`);
      setTimeout(() => {
        setBookingWorker(null);
        setBookingSuccessMsg('');
        onNavigateTab('my-bookings');
      }, 1500);
    } catch (err: any) {
      setBookingErrorMsg(err.message || 'Failed to submit booking');
    } finally {
      setBookingSubmitting(false);
    }
  };

  // Filter & Sort
  const filteredWorkers = workers
    .filter((w) => {
      if (minRating > 0 && w.rating < minRating) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'experience') return b.experienceYears - a.experienceYears;
      if (sortBy === 'price_low') return a.serviceCharge - b.serviceCharge;
      return 0;
    });

  const timeSlots = [
    '08:00 AM - 10:00 AM',
    '10:00 AM - 12:00 PM',
    '12:00 PM - 02:00 PM',
    '02:00 PM - 04:00 PM',
    '04:00 PM - 06:00 PM',
    '06:00 PM - 08:00 PM',
  ];

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Welcome back, {customer.fullName}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                Customer
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Registered City: <span className="text-slate-300 font-medium">{customer.city}</span> • Address: <span className="text-slate-300">{customer.address || 'Standard Address'}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigateTab('ai-advisor')}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-950 text-blue-300 border border-blue-800 hover:bg-blue-900 transition flex items-center space-x-1.5"
            >
              <span>AI Problem Diagnostic</span>
            </button>
            <button
              onClick={() => onNavigateTab('nearby-map')}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              Live GPS Map View
            </button>
          </div>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-5 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by service (e.g. AC repair, plumbing leak, electrician, carpenter, pest control)..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* INCOMING PROFILE & CONNECTION REQUESTS ON RECEIVER'S DASHBOARD */}
      {incomingConnections.filter((c) => c.status === 'pending').length > 0 && (
        <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/60 border border-blue-500/40 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-3">
              <span className="text-2xl p-2 rounded-xl bg-blue-500/20 border border-blue-500/30">📬</span>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Incoming Profile & Connection Requests
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
                    {incomingConnections.filter((c) => c.status === 'pending').length} Pending
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Members who sent a direct connection request to your profile. Accept to unlock contacts or deny if not relevant.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('profile')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
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
                  className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 hover:border-blue-500/40 transition flex flex-col justify-between space-y-3"
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
                            {conn.fromUserRole === 'worker' ? 'Service Pro' : 'Citizen Member'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {conn.fromUserNeighborhood ? `${conn.fromUserNeighborhood}, ` : ''}{conn.fromUserCity || 'Local Member'} •{' '}
                          {new Date(conn.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {onOpenPublicProfile && (
                      <button
                        onClick={() => onOpenPublicProfile(conn.fromUserId)}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-medium whitespace-nowrap"
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
                      <span>{actionConnLoading === conn.id ? 'Accepting...' : 'Accept Request'}</span>
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

      {/* Category Pills (15 Categories) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider text-slate-300">Browse by Service Category</span>
          {selectedCategory !== 'All' && (
            <button
              onClick={() => {
                setSelectedCategory('All');
                if (onClearSelectedCategory) onClearSelectedCategory();
              }}
              className="text-blue-400 hover:underline"
            >
              Reset to All Categories
            </button>
          )}
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              selectedCategory === 'All'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Services ({workers.length})
          </button>

          {SERVICE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary Filter Bar */}
      <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* City filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">City:</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-slate-200 text-xs focus:outline-none"
            >
              {INDIAN_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Min Rating */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Rating:</span>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-slate-200 text-xs focus:outline-none"
            >
              <option value="0">Any Rating</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.8">4.8+ Stars</option>
            </select>
          </div>

          {/* Availability Checkbox */}
          <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
            />
            <span>Available Now Only</span>
          </label>
        </div>

        {/* Sort By */}
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-400">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-slate-200 text-xs focus:outline-none"
          >
            <option value="rating">Top Rated</option>
            <option value="experience">Most Experienced</option>
            <option value="price_low">Lowest Visit Fee</option>
          </select>
        </div>
      </div>

      {/* Workers Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          Loading verified local professionals...
        </div>
      ) : filteredWorkers.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-base font-semibold text-white">No service providers found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, switching cities, or clearing category filters.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedCity('All');
              setSearchQuery('');
              setAvailableOnly(false);
              setMinRating(0);
            }}
            className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkers.map((worker) => {
            const isSaved = savedWorkerIds.includes(worker.id);
            return (
              <div
                key={worker.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition-all"
              >
                <div>
                  {/* Top card bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src={worker.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(worker.fullName)}`}
                        alt={worker.fullName}
                        className="w-12 h-12 rounded-xl bg-slate-800 object-cover border border-slate-700 shrink-0"
                      />
                      <div>
                        <h3 className="font-bold text-white text-base leading-tight">{worker.fullName}</h3>
                        <p className="text-xs text-blue-400 font-medium mt-0.5">{worker.serviceCategory}</p>
                        <p className="text-[11px] text-slate-400">{worker.city}</p>
                      </div>
                    </div>

                    {/* Bookmark Button */}
                    <button
                      onClick={() => handleToggleSaveWorker(worker.id)}
                      className={`p-1.5 rounded-lg border text-xs transition ${
                        isSaved
                          ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                      title={isSaved ? 'Remove from saved' : 'Save provider'}
                    >
                      {isSaved ? '★' : '☆'}
                    </button>
                  </div>

                  {/* Rating & Availability strip */}
                  <div className="mt-4 flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-amber-400 font-bold">★ {worker.rating.toFixed(1)}</span>
                      <span className="text-slate-400">({worker.reviewCount} reviews)</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className={`w-2 h-2 rounded-full ${worker.isAvailable ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                      <span className={worker.isAvailable ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                        {worker.isAvailable ? 'Available Now' : 'Offline'}
                      </span>
                    </div>
                  </div>

                  {/* Skills tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {worker.skills.slice(0, 3).map((skill, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {skill}
                      </span>
                    ))}
                    {worker.skills.length > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400">
                        +{worker.skills.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Bio snippet */}
                  <p className="mt-3 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {worker.bio}
                  </p>
                </div>

                {/* Bottom Card Footer */}
                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-slate-400">Inspection / Visit</p>
                    <p className="text-sm font-bold text-white">₹{worker.serviceCharge}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenWorkerProfile(worker)}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => handleOpenBooking(worker)}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Worker Profile & Reviews Modal */}
      {viewingWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Service Provider Profile
              </span>
              <button
                onClick={() => setViewingWorker(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center space-x-4">
                <img
                  src={viewingWorker.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(viewingWorker.fullName)}`}
                  alt={viewingWorker.fullName}
                  className="w-16 h-16 rounded-xl bg-slate-800 object-cover border border-slate-700"
                />
                <div>
                  <h2 className="text-lg font-bold text-white">{viewingWorker.fullName}</h2>
                  <p className="text-sm text-blue-400 font-semibold">{viewingWorker.serviceCategory}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {viewingWorker.experienceYears} Years Experience • {viewingWorker.city}
                  </p>
                </div>
              </div>

              {/* Status & Rates */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs">
                <div>
                  <span className="text-slate-400 block">Rating</span>
                  <span className="text-sm font-bold text-amber-400">★ {viewingWorker.rating.toFixed(1)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Visit Fee</span>
                  <span className="text-sm font-bold text-white">₹{viewingWorker.serviceCharge}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Completed</span>
                  <span className="text-sm font-bold text-emerald-400">{viewingWorker.totalCompletedJobs} jobs</span>
                </div>
              </div>

              {/* Working Hours & Address */}
              <div className="text-xs space-y-1 text-slate-300">
                <p><strong className="text-slate-400">Working Hours:</strong> {viewingWorker.workingHours}</p>
                <p><strong className="text-slate-400">Service Area:</strong> {viewingWorker.serviceAddress}</p>
                <p><strong className="text-slate-400">Phone:</strong> {viewingWorker.phone}</p>
              </div>

              {/* Bio */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">About</h4>
                <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  {viewingWorker.bio}
                </p>
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Specializations</h4>
                <div className="flex flex-wrap gap-1.5">
                  {viewingWorker.skills.map((s, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Verified Reviews */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Customer Reviews ({workerReviews.length})
                </h4>
                {loadingReviews ? (
                  <p className="text-xs text-slate-400">Loading reviews...</p>
                ) : workerReviews.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No reviews yet for this professional.</p>
                ) : (
                  <div className="space-y-2">
                    {workerReviews.map((r) => (
                      <div key={r.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-white">{r.customerName}</span>
                          <span className="text-amber-400 font-bold">★ {r.rating}</span>
                        </div>
                        <p className="text-slate-400">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Send Profile Request / Inquiry to Worker */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Connect Directly with {viewingWorker.fullName}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowWorkerConnectForm(!showWorkerConnectForm);
                      setWorkerConnectFeedback(null);
                      if (!workerConnectSubject) {
                        setWorkerConnectSubject(`Question about ${viewingWorker.serviceCategory}`);
                      }
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    {showWorkerConnectForm ? 'Hide Form' : '✉️ Send Request to Profile'}
                  </button>
                </div>

                {workerConnectFeedback && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                    {workerConnectFeedback}
                  </div>
                )}

                {showWorkerConnectForm && (
                  <form onSubmit={handleSendWorkerProfileRequest} className="space-y-2 pt-2 border-t border-slate-800">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Subject</label>
                      <input
                        type="text"
                        value={workerConnectSubject}
                        onChange={(e) => setWorkerConnectSubject(e.target.value)}
                        placeholder="e.g. Rate quote for bathroom tiles / AC installation inquiry"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Message Note</label>
                      <textarea
                        rows={2}
                        required
                        value={workerConnectMessage}
                        onChange={(e) => setWorkerConnectMessage(e.target.value)}
                        placeholder="Hello, I saw your profile on NagrikAI. Could you connect to discuss..."
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowWorkerConnectForm(false)}
                        className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={sendingWorkerConnect}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                      >
                        {sendingWorkerConnect ? 'Sending...' : 'Send Profile Request'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    const targetWorker = viewingWorker;
                    setViewingWorker(null);
                    handleOpenBooking(targetWorker);
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-1.5 shadow"
                >
                  <span>📅</span>
                  <span>Book Service Request</span>
                </button>

                {onOpenPublicProfile && (
                  <button
                    onClick={() => {
                      const targetWorkerId = viewingWorker.id;
                      setViewingWorker(null);
                      onOpenPublicProfile(targetWorkerId);
                    }}
                    className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-1.5"
                  >
                    <span>👤</span>
                    <span>View Full Profile Card</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book Service Modal */}
      {bookingWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Schedule Booking Request
              </span>
              <button
                onClick={() => setBookingWorker(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Assigned Professional</p>
                  <p className="text-sm font-bold text-white">{bookingWorker.fullName}</p>
                  <p className="text-xs text-blue-400">{bookingWorker.serviceCategory}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Base Visit Fee</p>
                  <p className="text-base font-bold text-emerald-400">₹{bookingWorker.serviceCharge}</p>
                </div>
              </div>

              {bookingSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg">
                  {bookingSuccessMsg}
                </div>
              )}

              {bookingErrorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg">
                  {bookingErrorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Service Required</label>
                <input
                  type="text"
                  required
                  value={serviceRequired}
                  onChange={(e) => setServiceRequired(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Time Slot</label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    {timeSlots.map((ts) => (
                      <option key={ts} value={ts}>
                        {ts}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Problem Description / Specific Symptoms
                </label>
                <textarea
                  rows={3}
                  required
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="e.g. Master bathroom tap leaking continuously, needs washer replacement."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-slate-400">
                <p className="font-semibold text-slate-300">Service Location:</p>
                <p>{customer.address || 'Address on file'}, {customer.city}</p>
                <p className="text-[11px] text-slate-400 mt-1">Contact: {customer.phone}</p>
              </div>

              <button
                type="submit"
                disabled={bookingSubmitting}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition"
              >
                {bookingSubmitting ? 'Sending Request...' : 'Confirm & Request Booking'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Deny Connection Modal */}
      {denyModalConn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Decline Connection Request</h3>
              <button
                onClick={() => setDenyModalConn(null)}
                className="text-slate-400 hover:text-white p-1 text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to decline the request from{' '}
              <strong className="text-white">{denyModalConn.fromUserName}</strong>?
            </p>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Optional Note / Reason
              </label>
              <textarea
                rows={2}
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value)}
                placeholder="e.g. Currently not accepting new connections..."
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
                onClick={handleConfirmDeny}
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
