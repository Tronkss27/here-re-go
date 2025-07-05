import apiClient from './apiClient.js'
import { API_ENDPOINTS } from '../config/api.js'

// Bookings Service - Gestisce le prenotazioni
class BookingsService {
  
  // Create new booking
  async createBooking(bookingData) {
    return apiClient.post(API_ENDPOINTS.BOOKINGS.CREATE, bookingData, { includeAuth: false })
  }

  // Get all bookings (with filters for venue owners/admin)
  async getBookings(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `${API_ENDPOINTS.BOOKINGS.LIST}?${queryString}` : API_ENDPOINTS.BOOKINGS.LIST
    
    return apiClient.get(endpoint)
  }

  // Get booking by ID
  async getBookingById(id) {
    return apiClient.get(API_ENDPOINTS.BOOKINGS.DETAILS(id))
  }

  // Update booking details
  async updateBooking(id, updateData) {
    return apiClient.put(API_ENDPOINTS.BOOKINGS.UPDATE(id), updateData)
  }

  // Update booking status
  async updateBookingStatus(id, status) {
    return apiClient.put(API_ENDPOINTS.BOOKINGS.UPDATE_STATUS(id), { status })
  }

  // Delete booking
  async deleteBooking(id) {
    return apiClient.delete(API_ENDPOINTS.BOOKINGS.DELETE(id))
  }

  // Get available time slots for a venue
  async getAvailableSlots(venueId, date) {
    const params = date ? { date } : {}
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString 
      ? `${API_ENDPOINTS.BOOKINGS.AVAILABLE_SLOTS(venueId)}?${queryString}`
      : API_ENDPOINTS.BOOKINGS.AVAILABLE_SLOTS(venueId)
    
    return apiClient.get(endpoint, { includeAuth: false })
  }

  // Check time conflicts for booking
  async checkTimeConflict(conflictData) {
    return apiClient.post(API_ENDPOINTS.BOOKINGS.CHECK_CONFLICT, conflictData, { includeAuth: false })
  }

  // Get booking by confirmation code
  async getBookingByConfirmationCode(code) {
    return apiClient.get(API_ENDPOINTS.BOOKINGS.CONFIRM(code), { includeAuth: false })
  }

  // Get all bookings for a specific venue (for calendar display)
  async getVenueBookings(venueId, params = {}) {
    const queryParams = { venue: venueId, ...params }
    const queryString = new URLSearchParams(queryParams).toString()
    const endpoint = `${API_ENDPOINTS.BOOKINGS.LIST}?${queryString}`
    
    return apiClient.get(endpoint, { includeAuth: false })
  }

