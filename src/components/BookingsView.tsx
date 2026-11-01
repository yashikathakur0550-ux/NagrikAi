import React, { useState, useEffect } from 'react';
import { Booking, BookingStatus } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const BookingsView: React.FC = () => {
  const { role, user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Active' | 'Completed' | 'Cancelled'>('All');

  // Review Modal
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.getBookings();
      setBookings(res.bookings || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.updateBookingStatus(bookingId, 'Cancelled', 'Cancelled by user');
      await fetchBookings();
    } catch (err) {
      console.error('Cancel booking error:', err);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking) return;

    setSubmittingReview(true);
    try {
      await api.submitReview(reviewBooking.id, rating, reviewComment);
      setReviewSuccess('Review published successfully!');
      setTimeout(() => {
        setReviewBooking(null);
        setReviewSuccess('');
        setReviewComment('');
        fetchBookings();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'Active') return b.status === 'Requested' || b.status === 'Accepted' || b.status === 'In Progress';
    if (filter === 'Completed') return b.status === 'Completed';
    if (filter === 'Cancelled') return b.status === 'Cancelled' || b.status === 'Rejected';
    return true;
  });

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'Requested':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'Accepted':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'In Progress':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'Completed':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'Rejected':
      case 'Cancelled':
        return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {role === 'customer' ? 'My Service Bookings' : 'All Assigned Job Bookings'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Track appointment statuses, technician visits, schedules, and verified receipts.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex space-x-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-medium">
            {(['All', 'Active', 'Completed', 'Cancelled'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-md transition ${
                  filter === t
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          Loading booking records...
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-base font-semibold text-white">No bookings in this category</p>
          <p className="text-xs text-slate-400 mt-1">
            {role === 'customer'
              ? 'Browse categories or nearby technicians to schedule a service request.'
              : 'New customer booking requests will appear here once submitted.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-400 font-bold">{b.id}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${getStatusBadge(b.status)}`}>
                      {b.status}
                    </span>
                    <span className="text-xs text-slate-400">• Created on {new Date(b.createdAt).toLocaleDateString()}</span>
                  </div>

                  <h3 className="text-base font-bold text-white">{b.serviceRequired}</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <p>
                      <strong className="text-slate-400">Scheduled Date:</strong> {b.bookingDate} ({b.preferredTime})
                    </p>
                    <p>
                      <strong className="text-slate-400">
                        {role === 'customer' ? 'Assigned Provider:' : 'Customer Name:'}
                      </strong>{' '}
                      {role === 'customer' ? `${b.workerName} (${b.workerCategory})` : b.customerName}
                    </p>
                    <p>
                      <strong className="text-slate-400">Contact Phone:</strong>{' '}
                      {role === 'customer' ? b.workerPhone : b.customerPhone}
                    </p>
                    <p>
                      <strong className="text-slate-400">Address:</strong> {b.customerAddress}, {b.customerCity}
                    </p>
                  </div>

                  {b.problemDescription && (
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">Issue Reported: </span>
                      {b.problemDescription}
                    </div>
                  )}

                  {b.rejectionReason && (
                    <div className="p-2.5 bg-rose-500/10 rounded-lg border border-rose-500/30 text-xs text-rose-400">
                      <span className="font-semibold">Decline Note: </span>
                      {b.rejectionReason}
                    </div>
                  )}

                  {b.completionNotes && (
                    <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/30 text-xs text-emerald-400">
                      <span className="font-semibold">Technician Completion Notes: </span>
                      {b.completionNotes}
                    </div>
                  )}

                  {b.rating && (
                    <div className="flex items-center space-x-2 text-xs text-amber-400 font-semibold pt-1">
                      <span>Customer Review: ★ {b.rating}/5</span>
                      {b.reviewComment && <span className="text-slate-300 font-normal">"{b.reviewComment}"</span>}
                    </div>
                  )}
                </div>

                {/* Right Action column */}
                <div className="flex flex-col items-end justify-between shrink-0 self-stretch border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-5 gap-3">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Inspection Fee</span>
                    <span className="text-lg font-bold text-white">₹{b.estimatedCost}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {role === 'customer' && b.status === 'Requested' && (
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-rose-950/40 text-rose-400 border border-slate-700 hover:border-rose-700 transition"
                      >
                        Cancel Request
                      </button>
                    )}

                    {role === 'customer' && b.status === 'Completed' && !b.rating && (
                      <button
                        onClick={() => setReviewBooking(b)}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition shadow-sm"
                      >
                        ★ Leave Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leave Review Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Rate Service by {reviewBooking.workerName}</h3>
            <p className="text-xs text-slate-400">
              Your verified rating helps other local citizens find trusted tradespeople.
            </p>

            {reviewSuccess ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg text-center font-semibold">
                {reviewSuccess}
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Star Rating</label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-2xl transition ${
                          star <= rating ? 'text-amber-400 scale-110' : 'text-slate-700 hover:text-slate-500'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Comments & Feedback</label>
                  <textarea
                    rows={3}
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="e.g. Arrived on time, quickly fixed the problem, very courteous..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewBooking(null)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
