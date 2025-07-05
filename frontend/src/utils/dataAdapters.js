// ===== VENUE ADAPTERS =====

/**
 * Convert SPOrTS Venue to Legacy BarMatch Venue format
 * Maintains compatibility with existing components
 */
export function venueToLegacy(venue) {
  return {
    id: venue._id,
    name: venue.name,
    location: `${venue.location.address.city}, ${venue.location.address.country}`,
    address: venue.fullAddress || `${venue.location.address.street}, ${venue.location.address.city}`,
    rating: venue.analytics.averageRating || 0,
    totalReviews: venue.analytics.totalReviews || 0,
    images: venue.images.map(img => img.url),
    amenities: mapFeaturesToAmenities(venue.features),
    features: {
      bookable: venue.bookingSettings.enabled,
      wifi: venue.features.includes('wifi'),
      parking: venue.features.includes('parking'),
      outdoor: venue.features.includes('outdoor_seating'),
      screens: venue.features.includes('multiple_screens') || venue.features.includes('live_sports')
    },
    phone: venue.contact.phone,
    website: venue.contact.website,
    description: venue.description,
    capacity: venue.capacity.total,
    priceRange: mapPricingToRange(venue.pricing),
    cuisine: extractCuisineFromFeatures(venue.features),
    openingHours: formatOpeningHours(venue.hours)
  }
}

/**
 * Convert array of SPOrTS Venues to Legacy format
 */
export function venuesToLegacy(venues) {
  return venues.map(venueToLegacy)
}

/**
 * Map SPOrTS venue features to BarMatch amenities
 */
function mapFeaturesToAmenities(features) {
  const featureMap = {
    'live_sports': 'Live Sports',
    'multiple_screens': 'Multiple Screens',
    'outdoor_seating': 'Outdoor Seating',
    'private_rooms': 'Private Rooms',
    'pool_table': 'Pool Table',
    'darts': 'Darts',
    'karaoke': 'Karaoke',
    'live_music': 'Live Music',
    'food_service': 'Food Service',
    'full_bar': 'Full Bar',
    'craft_beer': 'Craft Beer',
    'wine_selection': 'Wine Selection',
    'parking': 'Parking',
    'wheelchair_accessible': 'Wheelchair Accessible',
    'wifi': 'Wi-Fi',
    'air_conditioning': 'Air Conditioning',
    'smoking_area': 'Smoking Area'
  }

  return features.map(feature => featureMap[feature]).filter(Boolean)
}

/**
 * Map SPOrTS pricing to BarMatch price range
 */
function mapPricingToRange(pricing) {
  const maxPrice = Math.max(pricing.basePrice, pricing.pricePerPerson, pricing.minimumSpend)
  
  if (maxPrice === 0) return 'Free'
  if (maxPrice <= 20) return '€'
  if (maxPrice <= 50) return '€€'
  if (maxPrice <= 100) return '€€€'
  return '€€€€'
}

/**
 * Extract cuisine types from venue features
 */
function extractCuisineFromFeatures(features) {
  const cuisineFeatures = []
  
  if (features.includes('food_service')) {
    cuisineFeatures.push('Bar Food')
  }
  if (features.includes('full_bar')) {
    cuisineFeatures.push('Cocktails')
  }
  if (features.includes('craft_beer')) {
    cuisineFeatures.push('Craft Beer')
  }
  if (features.includes('wine_selection')) {
    cuisineFeatures.push('Wine')
  }
  
  return cuisineFeatures.length > 0 ? cuisineFeatures : ['Bar']
}

/**
 * Format SPOrTS opening hours to BarMatch format
 */