  // Get booking statistics for venue
  async getBookingStats(params = {}) {
    try {
      // Get all bookings for statistics calculation
      const queryParams = { ...params, limit: 1000 }
      const queryString = new URLSearchParams(queryParams).toString()
      const endpoint = `${API_ENDPOINTS.BOOKINGS.LIST}?${queryString}`
      const response = await apiClient.get(endpoint)
      
      if (response.success && response.data) {
        const bookings = response.data
        
        // Debug: Log problematic bookings
        const problematicBookings = bookings.filter(b => {
          if (!b.bookingDate) return true
          const date = new Date(b.bookingDate)
          return isNaN(date.getTime())
        })
        
        if (problematicBookings.length > 0) {
          console.warn('Prenotazioni con date non valide:', problematicBookings.map(b => ({
            id: b._id,
            bookingDate: b.bookingDate,
            customer: b.customerName
          })))
        }
        
        // Calculate statistics
        const stats = {
          total: bookings.length,
          pending: bookings.filter(b => b.status === 'pending').length,
          confirmed: bookings.filter(b => b.status === 'confirmed').length,
          cancelled: bookings.filter(b => b.status === 'cancelled').length,
          completed: bookings.filter(b => b.status === 'completed').length,
          noShow: bookings.filter(b => b.status === 'no-show').length,
          
          // Revenue stats
          totalRevenue: bookings
            .filter(b => b.status === 'completed' || b.status === 'confirmed')
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0),
          
          // Today's stats
          today: {
            bookings: bookings.filter(b => {
              if (!b.bookingDate) return false
              const bookingDate = new Date(b.bookingDate)
              if (isNaN(bookingDate.getTime())) return false // Check if date is valid
              
              const today = new Date().toISOString().split('T')[0]
              return bookingDate.toISOString().split('T')[0] === today
            }).length,
            revenue: bookings
              .filter(b => {
                if (!b.bookingDate) return false
                const bookingDate = new Date(b.bookingDate)
                if (isNaN(bookingDate.getTime())) return false // Check if date is valid
                
                const today = new Date().toISOString().split('T')[0]
                return bookingDate.toISOString().split('T')[0] === today && 
                       (b.status === 'completed' || b.status === 'confirmed')
              })
              .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
          },
          
          // Average party size
          averagePartySize: bookings.length > 0 
            ? bookings.reduce((sum, b) => sum + (b.partySize || 0), 0) / bookings.length 
            : 0
        }
        
        return { success: true, data: stats }
      }
      
      return { success: false, data: null }
    } catch (error) {
      console.error('Error fetching booking stats:', error)
      return { success: false, error: error.message, data: null }
    }
  }

  // Get upcoming bookings for venue
  async getUpcomingBookings(venueId, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString 
      ? `${API_ENDPOINTS.BOOKINGS.UPCOMING(venueId)}?${queryString}`
      : API_ENDPOINTS.BOOKINGS.UPCOMING(venueId)
    
    return apiClient.get(endpoint)
  }

  // Format booking for display
  formatBooking(booking) {
    return {
      id: booking._id || booking.id,
      confirmationCode: booking.confirmationCode,
      customerName: booking.customerInfo?.name || booking.name,
      customerEmail: booking.customerInfo?.email || booking.email,
      customerPhone: booking.customerInfo?.phone || booking.phone,
      venueId: booking.venueId,
      venueName: booking.venue?.name,
      date: booking.date ? new Date(booking.date) : null,
      startTime: booking.startTime,
      endTime: booking.endTime,
      duration: booking.duration,
      partySize: booking.partySize || booking.guestCount,
      specialRequests: booking.specialRequests || booking.notes,
      status: booking.status || 'pending',
      fixtureId: booking.fixtureId,
      fixture: booking.fixture,
      totalAmount: booking.totalAmount || booking.price,
      createdAt: booking.createdAt ? new Date(booking.createdAt) : null,
      updatedAt: booking.updatedAt ? new Date(booking.updatedAt) : null
    }
  }

  // Validate booking data before submission
  validateBookingData(bookingData) {
    const errors = []
    
    // Required fields
    if (!bookingData.customerInfo?.name) {
      errors.push('Nome del cliente richiesto')
    }
    
    if (!bookingData.customerInfo?.email) {
      errors.push('Email del cliente richiesta')
    }
    
    if (!bookingData.venueId) {
      errors.push('Venue richiesto')
    }
    
    if (!bookingData.date) {
      errors.push('Data richiesta')
    }
    
    if (!bookingData.startTime) {
      errors.push('Orario di inizio richiesto')
    }
    
    if (!bookingData.partySize || bookingData.partySize < 1) {
      errors.push('Numero di persone deve essere almeno 1')
    }
    
    // Date validation
    if (bookingData.date) {
      const bookingDate = new Date(bookingData.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (bookingDate < today) {
        errors.push('La data non può essere nel passato')
      }
    }
    
    // Email validation
    if (bookingData.customerInfo?.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(bookingData.customerInfo.email)) {
        errors.push('Email non valida')
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Generate time slots for booking
  generateTimeSlots(startHour = 9, endHour = 23, interval = 30) {
    const slots = []
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push({
          value: timeString,
          label: timeString,
          hour,
          minute
        })
      }
    }
    
    return slots
  }

  // Get booking status text and style
  getBookingStatusInfo(status) {
    const statusMap = {
      pending: {
        text: 'In Attesa',
        color: 'orange',
        bgColor: 'orange-50',
        icon: '⏳'
      },
      confirmed: {
        text: 'Confermata',
        color: 'green',
        bgColor: 'green-50',
        icon: '✅'
      },
      cancelled: {
        text: 'Cancellata',
        color: 'red',
        bgColor: 'red-50',
        icon: '❌'
      },
      completed: {
        text: 'Completata',
        color: 'blue',
        bgColor: 'blue-50',
        icon: '🎉'
      },
      noshow: {
        text: 'No Show',
        color: 'gray',
        bgColor: 'gray-50',
        icon: '👤'
      }
    }
    
    return statusMap[status] || statusMap.pending
  }

  // Helper method to format date for API
  formatDateForApi(date) {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0]
    }
    return date
  }

  // Helper method to format time for display
  formatTimeForDisplay(time) {
    if (!time) return ''
    
    // Handle different time formats
    if (time.includes(':')) {
      const [hours, minutes] = time.split(':')
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
    }
    
    return time
  }

  // Get bookings for specific tenant (PUBLIC endpoint for testing)
  async getPublicBookings(tenantId, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString 
      ? `/api/bookings/public/${tenantId}?${queryString}`
      : `/api/bookings/public/${tenantId}`
    
    return apiClient.get(endpoint, { includeAuth: false })
  }
}

// Create and export singleton instance
const bookingsService = new BookingsService()
export default bookingsService 