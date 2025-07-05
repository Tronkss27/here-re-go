const express = require('express')
const { body, param, query } = require('express-validator')
const { auth, optionalAuth } = require('../middlewares/auth')
const TenantMiddleware = require('../middlewares/tenantMiddleware')
const venueController = require('../controllers/venueController')

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
// @desc    Get public venues for booking (no auth required)
// @access  Public
router.get('/public', venueController.getPublicVenues)

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
  createVenueValidation,
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