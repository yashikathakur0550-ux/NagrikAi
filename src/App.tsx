import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { CustomerUser, WorkerUser, CustomerTab, WorkerTab, ServiceCategory } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { CustomerDashboard } from './components/CustomerDashboard';
import { WorkerDashboard } from './components/WorkerDashboard';
import { NearbyMapView } from './components/NearbyMapView';
import { BookingsView } from './components/BookingsView';
import { CategoriesView } from './components/CategoriesView';
import { SavedWorkersView } from './components/SavedWorkersView';
import { AiServiceAdvisorView } from './components/AiServiceAdvisorView';
import { NotificationsView } from './components/NotificationsView';
import { ProfileView } from './components/ProfileView';
import { CommunityView } from './components/CommunityView';
import { PublicProfileModal } from './components/PublicProfileModal';

export default function App() {
  const { user, role, loading } = useAuth();

  // Navigation tab state
  const [customerTab, setCustomerTab] = useState<CustomerTab>('explore');
  const [workerTab, setWorkerTab] = useState<WorkerTab>('dashboard');

  // Filter pass-through (e.g. from Categories view or AI advisor to Explore)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<ServiceCategory | null>(null);

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<'customer' | 'worker'>('customer');
  const [authModalIsSignUp, setAuthModalIsSignUp] = useState(false);
  const [authModalDefaultCategory, setAuthModalDefaultCategory] = useState<ServiceCategory | undefined>();

  // Global counts
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [activeBookingsCount, setActiveBookingsCount] = useState(0);
  const [pendingConnectionsCount, setPendingConnectionsCount] = useState(0);

  // Public Profile Modal State (deep-link support for ?profile=ID or ?member=ID)
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('profile') || params.get('member') || null;
    }
    return null;
  });

  // Track landing page community preview mode
  const [landingCommunityMode, setLandingCommunityMode] = useState(false);

  const fetchBadges = async () => {
    if (!user) return;
    try {
      const [notifsRes, bookingsRes, connsRes] = await Promise.all([
        api.getNotifications().catch(() => ({ notifications: [] })),
        api.getBookings().catch(() => ({ bookings: [] })),
        api.getConnectionRequests().catch(() => ({ pendingCount: 0 })),
      ]);

      const unread = notifsRes.notifications.filter((n) => !n.read).length;
      setUnreadNotifications(unread);
      setPendingConnectionsCount(connsRes.pendingCount || 0);

      if (role === 'worker') {
        const pending = bookingsRes.bookings.filter((b) => b.status === 'Requested').length;
        setPendingRequestsCount(pending);
      } else {
        const active = bookingsRes.bookings.filter(
          (b) => b.status === 'Requested' || b.status === 'Accepted' || b.status === 'In Progress'
        ).length;
        setActiveBookingsCount(active);
      }
    } catch (err) {
      console.warn('Failed to refresh badges:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBadges();
      const interval = setInterval(fetchBadges, 30000);
      return () => clearInterval(interval);
    }
  }, [user, role]);

  const handleOpenAuth = (targetRole: 'customer' | 'worker', isSignUp = false, category?: ServiceCategory) => {
    setAuthModalRole(targetRole);
    setAuthModalIsSignUp(isSignUp);
    setAuthModalDefaultCategory(category);
    setAuthModalOpen(true);
  };

  const handleSelectCategoryFromAdvisorOrGrid = (category: ServiceCategory) => {
    setSelectedCategoryFilter(category);
    setCustomerTab('explore');
  };

  const handleBookWorkerFromMap = (worker: WorkerUser) => {
    setSelectedCategoryFilter(worker.serviceCategory);
    setCustomerTab('explore');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Initializing NagrikAI Marketplace...</p>
        </div>
      </div>
    );
  }

  // Not logged in: Show Landing Page or Community Preview
  if (!user || !role) {
    return (
      <>
        <Navbar
          onOpenAuth={handleOpenAuth}
          onNavigateTab={(t) => {
            if (t === 'community') setLandingCommunityMode(true);
          }}
          unreadCount={0}
        />

        {landingCommunityMode ? (
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => setLandingCommunityMode(false)}
                className="text-xs font-semibold text-blue-400 hover:underline flex items-center space-x-1"
              >
                <span>← Back to Home</span>
              </button>
              <button
                onClick={() => handleOpenAuth('customer', true)}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Join & Publish My Profile
              </button>
            </div>
            <CommunityView
              onOpenPublicProfile={(id) => setViewingProfileId(id)}
              onNavigateTab={() => {}}
              onOpenAuthModal={() => handleOpenAuth('customer', false)}
            />
          </div>
        ) : (
          <LandingPage
            onOpenAuth={handleOpenAuth}
            onSelectCategoryPreview={(cat) => handleOpenAuth('customer', false, cat)}
            onOpenAdvisorPreview={() => handleOpenAuth('customer', false)}
            onOpenCommunityPreview={() => setLandingCommunityMode(true)}
          />
        )}

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialRole={authModalRole}
          initialSignUp={authModalIsSignUp}
          initialCategory={authModalDefaultCategory}
        />

        {viewingProfileId && (
          <PublicProfileModal
            userId={viewingProfileId}
            onClose={() => setViewingProfileId(null)}
            onOpenAuthRequired={() => handleOpenAuth('customer', false)}
          />
        )}
      </>
    );
  }

  // Logged In: Customer or Worker Portal
  const isWorker = role === 'worker';
  const currentTab = isWorker ? workerTab : customerTab;
  const onSelectTab = isWorker ? (t: WorkerTab) => setWorkerTab(t) : (t: CustomerTab) => setCustomerTab(t);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        onOpenAuth={handleOpenAuth}
        onNavigateTab={onSelectTab}
        unreadCount={unreadNotifications}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Sidebar */}
        <div className="hidden md:block">
          <Sidebar
            currentTab={currentTab}
            onSelectTab={onSelectTab}
            pendingRequestsCount={pendingRequestsCount}
            activeBookingsCount={activeBookingsCount}
            pendingConnectionsCount={pendingConnectionsCount}
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Mobile Top Navigation bar */}
          <div className="md:hidden mb-4 overflow-x-auto pb-1 flex space-x-2 scrollbar-none">
            {isWorker ? (
              <>
                <button
                  onClick={() => setWorkerTab('dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    workerTab === 'dashboard' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setWorkerTab('community')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    workerTab === 'community' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  Community
                </button>
                <button
                  onClick={() => setWorkerTab('requests')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    workerTab === 'requests' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  Requests ({pendingRequestsCount})
                </button>
                <button
                  onClick={() => setWorkerTab('active-jobs')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    workerTab === 'active-jobs' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  Active Jobs
                </button>
                <button
                  onClick={() => setWorkerTab('earnings')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    workerTab === 'earnings' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  Earnings
                </button>
                <button
                  onClick={() => setWorkerTab('profile')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center space-x-1.5 ${
                    workerTab === 'profile' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  <span>Profile</span>
                  {pendingConnectionsCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                      {pendingConnectionsCount}
                    </span>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setCustomerTab('explore')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    customerTab === 'explore' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  Explore
                </button>
                <button
                  onClick={() => setCustomerTab('community')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    customerTab === 'community' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  Community
                </button>
                <button
                  onClick={() => setCustomerTab('categories')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    customerTab === 'categories' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  15 Categories
                </button>
                <button
                  onClick={() => setCustomerTab('my-bookings')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    customerTab === 'my-bookings' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  Bookings ({activeBookingsCount})
                </button>
                <button
                  onClick={() => setCustomerTab('nearby-map')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    customerTab === 'nearby-map' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  Map Radar
                </button>
                <button
                  onClick={() => setCustomerTab('ai-advisor')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    customerTab === 'ai-advisor' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  AI Advisor
                </button>
                <button
                  onClick={() => setCustomerTab('profile')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center space-x-1.5 ${
                    customerTab === 'profile' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  <span>Profile</span>
                  {pendingConnectionsCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                      {pendingConnectionsCount}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Customer Portal Tabs */}
          {!isWorker && (
            <>
              {customerTab === 'explore' && (
                <CustomerDashboard
                  customer={user as CustomerUser}
                  onNavigateTab={setCustomerTab}
                  selectedCategoryFromParent={selectedCategoryFilter}
                  onClearSelectedCategory={() => setSelectedCategoryFilter(null)}
                  onOpenPublicProfile={(id) => setViewingProfileId(id)}
                />
              )}

              {customerTab === 'community' && (
                <CommunityView
                  onOpenPublicProfile={(id) => setViewingProfileId(id)}
                  onNavigateTab={setCustomerTab}
                  onBookWorker={(w) => {
                    setSelectedCategoryFilter(w.serviceCategory);
                    setCustomerTab('explore');
                  }}
                />
              )}

              {customerTab === 'categories' && (
                <CategoriesView onSelectCategory={handleSelectCategoryFromAdvisorOrGrid} />
              )}

              {customerTab === 'nearby-map' && (
                <NearbyMapView onBookWorker={handleBookWorkerFromMap} />
              )}

              {customerTab === 'my-bookings' && <BookingsView />}

              {customerTab === 'saved-workers' && (
                <SavedWorkersView
                  customer={user as CustomerUser}
                  onBookWorker={handleBookWorkerFromMap}
                />
              )}

              {customerTab === 'ai-advisor' && (
                <AiServiceAdvisorView
                  customerName={user.fullName}
                  customerCity={user.city}
                  onSelectCategory={handleSelectCategoryFromAdvisorOrGrid}
                />
              )}

              {customerTab === 'notifications' && (
                <NotificationsView
                  onRefreshBadge={fetchBadges}
                  onNavigateToBookings={() => setCustomerTab('my-bookings')}
                />
              )}

              {customerTab === 'profile' && <ProfileView />}
            </>
          )}

          {/* Worker Portal Tabs */}
          {isWorker && (
            <>
              {(workerTab === 'dashboard' ||
                workerTab === 'requests' ||
                workerTab === 'active-jobs' ||
                workerTab === 'earnings' ||
                workerTab === 'reviews') && (
                <WorkerDashboard
                  worker={user as WorkerUser}
                  onNavigateTab={setWorkerTab}
                  onOpenPublicProfile={(id) => setViewingProfileId(id)}
                />
              )}

              {workerTab === 'community' && (
                <CommunityView
                  onOpenPublicProfile={(id) => setViewingProfileId(id)}
                  onNavigateTab={setWorkerTab}
                />
              )}

              {workerTab === 'notifications' && (
                <NotificationsView
                  onRefreshBadge={fetchBadges}
                  onNavigateToBookings={() => setWorkerTab('requests')}
                />
              )}

              {workerTab === 'profile' && <ProfileView />}
            </>
          )}
        </main>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialRole={authModalRole}
        initialSignUp={authModalIsSignUp}
        initialCategory={authModalDefaultCategory}
      />

      {/* Global Public Profile Modal */}
      {viewingProfileId && (
        <PublicProfileModal
          userId={viewingProfileId}
          onClose={() => setViewingProfileId(null)}
          onBookWorker={(w) => {
            setViewingProfileId(null);
            setSelectedCategoryFilter(w.serviceCategory);
            setCustomerTab('explore');
          }}
          onOpenAuthRequired={() => handleOpenAuth('customer', false)}
        />
      )}
    </div>
  );
}
