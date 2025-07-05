const express = require('express')
const router = express.Router()
const fixtureController = require('../controllers/fixtureController')
const { auth } = require('../middlewares/auth')

// Public routes (no auth required)

// @desc    Get fixtures with hybrid system (local + API)
// @route   GET /fixtures
// @access  Public
router.get('/', fixtureController.getFixtures)

// @desc    Search fixtures with advanced criteria
// @route   GET /fixtures/search
// @access  Public  
router.get('/search', fixtureController.searchFixtures)

// @desc    Get upcoming fixtures (next 7 days)
// @route   GET /fixtures/upcoming
// @access  Public
router.get('/upcoming', fixtureController.getUpcomingFixtures)

// @desc    Get live fixtures
// @route   GET /fixtures/live
// @access  Public
router.get('/live', fixtureController.getLiveFixtures)

// @desc    Get popular fixtures
// @route   GET /fixtures/popular
// @access  Public
router.get('/popular', fixtureController.getPopularFixtures)

// @desc    Get available leagues
// @route   GET /fixtures/leagues
// @access  Public
router.get('/leagues', fixtureController.getAvailableLeagues)

// @desc    Get available teams
// @route   GET /fixtures/teams
// @access  Public
router.get('/teams', fixtureController.getAvailableTeams)

// @desc    Get fixture details by ID
// @route   GET /fixtures/:id
// @access  Public
router.get('/:id', fixtureController.getFixtureById)

// Protected routes (authentication required)

// @desc    Sync popular fixtures from API
// @route   POST /fixtures/sync
// @access  Admin only
router.post('/sync', auth, fixtureController.syncFixtures)

// @desc    Update fixture popularity
// @route   PUT /fixtures/:id/popularity
// @access  Private (venue owners can update their bookings impact)
router.put('/:id/popularity', auth, fixtureController.updateFixturePopularity)

// @desc    Clear fixtures cache
// @route   DELETE /fixtures/cache
// @access  Admin only
router.delete('/cache', auth, fixtureController.clearCache)

module.exports = router 