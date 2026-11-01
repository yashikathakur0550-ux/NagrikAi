import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  CustomerUser,
  WorkerUser,
  Booking,
  ServiceReview,
  MarketplaceNotification,
  ServiceCategory,
  BookingStatus,
  CommunityPost,
  CommunityReply,
  CommunityConnectionMessage,
  AuthSession,
} from './types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'nagrikai_marketplace_db.json');

export interface MarketplaceDatabaseSchema {
  customers: CustomerUser[];
  workers: WorkerUser[];
  bookings: Booking[];
  reviews: ServiceReview[];
  notifications: MarketplaceNotification[];
  communityPosts: CommunityPost[];
  connectionMessages: CommunityConnectionMessage[];
  sessions?: Record<string, AuthSession>;
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_nagrikai_service_salt_2025').digest('hex');
}

// High quality demo customers and workers across categories
const SEED_CUSTOMERS: CustomerUser[] = [
  {
    id: 'cust_aarav_sharma',
    role: 'customer',
    email: 'customer@nagrikai.com',
    passwordHash: hashPassword('Password123!'),
    fullName: 'Aarav Sharma',
    phone: '+91 98765 43210',
    city: 'Mumbai',
    neighborhood: 'Andheri West',
    address: 'B-402, Sea Green Heights, Link Road, Andheri West, Mumbai',
    occupation: 'Senior UI/UX Designer & Smart Home Enthusiast',
    bio: 'Tech enthusiast & resident in Andheri West for 8 years. Happy to help senior neighbors with smart devices, Wi-Fi configuration, and digital services.',
    isPublicProfile: true,
    allowDirectContact: true,
    skillsCanHelpWith: ['Smart Home Setup', 'Wi-Fi & Router Setup', 'Digital Payment Safety', 'Emergency Citizen Help'],
    lookingForServices: ['Electrician', 'Plumbing', 'AC Repair'],
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    savedWorkerIds: ['wrk_rajesh_electrician', 'wrk_vijay_plumber'],
    createdAt: '2025-01-10T08:00:00.000Z',
  },
  {
    id: 'cust_priya_patel',
    role: 'customer',
    email: 'priya.patel@example.com',
    passwordHash: hashPassword('Password123!'),
    fullName: 'Priya Patel',
    phone: '+91 98234 56789',
    city: 'Mumbai',
    neighborhood: 'Powai',
    address: 'Flat 12, Sunrise Residency, Powai, Mumbai',
    occupation: 'Architect & Organic Terrace Gardener',
    bio: 'Passionate about sustainable balcony gardens, neighborhood composting, and energy efficiency. Always welcoming connections with fellow Mumbai residents.',
    isPublicProfile: true,
    allowDirectContact: true,
    skillsCanHelpWith: ['Terrace & Balcony Gardening', 'Interior Space Planning', 'Energy Saving Advice'],
    lookingForServices: ['Home Cleaning', 'Carpenter', 'Gardening'],
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    savedWorkerIds: ['wrk_sunita_cleaner'],
    createdAt: '2025-02-14T10:30:00.000Z',
  },
  {
    id: 'cust_rohit_verma',
    role: 'customer',
    email: 'rohit.verma@example.com',
    passwordHash: hashPassword('Password123!'),
    fullName: 'Rohit Verma',
    phone: '+91 98199 88776',
    city: 'Delhi',
    neighborhood: 'South Extension',
    address: 'C-18, South Extension Part II, New Delhi',
    occupation: 'Civil Construction Consultant',
    bio: 'Civil engineer with 15+ years experience in waterproofing, structural integrity, and building maintenance. Connecting to assist local citizens with renovation audits.',
    isPublicProfile: true,
    allowDirectContact: true,
    skillsCanHelpWith: ['Waterproofing Advice', 'Home Renovation Planning', 'Structural Inspection'],
    lookingForServices: ['Painting', 'Plumbing'],
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    savedWorkerIds: [],
    createdAt: '2025-03-01T11:00:00.000Z',
  },
  {
    id: 'cust_ananya_reddy',
    role: 'customer',
    email: 'ananya.reddy@example.com',
    passwordHash: hashPassword('Password123!'),
    fullName: 'Ananya Reddy',
    phone: '+91 97400 11223',
    city: 'Bengaluru',
    neighborhood: 'Indiranagar',
    address: '100ft Road, Near Metro Station, Indiranagar, Bengaluru',
    occupation: 'Product Manager & Community Animal Volunteer',
    bio: 'Indiranagar resident. Love connecting with fellow pet parents, environmental volunteers, and local neighborhood watch coordinators.',
    isPublicProfile: true,
    allowDirectContact: true,
    skillsCanHelpWith: ['Pet Care / Pet Sitting', 'Waste Segregation Guidance', 'Neighborhood Cleanups'],
    lookingForServices: ['Pest Control', 'Appliance Repair'],
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    savedWorkerIds: [],
    createdAt: '2025-03-15T09:30:00.000Z',
  },
];

