import React from 'react';
import { SERVICE_CATEGORIES } from '../data/categories';
import { useAuth } from '../context/AuthContext';
import { ServiceCategory } from '../types';

interface LandingPageProps {
  onOpenAuth: (role: 'customer' | 'worker', isSignUp?: boolean, defaultCategory?: ServiceCategory) => void;
  onSelectCategoryPreview?: (category: ServiceCategory) => void;
  onOpenAdvisorPreview?: () => void;
  onOpenCommunityPreview?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onSelectCategoryPreview,
  onOpenAdvisorPreview,
  onOpenCommunityPreview,
}) => {
  const { quickDemoLogin } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            <span>NagrikAI Community & Marketplace • 15 Service Categories</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Connect Locally with Citizens & Verified Technicians
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-normal">
            A unified network where citizens and skilled professionals share information, connect directly, and book vetted home services with live GPS and transparent pricing.
          </p>

          {/* Primary Dual Portal Call-to-Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
            <button
              onClick={() => onOpenAuth('customer', false)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors shadow-sm flex items-center justify-center space-x-2"
            >
              <span>Login as Customer</span>
              <span>→</span>
            </button>

            <button
              onClick={() => onOpenAuth('worker', false)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-colors flex items-center justify-center space-x-2"
            >
              <span>Login as Provider</span>
              <span>→</span>
            </button>

            {onOpenCommunityPreview && (
              <button
                onClick={onOpenCommunityPreview}
                className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold text-sm transition-colors flex items-center justify-center space-x-2"
              >
                <span>👥 Community Network</span>
              </button>
            )}
          </div>

          {/* Quick Sign-up Links */}
          <div className="mt-4 flex items-center justify-center space-x-6 text-xs text-slate-400">
            <span>
              New customer?{' '}
              <button
                onClick={() => onOpenAuth('customer', true)}
                className="text-blue-400 hover:underline font-medium"
              >
                Sign up as Customer
              </button>
            </span>
            <span className="text-slate-600">•</span>
            <span>
              Technician or Specialist?{' '}
              <button
                onClick={() => onOpenAuth('worker', true)}
                className="text-amber-400 hover:underline font-medium"
              >
                Join as Provider
              </button>
            </span>
          </div>

          {/* Instant 1-Click Interactive Demo Access */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 max-w-xl mx-auto">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">
              One-Click Instant Demo Portals
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => quickDemoLogin('customer')}
                className="px-3.5 py-2 text-xs font-medium rounded-lg bg-slate-900 border border-slate-700 hover:border-blue-500 text-slate-200 hover:text-white transition"
              >
                Launch Customer Demo (Aarav Sharma)
              </button>
              <button
                onClick={() => quickDemoLogin('worker')}
                className="px-3.5 py-2 text-xs font-medium rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-200 hover:text-white transition"
              >
                Launch Provider Demo (Rajesh Kumar - Electrician)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 15 Service Categories Grid */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Explore Our 15 Service Categories
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Select any category to view available registered workers in your area.
            </p>
          </div>
          {onOpenAdvisorPreview && (
            <button
              onClick={onOpenAdvisorPreview}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-950 text-blue-300 border border-blue-800 hover:bg-blue-900 transition"
            >
              Ask AI Service Diagnostic & Cost Advisor
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {SERVICE_CATEGORIES.map((cat, idx) => (
            <div
              key={cat.id}
              onClick={() => {
                if (onSelectCategoryPreview) {
                  onSelectCategoryPreview(cat.id);
                } else {
                  onOpenAuth('customer', false);
                }
              }}
              className="group p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-850 cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-mono text-slate-400 font-semibold">{String(idx + 1).padStart(2, '0')}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">{cat.tag}</span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">{cat.avgCost}</span>
                <span className="text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  Book →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose NagrikAI Local Service Platform */}
      <section className="py-14 bg-slate-900/50 border-t border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-white">Built for Everyday Convenience & Reliable Work</h2>
            <p className="text-sm text-slate-400 mt-2">
              Connecting local households with vetted skilled tradespeople with zero middleman markups.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm mb-4">
                01
              </div>
              <h3 className="text-lg font-bold text-white">Live Geodesic GPS Mapping</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Find available technicians closest to your exact street address. View real-time proximity in kilometers on an interactive OpenStreetMap.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-sm mb-4">
                02
              </div>
              <h3 className="text-lg font-bold text-white">AI Diagnostic & Price Estimator</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Describe your electrical, plumbing, or appliance fault to get instant diagnostic guidance and estimated repair ranges before scheduling.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold text-sm mb-4">
                03
              </div>
              <h3 className="text-lg font-bold text-white">Dedicated Provider Portal</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Technicians manage their schedule, toggle live availability, review requests, track job earnings, and build a verified local reputation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-slate-950 text-slate-400 text-xs border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white text-sm">NagrikAI</span>
            <span>• Smart Local Service Marketplace</span>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => onOpenAuth('customer', false)} className="hover:text-white transition">Customer Sign In</button>
            <button onClick={() => onOpenAuth('worker', false)} className="hover:text-white transition">Provider Sign In</button>
            <button onClick={() => onOpenAuth('worker', true)} className="hover:text-white transition">Register as Technician</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
