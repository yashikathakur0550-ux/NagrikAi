export type UserRole = 'customer' | 'worker';

export interface CustomerUser {
  id: string;
  role: 'customer';
  email: string;
  passwordHash: string;
  fullName: string;
  phone: string;
  city: string;
  address: string;
  neighborhood?: string;
  occupation?: string;
  bio?: string;
  isPublicProfile?: boolean;
  allowDirectContact?: boolean;
  skillsCanHelpWith?: string[];
  lookingForServices?: string[];
  avatarUrl?: string;
  savedWorkerIds?: string[];
  createdAt: string;
}

export type ServiceCategory =
  | 'Plumbing'
  | 'Electrician'
  | 'Carpenter'
  | 'Home Cleaning'
  | 'AC Repair'
  | 'Appliance Repair'
  | 'Painting'
  | 'Pest Control'
  | 'Beauty Services'
  | 'Salon at Home'
  | 'Gardening'
  | 'RO and Water Purifier Repair'
  | 'Computer and Laptop Repair'
  | 'Vehicle Repair'
  | 'Packers and Movers';

export interface WorkerUser {
  id: string;
  role: 'worker';
  email: string;
  passwordHash: string;
  fullName: string;
  phone: string;
  photoUrl: string;
  avatarUrl?: string;
  serviceCategory: ServiceCategory;
  skills: string[];
  experienceYears: number;
  city: string;
  serviceAddress: string;
  neighborhood?: string;
  lat: number;
  lng: number;
  isAvailable: boolean; // toggle live availability
  isPublicProfile?: boolean;
  allowDirectContact?: boolean;
  workingHours: string;
  serviceCharge: number; // e.g., 299 visiting/inspection fee
  chargeUnit: string; // 'visit' | 'hour' | 'job'
  bio: string;
  rating: number; // e.g. 4.8
  reviewCount: number;
  totalCompletedJobs: number;
  totalEarnings: number;
  isDemo?: boolean;
  createdAt: string;
}

export interface CommunityReply {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'customer' | 'worker';
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'customer' | 'worker';
  authorAvatar?: string;
  authorCity: string;
  authorNeighborhood?: string;
  category: 'help_request' | 'service_offer' | 'neighbourhood_connect' | 'recommendation' | 'general';
  title: string;
  content: string;
  tags: string[];
  likesCount: number;
  likedBy: string[];
  replies: CommunityReply[];
  createdAt: string;
}

export type ConnectionStatus = 'pending' | 'accepted' | 'declined';

export interface CommunityConnectionMessage {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserRole: 'customer' | 'worker';
  fromUserAvatar?: string;
  fromUserCity?: string;
  fromUserNeighborhood?: string;
  fromUserPhone?: string;
  fromUserEmail?: string;
  toUserId: string;
  toUserName?: string;
  toUserRole?: 'customer' | 'worker';
  toUserAvatar?: string;
  subject: string;
  message: string;
  status: ConnectionStatus;
  responseNote?: string;
  createdAt: string;
  updatedAt?: string;
}

export type BookingStatus =
  | 'Requested'
  | 'Accepted'
  | 'Rejected'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled';

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerLocation?: { lat: number; lng: number };
  workerId: string;
  workerName: string;
  workerCategory: ServiceCategory;
  workerPhone: string;
  serviceRequired: string;
  bookingDate: string; // YYYY-MM-DD
  preferredTime: string; // e.g., '10:00 AM - 12:00 PM'
  problemDescription: string;
  photoUrl?: string;
  estimatedCost: number;
  status: BookingStatus;
  rejectionReason?: string;
  completionNotes?: string;
  rating?: number;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceReview {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  workerId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface MarketplaceNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking_request' | 'booking_status' | 'payment' | 'system';
  read: boolean;
  bookingId?: string;
  createdAt: string;
}

export interface ServiceCategoryMeta {
  id: ServiceCategory;
  name: string;
  iconName: string;
  description: string;
  averageRate: string;
  popularIssues: string[];
}

export interface AuthSession {
  userId: string;
  role: 'customer' | 'worker';
  expiresAt: number;
}
