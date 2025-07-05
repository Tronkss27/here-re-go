const jwt = require('jsonwebtoken')
const User = require('../models/User')

// Protect routes
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password')

    if (!req.user) {
      return res.status(401).json({ message: 'Token is not valid' })
    }

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(401).json({ message: 'Token is not valid' })
  }
}

// Check if user is venue owner
const venueOwnerAuth = (req, res, next) => {
  if (req.user && (req.user.role === 'venue_owner' || req.user.role === 'admin')) {
    next()
  } else {
    res.status(403).json({ message: 'Access denied. Venue owner access required.' })
  }
}

// Check if user is admin
const adminAuth = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next()
  } else {
    res.status(403).json({ message: 'Access denied. Admin access required.' })
  }
}

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
      req.user = await User.findById(decoded.id).select('-password')
    }

    next()
  } catch (error) {
    // Continue without user if token is invalid
    next()
  }
}

// Venue authentication middleware (for match announcements)
const authenticateVenue = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Token di accesso richiesto' 
      })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')

    // Get user from token
    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Token non valido' 
      })
    }

    // Check if user is venue owner or admin
    if (user.role !== 'venue_owner' && user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Accesso negato. Solo i proprietari di locali possono accedere.' 
      })
    }

    // Add user and venue info to request
    req.user = user
    req.venue = { _id: user._id } // For now, assuming user ID is venue ID

    next()
  } catch (error) {
    console.error('Venue auth middleware error:', error)
    res.status(401).json({ 
      success: false,
      message: 'Token non valido' 
    })
  }
}

module.exports = {
  auth,
  venueOwnerAuth,
  adminAuth,
  optionalAuth,
  authenticateVenue
} 