const SEED_WORKERS: WorkerUser[] = [
  {
    id: 'wrk_rajesh_electrician',
    role: 'worker',
    email: 'worker@nagrikai.com', // Demo Service Provider Login
    passwordHash: hashPassword('Password123!'),
    fullName: 'Rajesh Kumar Verma',
    phone: '+91 98111 22334',
    photoUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80',
    serviceCategory: 'Electrician',
    skills: ['Complete Home Rewiring', 'Inverter & Battery Setup', 'MCB Tripping Repair', 'Chandelier Installation', 'Appliance Earthing'],
    experienceYears: 9,
    city: 'Mumbai',
    serviceAddress: 'Shop 4, Andheri West Market, Near Railway Station, Mumbai',
    lat: 19.1197,
    lng: 72.8464,
    isAvailable: true,
    workingHours: '8:30 AM - 8:30 PM (Mon-Sun)',
    serviceCharge: 299,
    chargeUnit: 'visit',
    bio: 'Govt Certified Electrician with over 9 years of residential and commercial electrical repair expertise. Quick 30-minute arrival in Andheri and Juhu.',
    rating: 4.9,
    reviewCount: 124,
    totalCompletedJobs: 188,
    totalEarnings: 74200,
    isDemo: true,
    createdAt: '2024-11-01T09:00:00.000Z',
  },
  {
    id: 'wrk_vijay_plumber',
    role: 'worker',
    email: 'vijay.plumber@nagrikai.com',
    passwordHash: hashPassword('Password123!'),
    fullName: 'Vijay Shinde',
    phone: '+91 98222 33445',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    serviceCategory: 'Plumbing',
    skills: ['Water Leakage Detection', 'Bathroom Pipe Fitting', 'Overhead Tank Cleaning', 'Water Motor Pump Repair', 'Faucet & Tap Replacement'],
    experienceYears: 12,
    city: 'Mumbai',
    serviceAddress: 'Gala 18, Lokhandwala Complex, Andheri West, Mumbai',
    lat: 19.1311,
    lng: 72.8258,
    isAvailable: true,
    workingHours: '9:00 AM - 7:00 PM',
    serviceCharge: 349,
    chargeUnit: 'visit',
    bio: 'Master Plumber specializing in concealed pipeline leakage detection and luxury bathroom sanitary ware installations. Genuine CPVC parts guaranteed.',
    rating: 4.8,
    reviewCount: 98,
    totalCompletedJobs: 154,
    totalEarnings: 61800,
    isDemo: true,
    createdAt: '2024-10-15T11:00:00.000Z',
  },
  {
    id: 'wrk_sunita_cleaner',
    role: 'worker',
    email: 'sunita.cleaning@nagrikai.com',
    passwordHash: hashPassword('Password123!'),
    fullName: 'Sunita Sharma & Team',
    phone: '+91 98333 44556',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    serviceCategory: 'Home Cleaning',
    skills: ['Deep Home Cleaning', 'Kitchen Degreasing', 'Sofa & Carpet Shampooing', 'Bathroom Disinfection', 'Move-in/Move-out Cleaning'],
    experienceYears: 7,
    city: 'Mumbai',
    serviceAddress: 'Vile Parle East, Station Road, Mumbai',
    lat: 19.0988,
    lng: 72.8526,
    isAvailable: true,
    workingHours: '8:00 AM - 6:00 PM',
    serviceCharge: 799,
    chargeUnit: 'visit',
    bio: 'Professional eco-friendly home sanitization and deep cleaning team equipped with industrial vacuum extractors and steam disinfectants.',
    rating: 4.9,
    reviewCount: 142,
    totalCompletedJobs: 210,
    totalEarnings: 112000,
    isDemo: true,
    createdAt: '2024-09-20T08:00:00.000Z',
  },
  {
    id: 'wrk_amit_ac',
    role: 'worker',
    email: 'amit.acrepair@nagrikai.com',
    passwordHash: hashPassword('Password123!'),
    fullName: 'Amit Yadav',
    phone: '+91 98444 55667',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    serviceCategory: 'AC Repair',
    skills: ['Split & Window AC Servicing', 'Gas Charging & Leak Test', 'PCB Board Repair', 'Compressor Replacement', 'AC Uninstallation & Fitting'],
    experienceYears: 8,
    city: 'Mumbai',
    serviceAddress: 'SV Road, Bandra West, Mumbai',
    lat: 19.0596,
    lng: 72.8295,
    isAvailable: false,
    workingHours: '9:00 AM - 9:00 PM',
    serviceCharge: 449,
    chargeUnit: 'visit',
    bio: 'Certified HVAC cooling technician trained across Daikin, Voltas, LG, and Blue Star units. 90-day warranty on all cooling repairs.',
    rating: 4.7,
    reviewCount: 86,
    totalCompletedJobs: 132,
    totalEarnings: 69400,
    isDemo: true,
    createdAt: '2024-12-05T10:00:00.000Z',
  },
  {
    id: 'wrk_manoj_carpenter',
    role: 'worker',
    email: 'manoj.carpenter@nagrikai.com',
    passwordHash: hashPassword('Password123!'),
    fullName: 'Manoj Suthar',
    phone: '+91 98555 66778',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    serviceCategory: 'Carpenter',
    skills: ['Modular Furniture Assembly', 'Door Lock & Latch Fixing', 'Bed & Wardrobe Repair', 'Kitchen Cabinet Hinge Alignment', 'Custom Woodwork'],
    experienceYears: 14,
    city: 'Mumbai',
    serviceAddress: 'Chincholi Bunder, Malad West, Mumbai',
    lat: 19.1860,
    lng: 72.8485,
    isAvailable: true,
    workingHours: '9:30 AM - 7:30 PM',
    serviceCharge: 399,
    chargeUnit: 'visit',
    bio: 'Precision carpenter with 14 years of craftsmanship in teakwood, plywood, and IKEA/Urban Ladder modular assemblies.',
    rating: 4.9,
    reviewCount: 79,
    totalCompletedJobs: 118,
    totalEarnings: 52000,
    isDemo: true,
    createdAt: '2024-08-11T13:00:00.000Z',
  },
  {
    id: 'wrk_pooja_beauty',
    role: 'worker',
    email: 'pooja.beauty@nagrikai.com',
    passwordHash: hashPassword('Password123!'),
    fullName: 'Pooja Kulkarni',
    phone: '+91 98666 77889',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    serviceCategory: 'Salon at Home',
    skills: ['Bridal Makeover', 'Organic Fruit Facial', 'RICA Waxing', 'Mani-Pedi Spa', 'Hair Keratin Treatment'],
    experienceYears: 6,
    city: 'Mumbai',
    serviceAddress: 'Seven Bungalows, Versova, Mumbai',
    lat: 19.1322,
    lng: 72.8164,
    isAvailable: true,
    workingHours: '10:00 AM - 7:00 PM',
    serviceCharge: 499,
    chargeUnit: 'visit',
    bio: 'Certified cosmetologist offering hygienic salon services at your doorstep with sterilized mono-dose beauty kits.',
    rating: 4.9,
    reviewCount: 167,
    totalCompletedJobs: 245,
    totalEarnings: 135000,
    isDemo: true,
    createdAt: '2024-07-01T10:00:00.000Z',
  },
  {
    id: 'wrk_suresh_ro',
    role: 'worker',
    email: 'suresh.ro@nagrikai.com',
    passwordHash: hashPassword('Password123!'),
    fullName: 'Suresh Das',
    phone: '+91 98777 88990',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    serviceCategory: 'RO and Water Purifier Repair',
    skills: ['Filter Replacement', 'TDS Calibration', 'Booster Pump Repair', 'UV Lamp Fixing', 'Kent/Aquaguard Servicing'],
    experienceYears: 8,
    city: 'Mumbai',
    serviceAddress: 'Goregaon East, Hub Mall Road, Mumbai',
    lat: 19.1550,
    lng: 72.8550,
    isAvailable: true,
    workingHours: '9:00 AM - 8:00 PM',
    serviceCharge: 299,
    chargeUnit: 'visit',
    bio: 'Specialist in household RO, UV, and UF water purifier maintenance. Genuine OEM certified carbon, sediment, and membrane filters.',
    rating: 4.8,
    reviewCount: 92,
    totalCompletedJobs: 138,
    totalEarnings: 48900,
    isDemo: true,
    createdAt: '2024-09-15T09:00:00.000Z',
  },
  {
    id: 'wrk_neeraj_laptop',
    role: 'worker',
    email: 'neeraj.tech@nagrikai.com',
    passwordHash: hashPassword('Password123!'),
    fullName: 'Neeraj Joshi',
    phone: '+91 98888 99001',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    serviceCategory: 'Computer and Laptop Repair',
    skills: ['Laptop Screen & Battery Replacement', 'Motherboard Chip-level Repair', 'OS Reinstall & Virus Removal', 'RAM & SSD Upgrade', 'Data Recovery'],
    experienceYears: 10,
    city: 'Mumbai',
    serviceAddress: 'Lamington Road Tech Hub / Bandra Hub, Mumbai',
    lat: 19.1250,
    lng: 72.8400,
    isAvailable: true,
    workingHours: '10:00 AM - 8:30 PM',
    serviceCharge: 399,
    chargeUnit: 'visit',
    bio: 'Hardware engineer with 10 years experience diagnosing Windows, Mac, and custom desktops. Doorstep diagnosis and same-day component upgrades.',
    rating: 4.8,
    reviewCount: 115,
    totalCompletedJobs: 172,
    totalEarnings: 82500,
    isDemo: true,
    createdAt: '2024-06-25T11:00:00.000Z',
  },
];

