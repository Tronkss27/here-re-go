const express = require('express')
const { auth } = require('../middlewares/auth')
const { param, query, body } = require('express-validator')
const reviewsController = require('../controllers/reviewsController')

const router = express.Router()

// @route   GET /api/reviews
// @desc    Get all reviews for venue
// @access  Public
router.get('/venues/:venueId/reviews/summary', [param('venueId').isMongoId()], reviewsController.getSummary)
router.get('/venues/:venueId/reviews', [param('venueId').isMongoId(), query('rating').optional().isInt({ min: 1, max: 5 }), query('limit').optional().isInt({ min: 1, max: 50 })], reviewsController.getList)

// @route   POST /api/reviews
// @desc    Create new review
// @access  Private
router.post('/reviews/:id/reply', auth, [param('id').isMongoId(), body('text').isString().isLength({ min: 1, max: 1000 })], reviewsController.postReply)

module.exports = router 