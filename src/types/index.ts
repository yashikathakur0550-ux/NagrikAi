export type UserRole = 'customer' | 'worker';

export interface CustomerUser {
  id: string;
  role: 'customer';
  email: string;
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
  isAvailable: boolean;
  isPublicProfile?: boolean;
  allowDirectContact?: boolean;
  workingHours: string;
  serviceCharge: number;
  chargeUnit: string;
  bio: string;
  rating: number;
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

export interface PublicProfileData {
  user: CustomerUser | WorkerUser;
  role: 'customer' | 'worker';
  reviews?: ServiceReview[];
  communityPosts?: CommunityPost[];
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
  bookingDate: string;
  preferredTime: string;
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
  description: string;
  avgCost: string;
  tag: string;
  commonIssues: string[];
}

export type CustomerTab =
  | 'explore'
  | 'categories'
  | 'community'
  | 'my-bookings'
  | 'nearby-map'
  | 'saved-workers'
  | 'ai-advisor'
  | 'notifications'
  | 'profile';

export type WorkerTab =
  | 'dashboard'
  | 'community'
  | 'requests'
  | 'active-jobs'
  | 'earnings'
  | 'reviews'
  | 'profile'
  | 'notifications';

export interface GPSCoordinate {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}