function formatOpeningHours(hours) {
  const dayMap = {
    monday: 'Lunedì',
    tuesday: 'Martedì', 
    wednesday: 'Mercoledì',
    thursday: 'Giovedì',
    friday: 'Venerdì',
    saturday: 'Sabato',
    sunday: 'Domenica'
  }

  const formatted = {}

  Object.entries(hours).forEach(([day, schedule]) => {
    const italianDay = dayMap[day]
    if (schedule.closed) {
      formatted[italianDay] = 'Chiuso'
    } else if (schedule.open && schedule.close) {
      formatted[italianDay] = `${schedule.open} - ${schedule.close}`
    } else {
      formatted[italianDay] = 'Orari non disponibili'
    }
  })

  return formatted
}

// ===== REVERSE ADAPTERS =====

/**
 * Convert Legacy BarMatch filters to SPOrTS API format
 */
export function legacyFiltersToSPOrTS(filters) {
  return {
    search: filters.search,
    city: filters.location,
    features: mapLegacyFeaturesToSPOrTS(filters.features || []),
  }
}

/**
 * Map legacy BarMatch features to SPOrTS features
 */
function mapLegacyFeaturesToSPOrTS(legacyFeatures) {
  const reverseMap = {
    'Wi-Fi': 'wifi',
    'Grande schermo': 'multiple_screens',
    'Prenotabile': 'live_sports', // Assume live sports venues are bookable
    'Giardino': 'outdoor_seating',
    'Schermo esterno': 'outdoor_seating',
    'Servi cibo': 'food_service',
    'Pet friendly': 'wheelchair_accessible', // Map to accessibility
    'Commentatore': 'live_music',
    'Parcheggio': 'parking'
  }

  return legacyFeatures
    .map(feature => reverseMap[feature])
    .filter(Boolean)
}

// ===== BOOKING ADAPTERS =====

/**
 * Format booking time for display
 */
export function formatBookingTime(timeSlot) {
  return `${timeSlot.start} - ${timeSlot.end}`
}

/**
 * Calculate booking duration in minutes
 */
export function calculateBookingDuration(timeSlot) {
  const [startHour, startMin] = timeSlot.start.split(':').map(Number)
  const [endHour, endMin] = timeSlot.end.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  
  return endMinutes - startMinutes
}

/**
 * Check if a booking is within business hours
 */
export function isBookingWithinHours(timeSlot, venueHours, day) {
  const dayLower = day.toLowerCase()
  const schedule = venueHours[dayLower]
  
  if (!schedule || schedule.closed) {
    return false
  }
  
  const bookingStart = timeSlot.start
  const bookingEnd = timeSlot.end
  const venueOpen = schedule.open
  const venueClose = schedule.close
  
  return bookingStart >= venueOpen && bookingEnd <= venueClose
}

// ===== FIXTURE ADAPTERS =====

/**
 * Format fixture for display
 */
export function formatFixture(fixture) {
  return {
    id: fixture._id,
    title: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
    homeTeam: fixture.teams.home.name,
    awayTeam: fixture.teams.away.name,
    competition: fixture.competition.name,
    league: fixture.competition.name,
    date: fixture.datetime.toISOString(),
    time: fixture.datetime.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    venue: fixture.venue,
    status: formatFixtureStatus(fixture.status),
    homeScore: fixture.score?.home || null,
    awayScore: fixture.score?.away || null,
    popularity: fixture.popularity || 0
  }
}

/**
 * Format fixture status for display
 */
function formatFixtureStatus(status) {
  const statusMap = {
    'scheduled': 'Programmata',
    'live': 'In Corso',
    'finished': 'Finita',
    'postponed': 'Rimandata',
    'cancelled': 'Annullata'
  }
  
  return statusMap[status] || status
}

/**
 * Get fixtures for a specific venue
 */
export function getVenueFixtures(fixtures, venueId) {
  return fixtures.filter(fixture => fixture.venue === venueId)
}

/**
 * Get upcoming fixtures (within next 7 days)
 */
export function getUpcomingFixtures(fixtures) {
  const now = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  return fixtures.filter(fixture => {
    const fixtureDate = new Date(fixture.datetime)
    return fixtureDate >= now && fixtureDate <= nextWeek
  })
}

