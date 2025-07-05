const bookingsService = require('../services/bookingsService')
const Booking = require('../models/Booking')
const Venue = require('../models/Venue')
const Fixture = require('../models/Fixture')
const { validationResult } = require('express-validator')
const emailService = require('../services/emailService')
const TenantQuery = require('../utils/tenantQuery')

class BookingController {

  /**
   * @desc    Create new booking
   * @route   POST /api/bookings
   * @access  Public (rate limited)
   */
  async createBooking(req, res) {
    try {
      const {
        customer,
        venue,
        fixture,
        date,
        timeSlot,
        partySize,
        tablePreference,
        specialRequests
      } = req.body

      // Validazione dati richiesti
      if (!customer || !customer.name || !customer.email || !customer.phone) {
        return res.status(400).json({
          success: false,
          error: 'Customer information (name, email, phone) is required'
        })
      }

      if (!venue || !date || !timeSlot || !partySize) {
        return res.status(400).json({
          success: false,
          error: 'Venue, date, timeSlot and partySize are required'
        })
      }

      if (!timeSlot.start || !timeSlot.end) {
        return res.status(400).json({
          success: false,
          error: 'TimeSlot must have start and end times'
        })
      }

      // DEBUG: Log tenant info
      console.log('🔍 CONTROLLER DEBUG: req.tenant:', req.tenant ? 'EXISTS' : 'NULL');
      console.log('🔍 CONTROLLER DEBUG: req.tenant._id:', req.tenant?._id);
      console.log('🔍 CONTROLLER DEBUG: req.tenantId:', req.tenantId);

      const result = await bookingsService.createBooking({
        customer,
        venue,
        fixture,
        date,
        timeSlot,
        partySize,
        tablePreference,
        specialRequests,
        tenantId: req.tenant?._id || req.tenantId // Fallback a req.tenantId se req.tenant._id è undefined
      })

      res.status(201).json(result)

    } catch (error) {
      console.error('Booking creation error:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * @desc    Get bookings with filters
   * @route   GET /api/bookings
   * @access  Private (venue owners see their bookings, admin sees all)
   */
  async getBookings(req, res) {
    try {
      const {
        venue,
        status,
        date,
        dateFrom,
        dateTo,
        page = 1,
        limit = 20,
        sortBy = 'bookingDate',
        sortOrder = 'desc'
      } = req.query

      // Build filter object
      const filter = {}

      // Venue filter (per venue owners)
      if (venue) {
        filter.venue = venue
      } else if (req.user && req.user.role === 'venue_owner') {
        // Venue owners can only see their bookings (tenant-aware)
        const userVenues = await TenantQuery.find(Venue, req.tenantId, { owner: req.user._id }).select('_id')
        if (userVenues.length > 0) {
          filter.venue = { $in: userVenues.map(v => v._id) }
        }
      }

      // Status filter
      if (status) {
        filter.status = status
      }

      // Date filters
      if (date) {
        const targetDate = new Date(date)
        filter.bookingDate = {
          $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          $lt: new Date(targetDate.setHours(23, 59, 59, 999))
        }
      } else if (dateFrom || dateTo) {
        filter.bookingDate = {}
        if (dateFrom) filter.bookingDate.$gte = new Date(dateFrom)
        if (dateTo) filter.bookingDate.$lte = new Date(dateTo)
      }

      // Pagination
      const skip = (page - 1) * limit
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

      // Execute query WITHOUT populate (to avoid ObjectId issues with mock venues) - tenant-aware
      const bookings = await TenantQuery.find(Booking, req.tenantId, filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))

      const total = await TenantQuery.count(Booking, req.tenantId, filter)

      // Process bookings to handle mock venues manually
      const processedBookings = bookings.map(booking => {
        const bookingObj = booking.toObject()
        
        // Handle mock venues manually
        if (typeof bookingObj.venue === 'string' && bookingObj.venue.startsWith('venue_')) {
          const mockVenues = {
            'venue_1': { 
              _id: 'venue_1', 
              name: "The Queen's Head",
              address: "Via The Queens Head, Milano"
            },
            'venue_2': { 
              _id: 'venue_2', 
              name: "Sports Corner",
              address: "Via Sports Corner, Milano"
            },
            'venue_3': { 
              _id: 'venue_3', 
              name: "The Football Tavern",
              address: "Via The Football Tavern, Milano"
            }
          }
          
          bookingObj.venue = mockVenues[bookingObj.venue] || {
            _id: bookingObj.venue,
            name: "Mock Venue",
            address: "Via Mock, Milano"
          }
        }
        
        return bookingObj
      })

      res.json({
        success: true,
        data: processedBookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error('Error fetching bookings:', error)
      res.status(500).json({
        success: false,
        message: 'Server error while fetching bookings'
      })
    }
  }

  /**
   * @desc    Get single booking by ID
   * @route   GET /api/bookings/:id
   * @access  Private
   */
  async getBookingById(req, res) {
    try {
      const { id } = req.params

      // Usa TenantQuery per garantire isolamento tenant
      const booking = await TenantQuery.findById(Booking, req.tenantId, id)

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        })
      }

      // Verifica autorizzazione (venue owner o admin)
      if (req.user && req.user.role !== 'admin') {
        // TODO: Verificare che l'utente possa accedere a questa prenotazione
      }

      res.json({
        success: true,
        data: booking
      })

    } catch (error) {
      console.error('Get booking by ID error:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * @desc    Update booking status
   * @route   PUT /api/bookings/:id/status
   * @access  Private (venue owners, admin)
   */
  async updateBookingStatus(req, res) {
    try {
      const { id } = req.params
      const { status, reason, adminNotes } = req.body

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Status is required'
        })
      }

      const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show']
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        })
      }

