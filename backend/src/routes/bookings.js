const express = require('express')
const { body, param, query } = require('express-validator')
const {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  getBookingStats,
  getAvailableSlots,
  getBookingByConfirmationCode,
  getUpcomingBookings,
  checkTimeConflict,
  updateBookingStatus
} = require('../controllers/bookingController')
const { auth } = require('../middlewares/auth')
const { isVenueOwnerOrAdmin } = require('../middlewares/roleMiddleware')
const { handleValidationErrors } = require('../middlewares/validation')
const TenantMiddleware = require('../middlewares/tenantMiddleware')
const TenantQuery = require('../utils/tenantQuery')
const Booking = require('../models/Booking')

const router = express.Router()

// Validation rules
const createBookingValidation = [
  body('venue')
    .isString()
    .notEmpty()
    .withMessage('Valid venue ID is required'),
  
  body('date')
    .isISO8601()
    .withMessage('Valid booking date is required (ISO format)')
    .custom(value => {
      const bookingDate = new Date(value)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Start of today
      
      if (bookingDate < today) {
        throw new Error('Booking date cannot be in the past')
      }
      return true
    }),
  
  body('timeSlot')
    .isObject()
    .withMessage('TimeSlot object is required'),
  
  body('timeSlot.start')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  
  body('timeSlot.end')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format')
    .custom((value, { req }) => {
      if (req.body.timeSlot && req.body.timeSlot.start) {
        const start = req.body.timeSlot.start.split(':')
        const end = value.split(':')
        const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1])
        const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1])
        
        if (endMinutes <= startMinutes) {
          throw new Error('End time must be after start time')
        }
      }
      return true
    }),
  
  body('partySize')
    .isInt({ min: 1, max: 50 })
    .withMessage('Party size must be between 1 and 50'),
  
  body('customer')
    .isObject()
    .withMessage('Customer object is required'),
  
  body('customer.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),
  
  body('customer.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address is required'),
  
  body('customer.phone')
    .matches(/^[\+]?[0-9][\d\s\-\(\)]{6,20}$/)
    .withMessage('Valid phone number is required'),
  
  body('specialRequests')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Special requests cannot exceed 500 characters'),
  
  body('tablePreference')
    .optional()
    .isIn(['any', 'window', 'bar', 'booth', 'outdoor'])
    .withMessage('Invalid table preference'),
  
  body('fixture')
    .optional()
    .isString()
    .withMessage('Valid fixture ID is required')
]

const updateBookingValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid booking ID is required'),
  
  body('bookingDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid booking date is required'),
  
  body('startTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  
  body('endTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  
  body('partySize')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Party size must be between 1 and 50'),
  
  body('customerName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),
  
  body('customerEmail')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address is required'),
  
  body('customerPhone')
    .optional()
    .matches(/^[\+]?[0-9][\d\s\-\(\)]{6,20}$/)
    .withMessage('Valid phone number is required'),
  
  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'cancelled', 'completed', 'no-show'])
    .withMessage('Invalid booking status'),
  
  body('specialRequests')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Special requests cannot exceed 500 characters'),
  
  body('internalNotes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Internal notes cannot exceed 1000 characters')
]

const availabilityValidation = [
  param('venueId')
    .isMongoId()
    .withMessage('Valid venue ID is required'),
  
  query('date')
    .isISO8601()
    .withMessage('Valid date is required'),
  
  query('duration')
    .optional()
    .isInt({ min: 30, max: 480 })
    .withMessage('Duration must be between 30 and 480 minutes')
]

// Routes