const SEED_BOOKINGS: Booking[] = [
  {
    id: 'BK-2025-0841',
    customerId: 'cust_aarav_sharma',
    customerName: 'Aarav Sharma',
    customerEmail: 'customer@nagrikai.com',
    customerPhone: '+91 98765 43210',
    customerAddress: 'B-402, Sea Green Heights, Link Road, Andheri West, Mumbai',
    customerCity: 'Mumbai',
    customerLocation: { lat: 19.1197, lng: 72.8464 },
    workerId: 'wrk_rajesh_electrician',
    workerName: 'Rajesh Kumar Verma',
    workerCategory: 'Electrician',
    workerPhone: '+91 98111 22334',
    serviceRequired: 'MCB repeatedly tripping in kitchen & living room',
    bookingDate: '2025-05-18',
    preferredTime: '11:00 AM - 01:00 PM',
    problemDescription: 'Every time the microwave oven or geyser is switched on, the main 32A MCB switch trips. Need urgent circuit inspection.',
    estimatedCost: 450,
    status: 'In Progress',
    createdAt: '2025-05-17T14:30:00.000Z',
    updatedAt: '2025-05-18T09:00:00.000Z',
  },
  {
    id: 'BK-2025-0712',
    customerId: 'cust_aarav_sharma',
    customerName: 'Aarav Sharma',
    customerEmail: 'customer@nagrikai.com',
    customerPhone: '+91 98765 43210',
    customerAddress: 'B-402, Sea Green Heights, Link Road, Andheri West, Mumbai',
    customerCity: 'Mumbai',
    customerLocation: { lat: 19.1197, lng: 72.8464 },
    workerId: 'wrk_vijay_plumber',
    workerName: 'Vijay Shinde',
    workerCategory: 'Plumbing',
    workerPhone: '+91 98222 33445',
    serviceRequired: 'Concealed kitchen sink mixer tap replacement',
    bookingDate: '2025-05-10',
    preferredTime: '03:00 PM - 05:00 PM',
    problemDescription: 'Hot/cold mixer tap is jammed and leaking from underneath the granite slab.',
    estimatedCost: 650,
    status: 'Completed',
    completionNotes: 'Replaced brass cartridge washer and refitted angle valves. Leakage completely sealed.',
    rating: 5,
    reviewComment: 'Arrived within 25 minutes. Very polite, clean work, and fixed the leak seamlessly!',
    createdAt: '2025-05-09T18:00:00.000Z',
    updatedAt: '2025-05-10T16:30:00.000Z',
  },
  {
    id: 'BK-2025-0919',
    customerId: 'cust_priya_patel',
    customerName: 'Priya Patel',
    customerEmail: 'priya.patel@example.com',
    customerPhone: '+91 98234 56789',
    customerAddress: 'Flat 12, Sunrise Residency, Powai, Mumbai',
    customerCity: 'Mumbai',
    customerLocation: { lat: 19.1170, lng: 72.9050 },
    workerId: 'wrk_rajesh_electrician',
    workerName: 'Rajesh Kumar Verma',
    workerCategory: 'Electrician',
    workerPhone: '+91 98111 22334',
    serviceRequired: 'Ceiling fan regulator replacement & new bedroom light point',
    bookingDate: '2025-05-20',
    preferredTime: '02:00 PM - 04:00 PM',
    problemDescription: 'Need to replace 2 rotary speed regulators and install a study lamp socket.',
    estimatedCost: 350,
    status: 'Requested',
    createdAt: '2025-05-18T10:15:00.000Z',
    updatedAt: '2025-05-18T10:15:00.000Z',
  },
];

