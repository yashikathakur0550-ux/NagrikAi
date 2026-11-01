import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ServiceCategory } from '../types';
import { SERVICE_CATEGORIES, INDIAN_CITIES } from '../data/categories';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: 'customer' | 'worker';
  initialSignUp?: boolean;
  initialCategory?: ServiceCategory;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'customer',
  initialSignUp = false,
  initialCategory,
}) => {
  const { loginCustomer, registerCustomer, loginWorker, registerWorker, quickDemoLogin } = useAuth();

  const [activeTab, setActiveTab] = useState<'customer' | 'worker'>(initialRole);
  const [isSignUp, setIsSignUp] = useState<boolean>(initialSignUp);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Common / Customer form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [address, setAddress] = useState('');

  // Worker-specific form state
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>(initialCategory || 'Plumbing');
  const [skills, setSkills] = useState('');
  const [experienceYears, setExperienceYears] = useState(3);
  const [serviceAddress, setServiceAddress] = useState('');
  const [workingHours, setWorkingHours] = useState('9:00 AM - 7:00 PM');
  const [serviceCharge, setServiceCharge] = useState(299);
  const [bio, setBio] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      if (activeTab === 'customer') {
        if (isSignUp) {
          if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
          }
          if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
          }
          await registerCustomer({
            fullName,
            email,
            phone,
            password,
            city,
            address,
          });
        } else {
          await loginCustomer(email, password, rememberMe);
        }
      } else {
        // Worker
        if (isSignUp) {
          if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
          }
          if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
          }
          await registerWorker({
            fullName,
            email,
            phone,
            password,
            serviceCategory,
            skills: skills ? skills.split(',').map((s) => s.trim()) : ['General Repairs'],
            experienceYears: Number(experienceYears) || 2,
            city,
            serviceAddress: serviceAddress || address,
            workingHours,
            serviceCharge: Number(serviceCharge) || 299,
            bio,
          });
        } else {
          await loginWorker(email, password, rememberMe);
        }
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (roleType: 'customer' | 'worker') => {
    setLoading(true);
    setErrorMessage('');
    try {
      await quickDemoLogin(roleType);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Top Header with Role Switch Tabs */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex space-x-1 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('customer');
                setErrorMessage('');
              }}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === 'customer'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Customer Portal
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('worker');
                setErrorMessage('');
              }}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === 'worker'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Service Provider Portal
            </button>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {activeTab === 'customer'
                ? isSignUp
                  ? 'Create Customer Account'
                  : 'Customer Sign In'
                : isSignUp
                ? 'Register as Service Provider'
                : 'Service Provider Sign In'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === 'customer'
                ? 'Book verified technicians with guaranteed pricing'
                : 'Grow your local service business and get direct bookings'}
            </p>
          </div>

          {/* Quick Demo Login Pill */}
          <div className="mb-5 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-300">Quick Demo Testing</p>
              <p className="text-[11px] text-slate-400">
                {activeTab === 'customer' ? 'Log in as Aarav Sharma' : 'Log in as Rajesh Kumar (Electrician)'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleQuickDemo(activeTab)}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 transition"
            >
              1-Click Demo
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* If Sign Up */}
            {isSignUp && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={activeTab === 'customer' ? 'e.g. Ramesh Patel' : 'e.g. Suresh Kumar'}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">City</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      {INDIAN_CITIES.filter((c) => c !== 'All Cities').map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Worker-specific Fields */}
                {activeTab === 'worker' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Service Category
                        </label>
                        <select
                          value={serviceCategory}
                          onChange={(e) => setServiceCategory(e.target.value as ServiceCategory)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                        >
                          {SERVICE_CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Experience (Years)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="40"
                          value={experienceYears}
                          onChange={(e) => setExperienceYears(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Visiting Charge (₹)
                        </label>
                        <input
                          type="number"
                          min="99"
                          step="50"
                          value={serviceCharge}
                          onChange={(e) => setServiceCharge(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Working Hours
                        </label>
                        <input
                          type="text"
                          value={workingHours}
                          onChange={(e) => setWorkingHours(e.target.value)}
                          placeholder="9:00 AM - 7:00 PM"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Skills / Specializations (comma separated)
                      </label>
                      <input
                        type="text"
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        placeholder="e.g. MCB Repair, Inverter Wiring, Fan Rewinding"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Short Professional Description
                      </label>
                      <textarea
                        rows={2}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Brief summary of your work experience and expertise..."
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {activeTab === 'worker' ? 'Full Service Address / Base Location' : 'Full Home Address'}
                  </label>
                  <input
                    type="text"
                    required
                    value={activeTab === 'worker' ? serviceAddress : address}
                    onChange={(e) =>
                      activeTab === 'worker' ? setServiceAddress(e.target.value) : setAddress(e.target.value)
                    }
                    placeholder="Street, Area, Landmark"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </>
            )}

            {/* Email & Password */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {!isSignUp && (
              <div className="flex items-center justify-between text-xs text-slate-400">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0"
                  />
                  <span>Remember me</span>
                </label>
                <span className="text-slate-400">Default demo: password123</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold text-white transition shadow-sm ${
                activeTab === 'customer'
                  ? 'bg-blue-600 hover:bg-blue-500'
                  : 'bg-amber-600 hover:bg-amber-500'
              }`}
            >
              {loading
                ? 'Processing...'
                : isSignUp
                ? activeTab === 'customer'
                  ? 'Complete Customer Registration'
                  : 'Register as Service Provider'
                : activeTab === 'customer'
                ? 'Sign In as Customer'
                : 'Sign In as Provider'}
            </button>
          </form>

          {/* Toggle Login / Signup */}
          <div className="mt-5 text-center text-xs text-slate-400 border-t border-slate-800 pt-4">
            {isSignUp ? (
              <p>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="text-blue-400 hover:underline font-semibold ml-1"
                >
                  Sign in here
                </button>
              </p>
            ) : (
              <p>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="text-blue-400 hover:underline font-semibold ml-1"
                >
                  Create {activeTab === 'customer' ? 'customer' : 'provider'} account
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
