// API Configuration for SPOrTS Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    DEMO: '/auth/demo',
    VERIFY: '/auth/verify',
    ME: '/auth/me'
  },
  
  // Venues
  VENUES: {
    LIST: '/venues',
    DETAILS: (id) => `/venues/${id}`
  },
  
  // Fixtures (Partite)
  FIXTURES: {
    LIST: '/fixtures',
    SEARCH: '/fixtures/search',
    UPCOMING: '/fixtures/upcoming',
    LIVE: '/fixtures/live',
    POPULAR: '/fixtures/popular',
    LEAGUES: '/fixtures/leagues',
    TEAMS: '/fixtures/teams',
    DETAILS: (id) => `/fixtures/${id}`,
    SYNC: '/fixtures/sync'
  },
  
  // Bookings (Prenotazioni)
  BOOKINGS: {
    CREATE: '/bookings',
    LIST: '/bookings',
    DETAILS: (id) => `/bookings/${id}`,
    UPDATE: (id) => `/bookings/${id}`,
    UPDATE_STATUS: (id) => `/bookings/${id}/status`,
    DELETE: (id) => `/bookings/${id}`,
    AVAILABLE_SLOTS: (venueId) => `/bookings/availability/${venueId}`,
    CHECK_CONFLICT: '/bookings/check-conflict',
    CONFIRM: (code) => `/bookings/confirm/${code}`,
    STATS: (venueId) => `/bookings/stats/${venueId}`,
    UPCOMING: (venueId) => `/bookings/upcoming/${venueId}`
  },
  
  // Reviews
  REVIEWS: {
    LIST: '/reviews',
    CREATE: '/reviews',
    DETAILS: (id) => `/reviews/${id}`,
    UPDATE: (id) => `/reviews/${id}`,
    DELETE: (id) => `/reviews/${id}`
  },
  
  // Offers
  OFFERS: {
    LIST: '/offers',
    CREATE: '/offers',
    DETAILS: (id) => `/offers/${id}`,
    UPDATE: (id) => `/offers/${id}`,
    DELETE: (id) => `/offers/${id}`
  }
}

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
}

// Request headers
export const getHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json'
  }
  
  if (includeAuth) {
    const token = localStorage.getItem('token')
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }
  
  // Aggiungi tenant header per sistema multi-tenant
  const user = localStorage.getItem('user')
  if (user) {
    try {
      const userData = JSON.parse(user)
      if (userData._id) {
        headers['X-Tenant-ID'] = userData._id
      }
    } catch (error) {
      console.warn('Error parsing user data for tenant header:', error)
    }
  }
  
  return headers
}

// Build full URL
export const buildUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`
}

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  HTTP_STATUS,
  getHeaders,
  buildUrl
} 