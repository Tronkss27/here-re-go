const express = require('express')
const { body, param, query } = require('express-validator')
const { auth, optionalAuth } = require('../middlewares/auth')
const TenantMiddleware = require('../middlewares/tenantMiddleware')
const venueController = require('../controllers/venueController')
const { upload } = require('../config/multerConfig')

const router = express.Router()

// Validation middleware
const createVenueValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('contact.email')
    .isEmail()
    .withMessage('Valid email is required'),
  
  body('contact.phone')
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  
  body('location.address.street')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Street address is required'),
  
  body('location.address.city')
    .trim()
    .isLength({ min: 2 })
    .withMessage('City is required'),
  
  body('location.address.postalCode')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Postal code is required'),
  
  body('capacity.total')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Total capacity must be between 1 and 1000')
]

const updateVenueValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('contact.email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required'),
  
  body('contact.phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required')
]

// ================================
// 🌍 ROUTE PUBBLICHE (NO AUTH)
// ================================

// @route   GET /api/venues/public
// @desc    Get public venues  
// @access  Public
router.get('/public', venueController.getPublicVenues)

// @route   GET /api/venues/test-debug
// @desc    Test route to debug public venues
// @access  Public
router.get('/test-debug', (req, res) => {
  console.log('🧪 TEST DEBUG ROUTE CALLED');
  res.json({ success: true, message: 'Test route working', timestamp: new Date() });
})

// @route   GET /api/venues/search
// @desc    Cerca venue per partita specifica (semplificato)
// @access  Public
router.get('/search', venueController.searchVenuesForMatch)

// @route   GET /api/venues/public/:id
// @desc    Ottieni singolo venue pubblico senza auth (backup route)
// @access  Public
router.get('/public/:id', optionalAuth, venueController.getPublicVenue)

// @route   GET /api/venues/details/:id
// @desc    Ottieni venue pubblico per details page (NO AUTH)
// @access  Public
router.get('/details/:id', optionalAuth, venueController.getPublicVenue)

// @route   GET /api/venues/with-announcements
// @desc    Get venues that have active announcements
// @access  Public
router.get('/with-announcements', venueController.getVenuesWithAnnouncements)