const SEED_REVIEWS: ServiceReview[] = [
  {
    id: 'rev_1',
    bookingId: 'BK-2025-0712',
    customerId: 'cust_aarav_sharma',
    customerName: 'Aarav Sharma',
    workerId: 'wrk_vijay_plumber',
    rating: 5,
    comment: 'Arrived on time with proper plumbing gear. Highly professional and transparent billing.',
    createdAt: '2025-05-10T17:00:00.000Z',
  },
  {
    id: 'rev_2',
    bookingId: 'BK-2025-0601',
    customerId: 'cust_priya_patel',
    customerName: 'Priya Patel',
    workerId: 'wrk_rajesh_electrician',
    rating: 5,
    comment: 'Rajesh solved our persistent short-circuit within 30 minutes. Extremely knowledgeable.',
    createdAt: '2025-05-02T19:30:00.000Z',
  },
];

const SEED_NOTIFICATIONS: MarketplaceNotification[] = [
  {
    id: 'notif_1',
    userId: 'wrk_rajesh_electrician',
    title: 'New Service Booking Request!',
    message: 'Customer Priya Patel requested Electrician service for 20 May, 2:00 PM. Please review and accept.',
    type: 'booking_request',
    read: false,
    bookingId: 'BK-2025-0919',
    createdAt: '2025-05-18T10:15:00.000Z',
  },
  {
    id: 'notif_2',
    userId: 'cust_aarav_sharma',
    title: 'Booking In Progress',
    message: 'Rajesh Kumar Verma has started work on your booking #BK-2025-0841.',
    type: 'booking_status',
    read: false,
    bookingId: 'BK-2025-0841',
    createdAt: '2025-05-18T09:05:00.000Z',
  },
];

const SEED_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post_1',
    authorId: 'cust_aarav_sharma',
    authorName: 'Aarav Sharma',
    authorRole: 'customer',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    authorCity: 'Mumbai',
    authorNeighborhood: 'Andheri West',
    category: 'recommendation',
    title: 'Looking for recommended 3-phase electrician in Andheri West for EV Charger',
    content: 'Hi neighbors! We are installing a 7.2 kW home EV wallbox in our apartment building in Andheri West. Seeking certified technicians experienced with residential load calculation, dedicated distribution boxes, and safety earthing. Feel free to connect or comment below!',
    tags: ['Electrician', 'EV Charger', 'Andheri West', 'Residential'],
    likesCount: 14,
    likedBy: ['cust_priya_patel', 'wrk_rajesh_electrician'],
    replies: [
      {
        id: 'rep_1',
        authorId: 'wrk_rajesh_electrician',
        authorName: 'Rajesh Kumar Verma',
        authorRole: 'worker',
        authorAvatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80',
        content: 'Namaste Aarav ji! I have completed EV charger line installations at 6 housing societies in Andheri and Juhu. Happy to do a free load inspection.',
        createdAt: '2025-05-18T11:00:00.000Z',
      },
    ],
    createdAt: '2025-05-18T10:00:00.000Z',
  },
  {
    id: 'post_2',
    authorId: 'cust_priya_patel',
    authorName: 'Priya Patel',
    authorRole: 'customer',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    authorCity: 'Mumbai',
    authorNeighborhood: 'Powai',
    category: 'service_offer',
    title: 'Free Balcony Vegetable Gardening & Drip Irrigation Tips for Powai Residents',
    content: 'Happy to share starter tomato & basil saplings with neighbors in Powai interested in setting up balcony micro-gardens! Also have leftover drip irrigation fittings if anyone needs them. Connect with me or drop a message here.',
    tags: ['Gardening', 'Powai', 'Sustainable Living', 'Saplings'],
    likesCount: 22,
    likedBy: ['cust_aarav_sharma', 'cust_ananya_reddy'],
    replies: [
      {
        id: 'rep_2',
        authorId: 'cust_ananya_reddy',
        authorName: 'Ananya Reddy',
        authorRole: 'customer',
        authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        content: 'Love this initiative! I am doing a similar composting drive in Indiranagar. Great to see urban citizens helping each other!',
        createdAt: '2025-05-17T15:30:00.000Z',
      },
    ],
    createdAt: '2025-05-17T14:00:00.000Z',
  },
  {
    id: 'post_3',
    authorId: 'wrk_vijay_plumber',
    authorName: 'Vijay Shinde',
    authorRole: 'worker',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    authorCity: 'Mumbai',
    authorNeighborhood: 'Lokhandwala, Andheri',
    category: 'service_offer',
    title: 'Monsoon Preparation: Free Drain Inspection with Any Regular Plumbing Booking',
    content: 'With heavy rains approaching, clogged balcony drains and terrace rainwater pipes cause avoidable seepages. For any regular booking in Andheri West/Lokhandwala this week, I will check your terrace drains and main inlet valves at no extra charge.',
    tags: ['Plumbing', 'Monsoon Care', 'Leak Prevention', 'Lokhandwala'],
    likesCount: 31,
    likedBy: ['cust_aarav_sharma'],
    replies: [],
    createdAt: '2025-05-16T09:00:00.000Z',
  },
  {
    id: 'post_4',
    authorId: 'wrk_neeraj_laptop',
    authorName: 'Neeraj Joshi',
    authorRole: 'worker',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    authorCity: 'Mumbai',
    authorNeighborhood: 'Bandra / Khar',
    category: 'neighbourhood_connect',
    title: 'Free Doorstep Computer Safety Check & Scam Awareness for Senior Citizens',
    content: 'Offering free 20-minute safety checkups on Windows/Mac laptops for senior citizens in Bandra and Khar. We remove adware, verify antivirus, and teach safe online banking habits. Connect with me or message on my profile.',
    tags: ['Tech Support', 'Senior Citizens', 'Laptop Repair', 'Bandra'],
    likesCount: 45,
    likedBy: ['cust_aarav_sharma', 'cust_priya_patel', 'cust_rohit_verma'],
    replies: [],
    createdAt: '2025-05-15T12:00:00.000Z',
  },
];

