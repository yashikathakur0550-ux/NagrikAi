import React, { useState, useEffect } from 'react';
import { CustomerUser, WorkerUser, PublicProfileData } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface PublicProfileModalProps {
  userId: string | null;
  onClose: () => void;
  onBookWorker?: (worker: WorkerUser) => void;
  onOpenAuthRequired?: () => void;
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({
  userId,
  onClose,
  onBookWorker,
  onOpenAuthRequired,
}) => {
  const { user: currentUser } = useAuth();
  const [profileData, setProfileData] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Share & QR states
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  // Direct connect message state
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [connectSubject, setConnectSubject] = useState('');
  const [connectMessage, setConnectMessage] = useState('');
  const [sendingConnect, setSendingConnect] = useState(false);
  const [connectSuccess, setConnectSuccess] = useState('');
  const [connectError, setConnectError] = useState('');
  const [existingConnection, setExistingConnection] = useState<any | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError('');
    setShowConnectForm(false);
    setConnectSuccess('');
    setConnectError('');

    api
      .getPublicProfile(userId)
      .then((data) => {
        setProfileData(data);
      })
      .catch((err) => {
        console.error('Failed to load profile:', err);
        setError(err.message || 'Profile could not be loaded');
      })
      .finally(() => {
        setLoading(false);
      });

    if (currentUser && currentUser.id !== userId) {
      api
        .getConnectionRequests()
        .then((data) => {
          const match = [...data.incoming, ...data.outgoing].find(
            (c) => c.fromUserId === userId || c.toUserId === userId
          );
          if (match) setExistingConnection(match);
        })
        .catch(() => {});
    }
  }, [userId, currentUser]);

  if (!userId) return null;

  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?profile=${userId}`
    : '';

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(profileUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleShareNative = async () => {
    if (!profileData) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profileData.user.fullName} on NagrikAI`,
          text: `Connect with ${profileData.user.fullName} on NagrikAI Local Service & Community Network`,
          url: profileUrl,
        });
      } catch (e) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSendConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      if (onOpenAuthRequired) onOpenAuthRequired();
      return;
    }
    if (!connectMessage.trim()) return;

    setSendingConnect(true);
    setConnectError('');
    setConnectSuccess('');

    try {
      await api.sendConnectionMessage({
        toUserId: userId,
        subject: connectSubject.trim() || 'Neighborhood Connection',
        message: connectMessage.trim(),
      });
      setConnectSuccess('Connection request sent! They have been notified.');
      setConnectMessage('');
      setConnectSubject('');
      setTimeout(() => {
        setShowConnectForm(false);
        setConnectSuccess('');
      }, 2500);
    } catch (err: any) {
      setConnectError(err.message || 'Failed to send connection message');
    } finally {
      setSendingConnect(false);
    }
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    profileUrl
  )}&bgcolor=0f172a&color=ffffff&margin=10`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Bar */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Nagrik Public Identity Card
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleShareNative}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center space-x-1.5 transition"
              title="Share profile link"
            >
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={() => setShowQrCode(!showQrCode)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              title="Scan QR Code"
            >
              QR
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* QR Code Popup */}
        {showQrCode && (
          <div className="p-4 bg-slate-950 border-b border-slate-800 text-center animate-in fade-in">
            <p className="text-xs font-semibold text-slate-300 mb-2">Scan to Open this Profile on Mobile</p>
            <div className="inline-block p-2 bg-slate-900 border border-slate-700 rounded-xl shadow-lg">
              <img src={qrImageUrl} alt="Profile QR Code" className="w-36 h-36 rounded-lg mx-auto" />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Anyone can scan this code to view this person's details and contact info.</p>
          </div>
        )}

        {/* Content Body */}
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">Loading public member profile...</p>
          </div>
        ) : error || !profileData ? (
          <div className="p-10 text-center text-rose-400 text-xs">
            {error || 'This member profile is not public or does not exist.'}
          </div>
        ) : (
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800">
              <div className="flex items-center space-x-4">
                <img
                  src={
                    (profileData.user as any).photoUrl ||
                    profileData.user.avatarUrl ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profileData.user.fullName)}`
                  }
                  alt={profileData.user.fullName}
                  className="w-16 h-16 rounded-2xl bg-slate-800 object-cover border-2 border-blue-500/40 shadow-md shrink-0"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-bold text-white tracking-tight">{profileData.user.fullName}</h2>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                        profileData.role === 'worker'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      }`}
                    >
                      {profileData.role === 'worker' ? 'Verified Provider' : 'Citizen Member'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    {profileData.role === 'worker'
                      ? `${(profileData.user as WorkerUser).serviceCategory} Specialist • ${(profileData.user as WorkerUser).experienceYears} Years Exp`
                      : (profileData.user as CustomerUser).occupation || 'Community Resident'}
                  </p>

                  <p className="text-[11px] text-slate-400 flex items-center space-x-1 mt-1">
                    <span>📍</span>
                    <span>
                      {(profileData.user as any).neighborhood
                        ? `${(profileData.user as any).neighborhood}, ${profileData.user.city}`
                        : profileData.user.city}
                    </span>
                  </p>
                </div>
              </div>

              {/* Worker Quick Metric or Citizen Member ID */}
              {profileData.role === 'worker' ? (
                <div className="text-left sm:text-right bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                  <div className="text-xs text-amber-400 font-bold">
                    ★ {(profileData.user as WorkerUser).rating.toFixed(1)} ({(profileData.user as WorkerUser).reviewCount} reviews)
                  </div>
                  <div className="text-xs text-slate-300 font-semibold mt-1">
                    ₹{(profileData.user as WorkerUser).serviceCharge} Visit Fee
                  </div>
                  <div className="text-[11px] text-emerald-400">
                    {(profileData.user as WorkerUser).isAvailable ? '● Available for Work' : '○ Currently Offline'}
                  </div>
                </div>
              ) : (
                <div className="text-left sm:text-right bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Citizen ID</span>
                  <span className="font-mono text-blue-400 font-semibold text-xs">{profileData.user.id}</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Verified Public Profile</span>
                </div>
              )}
            </div>

            {/* Share link snippet box */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2 text-xs">
              <div className="overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Public Profile URL</span>
                <span className="font-mono text-slate-300 text-xs truncate block">{profileUrl}</span>
              </div>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shrink-0 transition"
              >
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            {/* About / Bio */}
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">About & Background</h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                {profileData.user.bio || 'This community member is active on NagrikAI to connect with neighbors and local service professionals.'}
              </p>
            </div>

            {/* Skills & Mutual Help */}
            {profileData.role === 'customer' ? (
              <div className="space-y-3">
                {(profileData.user as CustomerUser).skillsCanHelpWith && (profileData.user as CustomerUser).skillsCanHelpWith!.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                      Skills I Can Help Neighbors With
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {(profileData.user as CustomerUser).skillsCanHelpWith!.map((skill, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(profileData.user as CustomerUser).lookingForServices && (profileData.user as CustomerUser).lookingForServices!.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                      Services Frequently Needed
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {(profileData.user as CustomerUser).lookingForServices!.map((serv, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/30">
                          {serv}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                  Specialized Skills & Qualifications
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(profileData.user as WorkerUser).skills.map((skill, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Contact & Profile Request Options */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📬</span>
                  <span>Connect & Send Request</span>
                </span>
                {profileData.user.allowDirectContact ? (
                  <span className="text-[11px] text-emerald-400 font-medium">Public Contact Allowed</span>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium">Profile Inquiries Allowed</span>
                )}
              </div>

              {/* Active Connection Status Badge */}
              {existingConnection?.status === 'accepted' ? (
                <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-base">🤝</span>
                    <span>You and {profileData.user.fullName} are connected members!</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    Connected
                  </span>
                </div>
              ) : existingConnection?.status === 'pending' ? (
                <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-base">⏳</span>
                    <span>Connection request is pending acceptance on their dashboard</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    Pending
                  </span>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-1">
                {profileData.user.allowDirectContact !== false && profileData.user.phone && (
                  <a
                    href={`tel:${profileData.user.phone}`}
                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-700"
                  >
                    <span>📞</span>
                    <span>Call {profileData.user.phone}</span>
                  </a>
                )}

                {profileData.user.allowDirectContact !== false && profileData.user.phone && (
                  <a
                    href={`https://wa.me/${profileData.user.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold flex items-center space-x-1.5 transition border border-emerald-500/30"
                  >
                    <span>💬</span>
                    <span>WhatsApp</span>
                  </a>
                )}

                {currentUser?.id !== profileData.user.id && (
                  <button
                    onClick={() => {
                      setShowConnectForm(!showConnectForm);
                      if (!connectSubject) {
                        setConnectSubject(
                          profileData.role === 'worker'
                            ? `Service Inquiry for ${profileData.user.fullName}`
                            : `Neighborhood Connection & Citizen Support`
                        );
                      }
                    }}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm ${
                      existingConnection?.status === 'accepted'
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    <span>✉️</span>
                    <span>
                      {existingConnection?.status === 'accepted'
                        ? 'Send Direct Message Note'
                        : existingConnection?.status === 'pending'
                        ? 'Send Additional Note'
                        : `Send Request to ${profileData.user.fullName}`}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Inline Connect / Message Form */}
            {showConnectForm && (
              <form onSubmit={handleSendConnection} className="p-4 rounded-xl bg-slate-950 border border-blue-500/40 space-y-3">
                <h4 className="text-xs font-bold text-white">Send Direct Message to {profileData.user.fullName}</h4>

                {connectSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                    {connectSuccess}
                  </div>
                )}
                {connectError && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                    {connectError}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Subject</label>
                  <input
                    type="text"
                    value={connectSubject}
                    onChange={(e) => setConnectSubject(e.target.value)}
                    placeholder="e.g. Question about AC installation / Neighborhood gardening"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {[
                      profileData.role === 'worker' ? 'Service Consultation & Quote' : 'Civic Advice & Help',
                      'Neighborhood Collaboration',
                      'Local Service Recommendations',
                      'General Profile Connection',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setConnectSubject(preset)}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Your Message</label>
                  <textarea
                    rows={3}
                    required
                    value={connectMessage}
                    onChange={(e) => setConnectMessage(e.target.value)}
                    placeholder="Introduce yourself and explain what you'd like to connect about..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowConnectForm(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingConnect}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                  >
                    {sendingConnect ? 'Sending...' : 'Send Connection Request'}
                  </button>
                </div>
              </form>
            )}

            {/* Worker Reviews Section */}
            {profileData.role === 'worker' && profileData.reviews && profileData.reviews.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Verified Client Reviews ({profileData.reviews.length})
                </h3>
                <div className="space-y-2">
                  {profileData.reviews.map((rev) => (
                    <div key={rev.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-white">{rev.customerName}</span>
                        <span className="text-amber-400 font-bold">★ {rev.rating}</span>
                      </div>
                      <p className="text-slate-400">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Community Activity */}
            {profileData.communityPosts && profileData.communityPosts.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Recent Community Posts ({profileData.communityPosts.length})
                </h3>
                <div className="space-y-2">
                  {profileData.communityPosts.map((post) => (
                    <div key={post.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                      <h4 className="font-semibold text-white">{post.title}</h4>
                      <p className="text-slate-400 mt-1 line-clamp-2">{post.content}</p>
                      <div className="mt-2 flex items-center space-x-3 text-[11px] text-slate-400">
                        <span>❤️ {post.likesCount}</span>
                        <span>💬 {post.replies?.length || 0} replies</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            {profileData.role === 'worker' && onBookWorker && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onBookWorker(profileData.user as WorkerUser);
                  }}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-md"
                >
                  Schedule Service with {profileData.user.fullName}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
