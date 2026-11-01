import { IncomingMessage, ServerResponse } from 'http';
import { dbManager, hashPassword } from './db';
import { askServiceAdvisorAI } from './gemini';
import {
  CustomerUser,
  WorkerUser,
  Booking,
  ServiceCategory,
  BookingStatus,
} from './types';

// Session lifetime: 1 year (permanent accounts and sessions)
const PERMANENT_SESSION_EXPIRY = 365 * 24 * 60 * 60 * 1000;

function generateToken(): string {
  return 'ngk_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function parseCookies(req: IncomingMessage): Record<string, string> {
  const list: Record<string, string> = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      const key = parts.shift()?.trim();
      const value = decodeURI(parts.join('='));
      if (key) list[key] = value;
    });
  }
  return list;
}

function getAuthenticatedSession(req: IncomingMessage): { user: (CustomerUser | WorkerUser); role: 'customer' | 'worker' } | null {
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    const cookies = parseCookies(req);
    token = cookies.auth_token || '';
  }

  if (!token) return null;
  const session = dbManager.getSession(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    dbManager.deleteSession(token);
    return null;
  }

  if (session.role === 'customer') {
    const customer = dbManager.getCustomerById(session.userId);
    return customer ? { user: customer, role: 'customer' } : null;
  } else {
    const worker = dbManager.getWorkerById(session.userId);
    return worker ? { user: worker, role: 'worker' } : null;
  }
}

async function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  });
  res.end(JSON.stringify(data));
}