const SEED_CONNECTIONS: CommunityConnectionMessage[] = [
  {
    id: 'conn_demo_1',
    fromUserId: 'cust_priya_patel',
    fromUserName: 'Priya Patel',
    fromUserRole: 'customer',
    fromUserAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    fromUserCity: 'Mumbai',
    fromUserNeighborhood: 'Powai',
    fromUserPhone: '+91 98234 56789',
    fromUserEmail: 'priya.patel@example.com',
    toUserId: 'cust_aarav_sharma',
    toUserName: 'Aarav Sharma',
    toUserRole: 'customer',
    toUserAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    subject: 'Neighborhood Balcony Gardening & Home Sensors',
    message: 'Hello Aarav! I saw your public profile and your post about smart home setups. Would love to connect and exchange some tips on home sensor automation & balcony plants!',
    status: 'pending',
    createdAt: '2025-05-18T14:20:00.000Z',
  },
  {
    id: 'conn_demo_2',
    fromUserId: 'wrk_vijay_plumber',
    fromUserName: 'Vijay Shinde',
    fromUserRole: 'worker',
    fromUserAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    fromUserCity: 'Mumbai',
    fromUserNeighborhood: 'Andheri West',
    fromUserPhone: '+91 98222 33445',
    fromUserEmail: 'vijay.plumber@nagrikai.com',
    toUserId: 'cust_aarav_sharma',
    toUserName: 'Aarav Sharma',
    toUserRole: 'customer',
    toUserAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    subject: 'Plumbing follow-up & emergency contact',
    message: 'Namaste Aarav sir! Pleasure working on your bathroom sink. Please keep my profile in your network for any emergency plumbing advice.',
    status: 'accepted',
    createdAt: '2025-05-11T10:00:00.000Z',
    updatedAt: '2025-05-11T12:00:00.000Z',
  },
  {
    id: 'conn_demo_3',
    fromUserId: 'cust_ananya_reddy',
    fromUserName: 'Ananya Reddy',
    fromUserRole: 'customer',
    fromUserAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    fromUserCity: 'Bengaluru',
    fromUserNeighborhood: 'Indiranagar',
    fromUserPhone: '+91 97400 11223',
    fromUserEmail: 'ananya.reddy@example.com',
    toUserId: 'wrk_rajesh_electrician',
    toUserName: 'Rajesh Kumar Verma',
    toUserRole: 'worker',
    toUserAvatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80',
    subject: 'EV line consultation inquiry',
    message: 'Hello Rajesh ji! My parents in Mumbai are considering getting an EV charger installed. Connecting with you so they can reach out directly.',
    status: 'pending',
    createdAt: '2025-05-18T16:00:00.000Z',
  },
];

