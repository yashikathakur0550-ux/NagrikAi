import React, { createContext, useContext, useState, useEffect } from 'react';
import { CustomerUser, WorkerUser, ServiceCategory } from '../types';
import {
  api,
  getStoredToken,
  setStoredToken,
  setStoredRole,
  getStoredRole,
  getStoredUser,
  setStoredUser,
} from '../services/api';

interface AuthContextType {
  user: CustomerUser | WorkerUser | null;
  role: 'customer' | 'worker' | null;
  loading: boolean;
  loginCustomer: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  registerCustomer: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    city?: string;
    address?: string;
  }) => Promise<void>;
  loginWorker: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  registerWorker: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    serviceCategory: ServiceCategory;
    skills?: string[];
    experienceYears?: number;
    city?: string;
    serviceAddress?: string;
    workingHours?: string;
    serviceCharge?: number;
    bio?: string;
    photoUrl?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserInState: (updated: Partial<CustomerUser | WorkerUser>) => void;
  quickDemoLogin: (roleType: 'customer' | 'worker') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomerUser | WorkerUser | null>(getStoredUser());
  const [role, setRole] = useState<'customer' | 'worker' | null>(getStoredRole());
  const [loading, setLoading] = useState<boolean>(!getStoredUser());

  const checkAuth = async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setRole(null);
      setStoredUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
      setRole(res.role);
      setStoredRole(res.role);
      setStoredUser(res.user);
    } catch (e: any) {
      console.warn('Session verification notice:', e);
      // Only clear credentials if backend explicitly responds with 401 Unauthorized
      if (e?.status === 401 || (e?.message && e.message.toLowerCase().includes('unauthorized'))) {
        setStoredToken(null);
        setStoredRole(null);
        setStoredUser(null);
        setUser(null);
        setRole(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const loginCustomer = async (email: string, password: string, rememberMe = true) => {
    const res = await api.loginCustomer(email, password, rememberMe);
    setUser(res.user);
    setRole('customer');
    setStoredRole('customer');
    setStoredUser(res.user);
  };

  const registerCustomer = async (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    city?: string;
    address?: string;
  }) => {
    const res = await api.registerCustomer(data);
    setUser(res.user);
    setRole('customer');
    setStoredRole('customer');
    setStoredUser(res.user);
  };

  const loginWorker = async (email: string, password: string, rememberMe = true) => {
    const res = await api.loginWorker(email, password, rememberMe);
    setUser(res.user);
    setRole('worker');
    setStoredRole('worker');
    setStoredUser(res.user);
  };

  const registerWorker = async (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    serviceCategory: ServiceCategory;
    skills?: string[];
    experienceYears?: number;
    city?: string;
    serviceAddress?: string;
    workingHours?: string;
    serviceCharge?: number;
    bio?: string;
    photoUrl?: string;
  }) => {
    const res = await api.registerWorker(data);
    setUser(res.user);
    setRole('worker');
    setStoredRole('worker');
    setStoredUser(res.user);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn('Logout request failed:', err);
    }
    setStoredUser(null);
    setStoredToken(null);
    setStoredRole(null);
    setUser(null);
    setRole(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
      setRole(res.role);
      setStoredRole(res.role);
      setStoredUser(res.user);
    } catch (e) {
      console.error('Refresh user failed:', e);
    }
  };

  const updateUserInState = (updated: Partial<CustomerUser | WorkerUser>) => {
    setUser((prev: any) => {
      if (!prev) return null;
      const next = { ...prev, ...updated };
      setStoredUser(next);
      return next;
    });
  };

  const quickDemoLogin = async (roleType: 'customer' | 'worker') => {
    if (roleType === 'customer') {
      await loginCustomer('aarav.sharma@example.com', 'password123');
    } else {
      await loginWorker('rajesh.kumar@example.com', 'password123');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        loginCustomer,
        registerCustomer,
        loginWorker,
        registerWorker,
        logout,
        refreshUser,
        updateUserInState,
        quickDemoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
