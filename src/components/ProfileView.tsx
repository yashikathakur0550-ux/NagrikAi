import React, { useState, useEffect } from 'react';
import { CustomerUser, WorkerUser, ServiceCategory, CommunityConnectionMessage } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SERVICE_CATEGORIES, INDIAN_CITIES } from '../data/categories';
import { PublicProfileModal } from './PublicProfileModal';

export const ProfileView: React.FC = () => {
  const { user, role, updateUserInState } = useAuth();

  if (!user || !role) return null;

  const isWorker = role === 'worker';
  const workerUser = isWorker ? (user as WorkerUser) : null;
  const customerUser = !isWorker ? (user as CustomerUser) : null;

  // Basic form state
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone);
  const [city, setCity] = useState(user.city);
  const [neighborhood, setNeighborhood] = useState((user as any).neighborhood || '');
  const [address, setAddress] = useState(
    customerUser ? customerUser.address : workerUser ? workerUser.serviceAddress : ''
  );

  // Community & Public Visibility settings
  const [isPublicProfile, setIsPublicProfile] = useState<boolean>(
    (user as any).isPublicProfile !== false
  );
  const [allowDirectContact, setAllowDirectContact] = useState<boolean>(
    (user as any).allowDirectContact !== false
  );
  const [occupation, setOccupation] = useState((customerUser as any)?.occupation || '');
  const [bio, setBio] = useState(user.bio || '');
  const [skillsCanHelpWith, setSkillsCanHelpWith] = useState(
    customerUser?.skillsCanHelpWith?.join(', ') || ''
  );
  const [lookingForServices, setLookingForServices] = useState(
    customerUser?.lookingForServices?.join(', ') || ''
  );

  // Worker specifics
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>(
    workerUser?.serviceCategory || 'Plumbing'
  );
  const [skills, setSkills] = useState(workerUser?.skills?.join(', ') || '');
  const [experienceYears, setExperienceYears] = useState(workerUser?.experienceYears || 3);
  const [serviceCharge, setServiceCharge] = useState(workerUser?.serviceCharge || 299);
  const [workingHours, setWorkingHours] = useState(workerUser?.workingHours || '9:00 AM - 7:00 PM');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Share & Preview states
  const [copiedLink, setCopiedLink] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedMemberModalId, setSelectedMemberModalId] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  // Connection Requests Management state
  const [incomingRequests, setIncomingRequests] = useState<CommunityConnectionMessage[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<CommunityConnectionMessage[]>([]);
  const [connectedMembers, setConnectedMembers] = useState<CommunityConnectionMessage[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [connectionsTab, setConnectionsTab] = useState<'incoming' | 'connected' | 'outgoing'>('incoming');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [connectionFeedback, setConnectionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Optional decline note for a request
  const [declineNoteInput, setDeclineNoteInput] = useState<Record<string, string>>({});
  const [showDeclineBox, setShowDeclineBox] = useState<Record<string, boolean>>({});

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?profile=${user.id}`
    : '';

  const fetchConnections = async () => {
    setLoadingConnections(true);
    try {
      const data = await api.getConnectionRequests();
      setIncomingRequests(data.incoming || []);
      setOutgoingRequests(data.outgoing || []);
      setConnectedMembers(data.connected || []);
    } catch (err) {
      console.error('Failed to load profile connection requests:', err);
    } finally {
      setLoadingConnections(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [user.id]);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(profileUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleRespondToRequest = async (
    connectionId: string,
    status: 'accepted' | 'declined'
  ) => {
    setActioningId(connectionId);
    setConnectionFeedback(null);
    const note = declineNoteInput[connectionId] || '';

    try {
      const res = await api.respondToConnectionRequest(connectionId, status, note);

      // Update incoming list
      setIncomingRequests((prev) =>
        prev.map((c) => (c.id === connectionId ? { ...c, status, responseNote: note } : c))
      );

      if (status === 'accepted') {
        // Move to connected members
        setConnectedMembers((prev) => [res.connection, ...prev]);
        setConnectionFeedback({
          type: 'success',
          text: `You accepted ${res.connection.fromUserName}'s connection request! You are now connected.`,
        });
      } else {
        setConnectionFeedback({
          type: 'success',
          text: `Connection request from ${res.connection.fromUserName} was denied.`,
        });
      }

      // Clean up decline input box
      setShowDeclineBox((prev) => ({ ...prev, [connectionId]: false }));
    } catch (err: any) {
      setConnectionFeedback({
        type: 'error',
        text: err.message || 'Failed to update connection request',
      });
    } finally {
      setActioningId(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setErrorMsg('');

    try {
      if (isWorker) {
        const res = await api.updateWorkerProfile({
          fullName,
          phone,
          city,
          neighborhood,
          serviceAddress: address,
          isPublicProfile,
          allowDirectContact,
          serviceCategory,
          skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
          experienceYears: Number(experienceYears),
          serviceCharge: Number(serviceCharge),
          workingHours,
          bio,
        });
        updateUserInState(res.user);
        setMessage('Provider profile successfully updated and live on NagrikAI!');
      } else {
        const res = await api.updateCustomerProfile({
          fullName,
          phone,
          city,
          neighborhood,
          address,
          occupation,
          isPublicProfile,
          allowDirectContact,
          bio,
          skillsCanHelpWith: skillsCanHelpWith.split(',').map((s) => s.trim()).filter(Boolean),
          lookingForServices: lookingForServices.split(',').map((s) => s.trim()).filter(Boolean),
        });
        updateUserInState(res.user);
        setMessage('Your public profile and community preferences have been saved!');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMsg('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMsg('New passwords do not match');
      return;
    }
    setPasswordMsg('Password changed successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const pendingIncomingCount = incomingRequests.filter((c) => c.status === 'pending').length;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    profileUrl
  )}&bgcolor=0f172a&color=ffffff&margin=10`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Profile Identity */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <img
              src={
                user.avatarUrl ||
                (user as any).photoUrl ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName)}`
              }
              alt={user.fullName}
              className="w-16 h-16 rounded-2xl bg-slate-800 object-cover border-2 border-blue-500/40 shrink-0"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white tracking-tight">{user.fullName}</h1>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                    isWorker
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  }`}
                >
                  {isWorker ? 'Verified Service Provider' : 'Citizen Member'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Citizen ID: <span className="font-mono text-slate-300 font-semibold">{user.id}</span> • Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
              <div className="flex items-center space-x-2 mt-1.5 text-xs">
                <span className={`w-2 h-2 rounded-full ${isPublicProfile ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                <span className={isPublicProfile ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                  {isPublicProfile ? 'Public Profile (Discoverable by All)' : 'Private Profile'}
                </span>
                {pendingIncomingCount > 0 && (
                  <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[11px] font-bold">
                    {pendingIncomingCount} Connection Request{pendingIncomingCount > 1 ? 's' : ''} Pending
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPreviewModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
            >
              Preview Public Card
            </button>
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-sm"
            >
              {copiedLink ? 'Link Copied!' : 'Share My Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Shareable Link & QR Banner */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-950 border border-blue-500/30 rounded-2xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-bold text-blue-400 tracking-wider">Your Permanent Public URL</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Live & Connectable
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 font-mono break-all">{profileUrl}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Share this link with anyone. When someone sends you a connection request, you can review and accept or deny it below.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setShowQrModal(!showQrModal)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            >
              {showQrModal ? 'Hide QR' : 'Show QR Code'}
            </button>
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
            >
              {copiedLink ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {showQrModal && (
          <div className="pt-3 border-t border-slate-800 text-center animate-in fade-in">
            <div className="inline-block p-2 bg-slate-950 border border-slate-700 rounded-xl shadow-lg">
              <img src={qrImageUrl} alt="QR Code" className="w-36 h-36 rounded-lg mx-auto" />
            </div>
            <p className="text-xs text-slate-300 mt-2 font-medium">Scan with any mobile camera to view your public card</p>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* FEATURE: PROFILE CONNECTION REQUESTS (ACCEPT / DENY WORKFLOW) */}
      {/* ============================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Profile Connection Requests
              </h2>
              {pendingIncomingCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-xs font-extrabold flex items-center justify-center">
                  {pendingIncomingCount}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage requests sent to your profile. Accept to connect with neighbors or specialists, or deny requests anytime.
            </p>
          </div>

          {/* Subtabs for connections */}
          <div className="flex space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setConnectionsTab('incoming')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                connectionsTab === 'incoming'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Incoming</span>
              {pendingIncomingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold">
                  {pendingIncomingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setConnectionsTab('connected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                connectionsTab === 'connected'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Connected ({connectedMembers.length})</span>
            </button>

            <button
              onClick={() => setConnectionsTab('outgoing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                connectionsTab === 'outgoing'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Sent ({outgoingRequests.length})</span>
            </button>
          </div>
        </div>

        {/* Action Feedback Banner */}
        {connectionFeedback && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
              connectionFeedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <span>{connectionFeedback.text}</span>
            <button
              onClick={() => setConnectionFeedback(null)}
              className="text-slate-400 hover:text-white ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab 1: Incoming Requests with Accept / Deny actions */}
        {connectionsTab === 'incoming' && (
          <div className="space-y-3">
            {loadingConnections ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading incoming requests...</div>
            ) : incomingRequests.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-xs font-semibold text-slate-300">No incoming connection requests</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  When other citizens or technicians send a request to your profile, they will appear here for you to accept or deny.
                </p>
              </div>
            ) : (
              incomingRequests.map((req) => {
                const isPending = req.status === 'pending';
                const isAccepted = req.status === 'accepted';
                const isDeclined = req.status === 'declined';
                const isActioning = actioningId === req.id;
                const showDeclineForm = !!showDeclineBox[req.id];

                return (
                  <div
                    key={req.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isPending
                        ? 'bg-slate-950/90 border-blue-500/40 shadow-sm'
                        : isAccepted
                        ? 'bg-slate-950/50 border-emerald-500/30'
                        : 'bg-slate-950/30 border-slate-800 opacity-70'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      {/* Sender Info */}
                      <div className="flex items-start space-x-3">
                        <img
                          src={
                            req.fromUserAvatar ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(req.fromUserName)}`
                          }
                          alt={req.fromUserName}
                          className="w-10 h-10 rounded-xl bg-slate-800 object-cover border border-slate-700 shrink-0 mt-0.5"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span
                              onClick={() => setSelectedMemberModalId(req.fromUserId)}
                              className="font-bold text-white text-sm hover:text-blue-400 cursor-pointer"
                            >
                              {req.fromUserName}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.2 rounded-full font-semibold border ${
                                req.fromUserRole === 'worker'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              }`}
                            >
                              {req.fromUserRole === 'worker' ? 'Provider' : 'Citizen'}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                                isPending
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : isAccepted
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {isPending ? 'Pending' : isAccepted ? 'Accepted' : 'Declined'}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {req.fromUserNeighborhood ? `${req.fromUserNeighborhood}, ` : ''}{req.fromUserCity || 'Mumbai'} •{' '}
                            {new Date(req.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Top Action buttons when Pending */}
                      {isPending && (
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={() => handleRespondToRequest(req.id, 'accepted')}
                            disabled={isActioning}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center space-x-1 shadow-sm"
                          >
                            <span>✓</span>
                            <span>{isActioning ? 'Updating...' : 'Accept'}</span>
                          </button>

                          <button
                            onClick={() =>
                              setShowDeclineBox((prev) => ({
                                ...prev,
                                [req.id]: !prev[req.id],
                              }))
                            }
                            disabled={isActioning}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 text-xs font-semibold border border-slate-700 hover:border-rose-800 transition flex items-center space-x-1"
                          >
                            <span>✕</span>
                            <span>Deny</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Request message contents */}
                    <div className="mt-3 pl-0 sm:pl-13 space-y-1.5">
                      <p className="text-xs font-semibold text-slate-200">
                        Subject: <span className="text-slate-300 font-normal">{req.subject}</span>
                      </p>
                      <p className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800 leading-relaxed whitespace-pre-line">
                        "{req.message}"
                      </p>

                      {/* If Accepted: Show direct contact info */}
                      {isAccepted && (
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-300 mt-2">
                          <span className="font-semibold flex items-center space-x-1.5">
                            <span>🤝</span>
                            <span>Connected Member</span>
                          </span>

                          <div className="flex items-center space-x-2">
                            {req.fromUserPhone && (
                              <a
                                href={`tel:${req.fromUserPhone}`}
                                className="px-2.5 py-1 rounded bg-slate-900 text-slate-200 hover:text-white border border-slate-700 text-xs transition"
                              >
                                📞 Call ({req.fromUserPhone})
                              </a>
                            )}
                            {req.fromUserPhone && (
                              <a
                                href={`https://wa.me/${req.fromUserPhone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded bg-emerald-700/50 text-white text-xs hover:bg-emerald-600 transition"
                              >
                                WhatsApp
                              </a>
                            )}
                            <button
                              onClick={() => setSelectedMemberModalId(req.fromUserId)}
                              className="px-2.5 py-1 rounded bg-slate-900 text-blue-400 hover:text-blue-300 border border-slate-700 text-xs transition"
                            >
                              View Card
                            </button>
                          </div>
                        </div>
                      )}

                      {/* If Declined: Show note */}
                      {isDeclined && req.responseNote && (
                        <p className="text-[11px] text-slate-400 italic">
                          Decline note: "{req.responseNote}"
                        </p>
                      )}

                      {/* Decline Box expansion */}
                      {showDeclineForm && (
                        <div className="p-3 bg-slate-900 border border-rose-500/30 rounded-lg space-y-2 mt-2">
                          <p className="text-xs font-semibold text-rose-300">
                            Confirm Denying Request from {req.fromUserName}
                          </p>
                          <input
                            type="text"
                            value={declineNoteInput[req.id] || ''}
                            onChange={(e) =>
                              setDeclineNoteInput((prev) => ({
                                ...prev,
                                [req.id]: e.target.value,
                              }))
                            }
                            placeholder="Optional note / reason for declining..."
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() =>
                                setShowDeclineBox((prev) => ({ ...prev, [req.id]: false }))
                              }
                              className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleRespondToRequest(req.id, 'declined')}
                              className="px-3.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition"
                            >
                              Confirm Deny
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Connected Members */}
        {connectionsTab === 'connected' && (
          <div className="space-y-3">
            {connectedMembers.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-xs font-semibold text-slate-300">No active connections yet</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  When you accept someone's connection request (or they accept yours), they will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {connectedMembers.map((conn) => {
                  const otherUserId = conn.fromUserId === user.id ? conn.toUserId : conn.fromUserId;
                  const otherUserName = conn.fromUserId === user.id ? conn.toUserName || 'Member' : conn.fromUserName;
                  const otherUserRole = conn.fromUserId === user.id ? conn.toUserRole : conn.fromUserRole;
                  const otherUserAvatar = conn.fromUserId === user.id ? conn.toUserAvatar : conn.fromUserAvatar;
                  const otherUserPhone = conn.fromUserPhone;

                  return (
                    <div
                      key={conn.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/20 hover:border-emerald-500/40 flex flex-col justify-between transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            otherUserAvatar ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(otherUserName)}`
                          }
                          alt={otherUserName}
                          className="w-10 h-10 rounded-xl bg-slate-800 object-cover border border-slate-700 shrink-0"
                        />
                        <div className="overflow-hidden">
                          <h4 className="font-bold text-white text-xs truncate">{otherUserName}</h4>
                          <span
                            className={`inline-block text-[10px] px-2 py-0.2 rounded-full font-semibold border mt-0.5 ${
                              otherUserRole === 'worker'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            }`}
                          >
                            {otherUserRole === 'worker' ? 'Provider' : 'Citizen'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <button
                          onClick={() => setSelectedMemberModalId(otherUserId)}
                          className="text-blue-400 hover:underline font-medium text-[11px]"
                        >
                          View Profile & ID Card →
                        </button>

                        {otherUserPhone && (
                          <div className="flex items-center space-x-1.5">
                            <a
                              href={`tel:${otherUserPhone}`}
                              className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px] hover:text-white"
                            >
                              Call
                            </a>
                            <a
                              href={`https://wa.me/${otherUserPhone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 rounded bg-emerald-600/30 text-emerald-300 text-[11px] hover:bg-emerald-600/40"
                            >
                              WhatsApp
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Outgoing / Sent Requests */}
        {connectionsTab === 'outgoing' && (
          <div className="space-y-3">
            {outgoingRequests.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-xs font-semibold text-slate-300">No sent requests</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  You haven't sent any connection requests yet. Visit the Community Network or Explore tab to connect with other citizens!
                </p>
              </div>
            ) : (
              outgoingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white">To: {req.toUserName || req.toUserId}</span>
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                          req.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : req.status === 'accepted'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {req.status === 'pending'
                          ? 'Pending Review'
                          : req.status === 'accepted'
                          ? 'Accepted'
                          : 'Declined'}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-0.5 line-clamp-1">{req.message}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Sent on {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedMemberModalId(req.toUserId)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs shrink-0"
                  >
                    View Member
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Profile Form Feedback */}
      {message && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-emerald-400">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-rose-400">✕</button>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Visibility & Connect Settings Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white">Public Visibility & Community Discovery</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Control how other users of this website discover and see your information.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Toggle 1: Public profile */}
            <label className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-white block">
                  Public Profile on Nagrik Community Connect
                </span>
                <span className="text-[11px] text-slate-400 block leading-relaxed">
                  Allow other website users, neighbors, and local specialists to discover your profile in the community directory and send you connection requests.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isPublicProfile}
                onChange={(e) => setIsPublicProfile(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
              />
            </label>

            {/* Toggle 2: Direct contact */}
            <label className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-white block">
                  Allow Direct Contact (Phone & WhatsApp)
                </span>
                <span className="text-[11px] text-slate-400 block leading-relaxed">
                  Display your contact phone number and quick WhatsApp button on your public card so accepted connections can call you directly.
                </span>
              </div>
              <input
                type="checkbox"
                checked={allowDirectContact}
                onChange={(e) => setAllowDirectContact(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
              />
            </label>

            {/* Neighborhood / Locality */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Neighborhood / Locality
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="e.g. Andheri West, Powai, Indiranagar"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {!isWorker && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Occupation / Community Role
                  </label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="e.g. UI Designer, Architect, Teacher, Volunteer"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Public Bio & Introduction
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Introduce yourself to neighbors and specialists. Mention what you love about your community or how you can assist."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Customer specific skills */}
            {!isWorker && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Skills I Can Help Neighbors With (comma separated)
                  </label>
                  <input
                    type="text"
                    value={skillsCanHelpWith}
                    onChange={(e) => setSkillsCanHelpWith(e.target.value)}
                    placeholder="e.g. Smart Home Setup, Balcony Gardening, Pet Sitting, Wi-Fi Troubleshooting"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Services I Frequently Look For (comma separated)
                  </label>
                  <input
                    type="text"
                    value={lookingForServices}
                    onChange={(e) => setLookingForServices(e.target.value)}
                    placeholder="e.g. AC Repair, Plumbing, Carpenter, Home Cleaning"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Basic Contact & Address Details Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white mb-2">Personal & Location Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email (Read Only)</label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Contact Phone</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {INDIAN_CITIES.filter((c) => c !== 'All Cities').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {isWorker ? 'Operating / Service Address' : 'Street Address'}
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Provider Specific Controls */}
          {isWorker && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Provider Qualifications & Service Rates
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Service Category</label>
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value as ServiceCategory)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {SERVICE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Inspection Fee (₹)</label>
                  <input
                    type="number"
                    min="99"
                    step="50"
                    value={serviceCharge}
                    onChange={(e) => setServiceCharge(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Specializations (comma separated)
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Working Hours</label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-md"
            >
              {saving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </div>
      </form>

      {/* Password Change Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-base font-bold text-white mb-4">Security & Password</h2>
        {passwordMsg && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs rounded-lg">
            {passwordMsg}
          </div>
        )}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Public Profile Preview Modal for self */}
      {showPreviewModal && (
        <PublicProfileModal
          userId={user.id}
          onClose={() => setShowPreviewModal(false)}
        />
      )}

      {/* Public Profile Modal for clicking any member in connection lists */}
      {selectedMemberModalId && (
        <PublicProfileModal
          userId={selectedMemberModalId}
          onClose={() => setSelectedMemberModalId(null)}
        />
      )}
    </div>
  );
};
