import React, { useState, useEffect } from 'react';
import { CustomerUser, WorkerUser } from '../types';
import { api } from '../services/api';

interface SavedWorkersViewProps {
  customer: CustomerUser;
  onBookWorker: (worker: WorkerUser) => void;
}

export const SavedWorkersView: React.FC<SavedWorkersViewProps> = ({ customer, onBookWorker }) => {
  const [savedWorkers, setSavedWorkers] = useState<WorkerUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    setLoading(true);
    try {
      const res = await api.getWorkers();
      const savedIds = new Set(customer.savedWorkerIds || []);
      const matched = res.workers.filter((w) => savedIds.has(w.id));
      setSavedWorkers(matched);
    } catch (err) {
      console.error('Failed to load saved workers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, [customer.savedWorkerIds]);

  const handleRemove = async (workerId: string) => {
    try {
      await api.toggleSaveWorker(workerId);
      setSavedWorkers((prev) => prev.filter((w) => w.id !== workerId));
    } catch (err) {
      console.error('Failed to remove bookmark:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Saved Service Providers</h1>
        <p className="text-xs text-slate-400 mt-1">
          Quickly access and re-book your preferred technicians.
        </p>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400 py-8 text-center">Loading saved professionals...</p>
      ) : savedWorkers.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-base font-semibold text-white">No saved workers yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Click the star bookmark button on any worker card in the explore page to save them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedWorkers.map((w) => (
            <div
              key={w.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={w.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(w.fullName)}`}
                      alt={w.fullName}
                      className="w-12 h-12 rounded-xl bg-slate-800 object-cover border border-slate-700"
                    />
                    <div>
                      <h3 className="font-bold text-white text-sm">{w.fullName}</h3>
                      <p className="text-xs text-blue-400 font-medium">{w.serviceCategory}</p>
                      <p className="text-[11px] text-slate-400">{w.city}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(w.id)}
                    className="text-xs text-slate-400 hover:text-rose-400"
                    title="Remove from saved"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-slate-950">
                  <span className="text-amber-400 font-bold">★ {w.rating.toFixed(1)}</span>
                  <span className="text-white font-semibold">₹{w.serviceCharge} / visit</span>
                  <span className={w.isAvailable ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                    {w.isAvailable ? 'Available Now' : 'Offline'}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-400 line-clamp-2">{w.bio}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => onBookWorker(w)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
                >
                  Book Service
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
