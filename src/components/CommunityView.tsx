import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CommunityPost, ServiceCategory } from '../types';
import { INDIAN_CITIES } from '../data/categories';

interface CommunityViewProps {
  onOpenPublicProfile: (userId: string) => void;
  onNavigateTab: (tab: any) => void;
  onBookWorker?: (worker: any) => void;
  onOpenAuthModal?: () => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  onOpenPublicProfile,
  onNavigateTab,
  onBookWorker,
  onOpenAuthModal,
}) => {
  const { user, role } = useAuth();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'directory' | 'board'>('directory');

  // Directory filter state
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [memberRoleFilter, setMemberRoleFilter] = useState<'all' | 'customer' | 'worker'>('all');
  const [memberCityFilter, setMemberCityFilter] = useState<string>('All');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Community board state
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [postSearchQuery, setPostSearchQuery] = useState('');

  // Create Post Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState<CommunityPost['category']>('help_request');
  const [postTags, setPostTags] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);
  const [postError, setPostError] = useState('');

  // Active reply thread
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<Record<string, boolean>>({});

  // Share profile toast
  const [copiedMyLink, setCopiedMyLink] = useState(false);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await api.getCommunityMembers({
        role: memberRoleFilter !== 'all' ? memberRoleFilter : undefined,
        city: memberCityFilter !== 'All' ? memberCityFilter : undefined,
        search: memberSearchQuery.trim() || undefined,
      });
      setMembers(res.members || []);
    } catch (err) {
      console.error('Failed to load community members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await api.getCommunityPosts({
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        city: memberCityFilter !== 'All' ? memberCityFilter : undefined,
        search: postSearchQuery.trim() || undefined,
      });
      setPosts(res.posts || []);
    } catch (err) {
      console.error('Failed to load community posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [memberRoleFilter, memberCityFilter]);

  useEffect(() => {
    if (activeTab === 'board') {
      fetchPosts();
    }
  }, [activeTab, categoryFilter, memberCityFilter]);

  const handleMemberSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMembers();
  };

  const handlePostSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    if (!postTitle.trim() || !postContent.trim()) return;

    setSubmittingPost(true);
    setPostError('');
    try {
      const tagsArray = postTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await api.createCommunityPost({
        title: postTitle,
        content: postContent,
        category: postCategory,
        tags: tagsArray.length > 0 ? tagsArray : ['Community'],
      });

      setPosts((prev) => [res.post, ...prev]);
      setShowCreateModal(false);
      setPostTitle('');
      setPostContent('');
      setPostTags('');
    } catch (err: any) {
      setPostError(err.message || 'Failed to publish post');
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!user) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    try {
      const res = await api.likeCommunityPost(postId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const currentLiked = p.likedBy?.includes(user.id);
            const newLikedBy = currentLiked
              ? p.likedBy.filter((id) => id !== user.id)
              : [...(p.likedBy || []), user.id];
            return {
              ...p,
              likesCount: res.likesCount,
              likedBy: newLikedBy,
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  const handleSendReply = async (postId: string) => {
    if (!user) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    const text = replyText[postId];
    if (!text?.trim()) return;

    setSubmittingReply((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await api.replyToCommunityPost(postId, text);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              replies: [...(p.replies || []), res.reply],
            };
          }
          return p;
        })
      );
      setReplyText((prev) => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSubmittingReply((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleCopyMyProfileLink = () => {
    if (!user) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    const myUrl = `${window.location.origin}${window.location.pathname}?profile=${user.id}`;
    navigator.clipboard.writeText(myUrl);
    setCopiedMyLink(true);
    setTimeout(() => setCopiedMyLink(false), 2500);
  };

  const myProfileUrl = user
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}?profile=${user.id}`
    : '';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Community Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Public Citizen & Specialist Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Nagrik Community Connect
            </h1>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Discover and connect with local citizens, neighbors, and verified specialists using this website.
              Anyone on this platform can view your public profile, exchange mutual help, and connect directly.
            </p>
          </div>

          {/* Quick Visibility & Share Card */}
          {user ? (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 shrink-0 max-w-sm w-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Your Public Profile</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                  Visible to All
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <img
                  src={user.avatarUrl || (user as any).photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName)}`}
                  alt={user.fullName}
                  className="w-10 h-10 rounded-xl bg-slate-800 object-cover border border-slate-700"
                />
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user.city} • {role === 'worker' ? 'Provider' : 'Citizen'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  onClick={handleCopyMyProfileLink}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                >
                  {copiedMyLink ? 'Link Copied!' : 'Copy My Share Link'}
                </button>
                <button
                  onClick={() => onOpenPublicProfile(user.id)}
                  className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
                >
                  Preview Card
                </button>
              </div>

              <button
                onClick={() => onNavigateTab('profile')}
                className="w-full text-center py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-blue-300 hover:text-white text-[11px] font-medium border border-slate-800 transition"
              >
                Review & Manage Requests on My Profile →
              </button>
            </div>
          ) : (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 shrink-0 max-w-sm w-full space-y-2 text-xs">
              <p className="font-semibold text-white">Join the Citizen Directory</p>
              <p className="text-slate-400">Sign in to publish your profile, share skills, and connect with neighbors in your area.</p>
              <button
                onClick={onOpenAuthModal}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition mt-1"
              >
                Sign In / Join Network
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main View Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-2 ${
              activeTab === 'directory'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>👥 Members & Neighbors ({members.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('board')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-2 ${
              activeTab === 'board'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>💬 Community Help Board</span>
          </button>
        </div>

        {activeTab === 'board' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-2"
          >
            <span>+</span>
            <span>Post a Request or Offer</span>
          </button>
        )}
      </div>

      {/* TAB 1: MEMBERS DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <form onSubmit={handleMemberSearchSubmit} className="flex-1 flex gap-2">
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder="Search citizens & helpers by name, skill, neighborhood (e.g. Andheri, Powai, carpentry)..."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-lg transition"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              {/* Role filter */}
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400">Show:</span>
                <select
                  value={memberRoleFilter}
                  onChange={(e) => setMemberRoleFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none"
                >
                  <option value="all">All Members</option>
                  <option value="customer">Citizens & Neighbors Only</option>
                  <option value="worker">Verified Providers Only</option>
                </select>
              </div>

              {/* City filter */}
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400">City:</span>
                <select
                  value={memberCityFilter}
                  onChange={(e) => setMemberCityFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none"
                >
                  {INDIAN_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Member Cards Grid */}
          {loadingMembers ? (
            <div className="p-16 text-center text-slate-400 text-xs">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading public member directory...
            </div>
          ) : members.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
              <p className="text-sm font-semibold text-white">No members matched your search</p>
              <p className="text-xs text-slate-400 mt-1">Try clearing filters or searching for another neighborhood.</p>
              <button
                onClick={() => {
                  setMemberSearchQuery('');
                  setMemberRoleFilter('all');
                  setMemberCityFilter('All');
                }}
                className="mt-3 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => {
                const isWorker = member.memberType === 'worker';
                const skills = isWorker ? member.skills : member.skillsCanHelpWith;

                return (
                  <div
                    key={member.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all group"
                  >
                    <div>
                      {/* Member Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={
                              member.photoUrl ||
                              member.avatarUrl ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.fullName)}`
                            }
                            alt={member.fullName}
                            className="w-12 h-12 rounded-xl bg-slate-800 object-cover border border-slate-700 shrink-0"
                          />
                          <div>
                            <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                              {member.fullName}
                            </h3>
                            <p className="text-xs text-slate-300 font-medium">{member.subtitle}</p>
                            <p className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                              <span>📍</span>
                              <span>{member.locality}</span>
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border shrink-0 ${
                            isWorker
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          }`}
                        >
                          {isWorker ? 'Provider' : 'Citizen'}
                        </span>
                      </div>

                      {/* Bio snippet */}
                      <p className="mt-3 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {member.bio || 'Public member connecting with neighbors on NagrikAI.'}
                      </p>

                      {/* Skills or Mutual Help Chips */}
                      {skills && skills.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-800/80">
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                            {isWorker ? 'Specializations' : 'Can Help With'}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {skills.slice(0, 3).map((s: string, idx: number) => (
                              <span
                                key={idx}
                                className={`text-[11px] px-2 py-0.5 rounded-md ${
                                  isWorker
                                    ? 'bg-slate-800 text-slate-300'
                                    : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                }`}
                              >
                                {s}
                              </span>
                            ))}
                            {skills.length > 3 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                +{skills.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onOpenPublicProfile(member.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
                      >
                        View Profile & ID
                      </button>

                      <div className="flex items-center space-x-2">
                        {isWorker && onBookWorker ? (
                          <button
                            onClick={() => onBookWorker(member)}
                            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-sm"
                          >
                            Book (₹{member.serviceCharge})
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenPublicProfile(member.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMMUNITY BOARD */}
      {activeTab === 'board' && (
        <div className="space-y-5">
          {/* Category Filter Pills */}
          <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All Discussions' },
              { id: 'help_request', label: 'Help Needed' },
              { id: 'service_offer', label: 'Service Offers' },
              { id: 'neighbourhood_connect', label: 'Neighborhood Connect' },
              { id: 'recommendation', label: 'Local Recommendations' },
              { id: 'general', label: 'General Civic Talk' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  categoryFilter === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Posts Feed */}
          {loadingPosts ? (
            <div className="p-16 text-center text-slate-400 text-xs">Loading community discussions...</div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
              <p className="text-sm font-semibold text-white">No community posts yet in this category</p>
              <p className="text-xs text-slate-400 mt-1">Be the first to post a question, neighborhood help request, or recommendation!</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-3 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
              >
                + Create New Post
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => {
                const isLiked = user ? post.likedBy?.includes(user.id) : false;
                const isExpanded = !!expandedReplies[post.id];

                return (
                  <div key={post.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                    {/* Post Author Bar */}
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className="flex items-center space-x-3 cursor-pointer group"
                        onClick={() => onOpenPublicProfile(post.authorId)}
                      >
                        <img
                          src={post.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(post.authorName)}`}
                          alt={post.authorName}
                          className="w-10 h-10 rounded-xl bg-slate-800 object-cover border border-slate-700"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                              {post.authorName}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.2 rounded-full font-semibold border ${
                                post.authorRole === 'worker'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              }`}
                            >
                              {post.authorRole === 'worker' ? 'Provider' : 'Citizen'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {post.authorNeighborhood ? `${post.authorNeighborhood}, ` : ''}{post.authorCity} •{' '}
                            {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium capitalize">
                        {post.category.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Post Content */}
                    <div>
                      <h3 className="text-base font-bold text-white leading-snug">{post.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed whitespace-pre-line">
                        {post.content}
                      </p>
                    </div>

                    {/* Post Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {post.tags.map((t, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Interactive Action Bar */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleToggleLike(post.id)}
                          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                            isLiked
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          <span>{isLiked ? '❤️' : '🤍'}</span>
                          <span>{post.likesCount || 0}</span>
                        </button>

                        <button
                          onClick={() =>
                            setExpandedReplies((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                          }
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 text-slate-300 hover:text-white border border-slate-800 transition"
                        >
                          <span>💬</span>
                          <span>{post.replies?.length || 0} Replies</span>
                        </button>
                      </div>

                      <button
                        onClick={() => onOpenPublicProfile(post.authorId)}
                        className="text-blue-400 hover:underline font-medium text-xs"
                      >
                        Connect with Author →
                      </button>
                    </div>

                    {/* Replies Thread */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-800 space-y-3 animate-in fade-in">
                        {post.replies && post.replies.length > 0 ? (
                          <div className="space-y-2">
                            {post.replies.map((rep) => (
                              <div
                                key={rep.id}
                                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start space-x-3 text-xs"
                              >
                                <img
                                  src={rep.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(rep.authorName)}`}
                                  alt={rep.authorName}
                                  className="w-7 h-7 rounded-lg bg-slate-800 object-cover mt-0.5 shrink-0"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span
                                      className="font-bold text-white hover:text-blue-400 cursor-pointer"
                                      onClick={() => onOpenPublicProfile(rep.authorId)}
                                    >
                                      {rep.authorName}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      {new Date(rep.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-slate-300 mt-1">{rep.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No replies yet. Be the first to chime in!</p>
                        )}

                        {/* Reply Input Form */}
                        {user ? (
                          <div className="flex gap-2 pt-1">
                            <input
                              type="text"
                              value={replyText[post.id] || ''}
                              onChange={(e) =>
                                setReplyText((prev) => ({ ...prev, [post.id]: e.target.value }))
                              }
                              placeholder="Write a helpful response or comment..."
                              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSendReply(post.id);
                              }}
                            />
                            <button
                              onClick={() => handleSendReply(post.id)}
                              disabled={submittingReply[post.id]}
                              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                            >
                              {submittingReply[post.id] ? 'Posting...' : 'Reply'}
                            </button>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                            <button onClick={onOpenAuthModal} className="text-blue-400 hover:underline font-semibold">
                              Sign in
                            </button>{' '}
                            to join the conversation and reply to this post.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE POST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Create Community Post
              </span>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 space-y-4">
              {postError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg">
                  {postError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Topic Category</label>
                <select
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="help_request">Need Help / Local Service Advice</option>
                  <option value="service_offer">Offer Mutual Help / Skills</option>
                  <option value="neighbourhood_connect">Neighborhood Meet & Connect</option>
                  <option value="recommendation">Recommend a Technician or Experience</option>
                  <option value="general">General Community Talk</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Headline / Title</label>
                <input
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. Seeking reliable AC technician in Powai / Offering tools for woodcraft"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Details & Context</label>
                <textarea
                  rows={4}
                  required
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Explain your request, offer, or experience clearly. Other citizens and providers can reply and connect with you."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={postTags}
                  onChange={(e) => setPostTags(e.target.value)}
                  placeholder="e.g. AC Repair, Powai, Senior Support"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPost}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                >
                  {submittingPost ? 'Publishing...' : 'Publish to Community'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