class MarketplaceDatabaseManager {
  private data: MarketplaceDatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): MarketplaceDatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);

        const customers: CustomerUser[] = (parsed.customers || SEED_CUSTOMERS).map((c: any) => ({
          ...c,
          isPublicProfile: c.isPublicProfile ?? true,
          allowDirectContact: c.allowDirectContact ?? true,
          neighborhood: c.neighborhood || (c.city === 'Mumbai' ? 'Andheri West' : c.city || 'Central'),
          occupation: c.occupation || 'Resident & Citizen',
          bio: c.bio || `Citizen and community member based in ${c.city}. Connect with me for local recommendations and mutual help.`,
          skillsCanHelpWith: c.skillsCanHelpWith || ['Neighborhood Support', 'Community Help'],
          lookingForServices: c.lookingForServices || ['Home Maintenance'],
        }));

        const workers: WorkerUser[] = (parsed.workers || SEED_WORKERS).map((w: any) => ({
          ...w,
          isPublicProfile: w.isPublicProfile ?? true,
          allowDirectContact: w.allowDirectContact ?? true,
          neighborhood: w.neighborhood || w.city,
        }));

        const rawConns = parsed.connectionMessages && parsed.connectionMessages.length > 0
          ? parsed.connectionMessages
          : SEED_CONNECTIONS;

        const connectionMessages: CommunityConnectionMessage[] = rawConns.map((m: any) => ({
          ...m,
          status: m.status || 'pending',
        }));

        return {
          customers,
          workers,
          bookings: parsed.bookings || SEED_BOOKINGS,
          reviews: parsed.reviews || SEED_REVIEWS,
          notifications: parsed.notifications || SEED_NOTIFICATIONS,
          communityPosts: parsed.communityPosts || SEED_COMMUNITY_POSTS,
          connectionMessages,
          sessions: parsed.sessions || {},
        };
      }
    } catch (e) {
      console.warn('Initializing marketplace DB with seeds:', e);
    }

    const initialData: MarketplaceDatabaseSchema = {
      customers: SEED_CUSTOMERS,
      workers: SEED_WORKERS.map((w) => ({
        ...w,
        isPublicProfile: true,
        allowDirectContact: true,
        neighborhood: w.city,
      })),
      bookings: SEED_BOOKINGS,
      reviews: SEED_REVIEWS,
      notifications: SEED_NOTIFICATIONS,
      communityPosts: SEED_COMMUNITY_POSTS,
      connectionMessages: SEED_CONNECTIONS,
      sessions: {},
    };
    this.saveData(initialData);
    return initialData;
  }

  private saveData(data: MarketplaceDatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write marketplace database file:', e);
    }
  }

  // --- Persistent Sessions ---
  getSession(token: string): AuthSession | undefined {
    return this.data.sessions ? this.data.sessions[token] : undefined;
  }

  saveSession(token: string, session: AuthSession): void {
    if (!this.data.sessions) {
      this.data.sessions = {};
    }
    this.data.sessions[token] = session;
    this.saveData(this.data);
  }

  deleteSession(token: string): void {
    if (this.data.sessions && this.data.sessions[token]) {
      delete this.data.sessions[token];
      this.saveData(this.data);
    }
  }

  // --- Customers ---
  getCustomerByEmail(email: string): CustomerUser | undefined {
    return this.data.customers.find((c) => c.email.toLowerCase() === email.toLowerCase());
  }

  getCustomerById(id: string): CustomerUser | undefined {
    return this.data.customers.find((c) => c.id === id);
  }

  createCustomer(customer: CustomerUser): CustomerUser {
    this.data.customers.push(customer);
    this.saveData(this.data);
    return customer;
  }

  updateCustomer(id: string, updates: Partial<CustomerUser>): CustomerUser | undefined {
    const idx = this.data.customers.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    this.data.customers[idx] = { ...this.data.customers[idx], ...updates };
    this.saveData(this.data);
    return this.data.customers[idx];
  }

  toggleSaveWorker(customerId: string, workerId: string): string[] {
    const customer = this.getCustomerById(customerId);
    if (!customer) return [];
    const saved = new Set(customer.savedWorkerIds || []);
    if (saved.has(workerId)) {
      saved.delete(workerId);
    } else {
      saved.add(workerId);
    }
    customer.savedWorkerIds = Array.from(saved);
    this.saveData(this.data);
    return customer.savedWorkerIds;
  }

  // --- Workers ---
  getWorkerByEmail(email: string): WorkerUser | undefined {
    return this.data.workers.find((w) => w.email.toLowerCase() === email.toLowerCase());
  }

  getWorkerById(id: string): WorkerUser | undefined {
    return this.data.workers.find((w) => w.id === id);
  }

  getAllWorkers(): WorkerUser[] {
    return [...this.data.workers];
  }

  createWorker(worker: WorkerUser): WorkerUser {
    this.data.workers.push(worker);
    this.saveData(this.data);
    return worker;
  }

  updateWorker(id: string, updates: Partial<WorkerUser>): WorkerUser | undefined {
    const idx = this.data.workers.findIndex((w) => w.id === id);
    if (idx === -1) return undefined;
    this.data.workers[idx] = { ...this.data.workers[idx], ...updates };
    this.saveData(this.data);
    return this.data.workers[idx];
  }

  toggleWorkerAvailability(workerId: string): boolean {
    const worker = this.getWorkerById(workerId);
    if (!worker) return false;
    worker.isAvailable = !worker.isAvailable;
    this.saveData(this.data);
    return worker.isAvailable;
  }

  // --- Bookings ---
  getBookingsByCustomer(customerId: string): Booking[] {
    return this.data.bookings.filter((b) => b.customerId === customerId);
  }

  getBookingsByWorker(workerId: string): Booking[] {
    return this.data.bookings.filter((b) => b.workerId === workerId);
  }

  getBookingById(id: string): Booking | undefined {
    return this.data.bookings.find((b) => b.id === id);
  }

  createBooking(booking: Booking): Booking {
    this.data.bookings.unshift(booking);

    // Notify worker of new booking
    const notif: MarketplaceNotification = {
      id: 'notif_' + Date.now(),
      userId: booking.workerId,
      title: 'New Service Booking Request!',
      message: `Customer ${booking.customerName} requested ${booking.serviceRequired} on ${booking.bookingDate} (${booking.preferredTime}).`,
      type: 'booking_request',
      read: false,
      bookingId: booking.id,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(notif);

    this.saveData(this.data);
    return booking;
  }

  updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    reasonOrNotes?: string
  ): Booking | undefined {
    const booking = this.getBookingById(bookingId);
    if (!booking) return undefined;

    booking.status = status;
    booking.updatedAt = new Date().toISOString();

    if (status === 'Rejected') {
      booking.rejectionReason = reasonOrNotes || 'Worker is currently engaged.';
    } else if (status === 'Completed') {
      booking.completionNotes = reasonOrNotes || 'Job finished and inspected.';
      // Update worker statistics
      const worker = this.getWorkerById(booking.workerId);
      if (worker) {
        worker.totalCompletedJobs = (worker.totalCompletedJobs || 0) + 1;
        worker.totalEarnings = (worker.totalEarnings || 0) + (booking.estimatedCost || 350);
      }
    }

    // Notify Customer of Status Update
    const notifTitle =
      status === 'Accepted'
        ? 'Booking Confirmed by Service Provider'
        : status === 'In Progress'
        ? 'Service Provider Started the Job'
        : status === 'Completed'
        ? 'Service Completed – Please Rate Your Experience'
        : status === 'Rejected'
        ? 'Booking Declined by Service Provider'
        : `Booking Status Changed to ${status}`;

    const notif: MarketplaceNotification = {
      id: 'notif_' + Date.now(),
      userId: booking.customerId,
      title: notifTitle,
      message: `Your booking #${booking.id} with ${booking.workerName} is now ${status}.${
        reasonOrNotes ? ` Note: ${reasonOrNotes}` : ''
      }`,
      type: 'booking_status',
      read: false,
      bookingId: booking.id,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(notif);

    this.saveData(this.data);
    return booking;
  }

  // Add review for a completed booking
  addReview(
    bookingId: string,
    customerId: string,
    customerName: string,
    workerId: string,
    rating: number,
    comment: string
  ): ServiceReview {
    const review: ServiceReview = {
      id: 'rev_' + Date.now(),
      bookingId,
      customerId,
      customerName,
      workerId,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };
    this.data.reviews.unshift(review);

    // Update booking with review
    const booking = this.getBookingById(bookingId);
    if (booking) {
      booking.rating = rating;
      booking.reviewComment = comment;
    }

    // Recompute worker rating
    const worker = this.getWorkerById(workerId);
    if (worker) {
      const workerReviews = this.data.reviews.filter((r) => r.workerId === workerId);
      const totalStars = workerReviews.reduce((sum, r) => sum + r.rating, 0);
      worker.rating = Math.round((totalStars / workerReviews.length) * 10) / 10;
      worker.reviewCount = workerReviews.length;
    }

    this.saveData(this.data);
    return review;
  }

  getReviewsByWorker(workerId: string): ServiceReview[] {
    return this.data.reviews.filter((r) => r.workerId === workerId);
  }

  // --- Notifications ---
  getNotificationsByUser(userId: string): MarketplaceNotification[] {
    return this.data.notifications.filter((n) => n.userId === userId);
  }

  markNotificationRead(id: string, userId: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === id && n.userId === userId);
    if (!notif) return false;
    notif.read = true;
    this.saveData(this.data);
    return true;
  }

  markAllNotificationsRead(userId: string): void {
    let changed = false;
    this.data.notifications.forEach((n) => {
      if (n.userId === userId && !n.read) {
        n.read = true;
        changed = true;
      }
    });
    if (changed) this.saveData(this.data);
  }

  // --- Community Network & Public Profiles ---
  getAllPublicMembers(filters?: { role?: string; city?: string; search?: string }) {
    const list: Array<any> = [];

    // Public customers
    if (!filters?.role || filters.role === 'all' || filters.role === 'customer') {
      for (const c of this.data.customers) {
        if (c.isPublicProfile !== false) {
          const { passwordHash, ...safeCust } = c;
          list.push({
            ...safeCust,
            memberType: 'customer',
            displayName: safeCust.fullName,
            subtitle: safeCust.occupation || 'Active Resident',
            locality: safeCust.neighborhood ? `${safeCust.neighborhood}, ${safeCust.city}` : safeCust.city,
            badge: 'Citizen Member',
          });
        }
      }
    }

    // Public workers
    if (!filters?.role || filters.role === 'all' || filters.role === 'worker') {
      for (const w of this.data.workers) {
        if (w.isPublicProfile !== false) {
          const { passwordHash, ...safeWrk } = w;
          list.push({
            ...safeWrk,
            memberType: 'worker',
            displayName: safeWrk.fullName,
            subtitle: `${safeWrk.serviceCategory} Specialist (${safeWrk.experienceYears}y exp)`,
            locality: safeWrk.neighborhood ? `${safeWrk.neighborhood}, ${safeWrk.city}` : safeWrk.city,
            badge: 'Verified Service Provider',
          });
        }
      }
    }

    let filtered = list;

    if (filters?.city && filters.city !== 'All' && filters.city !== 'All Cities') {
      filtered = filtered.filter((m) => m.city.toLowerCase().includes(filters.city!.toLowerCase()));
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.fullName?.toLowerCase().includes(q) ||
          m.occupation?.toLowerCase().includes(q) ||
          m.serviceCategory?.toLowerCase().includes(q) ||
          m.bio?.toLowerCase().includes(q) ||
          m.neighborhood?.toLowerCase().includes(q) ||
          (Array.isArray(m.skills) && m.skills.some((s: string) => s.toLowerCase().includes(q))) ||
          (Array.isArray(m.skillsCanHelpWith) && m.skillsCanHelpWith.some((s: string) => s.toLowerCase().includes(q)))
      );
    }

    return filtered;
  }

  getUserPublicProfile(id: string) {
    // Check if worker
    const worker = this.getWorkerById(id);
    if (worker) {
      const { passwordHash, ...safeWrk } = worker;
      const reviews = this.getReviewsByWorker(id);
      const communityPosts = (this.data.communityPosts || []).filter((p) => p.authorId === id);
      return {
        user: safeWrk,
        role: 'worker' as const,
        reviews,
        communityPosts,
      };
    }

    // Check if customer
    const customer = this.getCustomerById(id);
    if (customer) {
      const { passwordHash, ...safeCust } = customer;
      const communityPosts = (this.data.communityPosts || []).filter((p) => p.authorId === id);
      return {
        user: safeCust,
        role: 'customer' as const,
        reviews: [],
        communityPosts,
      };
    }

    return null;
  }

  // --- Community Posts ---
  getCommunityPosts(filters?: { category?: string; city?: string; search?: string }): CommunityPost[] {
    let posts = [...(this.data.communityPosts || [])];

    if (filters?.category && filters.category !== 'all') {
      posts = posts.filter((p) => p.category === filters.category);
    }

    if (filters?.city && filters.city !== 'All' && filters.city !== 'All Cities') {
      posts = posts.filter((p) => p.authorCity.toLowerCase().includes(filters.city!.toLowerCase()));
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.authorName.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createCommunityPost(post: CommunityPost): CommunityPost {
    if (!this.data.communityPosts) this.data.communityPosts = [];
    this.data.communityPosts.unshift(post);
    this.saveData(this.data);
    return post;
  }

  addPostReply(postId: string, reply: CommunityReply): CommunityReply | null {
    if (!this.data.communityPosts) return null;
    const post = this.data.communityPosts.find((p) => p.id === postId);
    if (!post) return null;

    if (!post.replies) post.replies = [];
    post.replies.push(reply);

    // Notify author of reply if different user
    if (post.authorId !== reply.authorId) {
      const notif: MarketplaceNotification = {
        id: 'notif_' + Date.now(),
        userId: post.authorId,
        title: 'New Reply on Your Community Post',
        message: `${reply.authorName} replied: "${reply.content.slice(0, 80)}${reply.content.length > 80 ? '...' : ''}"`,
        type: 'system',
        read: false,
        createdAt: new Date().toISOString(),
      };
      this.data.notifications.unshift(notif);
    }

    this.saveData(this.data);
    return reply;
  }

  toggleLikePost(postId: string, userId: string): { likesCount: number; isLiked: boolean } | null {
    if (!this.data.communityPosts) return null;
    const post = this.data.communityPosts.find((p) => p.id === postId);
    if (!post) return null;

    if (!post.likedBy) post.likedBy = [];
    const idx = post.likedBy.indexOf(userId);
    let isLiked = false;

    if (idx > -1) {
      post.likedBy.splice(idx, 1);
      post.likesCount = Math.max(0, post.likesCount - 1);
      isLiked = false;
    } else {
      post.likedBy.push(userId);
      post.likesCount = (post.likesCount || 0) + 1;
      isLiked = true;
    }

    this.saveData(this.data);
    return { likesCount: post.likesCount, isLiked };
  }

  sendConnectionMessage(msg: CommunityConnectionMessage): CommunityConnectionMessage {
    if (!this.data.connectionMessages) this.data.connectionMessages = [];

    // Ensure status is pending
    msg.status = msg.status || 'pending';

    // Populate recipient info if missing
    if (!msg.toUserName) {
      const recipient = this.getCustomerById(msg.toUserId) || this.getWorkerById(msg.toUserId);
      if (recipient) {
        msg.toUserName = recipient.fullName;
        msg.toUserRole = recipient.role;
        msg.toUserAvatar = (recipient as any).photoUrl || recipient.avatarUrl;
      }
    }

    this.data.connectionMessages.unshift(msg);

    // Notify recipient
    const notif: MarketplaceNotification = {
      id: 'notif_' + Date.now(),
      userId: msg.toUserId,
      title: `New Connection Request from ${msg.fromUserName}`,
      message: `${msg.fromUserName} wants to connect with you: "${msg.message.slice(0, 100)}${msg.message.length > 100 ? '...' : ''}"`,
      type: 'system',
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(notif);

    this.saveData(this.data);
    return msg;
  }

  getConnectionRequests(userId: string) {
    const msgs = this.data.connectionMessages || [];
    const incoming = msgs.filter((m) => m.toUserId === userId);
    const outgoing = msgs.filter((m) => m.fromUserId === userId);
    const connected = msgs.filter(
      (m) => (m.toUserId === userId || m.fromUserId === userId) && m.status === 'accepted'
    );

    return {
      incoming,
      outgoing,
      connected,
      pendingCount: incoming.filter((m) => m.status === 'pending').length,
    };
  }

  respondToConnectionRequest(
    connectionId: string,
    userId: string,
    status: 'accepted' | 'declined',
    responseNote?: string
  ): CommunityConnectionMessage | null {
    if (!this.data.connectionMessages) return null;
    const conn = this.data.connectionMessages.find(
      (c) => c.id === connectionId && c.toUserId === userId
    );
    if (!conn) return null;

    conn.status = status;
    conn.responseNote = responseNote || '';
    conn.updatedAt = new Date().toISOString();

    // Look up responder name
    const responder = this.getCustomerById(userId) || this.getWorkerById(userId);
    const responderName = responder ? responder.fullName : 'A user';

    // Notify sender of response
    const notifTitle =
      status === 'accepted'
        ? `${responderName} Accepted Your Connection Request!`
        : `${responderName} Declined Your Connection Request`;

    const notifMsg =
      status === 'accepted'
        ? `Great news! You and ${responderName} are now connected on NagrikAI. You can view each other's full profile and reach out directly.`
        : `${responderName} has declined the connection request.${responseNote ? ` Note: "${responseNote}"` : ''}`;

    const notif: MarketplaceNotification = {
      id: 'notif_' + Date.now(),
      userId: conn.fromUserId,
      title: notifTitle,
      message: notifMsg,
      type: 'system',
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(notif);

    this.saveData(this.data);
    return conn;
  }
}

export const dbManager = new MarketplaceDatabaseManager();
