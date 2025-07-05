const express = require('express')
const { auth } = require('../middlewares/auth')

const router = express.Router()

// @route   GET /api/reviews
// @desc    Get all reviews for venue
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { venueId } = req.query
    res.json({
      success: true,
      message: `Reviews for venue ${venueId} - Coming soon`,
      data: []
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/reviews
// @desc    Create new review
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Create review - Coming soon',
      data: null
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router 