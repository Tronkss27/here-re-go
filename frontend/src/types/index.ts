// ===== BASE TYPES =====
export interface BaseEntity {
  _id: string
  createdAt: string
  updatedAt: string
}

// ===== USER TYPES =====
export interface User extends BaseEntity {
  name: string
  email: string
  role: 'user' | 'venue_owner' | 'admin'
  isActive: boolean
  profile?: {
    firstName?: string
    lastName?: string
    phone?: string
    avatar?: string
    preferences?: {
      favoriteTeams?: string[]
      favoriteSports?: string[]
      favoriteVenues?: string[]
    }
  }
}

// ===== VENUE TYPES =====
export interface VenueContact {
  email: string
  phone: string
  website?: string
}

export interface VenueAddress {
  street: string
  city: string
  state?: string
  postalCode: string
  country: string
}

export interface VenueCoordinates {
  latitude?: number
  longitude?: number
}

export interface VenueLocation {
  address: VenueAddress
  coordinates?: VenueCoordinates
}

export interface VenueHourSlot {
  open?: string
  close?: string
  closed: boolean
}

export interface VenueHours {
  monday: VenueHourSlot
  tuesday: VenueHourSlot
  wednesday: VenueHourSlot
  thursday: VenueHourSlot
  friday: VenueHourSlot
  saturday: VenueHourSlot
  sunday: VenueHourSlot
}

export interface VenueCapacity {
  total: number
  tables?: number
  bar?: number
  outdoor: number
}

export type VenueFeature = 
  | 'live_sports' 
  | 'multiple_screens' 
  | 'outdoor_seating' 
  | 'private_rooms'
  | 'pool_table' 
  | 'darts' 
  | 'karaoke' 
  | 'live_music' 
  | 'food_service'
  | 'full_bar' 
  | 'craft_beer' 
  | 'wine_selection' 
  | 'parking' 
  | 'wheelchair_accessible'
  | 'wifi' 
  | 'air_conditioning' 
  | 'smoking_area'

export interface VenueImage {
  url: string
  caption?: string
  isMain: boolean
  uploadedAt: string
}

export interface VenueSportsOffering {
  sport: string
  leagues: string[]
  isPrimary: boolean
}

export interface VenueBookingSettings {
  enabled: boolean
  requiresApproval: boolean
  advanceBookingDays: number
  minimumPartySize: number
  maximumPartySize: number
  timeSlotDuration: number // minutes
  cancellationPolicy?: string
}

export interface VenuePricing {
  basePrice: number
  pricePerPerson: number
  minimumSpend: number
  currency: string
}

export interface VenueAnalytics {
  totalBookings: number
  totalReviews: number
  averageRating: number
  viewCount: number
}

export type VenueStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

export interface Venue extends BaseEntity {
  name: string
  description?: string
  owner: string // User ID
  contact: VenueContact
  location: VenueLocation
  hours: VenueHours
  capacity: VenueCapacity
  features: VenueFeature[]
  images: VenueImage[]
  sportsOfferings: VenueSportsOffering[]
  bookingSettings: VenueBookingSettings
  pricing: VenuePricing
  status: VenueStatus
  isVerified: boolean
  isActive: boolean
  analytics: VenueAnalytics
  slug?: string
  adminNotes?: string
  
  // Virtual fields
  fullAddress?: string
  mainImage?: string | null
  isCurrentlyOpen?: boolean
}

// ===== BOOKING TYPES =====
export interface BookingCustomer {
  name: string
  email: string
  phone: string
}

export interface BookingTimeSlot {
  start: string // Format: "19:00"
  end: string   // Format: "21:00"
}

export type BookingTablePreference = 'any' | 'near_screen' | 'quiet_area' | 'outdoor' | 'bar_area'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
export type BookingPaymentStatus = 'none' | 'pending' | 'partial' | 'paid' | 'refunded'

export interface BookingPricing {
  basePrice: number
  discount: number
  finalPrice: number
}

export interface Booking extends BaseEntity {
  customer: BookingCustomer
  venue: string // Venue ID
  fixture?: string | null // Fixture ID (optional)
  date: string
  timeSlot: BookingTimeSlot
  partySize: number
  tablePreference: BookingTablePreference
  status: BookingStatus
  specialRequests?: string
  pricing: BookingPricing
  paymentStatus: BookingPaymentStatus
  confirmationCode?: string
  confirmedAt?: string | null
  cancelledAt?: string | null
  cancellationReason?: string
  adminNotes?: string
  
  // Virtual fields
  duration?: number // minutes
}

// ===== FIXTURE TYPES =====
export interface FixtureTeam {
  id: string
  name: string
  logo?: string
}

export interface FixtureLeague {
  id: string
  name: string
  country?: string
  logo?: string
  season?: string
}

export interface FixtureScore {
  home: number | null
  away: number | null
}

export type FixtureStatus = 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled'

export interface Fixture extends BaseEntity {
  fixtureId: string // External API fixture ID
  homeTeam: FixtureTeam
  awayTeam: FixtureTeam
  league: FixtureLeague
  date: string
  status: FixtureStatus
  score: FixtureScore
  popularity: number
  totalBookings: number
  isActive: boolean
}