// @route   GET /api/bookings
// @desc    Get all bookings with filters
// @access  Private (Admin/Venue Owner)
router.get(
  '/',
  TenantMiddleware.extractTenant,
  auth,
  isVenueOwnerOrAdmin,
  [
    query('venue').optional().isMongoId().withMessage('Valid venue ID required'),
    query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']),
    query('date').optional().isISO8601().withMessage('Valid date required'),
    query('dateFrom').optional().isISO8601().withMessage('Valid date required'),
    query('dateTo').optional().isISO8601().withMessage('Valid date required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['bookingDate', 'createdAt', 'status', 'partySize', 'totalPrice']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
  ],
  getBookings
)

// @route   GET /api/bookings/stats
// @desc    Get booking statistics
// @access  Private (Admin/Venue Owner)
router.get(
  '/stats',
  TenantMiddleware.extractTenant,
  auth,
  isVenueOwnerOrAdmin,
  [
    query('venue').optional().isMongoId().withMessage('Valid venue ID required'),
    query('dateFrom').optional().isISO8601().withMessage('Valid date required'),
    query('dateTo').optional().isISO8601().withMessage('Valid date required')
  ],
  getBookingStats
)

// @route   GET /api/bookings/availability/:venueId
// @desc    Check venue availability for a specific date
// @access  Public
router.get(
  '/availability/:venueId',
  TenantMiddleware.extractTenant,
  availabilityValidation,
  getAvailableSlots
)

// @route   GET /api/bookings/confirm/:code
// @desc    Get booking by confirmation code
// @access  Public
router.get(
  '/confirm/:code',
  [
    param('code').isLength({ min: 8, max: 12 }).withMessage('Valid confirmation code is required')
  ],
  getBookingByConfirmationCode
)

// @route   GET /api/bookings/:id
// @desc    Get single booking by ID
// @access  Private
router.get(
  '/:id',
  TenantMiddleware.extractTenant,
  auth,
  [
    param('id').isMongoId().withMessage('Valid booking ID is required')
  ],
  getBookingById
)

// @route   POST /api/bookings
// @desc    Create new booking
// @access  Public (bookings should be accessible without login)
router.post(
  '/',
  TenantMiddleware.extractTenant,
  createBookingValidation,
  handleValidationErrors,
  createBooking
)

// @route   PUT /api/bookings/:id
// @desc    Update booking
// @access  Private (Admin/Venue Owner)
router.put(
  '/:id',
  TenantMiddleware.extractTenant,
  auth,
  isVenueOwnerOrAdmin,
  updateBookingValidation,
  updateBooking
)

// @route   DELETE /api/bookings/:id
// @desc    Cancel booking
// @access  Private (Owner/Admin/Venue Owner)
router.delete(
  '/:id',
  TenantMiddleware.extractTenant,
  auth,
  [
    param('id').isMongoId().withMessage('Valid booking ID is required'),
    body('reason').optional().isLength({ max: 200 }).withMessage('Reason cannot exceed 200 characters')
  ],
  deleteBooking
)

// Additional utility routes

// @route   GET /api/bookings/venue/:venueId
// @desc    Get all bookings for a specific venue
// @access  Private (Venue Owner/Admin)
router.get(
  '/venue/:venueId',
  TenantMiddleware.extractTenant,
  auth,
  isVenueOwnerOrAdmin,
  [
    param('venueId').isMongoId().withMessage('Valid venue ID is required'),
    query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']),
    query('dateFrom').optional().isISO8601().withMessage('Valid date required'),
    query('dateTo').optional().isISO8601().withMessage('Valid date required')
  ],
  async (req, res, next) => {
    req.query.venue = req.params.venueId
    next()
  },
  getBookings
)

// @route   GET /api/bookings/user/me
// @desc    Get current user's bookings
// @access  Private
router.get(
  '/user/me',
  TenantMiddleware.extractTenant,
  auth,
  [
    query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']),
    query('dateFrom').optional().isISO8601().withMessage('Valid date required'),
    query('dateTo').optional().isISO8601().withMessage('Valid date required')
  ],
  async (req, res) => {
    try {
      const {
        status,
        dateFrom,
        dateTo,
        page = 1,
        limit = 20
      } = req.query

      const filter = { user: req.user._id }

      if (status) {
        filter.status = status
      }

      if (dateFrom || dateTo) {
        filter.bookingDate = {}
        if (dateFrom) filter.bookingDate.$gte = new Date(dateFrom)
        if (dateTo) filter.bookingDate.$lte = new Date(dateTo)
      }

      const skip = (page - 1) * limit

      const bookings = await Booking.find(filter)
        .populate('venue', 'name address contact')
        .populate('fixture', 'homeTeam awayTeam startTime competition')
        .sort({ bookingDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))

      const total = await Booking.countDocuments(filter)

      res.json({
        success: true,
        data: bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error('Error fetching user bookings:', error)
      res.status(500).json({
        success: false,
        message: 'Server error while fetching bookings'
      })
    }
  }
)

// @route   PATCH /api/bookings/:id/status
// @desc    Update booking status only
// @access  Private (Venue Owner/Admin)
router.patch(
  '/:id/status',
  auth,
  isVenueOwnerOrAdmin,
  [
    param('id').isMongoId().withMessage('Valid booking ID is required'),
    body('status')
      .isIn(['pending', 'confirmed', 'cancelled', 'completed', 'no-show'])
      .withMessage('Invalid booking status'),
    body('reason').optional().isLength({ max: 200 }).withMessage('Reason cannot exceed 200 characters')
  ],
  async (req, res) => {
    try {
      const { status, reason } = req.body

      const booking = await Booking.findById(req.params.id)
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        })
      }

      // Authorization check for venue owners
      if (req.user.role === 'venue_owner') {
        const venue = await Venue.findById(booking.venue)
        if (!venue || venue.owner.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to update this booking'
          })
        }
      }

      await booking.updateStatus(status, req.user._id, reason)

      res.json({
        success: true,
        message: 'Booking status updated successfully',
        data: { status: booking.status }
      })
    } catch (error) {
      console.error('Error updating booking status:', error)
      res.status(500).json({
        success: false,
        message: 'Server error while updating status'
      })
    }
  }
)