// ===== DATA VALIDATION =====

/**
 * Validate venue data structure
 */
export function validateVenue(venue) {
  const required = ['_id', 'name', 'location', 'contact']
  const missing = required.filter(field => !venue[field])
  
  if (missing.length > 0) {
    throw new Error(`Missing required venue fields: ${missing.join(', ')}`)
  }
  
  return true
}

/**
 * Validate booking data structure  
 */
export function validateBooking(booking) {
  const required = ['customer', 'venue', 'timeSlot', 'status']
  const missing = required.filter(field => !booking[field])
  
  if (missing.length > 0) {
    throw new Error(`Missing required booking fields: ${missing.join(', ')}`)
  }
  
  return true
}

// ===== SEARCH & FILTER UTILITIES =====

/**
 * Search venues by name, location, or features
 */
export function searchVenues(venues, searchTerm) {
  if (!searchTerm) return venues
  
  const term = searchTerm.toLowerCase()
  
  return venues.filter(venue => 
    venue.name.toLowerCase().includes(term) ||
    venue.location.address.city.toLowerCase().includes(term) ||
    venue.location.address.country.toLowerCase().includes(term) ||
    venue.features.some(feature => feature.toLowerCase().includes(term))
  )
}

/**
 * Filter venues by features
 */
export function filterVenuesByFeatures(venues, requiredFeatures) {
  if (!requiredFeatures || requiredFeatures.length === 0) return venues
  
  return venues.filter(venue =>
    requiredFeatures.every(feature => venue.features.includes(feature))
  )
}

/**
 * Sort venues by criteria
 */
