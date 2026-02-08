
export enum BusinessStatus {
  BUSY = 'busy', // Red
  MODERATE = 'moderate', // Blue
  EMPTY = 'empty', // White
  OFFLINE = 'offline', // Black
}

export enum BusinessCategory {
  FOOD_TRUCK = 'Food Truck',
  ICE_CREAM = 'Ice Cream',
  COFFEE = 'Coffee',
  FLOWER_TRUCK = 'Flower Truck',
  FASHION_VAN = 'Fashion Van',
  PET_GROOMING = 'Pet Grooming',
}

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  ownerResponse?: string;
  timestamp: number;
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
  isPlus?: boolean;
}

export interface BusinessPost {
  id: string;
  content: string;
  timestamp: number;
  isImportant?: boolean;
  type?: 'announcement' | 'social';
  friendName?: string;
}

export interface WeeklyHours {
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;
}

export interface RouteStep {
  id: string;
  locationName: string;
  time: string;
  isCurrent?: boolean;
  rsvps: number;
}

export interface Business {
  id: string;
  ownerId: string;
  driverId?: string;
  driverName?: string;
  companyId?: string;
  companyName?: string;
  name: string;
  category: BusinessCategory | string;
  status: BusinessStatus;
  rating: number;
  reviews: Review[];
  messages: Message[];
  posts: BusinessPost[];
  location: [number, number];
  description: string;
  imageUrl: string;
  openingHours: string;
  weeklyHours: WeeklyHours;
  isFavorite?: boolean;
  favoriteCount: number;
  products: Product[];
  currentVisitors: number;
  tags?: string[];
  route?: RouteStep[];
  inviteCode?: string;
  checkedInUsers?: string[]; // IDs of users currently there
  scheduledLocations?: ScheduledLocation[]; // Upcoming planned locations
}

export enum UserRole {
  CUSTOMER = 'customer',
  OWNER = 'owner',
  DRIVER = 'driver',
}

export enum SubscriptionTier {
  FREE = 'Free',
  PLUS = 'StreetBites Plus',
  BUSINESS = 'Business Fleet'
}

export interface UserStats {
  visitedCount: number;
  reviewCount: number;
  messageCount: number;
  uniqueCategories: string[];
  passportStamps?: string[]; // IDs of unique businesses visited
}

export interface FriendRequest {
  id: string;
  fromId: string;
  fromName: string;
  status: 'pending' | 'accepted';
}

export interface DirectMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  gender: 'male' | 'female';
  subscriptionTier: SubscriptionTier;
  assignedTruckId?: string;
  isOnShift?: boolean;
  isGhostMode?: boolean; // Premium feature
  tastePreferences: string[];
  stats: UserStats;
  notificationsEnabled: boolean;
  following: string[];
  friends: string[]; // IDs of friends
  friendRequests: FriendRequest[];
  directMessages: Record<string, DirectMessage[]>; // Key is friendId
}

export interface DriverProfile {
  id: string;
  name: string; // Display name (first name or short name)
  fullName?: string; // Full legal name
  email?: string;
  phone?: string;
  companyId?: string; // Which company the driver belongs to
  status?: 'online' | 'offline' | 'on-delivery' | 'on-break';
  location?: [number, number]; // Latitude, longitude
  lastUpdated?: number; // Timestamp
  vehicleId?: string; // Currently assigned vehicle
}

export interface ScheduledLocation {
  id: string;
  companyId: string;
  businessId?: string; // Specific vehicle if applicable
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  locationName: string;
  address: string;
  coordinates?: [number, number];
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  attendees: string[]; // User IDs who marked "I'll be there"
  description?: string;
}

export interface Company {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  color?: string; // Brand color for the company
  logoUrl?: string;
  socialMediaLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
  };
  drivers: DriverProfile[];
  vehicleIds: string[];
  scheduledLocations?: ScheduledLocation[];
}

export type SortOption = 'rating' | 'favorite' | 'alphabetical' | 'recommended';

export interface FeedPost extends BusinessPost {
  businessId?: string;
  businessName?: string;
  businessImageUrl?: string;
}