// @route   GET /api/bookings/upcoming/:venueId
// @desc    Get upcoming bookings for venue
// @access  Private (Venue Owner/Admin)
router.get(
  '/upcoming/:venueId',
  TenantMiddleware.extractTenant,
  auth,
  isVenueOwnerOrAdmin,
  [
    param('venueId').isMongoId().withMessage('Valid venue ID is required'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  getUpcomingBookings
)

// @route   POST /api/bookings/check-conflict
// @desc    Check time conflicts
// @access  Public
router.post(
  '/check-conflict',
  TenantMiddleware.extractTenant,
  [
    body('venueId').isString().notEmpty().withMessage('Valid venue ID is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('timeSlot').isObject().withMessage('TimeSlot object is required'),
    body('partySize').isInt({ min: 1 }).withMessage('Valid party size is required')
  ],
  checkTimeConflict
)

// @route   GET /api/bookings/public/:tenantId
// @desc    Get bookings for specific tenant (PUBLIC - for testing only)
// @access  Public
router.get(
  '/public/:tenantId',
  TenantMiddleware.extractTenant,
  [
    param('tenantId').isMongoId().withMessage('Valid tenant ID is required'),
    query('venue').optional().isMongoId().withMessage('Valid venue ID required'),
    query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  async (req, res) => {
    try {
      const { tenantId } = req.params
      const { venue, status, limit = 20 } = req.query

      // Build filter for the specific tenant
      const filter = {}
      
      if (venue) {
        filter.venue = venue
      }
      
      if (status) {
        filter.status = status
      }

      // Query bookings for the specific tenant
      const bookings = await TenantQuery.find(Booking, tenantId, filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))

      res.json({
        success: true,
        data: bookings,
        count: bookings.length,
        tenantId: tenantId
      })
    } catch (error) {
      console.error('Error fetching public bookings:', error)
      res.status(500).json({
        success: false,
        message: 'Server error while fetching bookings'
      })
    }
  }
)

module.exports = router 