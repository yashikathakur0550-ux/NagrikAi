import React, { useState } from 'react';
import { SERVICE_CATEGORIES } from '../data/categories';
import { ServiceCategory } from '../types';

interface CategoriesViewProps {
  onSelectCategory: (category: ServiceCategory) => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({ onSelectCategory }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = SERVICE_CATEGORIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.commonIssues.some((issue) => issue.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          All 15 Service Categories
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Explore complete home and professional service offerings with transparent inspection fees.
        </p>

        <div className="mt-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search categories (e.g. electrical, leak, cleaning, painting, pest)..."
            className="w-full max-w-md px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cat, idx) => (
          <div
            key={cat.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-mono text-slate-400 font-semibold">{String(idx + 1).padStart(2, '0')}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-medium">
                  {cat.tag}
                </span>
              </div>

              <h2 className="text-base font-bold text-white">{cat.name}</h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{cat.description}</p>

              <div className="mt-3">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Frequently Solved Issues:
                </p>
                <div className="flex flex-wrap gap-1">
                  {cat.commonIssues.map((issue, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800/80">
                      {issue}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Typical Cost</span>
                <span className="text-xs font-bold text-emerald-400">{cat.avgCost}</span>
              </div>

              <button
                onClick={() => onSelectCategory(cat.id)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
              >
                Browse Technicians →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