// @route   GET /api/venues/debug-tenant
// @desc    Debug tenant info (TEMPORARY)
// @access  Public
router.get('/debug-tenant', 
  TenantMiddleware.extractTenant,
  TenantMiddleware.requireTenant,
  async (req, res) => {
    try {
      res.json({
        success: true,
        tenant: {
          id: req.tenant._id,
          name: req.tenant.name,
          slug: req.tenant.slug,
          multiVenue: req.tenant.settings.features.multiVenue,
          currentVenues: req.tenant.usage.currentVenues,
          maxVenues: req.tenant.settings.limits.maxVenues
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// ================================
// 🔐 ROUTE PRIVATE (REQUIRE AUTH)
// ================================

// @route   POST /api/venues/test
// @desc    Test venue creation without auth (TEMPORARY)
// @access  Public
router.post('/test', 
  TenantMiddleware.extractTenant,
  TenantMiddleware.requireTenant,
  async (req, res) => {
    try {
      // Mock user per test
      req.user = { 
        _id: req.tenant.ownerUser,
        role: 'admin'
      };
      
      // Chiama il controller
      await venueController.createVenue(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// @route   POST /api/venues
// @desc    Create new venue
// @access  Private (Tenant Admin)
router.post(
  '/',
  TenantMiddleware.extractTenant,
  TenantMiddleware.requireTenant,
  auth,
  createVenueValidation, // ✅ RIABILITATO - problema risolto
  venueController.createVenue
)

// @route   GET /api/venues
// @desc    Get all venues for tenant
// @access  Private
router.get(
  '/',
  TenantMiddleware.extractTenant,
  TenantMiddleware.requireTenant,
  auth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'suspended']),
    query('city').optional().trim().isLength({ min: 2 }),
    query('features').optional().isString()
  ],
  venueController.getVenues
)

// @route   PUT /api/venues/:id
// @desc    Update venue
// @access  Private (Owner/Admin)
router.put(
  '/:id',
  TenantMiddleware.extractTenant,
  TenantMiddleware.requireTenant,
  auth,
  [
    param('id').isMongoId().withMessage('Valid venue ID is required'),
    ...updateVenueValidation
  ],
  venueController.updateVenue
)

// @route   DELETE /api/venues/:id
// @desc    Delete venue
// @access  Private (Owner/Admin)
router.delete(
  '/:id',
  TenantMiddleware.extractTenant,
  TenantMiddleware.requireTenant,
  auth,
  [
    param('id').isMongoId().withMessage('Valid venue ID is required')
  ],
  venueController.deleteVenue
)

// @route   POST /api/venues/:id/images
// @desc    Upload venue images
// @access  Private (Owner/Admin)
router.post(
  '/:id/images',
  (req, res, next) => {
    console.log('🚀 ROUTE DEBUG: Upload images route hit');
    console.log('🚀 ROUTE DEBUG: Params:', req.params);
    console.log('🚀 ROUTE DEBUG: Headers:', req.headers);
    next();
  },
  TenantMiddleware.extractTenant,
  TenantMiddleware.requireTenant,
  auth,
  upload.array('image', 5), // Massimo 5 immagini
  [
    param('id').isMongoId().withMessage('Valid venue ID is required')
  ],
  venueController.uploadVenueImages
)

// @route   DELETE /api/venues/:id/images
// @desc    Delete venue image by URL (alternative route)
// @access  Private (Owner/Admin)
router.delete(
  '/:id/images',
  TenantMiddleware.extractTenant,
  TenantMiddleware.requireTenant,
  auth,
  [
    param('id').isMongoId().withMessage('Valid venue ID is required'),
    body('imageUrl').notEmpty().withMessage('Image URL is required')
  ],
  venueController.deleteVenueImageByUrl
)

// @route   DELETE /api/venues/:id/images/:imageId
// @desc    Delete venue image by ID
// @access  Private (Owner/Admin)
router.delete(
  '/:id/images/:imageId',
  TenantMiddleware.extractTenant,
  TenantMiddleware.requireTenant,
  auth,
  [
    param('id').isMongoId().withMessage('Valid venue ID is required'),
    param('imageId').isMongoId().withMessage('Valid image ID is required')
  ],
  venueController.deleteVenueImage
)

// @route   PATCH /api/venues/:id/booking-settings
// @desc    Update venue booking settings (enable/disable bookings)
// @access  Private (Venue Owner/Admin)
router.patch(
  '/:id/booking-settings',
  TenantMiddleware.extractTenant,
  TenantMiddleware.requireTenant,
  auth,
  [
    param('id').isMongoId().withMessage('Valid venue ID is required'),
    body('enabled').optional().isBoolean().withMessage('Enabled must be a boolean'),
    body('requiresApproval').optional().isBoolean().withMessage('RequiresApproval must be a boolean'),
    body('advanceBookingDays').optional().isInt({ min: 1, max: 365 }).withMessage('AdvanceBookingDays must be between 1 and 365'),
    body('minimumPartySize').optional().isInt({ min: 1, max: 50 }).withMessage('MinimumPartySize must be between 1 and 50'),
    body('maximumPartySize').optional().isInt({ min: 1, max: 100 }).withMessage('MaximumPartySize must be between 1 and 100'),
    body('timeSlotDuration').optional().isInt({ min: 30, max: 480 }).withMessage('TimeSlotDuration must be between 30 and 480 minutes'),
    body('cancellationPolicy').optional().isLength({ max: 500 }).withMessage('CancellationPolicy must be max 500 characters')
  ],
  venueController.updateBookingSettings
)

// ================================
// 🌍 ROUTE PUBBLICHE PARAMETRIZZATE (NO AUTH) - DEVONO ESSERE ALLA FINE
// ================================

// @route   GET /api/venues/:id
// @desc    Ottieni singolo venue pubblico (per ID o slug) - NO AUTH
// @access  Public
router.get('/:id', optionalAuth, venueController.getPublicVenue)

// @route   GET /api/venues/admin/:id
// @desc    Get venue by ID (Private per admin)
// @access  Private
router.get(
  '/admin/:id',
  TenantMiddleware.extractTenant,
  TenantMiddleware.requireTenant,
  auth,
  [
    param('id').isMongoId().withMessage('Valid venue ID is required')
  ],
  venueController.getVenueById
)

module.exports = router 