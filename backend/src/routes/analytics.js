const express = require('express');
const router = express.Router({ mergeParams: true });
const { query, param } = require('express-validator');
const analyticsController = require('../controllers/analyticsController');
const { auth } = require('../middlewares/auth');
const { body } = require('express-validator');

// Overview per venue (auth richiesta per admin/owner - qui usiamo auth generico, i ruoli possono essere raffinati)
router.get('/venues/:venueId/analytics/overview',
  auth,
  [
    param('venueId').isMongoId().withMessage('Valid venue ID is required'),
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601()
  ],
  analyticsController.getVenueOverview
);

// Top (match, CTA in futuro) per venue
router.get('/venues/:venueId/analytics/top',
  auth,
  [
    param('venueId').isMongoId().withMessage('Valid venue ID is required'),
    query('metric').optional().isIn(['views','clicks']).withMessage('metric must be views|clicks'),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  analyticsController.getVenueTop
);

// Timeseries per venue (giornaliera)
router.get('/venues/:venueId/analytics/timeseries',
  auth,
  [
    param('venueId').isMongoId().withMessage('Valid venue ID is required'),
    query('metric').optional().isIn(['views','clicks']).withMessage('metric must be views|clicks'),
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601()
  ],
  analyticsController.getVenueTimeseries
);

// Track profile view (increment daily views for venue) - PUBLIC (no auth)
router.post('/analytics/profile-view',
  [body('venueId').isMongoId().withMessage('Valid venue ID is required')],
  analyticsController.trackProfileView
)

// Track profile click (increment daily clicks for venue) - PUBLIC
router.post('/analytics/profile-click',
  [body('venueId').isMongoId().withMessage('Valid venue ID is required')],
  analyticsController.trackProfileClick
)

// Track match click (global interest) - PUBLIC
router.post('/analytics/match-click',
  [body('matchId').isString().withMessage('Valid match ID is required')],
  analyticsController.trackMatchClick
)

// Global top matches by clicks (in range)
router.get('/analytics/matches/top',
  [query('from').optional().isISO8601(), query('to').optional().isISO8601(), query('limit').optional().isInt({ min: 1, max: 50 })],
  analyticsController.getTopMatches
)

// Venue match traffic (which matches drive venue traffic)
router.get('/venues/:venueId/analytics/match-traffic',
  [param('venueId').isMongoId().withMessage('Valid venue ID is required'), query('from').optional().isISO8601(), query('to').optional().isISO8601()],
  analyticsController.getVenueMatchTraffic
)

// ===== DEBUG ROUTES (no auth) =====
router.get('/debug/fixtures/:id', analyticsController.debugFixture)
router.get('/debug/announcements/by-match/:id', analyticsController.debugAnnouncementByMatch)
router.get('/debug/provider/fixture/:id', analyticsController.debugProviderFixture)

module.exports = router;