export async function handleApiRoute(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;
  const method = req.method?.toUpperCase() || 'GET';

  if (!pathname.startsWith('/api/')) {
    return false;
  }

  if (method === 'OPTIONS') {
    sendJson(res, 204, {});
    return true;
  }

  try {
    // ---------------- AUTH ROUTES ----------------
    // 1. Customer Registration
    if (pathname === '/api/auth/customer/register' && method === 'POST') {
      const body = await parseJsonBody(req);
      const { fullName, email, phone, password, city, address } = body;

      if (!fullName || !email || !password || !phone) {
        sendJson(res, 400, { error: 'Full name, email, phone, and password are required' });
        return true;
      }

      if (password.length < 6) {
        sendJson(res, 400, { error: 'Password must be at least 6 characters' });
        return true;
      }

      const existingCust = dbManager.getCustomerByEmail(email);
      const existingWrk = dbManager.getWorkerByEmail(email);
      if (existingCust || existingWrk) {
        sendJson(res, 409, { error: 'An account with this email already exists' });
        return true;
      }

      const newCustomer: CustomerUser = {
        id: 'cust_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        role: 'customer',
        email: email.trim().toLowerCase(),
        passwordHash: hashPassword(password),
        fullName: fullName.trim(),
        phone: phone.trim(),
        city: city?.trim() || 'Mumbai',
        address: address?.trim() || '',
        neighborhood: city?.trim() || 'Central',
        occupation: 'Resident & Citizen',
        bio: `Citizen and community member based in ${city?.trim() || 'Mumbai'}. Connect with me for local civic help, recommendations, and mutual support.`,
        isPublicProfile: true,
        allowDirectContact: true,
        skillsCanHelpWith: ['Community Help', 'Neighborhood Support', 'Local Recommendations'],
        lookingForServices: ['Home Maintenance', 'Electrical', 'Plumbing'],
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
        savedWorkerIds: [],
        createdAt: new Date().toISOString(),
      };

      dbManager.createCustomer(newCustomer);

      const token = generateToken();
      dbManager.saveSession(token, {
        userId: newCustomer.id,
        role: 'customer',
        expiresAt: Date.now() + PERMANENT_SESSION_EXPIRY,
      });

      const { passwordHash, ...safeCust } = newCustomer;
      sendJson(res, 201, {
        message: 'Customer registration successful',
        token,
        role: 'customer',
        user: safeCust,
      });
      return true;
    }

    // 2. Customer Login
    if (pathname === '/api/auth/customer/login' && method === 'POST') {
      const body = await parseJsonBody(req);
      const { email, password, rememberMe } = body;

      if (!email || !password) {
        sendJson(res, 400, { error: 'Email and password are required' });
        return true;
      }

      const customer = dbManager.getCustomerByEmail(email);
      if (!customer || customer.passwordHash !== hashPassword(password)) {
        sendJson(res, 401, { error: 'Invalid customer email or password' });
        return true;
      }

      const expiry = rememberMe === false ? 7 * 24 * 60 * 60 * 1000 : PERMANENT_SESSION_EXPIRY;
      const token = generateToken();
      dbManager.saveSession(token, {
        userId: customer.id,
        role: 'customer',
        expiresAt: Date.now() + expiry,
      });

      const { passwordHash, ...safeCust } = customer;
      sendJson(res, 200, {
        message: 'Login successful',
        token,
        role: 'customer',
        user: safeCust,
      });
      return true;
    }

    // 3. Worker Registration
    if (pathname === '/api/auth/worker/register' && method === 'POST') {
      const body = await parseJsonBody(req);
      const {
        fullName,
        photoUrl,
        email,
        phone,
        password,
        serviceCategory,
        skills,
        experienceYears,
        city,
        serviceAddress,
        workingHours,
        serviceCharge,
        bio,
      } = body;

      if (!fullName || !email || !password || !phone || !serviceCategory) {
        sendJson(res, 400, { error: 'Name, email, phone, category, and password are required' });
        return true;
      }

      const existingCust = dbManager.getCustomerByEmail(email);
      const existingWrk = dbManager.getWorkerByEmail(email);
      if (existingCust || existingWrk) {
        sendJson(res, 409, { error: 'An account with this email already exists' });
        return true;
      }

      const newWorker: WorkerUser = {
        id: 'wrk_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        role: 'worker',
        email: email.trim().toLowerCase(),
        passwordHash: hashPassword(password),
        fullName: fullName.trim(),
        phone: phone.trim(),
        photoUrl: photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
        serviceCategory: serviceCategory as ServiceCategory,
        skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map((s: string) => s.trim()) : ['General Repairs']),
        experienceYears: Number(experienceYears) || 2,
        city: city?.trim() || 'Mumbai',
        serviceAddress: serviceAddress?.trim() || 'Service Area',
        lat: 19.1197 + (Math.random() - 0.5) * 0.05,
        lng: 72.8464 + (Math.random() - 0.5) * 0.05,
        isAvailable: true,
        workingHours: workingHours || '9:00 AM - 7:00 PM',
        serviceCharge: Number(serviceCharge) || 299,
        chargeUnit: 'visit',
        bio: bio || 'Professional technician committed to quality service and timely completion.',
        rating: 5.0,
        reviewCount: 0,
        totalCompletedJobs: 0,
        totalEarnings: 0,
        isDemo: false,
        isPublicProfile: true,
        allowDirectContact: true,
        neighborhood: city?.trim() || 'Central',
        createdAt: new Date().toISOString(),
      };

      dbManager.createWorker(newWorker);

      const token = generateToken();
      dbManager.saveSession(token, {
        userId: newWorker.id,
        role: 'worker',
        expiresAt: Date.now() + PERMANENT_SESSION_EXPIRY,
      });

      const { passwordHash, ...safeWrk } = newWorker;
      sendJson(res, 201, {
        message: 'Worker registered successfully',
        token,
        role: 'worker',
        user: safeWrk,
      });
      return true;
    }

    // 4. Worker Login
    if (pathname === '/api/auth/worker/login' && method === 'POST') {
      const body = await parseJsonBody(req);
      const { email, password, rememberMe } = body;

      if (!email || !password) {
        sendJson(res, 400, { error: 'Email and password are required' });
        return true;
      }

      const worker = dbManager.getWorkerByEmail(email);
      if (!worker || worker.passwordHash !== hashPassword(password)) {
        sendJson(res, 401, { error: 'Invalid worker email or password' });
        return true;
      }

      const expiry = rememberMe === false ? 7 * 24 * 60 * 60 * 1000 : PERMANENT_SESSION_EXPIRY;
      const token = generateToken();
      dbManager.saveSession(token, {
        userId: worker.id,
        role: 'worker',
        expiresAt: Date.now() + expiry,
      });

      const { passwordHash, ...safeWrk } = worker;
      sendJson(res, 200, {
        message: 'Login successful',
        token,
        role: 'worker',
        user: safeWrk,
      });
      return true;
    }

    // 5. Auth Me
    if (pathname === '/api/auth/me' && method === 'GET') {
      const session = getAuthenticatedSession(req);
      if (!session) {
        sendJson(res, 401, { error: 'Unauthorized' });
        return true;
      }

      const { passwordHash, ...safeUser } = session.user as any;
      sendJson(res, 200, { user: safeUser, role: session.role });
      return true;
    }

    // 6. Logout
    if (pathname === '/api/auth/logout' && method === 'POST') {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        dbManager.deleteSession(token);
      }
      sendJson(res, 200, { message: 'Logged out successfully' });
      return true;
    }

    // ---------------- WORKER MARKETPLACE & DIRECTORY (FOR CUSTOMERS) ----------------
    if (pathname === '/api/workers' && method === 'GET') {
      const categoryParam = urlObj.searchParams.get('category');
      const cityParam = urlObj.searchParams.get('city');
      const searchParam = urlObj.searchParams.get('search');
      const availableOnly = urlObj.searchParams.get('available') === 'true';

      let workers = dbManager.getAllWorkers();

      if (categoryParam && categoryParam !== 'All') {
        workers = workers.filter((w) => w.serviceCategory.toLowerCase() === categoryParam.toLowerCase());
      }

      if (cityParam && cityParam !== 'All') {
        workers = workers.filter((w) => w.city.toLowerCase().includes(cityParam.toLowerCase()));
      }

      if (availableOnly) {
        workers = workers.filter((w) => w.isAvailable);
      }

      if (searchParam) {
        const q = searchParam.toLowerCase();
        workers = workers.filter(
          (w) =>
            w.fullName.toLowerCase().includes(q) ||
            w.serviceCategory.toLowerCase().includes(q) ||
            w.skills.some((s) => s.toLowerCase().includes(q)) ||
            w.bio.toLowerCase().includes(q)
        );
      }

      // Return public sanitized worker profiles
      const safeWorkers = workers.map(({ passwordHash, ...w }) => w);
      sendJson(res, 200, { workers: safeWorkers });
      return true;
    }

    if (pathname.startsWith('/api/workers/') && method === 'GET') {
      const workerId = pathname.replace('/api/workers/', '');
      const worker = dbManager.getWorkerById(workerId);
      if (!worker) {
        sendJson(res, 404, { error: 'Service provider not found' });
        return true;
      }
      const reviews = dbManager.getReviewsByWorker(workerId);
      const { passwordHash, ...safeWrk } = worker;
      sendJson(res, 200, { worker: safeWrk, reviews });
      return true;
    }

    // ---------------- WORKER SELF DASHBOARD ACTIONS ----------------
    if (pathname === '/api/worker/availability' && method === 'PATCH') {
      const session = getAuthenticatedSession(req);
      if (!session || session.role !== 'worker') {
        sendJson(res, 403, { error: 'Only registered workers can update availability' });
        return true;
      }

      const isAvailable = dbManager.toggleWorkerAvailability(session.user.id);
      sendJson(res, 200, { isAvailable, message: `Status updated to ${isAvailable ? 'Available Now' : 'Offline'}` });
      return true;
    }

    if (pathname === '/api/worker/profile' && method === 'PUT') {
      const session = getAuthenticatedSession(req);
      if (!session || session.role !== 'worker') {
        sendJson(res, 403, { error: 'Unauthorized' });
        return true;
      }

      const body = await parseJsonBody(req);
      const updated = dbManager.updateWorker(session.user.id, body);
      if (!updated) {
        sendJson(res, 500, { error: 'Failed to update profile' });
        return true;
      }
      const { passwordHash, ...safeWrk } = updated;
      sendJson(res, 200, { user: safeWrk, message: 'Worker profile updated successfully' });
      return true;
    }

    // ---------------- CUSTOMER PROFILE ACTIONS ----------------
    if (pathname === '/api/customer/profile' && method === 'PUT') {
      const session = getAuthenticatedSession(req);
      if (!session || session.role !== 'customer') {
        sendJson(res, 403, { error: 'Unauthorized' });
        return true;
      }

      const body = await parseJsonBody(req);
      const updated = dbManager.updateCustomer(session.user.id, body);
      if (!updated) {
        sendJson(res, 500, { error: 'Failed to update customer profile' });
        return true;
      }
      const { passwordHash, ...safeCust } = updated;
      sendJson(res, 200, { user: safeCust, message: 'Profile updated successfully' });
      return true;
    }

    if (pathname === '/api/customer/save-worker' && method === 'POST') {
      const session = getAuthenticatedSession(req);
      if (!session || session.role !== 'customer') {
        sendJson(res, 403, { error: 'Unauthorized' });
        return true;
      }

      const body = await parseJsonBody(req);
      const { workerId } = body;
      const savedList = dbManager.toggleSaveWorker(session.user.id, workerId);
      sendJson(res, 200, { savedWorkerIds: savedList });
      return true;
    }

    // ---------------- COMMUNITY & PUBLIC PROFILES ----------------
    // Get all public community members (citizens + service providers)
    if (pathname === '/api/community/members' && method === 'GET') {
      const roleParam = urlObj.searchParams.get('role') || undefined;
      const cityParam = urlObj.searchParams.get('city') || undefined;
      const searchParam = urlObj.searchParams.get('search') || undefined;

      const members = dbManager.getAllPublicMembers({
        role: roleParam,
        city: cityParam,
        search: searchParam,
      });

      sendJson(res, 200, { members });
      return true;
    }

    // Get individual public profile by ID (public access for profile link sharing)
    if (pathname.startsWith('/api/profile/') && method === 'GET') {
      const profileId = pathname.replace('/api/profile/', '');
      const profileData = dbManager.getUserPublicProfile(profileId);
      if (!profileData) {
        sendJson(res, 404, { error: 'Profile not found' });
        return true;
      }
      sendJson(res, 200, profileData);
      return true;
    }

    // Get community posts
    if (pathname === '/api/community/posts' && method === 'GET') {
      const category = urlObj.searchParams.get('category') || undefined;
      const city = urlObj.searchParams.get('city') || undefined;
      const search = urlObj.searchParams.get('search') || undefined;

      const posts = dbManager.getCommunityPosts({ category, city, search });
      sendJson(res, 200, { posts });
      return true;
    }

    // Create community post
    if (pathname === '/api/community/posts' && method === 'POST') {
      const session = getAuthenticatedSession(req);
      if (!session) {
        sendJson(res, 401, { error: 'Please login to post in the community' });
        return true;
      }

      const body = await parseJsonBody(req);
      const { title, content, category, tags } = body;
      if (!title || !content) {
        sendJson(res, 400, { error: 'Title and content are required' });
        return true;
      }

      const author = session.user as any;
      const newPost = {
        id: 'post_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        authorId: author.id,
        authorName: author.fullName,
        authorRole: session.role,
        authorAvatar: author.avatarUrl || author.photoUrl,
        authorCity: author.city || 'Mumbai',
        authorNeighborhood: author.neighborhood,
        category: category || 'general',
        title: title.trim(),
        content: content.trim(),
        tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : ['Community']),
        likesCount: 0,
        likedBy: [],
        replies: [],
        createdAt: new Date().toISOString(),
      };

      const created = dbManager.createCommunityPost(newPost);
      sendJson(res, 201, { post: created, message: 'Community post published!' });
      return true;
    }

    // Reply to community post
    if (pathname.startsWith('/api/community/posts/') && pathname.endsWith('/replies') && method === 'POST') {
      const session = getAuthenticatedSession(req);
      if (!session) {
        sendJson(res, 401, { error: 'Please login to reply' });
        return true;
      }

      const postId = pathname.replace('/api/community/posts/', '').replace('/replies', '');
      const body = await parseJsonBody(req);
      const { content } = body;
      if (!content?.trim()) {
        sendJson(res, 400, { error: 'Reply content cannot be empty' });
        return true;
      }

      const author = session.user as any;
      const reply = {
        id: 'rep_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        authorId: author.id,
        authorName: author.fullName,
        authorRole: session.role,
        authorAvatar: author.avatarUrl || author.photoUrl,
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };

      const added = dbManager.addPostReply(postId, reply);
      if (!added) {
        sendJson(res, 404, { error: 'Post not found' });
        return true;
      }

      sendJson(res, 201, { reply: added });
      return true;
    }

    // Toggle like on community post
    if (pathname.startsWith('/api/community/posts/') && pathname.endsWith('/like') && method === 'POST') {
      const session = getAuthenticatedSession(req);
      if (!session) {
        sendJson(res, 401, { error: 'Please login to like posts' });
        return true;
      }

      const postId = pathname.replace('/api/community/posts/', '').replace('/like', '');
      const result = dbManager.toggleLikePost(postId, session.user.id);
      if (!result) {
        sendJson(res, 404, { error: 'Post not found' });
        return true;
      }

      sendJson(res, 200, result);
      return true;
    }

    // Send direct connection message / inquiry
    if (pathname === '/api/community/connect' && method === 'POST') {
      const session = getAuthenticatedSession(req);
      if (!session) {
        sendJson(res, 401, { error: 'Please login to send connection requests' });
        return true;
      }

      const body = await parseJsonBody(req);
      const { toUserId, subject, message } = body;
      if (!toUserId || !message) {
        sendJson(res, 400, { error: 'Recipient and message are required' });
        return true;
      }

      const sender = session.user as any;
      const connectionMsg = {
        id: 'conn_' + Date.now().toString(36),
        fromUserId: sender.id,
        fromUserName: sender.fullName,
        fromUserRole: session.role,
        fromUserAvatar: sender.avatarUrl || sender.photoUrl,
        fromUserCity: sender.city,
        fromUserNeighborhood: sender.neighborhood,
        fromUserPhone: sender.phone,
        fromUserEmail: sender.email,
        toUserId,
        subject: subject?.trim() || 'Community Connect Request',
        message: message.trim(),
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      };

      dbManager.sendConnectionMessage(connectionMsg);
      sendJson(res, 200, {
        message: 'Connection request sent successfully! The recipient has been notified.',
        connection: connectionMsg,
      });
      return true;
    }

    // Get incoming, outgoing, and accepted connections for the current user
    if (pathname === '/api/community/connections' && method === 'GET') {
      const session = getAuthenticatedSession(req);
      if (!session) {
        sendJson(res, 401, { error: 'Unauthorized' });
        return true;
      }

      const connectionsData = dbManager.getConnectionRequests(session.user.id);
      sendJson(res, 200, connectionsData);
      return true;
    }

    // Respond (Accept / Deny) to an incoming connection request
    if (
      pathname.startsWith('/api/community/connections/') &&
      pathname.endsWith('/respond') &&
      method === 'PATCH'
    ) {
      const session = getAuthenticatedSession(req);
      if (!session) {
        sendJson(res, 401, { error: 'Unauthorized' });
        return true;
      }

      const connectionId = pathname
        .replace('/api/community/connections/', '')
        .replace('/respond', '');

      const body = await parseJsonBody(req);
      const { status, responseNote } = body;

      if (status !== 'accepted' && status !== 'declined') {
        sendJson(res, 400, { error: 'Status must be accepted or declined' });
        return true;
      }

      const updated = dbManager.respondToConnectionRequest(
        connectionId,
        session.user.id,
        status,
        responseNote
      );

      if (!updated) {
        sendJson(res, 404, {
          error: 'Connection request not found or you are not authorized to respond to it',
        });
        return true;
      }

      sendJson(res, 200, {
        message: `Connection request ${status === 'accepted' ? 'accepted' : 'declined'} successfully`,
        connection: updated,
      });
      return true;
    }

    // ---------------- BOOKINGS WORKFLOW ----------------
    if (pathname === '/api/bookings' && method === 'GET') {
      const session = getAuthenticatedSession(req);
      if (!session) {
        sendJson(res, 401, { error: 'Unauthorized' });
        return true;
      }

      if (session.role === 'customer') {
        const bookings = dbManager.getBookingsByCustomer(session.user.id);
        sendJson(res, 200, { bookings });
        return true;
      } else {
        const bookings = dbManager.getBookingsByWorker(session.user.id);
        sendJson(res, 200, { bookings });
        return true;
      }
    }

    if (pathname === '/api/bookings' && method === 'POST') {
      const session = getAuthenticatedSession(req);
      if (!session || session.role !== 'customer') {
        sendJson(res, 403, { error: 'Only customers can book services' });
        return true;
      }

      const customer = session.user as CustomerUser;
      const body = await parseJsonBody(req);
      const {
        workerId,
        serviceRequired,
        bookingDate,
        preferredTime,
        problemDescription,
        photoUrl,
        customerAddress,
        customerCity,
        customerLocation,
      } = body;

      if (!workerId || !serviceRequired || !bookingDate || !preferredTime) {
        sendJson(res, 400, { error: 'Worker, service, date, and preferred time are required' });
        return true;
      }

      const worker = dbManager.getWorkerById(workerId);
      if (!worker) {
        sendJson(res, 404, { error: 'Selected service provider was not found' });
        return true;
      }

      const bookingId = `BK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newBooking: Booking = {
        id: bookingId,
        customerId: customer.id,
        customerName: customer.fullName,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        customerAddress: customerAddress || customer.address,
        customerCity: customerCity || customer.city,
        customerLocation: customerLocation,
        workerId: worker.id,
        workerName: worker.fullName,
        workerCategory: worker.serviceCategory,
        workerPhone: worker.phone,
        serviceRequired: serviceRequired.trim(),
        bookingDate,
        preferredTime,
        problemDescription: problemDescription?.trim() || 'No additional notes provided.',
        photoUrl,
        estimatedCost: worker.serviceCharge,
        status: 'Requested',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dbManager.createBooking(newBooking);
      sendJson(res, 201, {
        message: 'Booking request sent successfully to service provider',
        booking: newBooking,
      });
      return true;
    }

    if (pathname.startsWith('/api/bookings/') && pathname.endsWith('/status') && method === 'PATCH') {
      const session = getAuthenticatedSession(req);
      if (!session) {
        sendJson(res, 401, { error: 'Unauthorized' });
        return true;
      }

      const bookingId = pathname.replace('/api/bookings/', '').replace('/status', '');
      const booking = dbManager.getBookingById(bookingId);
      if (!booking) {
        sendJson(res, 404, { error: 'Booking not found' });
        return true;
      }

      // Check permission: worker or customer
      const isAssignedWorker = session.role === 'worker' && booking.workerId === session.user.id;
      const isBookingCustomer = session.role === 'customer' && booking.customerId === session.user.id;

      if (!isAssignedWorker && !isBookingCustomer) {
        sendJson(res, 403, { error: 'You are not authorized to update this booking' });
        return true;
      }

      const body = await parseJsonBody(req);
      const { status, reasonOrNotes } = body;

      const updated = dbManager.updateBookingStatus(bookingId, status as BookingStatus, reasonOrNotes);
      sendJson(res, 200, {
        message: `Booking status changed to ${status}`,
        booking: updated,
      });
      return true;
    }

    // Submit Review for a Completed Booking
    if (pathname.startsWith('/api/bookings/') && pathname.endsWith('/review') && method === 'POST') {
      const session = getAuthenticatedSession(req);
      if (!session || session.role !== 'customer') {
        sendJson(res, 403, { error: 'Only customers can submit reviews' });
        return true;
      }

      const bookingId = pathname.replace('/api/bookings/', '').replace('/review', '');
      const booking = dbManager.getBookingById(bookingId);
      if (!booking) {
        sendJson(res, 404, { error: 'Booking not found' });
        return true;
      }

      if (booking.customerId !== session.user.id) {
        sendJson(res, 403, { error: 'You did not make this booking' });
        return true;
      }

      const body = await parseJsonBody(req);
      const { rating, comment } = body;

      const review = dbManager.addReview(
        bookingId,
        session.user.id,
        session.user.fullName,
        booking.workerId,
        Number(rating) || 5,
        comment?.trim() || 'Great service!'
      );

      sendJson(res, 200, { message: 'Review submitted successfully', review });
      return true;
    }

    // ---------------- NOTIFICATIONS ----------------
    if (pathname === '/api/notifications' && method === 'GET') {
      const session = getAuthenticatedSession(req);
      if (!session) {
        sendJson(res, 401, { error: 'Unauthorized' });
        return true;
      }

      const notifications = dbManager.getNotificationsByUser(session.user.id);
      sendJson(res, 200, { notifications });
      return true;
    }

    if (pathname.startsWith('/api/notifications/') && pathname.endsWith('/read') && method === 'PATCH') {
      const session = getAuthenticatedSession(req);
      if (!session) {
        sendJson(res, 401, { error: 'Unauthorized' });
        return true;
      }

      const notifId = pathname.replace('/api/notifications/', '').replace('/read', '');
      const success = dbManager.markNotificationRead(notifId, session.user.id);
      sendJson(res, 200, { success });
      return true;
    }

    if (pathname === '/api/notifications/read-all' && method === 'POST') {
      const session = getAuthenticatedSession(req);
      if (!session) {
        sendJson(res, 401, { error: 'Unauthorized' });
        return true;
      }

      dbManager.markAllNotificationsRead(session.user.id);
      sendJson(res, 200, { success: true });
      return true;
    }

    // ---------------- GEMINI AI SERVICE ADVISOR ----------------
    if (pathname === '/api/gemini/advisor' && method === 'POST') {
      const body = await parseJsonBody(req);
      const { messages, customerContext } = body;

      if (!Array.isArray(messages) || messages.length === 0) {
        sendJson(res, 400, { error: 'Messages array is required' });
        return true;
      }

      const result = await askServiceAdvisorAI(messages, customerContext);
      sendJson(res, 200, result);
      return true;
    }

    // ---------------- SYSTEM HEALTH ----------------
    if (pathname === '/api/system/status' && method === 'GET') {
      const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
      sendJson(res, 200, {
        app: 'NagrikAI Local Service Connect',
        version: '3.0.0-marketplace',
        totalWorkers: dbManager.getAllWorkers().length,
        geminiConfigured: hasKey,
        databaseEngine: 'Persistent Local JSON (Centralized Marketplace DB)',
      });
      return true;
    }

    sendJson(res, 404, { error: `Endpoint ${method} ${pathname} not found` });
    return true;
  } catch (err: any) {
    console.error('API Error:', err);
    sendJson(res, 500, { error: err?.message || 'Internal server error' });
    return true;
  }
}