      const result = await bookingsService.updateBookingStatus(id, status, {
        reason,
        adminNotes
      })

      res.json(result)

    } catch (error) {
      console.error('Update booking status error:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * @desc    Update booking details
   * @route   PUT /api/bookings/:id
   * @access  Private
   */
  async updateBooking(req, res) {
    try {
      const { id } = req.params
      const updates = req.body

      // Remove non-updatable fields
      delete updates._id
      delete updates.__v
      delete updates.createdAt
      delete updates.confirmationCode

      const booking = await Booking.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      ).populate(['venue', 'fixture'])

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        })
      }

      res.json({
        success: true,
        data: booking,
        message: 'Booking updated successfully'
      })

    } catch (error) {
      console.error('Update booking error:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * @desc    Delete booking
   * @route   DELETE /api/bookings/:id
   * @access  Private
   */
  async deleteBooking(req, res) {
    try {
      const { id } = req.params
      const { force } = req.query

      const result = await bookingsService.deleteBooking(id, {
        force: force === 'true'
      })

      res.json(result)

    } catch (error) {
      console.error('Delete booking error:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * @desc    Get booking statistics
   * @route   GET /api/bookings/stats/:venueId
   * @access  Private (venue owners, admin)
   */
  async getBookingStats(req, res) {
    try {
      const { venueId } = req.params
      const { fromDate, toDate } = req.query

      const options = {}
      if (fromDate) options.fromDate = new Date(fromDate)
      if (toDate) options.toDate = new Date(toDate)

      const result = await bookingsService.getBookingStats(venueId, options)

      res.json(result)

    } catch (error) {
      console.error('Get booking stats error:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * @desc    Check available time slots
   * @route   GET /api/bookings/available-slots/:venueId
   * @access  Public
   */
  async getAvailableSlots(req, res) {
    try {
      const { venueId } = req.params
      const { date, duration } = req.query

      if (!date) {
        return res.status(400).json({
          success: false,
          error: 'Date parameter is required'
        })
      }

      const result = await bookingsService.findAvailableSlots(
        venueId,
        date,
        parseInt(duration) || 120,
        req.tenant?._id // Pass tenant ID from middleware
      )

      res.json(result)

    } catch (error) {
      console.error('Get available slots error:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * @desc    Check time conflicts
   * @route   POST /api/bookings/check-conflict
   * @access  Public
   */
  async checkTimeConflict(req, res) {
    try {
      const { venueId, date, timeSlot, partySize } = req.body

      if (!venueId || !date || !timeSlot || !partySize) {
        return res.status(400).json({
          success: false,
          error: 'venueId, date, timeSlot and partySize are required'
        })
      }

      const conflict = await bookingsService.checkTimeConflicts(
        venueId,
        date,
        timeSlot,
        partySize
      )

      res.json({
        success: true,
        data: conflict
      })

    } catch (error) {
      console.error('Check time conflict error:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * @desc    Get bookings by confirmation code
   * @route   GET /api/bookings/confirm/:code
   * @access  Public
   */
  async getBookingByConfirmationCode(req, res) {
    try {
      const { code } = req.params

      const booking = await Booking.findOne({ confirmationCode: code })
        .populate('venue', 'name address phone')
        .populate('fixture', 'homeTeam awayTeam league date')

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found with this confirmation code'
        })
      }

      res.json({
        success: true,
        data: booking
      })

    } catch (error) {
      console.error('Get booking by confirmation code error:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * @desc    Get upcoming bookings for venue
   * @route   GET /api/bookings/upcoming/:venueId
   * @access  Private
   */
  async getUpcomingBookings(req, res) {
    try {
      const { venueId } = req.params
      const { limit } = req.query

      const bookings = await Booking.findUpcoming(venueId)
        .populate('fixture', 'homeTeam awayTeam league date')
        .limit(parseInt(limit) || 10)

      res.json({
        success: true,
        data: bookings,
        count: bookings.length
      })

    } catch (error) {
      console.error('Get upcoming bookings error:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }
}

const controller = new BookingController()

module.exports = {
  createBooking: controller.createBooking.bind(controller),
  getBookings: controller.getBookings.bind(controller),
  getBookingById: controller.getBookingById.bind(controller),
  updateBookingStatus: controller.updateBookingStatus.bind(controller),
  updateBooking: controller.updateBooking.bind(controller),
  deleteBooking: controller.deleteBooking.bind(controller),
  getBookingStats: controller.getBookingStats.bind(controller),
  getAvailableSlots: controller.getAvailableSlots.bind(controller),
  checkTimeConflict: controller.checkTimeConflict.bind(controller),
  getBookingByConfirmationCode: controller.getBookingByConfirmationCode.bind(controller),
  getUpcomingBookings: controller.getUpcomingBookings.bind(controller)
} 