// ===== REVIEW TYPES =====
export interface Review extends BaseEntity {
  venue: string // Venue ID
  user?: string | null // User ID (if registered user)
  customer?: BookingCustomer // Customer info (if guest review)
  rating: number // 1-5
  comment?: string
  images?: string[]
  isVerified: boolean
  isVisible: boolean
  reply?: {
    message: string
    repliedAt: string
    repliedBy: string // User ID of venue owner/admin
  }
  helpfulCount: number
}

// ===== OFFER TYPES =====
export type OfferType = 'percentage' | 'fixed_amount' | 'free_item'
export type OfferStatus = 'draft' | 'active' | 'paused' | 'expired'

export interface OfferConditions {
  minimumSpend?: number
  minimumPartySize?: number
  validDays?: string[] // ['monday', 'tuesday', etc.]
  validHours?: {
    start: string
    end: string
  }
  maxUses?: number
  maxUsesPerCustomer?: number
}

export interface Offer extends BaseEntity {
  venue: string // Venue ID
  title: string
  description: string
  type: OfferType
  value: number // percentage, amount, or quantity
  conditions: OfferConditions
  status: OfferStatus
  validFrom: string
  validUntil: string
  usageCount: number
  isActive: boolean
}

// ===== API RESPONSE TYPES =====
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  pagination?: {
    currentPage: number
    totalPages: number
    totalItems: number
    limit: number
  }
}

export interface ApiError {
  message: string
  status?: number
  code?: string
  details?: any
}

// ===== SEARCH & FILTER TYPES =====
export interface VenueFilters {
  search?: string
  city?: string
  features?: VenueFeature[]
  capacity?: {
    min?: number
    max?: number
  }
  priceRange?: {
    min?: number
    max?: number
  }
  rating?: {
    min?: number
  }
  openNow?: boolean
  hasParking?: boolean
  isVerified?: boolean
}

export interface FixtureFilters {
  search?: string
  league?: string[]
  team?: string[]
  date?: {
    from?: string
    to?: string
  }
  status?: FixtureStatus[]
}

export interface BookingFilters {
  venue?: string
  status?: BookingStatus[]
  date?: {
    from?: string
    to?: string
  }
  customer?: string // email search
}

// ===== PAGINATION TYPES =====
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    limit: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// ===== FORM TYPES =====
export interface CreateBookingForm {
  venue: string
  fixture?: string
  date: string
  timeSlot: BookingTimeSlot
  partySize: number
  tablePreference: BookingTablePreference
  customer: BookingCustomer
  specialRequests?: string
}

export interface VenueSearchForm {
  location?: string
  date?: string
  time?: string
  partySize?: number
  features?: VenueFeature[]
}

// ===== STATISTICS TYPES =====
export interface VenueStats {
  totalBookings: number
  totalRevenue: number
  averageRating: number
  totalReviews: number
  occupancyRate: number
  popularTimes: {
    [key: string]: number // hour -> booking count
  }
  topFixtures: Array<{
    fixture: Fixture
    bookingCount: number
  }>
}

export interface BookingStats {
  totalBookings: number
  confirmedBookings: number
  cancelledBookings: number
  noShowBookings: number
  averagePartySize: number
  peakHours: string[]
  revenueByMonth: Array<{
    month: string
    revenue: number
    bookings: number
  }>
}

// ===== LEGACY COMPATIBILITY TYPES =====
// These types maintain compatibility with existing BarMatch components
export interface LegacyVenue {
  id: string | number
  name: string
  location: string
  address?: string
  rating: number
  totalReviews: number
  images: string[]
  amenities: string[]
  features?: {
    bookable?: boolean
    wifi?: boolean
    parking?: boolean
    outdoor?: boolean
    screens?: boolean
  }
  phone?: string
  website?: string
  description?: string
  capacity?: number
  priceRange?: string
  cuisine?: string[]
  openingHours?: Record<string, string>
}

// ===== UTILITY TYPES =====
export type OptionalExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>
export type RequiredExcept<T, K extends keyof T> = Required<T> & Partial<Pick<T, K>>

export type EntityWithoutTimestamps<T extends BaseEntity> = Omit<T, '_id' | 'createdAt' | 'updatedAt'>
export type CreateEntityInput<T extends BaseEntity> = EntityWithoutTimestamps<T>
export type UpdateEntityInput<T extends BaseEntity> = Partial<EntityWithoutTimestamps<T>>

// ===== EXPORT TYPES FOR CONVENIENCE =====
export type {
  // Main entities
  User,
  Venue,
  Booking,
  Fixture,
  Review,
  Offer,
  
  // API types
  ApiResponse,
  ApiError,
  PaginatedResponse,
  
  // Form types
  CreateBookingForm,
  VenueSearchForm,
  
  // Filter types
  VenueFilters,
  FixtureFilters,
  BookingFilters,
  
  // Stats types
  VenueStats,
  BookingStats,
  
  // Legacy compatibility
  LegacyVenue
} 