export function sortVenues(venues, sortBy) {
  const sortedVenues = [...venues]
  
  switch (sortBy) {
    case 'rating':
      return sortedVenues.sort((a, b) => (b.analytics.averageRating || 0) - (a.analytics.averageRating || 0))
    case 'name':
      return sortedVenues.sort((a, b) => a.name.localeCompare(b.name))
    case 'capacity':
      return sortedVenues.sort((a, b) => (b.capacity.total || 0) - (a.capacity.total || 0))
    case 'price':
      return sortedVenues.sort((a, b) => (a.pricing.basePrice || 0) - (b.pricing.basePrice || 0))
    default:
      return sortedVenues
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Format currency values
 */
export function formatCurrency(amount, currency = 'EUR') {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

/**
 * Format date for display
 */
export function formatDate(date, locale = 'it-IT') {
  return new Date(date).toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Format time for display
 */
export function formatTime(date, locale = 'it-IT') {
  return new Date(date).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Generate mock venue data in SPOrTS format
 */
export function generateMockVenue(overrides = {}) {
  // Extract id and name from overrides or use defaults
  const id = overrides._id || `venue_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
  const name = overrides.name || `Mock Venue ${id}`
  
  // Ensure name is provided and valid
  const safeName = name.toLowerCase().replace(/\s+/g, '')
  
  return {
    _id: id,
    name: name,
    description: overrides.description || `Autentico locale sportivo perfetto per guardare le partite con gli amici.`,
    contact: {
      phone: overrides.contact?.phone || `+39 02 ${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
      email: overrides.contact?.email || `info@${safeName}.com`,
      website: overrides.contact?.website || `https://${safeName}.com`,
      socialMedia: {
        facebook: `https://facebook.com/${safeName}`,
        instagram: `https://instagram.com/${safeName}`,
        twitter: `https://twitter.com/${safeName}`
      }
    },
    location: overrides.location || {
      address: {
        street: 'Via Roma 123',
        city: 'Milano',
        postalCode: '20121',
        country: 'Italia'
      },
      coordinates: {
        lat: 45.4642 + (Math.random() - 0.5) * 0.1,
        lng: 9.1900 + (Math.random() - 0.5) * 0.1
      },
      neighborhood: 'Centro',
      publicTransport: {
        metro: ['M1 Duomo', 'M3 Duomo'],
        bus: ['54', '61'],
        tram: ['1', '2']
      }
    },
    hours: {
      monday: { open: '17:00', close: '00:00', closed: false },
      tuesday: { open: '17:00', close: '00:00', closed: false },
      wednesday: { open: '17:00', close: '00:00', closed: false },
      thursday: { open: '17:00', close: '01:00', closed: false },
      friday: { open: '17:00', close: '02:00', closed: false },
      saturday: { open: '15:00', close: '02:00', closed: false },
      sunday: { open: '15:00', close: '00:00', closed: false }
    },
    capacity: overrides.capacity || {
      total: 100 + Math.floor(Math.random() * 100),
      seating: 60 + Math.floor(Math.random() * 40),
      standing: 40 + Math.floor(Math.random() * 60),
      private: 0
    },
    features: overrides.features || ['wifi', 'multiple_screens', 'food_service', 'full_bar', 'live_sports'],
    images: [
      {
        url: `https://images.unsplash.com/photo-157211646969${6 + (Math.abs(id.hashCode()) % 4)}-31de0f17cc34?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`,
        alt: `${name} - Vista principale`,
        isPrimary: true,
        category: 'interior'
      },
      {
        url: `https://images.unsplash.com/photo-155861866${6 + ((Math.abs(id.hashCode()) + 1) % 4)}-fbd26c4cd2d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`,
        alt: `${name} - Area schermi`,
        isPrimary: false,
        category: 'screens'
      }
    ],
    sportsOfferings: [
      {
        sport: 'football',
        priority: 'high',
        competitions: ['Serie A', 'Champions League', 'Europa League'],
        equipment: {
          screens: 8 + Math.floor(Math.random() * 12),
          soundSystem: true,
          commentary: Math.random() > 0.5
        }
      }
    ],
    bookingSettings: overrides.bookingSettings || {
      enabled: true,
      advanceBookingDays: 30,
      minBookingDuration: 120,
      maxBookingDuration: 480,
      depositRequired: true,
      depositAmount: 50,
      cancellationPolicy: 'flexible',
      instantConfirmation: true
    },
    pricing: overrides.pricing || {
      basePrice: 20 + Math.floor(Math.random() * 80),
      pricePerPerson: 5 + Math.floor(Math.random() * 15),
      minimumSpend: 100 + Math.floor(Math.random() * 200),
      currency: 'EUR',
      specialRates: {
        happyHour: {
          enabled: true,
          hours: '17:00-19:00',
          discount: 0.2
        },
        groupDiscount: {
          enabled: true,
          minPeople: 8,
          discount: 0.15
        }
      }
    },
    analytics: overrides.analytics || {
      averageRating: 3.5 + Math.random() * 1.5,
      totalReviews: Math.floor(Math.random() * 500) + 50,
      popularTimes: {
        monday: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 40, 60, 80, 60, 40, 20],
        tuesday: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 25, 45, 65, 75, 55, 35, 15],
        wednesday: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 30, 50, 70, 85, 65, 45, 25],
        thursday: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 35, 55, 75, 90, 70, 50, 30],
        friday: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 70, 90, 100, 85, 65, 45],
        saturday: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 90, 100, 95, 90, 75, 55, 35],
        sunday: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 85, 90, 80, 70, 50, 30, 10]
      },
      totalBookings: Math.floor(Math.random() * 1000) + 200,
      repeatCustomers: Math.floor(Math.random() * 40) + 30
    },
    policies: {
      ageRestriction: 18,
      dressCode: 'casual',
      smokingPolicy: 'outdoor_only',
      petPolicy: 'not_allowed',
      accessibilityFeatures: ['wheelchair_accessible', 'accessible_restrooms']
    },
    status: 'active',
    verificationStatus: 'verified',
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)),
    updatedAt: new Date(),
    ...overrides
  }
}

// Helper function to generate hash code from string
String.prototype.hashCode = function() {
  let hash = 0;
  if (this.length === 0) return hash;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
} 