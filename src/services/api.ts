import {
  CustomerUser,
  WorkerUser,
  Booking,
  BookingStatus,
  ServiceReview,
  MarketplaceNotification,
  ServiceCategory,
  CommunityPost,
  CommunityReply,
  CommunityConnectionMessage,
  PublicProfileData,
} from '../types';

const TOKEN_KEY = 'nagrikai_token';
const ROLE_KEY = 'nagrikai_user_role';
const USER_KEY = 'nagrikai_cached_user';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    console.error('Storage error:', e);
  }
}

export function getStoredRole(): 'customer' | 'worker' | null {
  try {
    return localStorage.getItem(ROLE_KEY) as 'customer' | 'worker' | null;
  } catch {
    return null;
  }
}

export function setStoredRole(role: 'customer' | 'worker' | null) {
  try {
    if (role) {
      localStorage.setItem(ROLE_KEY, role);
    } else {
      localStorage.removeItem(ROLE_KEY);
    }
  } catch (e) {
    console.error('Storage error:', e);
  }
}

export function getStoredUser(): CustomerUser | WorkerUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: CustomerUser | WorkerUser | null) {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch (e) {
    console.error('User storage error:', e);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // --- Auth: Customer ---
  async registerCustomer(data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    city?: string;
    address?: string;
  }): Promise<{ token: string; role: 'customer'; user: CustomerUser }> {
    const res = await request<{ token: string; role: 'customer'; user: CustomerUser }>(
      '/api/auth/customer/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    setStoredToken(res.token);
    setStoredRole('customer');
    return res;
  },

  async loginCustomer(
    email: string,
    password: string,
    rememberMe = true
  ): Promise<{ token: string; role: 'customer'; user: CustomerUser }> {
    const res = await request<{ token: string; role: 'customer'; user: CustomerUser }>(
      '/api/auth/customer/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, rememberMe }),
      }
    );
    setStoredToken(res.token);
    setStoredRole('customer');
    return res;
  },

  // --- Auth: Worker ---
  async registerWorker(data: {
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
  }): Promise<{ token: string; role: 'worker'; user: WorkerUser }> {
    const res = await request<{ token: string; role: 'worker'; user: WorkerUser }>(
      '/api/auth/worker/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    setStoredToken(res.token);
    setStoredRole('worker');
    return res;
  },

  async loginWorker(
    email: string,
    password: string,
    rememberMe = true
  ): Promise<{ token: string; role: 'worker'; user: WorkerUser }> {
    const res = await request<{ token: string; role: 'worker'; user: WorkerUser }>(
      '/api/auth/worker/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, rememberMe }),
      }
    );
    setStoredToken(res.token);
    setStoredRole('worker');
    return res;
  },

  // Current session
  async getMe(): Promise<{ user: CustomerUser | WorkerUser; role: 'customer' | 'worker' }> {
    return request('/api/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout notification error:', e);
    } finally {
      setStoredToken(null);
      setStoredRole(null);
    }
  },

  // --- Worker Directory & Details ---
  async getWorkers(params?: {
    category?: string;
    city?: string;
    search?: string;
    available?: boolean;
  }): Promise<{ workers: WorkerUser[] }> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.city && params.city !== 'All') query.set('city', params.city);
    if (params?.search) query.set('search', params.search);
    if (params?.available) query.set('available', 'true');

    const qs = query.toString();
    return request(`/api/workers${qs ? `?${qs}` : ''}`);
  },

  async getWorkerById(workerId: string): Promise<{ worker: WorkerUser; reviews: ServiceReview[] }> {
    return request(`/api/workers/${workerId}`);
  },

  // Worker controls
  async toggleAvailability(): Promise<{ isAvailable: boolean; message: string }> {
    return request('/api/worker/availability', { method: 'PATCH' });
  },

  async updateWorkerProfile(data: Partial<WorkerUser>): Promise<{ user: WorkerUser; message: string }> {
    return request('/api/worker/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Customer controls
  async updateCustomerProfile(data: Partial<CustomerUser>): Promise<{ user: CustomerUser; message: string }> {
    return request('/api/customer/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async toggleSaveWorker(workerId: string): Promise<{ savedWorkerIds: string[] }> {
    return request('/api/customer/save-worker', {
      method: 'POST',
      body: JSON.stringify({ workerId }),
    });
  },

  // --- Community Network & Public Profiles ---
  async getCommunityMembers(params?: {
    role?: string;
    city?: string;
    search?: string;
  }): Promise<{ members: any[] }> {
    const query = new URLSearchParams();
    if (params?.role && params.role !== 'all') query.set('role', params.role);
    if (params?.city && params.city !== 'All' && params.city !== 'All Cities') query.set('city', params.city);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return request(`/api/community/members${qs ? `?${qs}` : ''}`);
  },

  async getPublicProfile(id: string): Promise<PublicProfileData> {
    return request(`/api/profile/${id}`);
  },

  async getCommunityPosts(params?: {
    category?: string;
    city?: string;
    search?: string;
  }): Promise<{ posts: CommunityPost[] }> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.city && params.city !== 'All' && params.city !== 'All Cities') query.set('city', params.city);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return request(`/api/community/posts${qs ? `?${qs}` : ''}`);
  },

  async createCommunityPost(data: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  }): Promise<{ post: CommunityPost; message: string }> {
    return request('/api/community/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async replyToCommunityPost(
    postId: string,
    content: string
  ): Promise<{ reply: CommunityReply }> {
    return request(`/api/community/posts/${postId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async likeCommunityPost(postId: string): Promise<{ likesCount: number; isLiked: boolean }> {
    return request(`/api/community/posts/${postId}/like`, {
      method: 'POST',
    });
  },

  async sendConnectionMessage(data: {
    toUserId: string;
    subject?: string;
    message: string;
  }): Promise<{ message: string; connection: CommunityConnectionMessage }> {
    return request('/api/community/connect', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getConnectionRequests(): Promise<{
    incoming: CommunityConnectionMessage[];
    outgoing: CommunityConnectionMessage[];
    connected: CommunityConnectionMessage[];
    pendingCount: number;
  }> {
    return request('/api/community/connections');
  },

  async respondToConnectionRequest(
    connectionId: string,
    status: 'accepted' | 'declined',
    responseNote?: string
  ): Promise<{ message: string; connection: CommunityConnectionMessage }> {
    return request(`/api/community/connections/${connectionId}/respond`, {
      method: 'PATCH',
      body: JSON.stringify({ status, responseNote }),
    });
  },

  // --- Bookings ---
  async createBooking(data: {
    workerId: string;
    serviceRequired: string;
    bookingDate: string;
    preferredTime: string;
    problemDescription?: string;
    photoUrl?: string;
    customerAddress?: string;
    customerCity?: string;
    customerLocation?: { lat: number; lng: number };
  }): Promise<{ message: string; booking: Booking }> {
    return request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getBookings(): Promise<{ bookings: Booking[] }> {
    return request('/api/bookings');
  },

  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    reasonOrNotes?: string
  ): Promise<{ message: string; booking: Booking }> {
    return request(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reasonOrNotes }),
    });
  },

  async submitReview(
    bookingId: string,
    rating: number,
    comment: string
  ): Promise<{ message: string; review: ServiceReview }> {
    return request(`/api/bookings/${bookingId}/review`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
  },

  // --- Notifications ---
  async getNotifications(): Promise<{ notifications: MarketplaceNotification[] }> {
    return request('/api/notifications');
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return request(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    return request('/api/notifications/read-all', {
      method: 'POST',
    });
  },

  // --- Gemini AI Advisor ---
  async askAdvisor(
    messages: { role: 'user' | 'assistant'; content: string }[],
    customerContext?: { name?: string; city?: string }
  ): Promise<{
    text: string;
    isLiveAi: boolean;
    modelUsed: string;
    recommendedCategory?: ServiceCategory;
    estimatedCostRange?: string;
    urgencyLevel?: 'routine' | 'urgent' | 'emergency';
    precautionTips?: string[];
  }> {
    return request('/api/gemini/advisor', {
      method: 'POST',
      body: JSON.stringify({ messages, customerContext }),
    });
  },

  // --- System Status ---
  async getSystemStatus(): Promise<{
    app: string;
    version: string;
    totalWorkers: number;
    geminiConfigured: boolean;
    databaseEngine: string;
  }> {
    return request('/api/system/status');
  },
};
