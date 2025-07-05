const Venue = require('../models/Venue')

// @desc    Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next()
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    })
  }
}

// @desc    Check if user is venue owner
const isVenueOwner = (req, res, next) => {
  if (req.user && req.user.role === 'venue_owner') {
    next()
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Venue owner role required.'
    })
  }
}

// @desc    Check if user is venue owner or admin
const isVenueOwnerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'venue_owner')) {
    next()
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Venue owner or admin role required.'
    })
  }
}

// @desc    Check if user owns the specific venue
const isVenueOwnerOfVenue = async (req, res, next) => {
  try {
    const venueId = req.params.venueId || req.body.venue || req.query.venue

    if (!venueId) {
      return res.status(400).json({
        success: false,
        message: 'Venue ID is required'
      })
    }

    // Admin can access any venue
    if (req.user.role === 'admin') {
      return next()
    }

    // Check if user owns the venue
    if (req.user.role === 'venue_owner') {
      const venue = await Venue.findById(venueId)
      
      if (!venue) {
        return res.status(404).json({
          success: false,
          message: 'Venue not found'
        })
      }

      if (venue.owner.toString() === req.user._id.toString()) {
        return next()
      }
    }

    res.status(403).json({
      success: false,
      message: 'Access denied. You do not own this venue.'
    })
  } catch (error) {
    console.error('Error in venue ownership check:', error)
    res.status(500).json({
      success: false,
      message: 'Server error during authorization check'
    })
  }
}

// @desc    Check if user is customer
const isCustomer = (req, res, next) => {
  if (req.user && req.user.role === 'customer') {
    next()
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Customer role required.'
    })
  }
}

// @desc    Flexible role checker
const hasRole = (...roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      next()
    } else {
      res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      })
    }
  }
}

// @desc    Check if user owns resource or is admin
const isOwnerOrAdmin = (resourceModel, ownerField = 'user') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id

      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID is required'
        })
      }

      // Admin can access anything
      if (req.user.role === 'admin') {
        return next()
      }

      // Check if user owns the resource
      const resource = await resourceModel.findById(resourceId)

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        })
      }

      const ownerId = resource[ownerField]
      if (ownerId && ownerId.toString() === req.user._id.toString()) {
        return next()
      }

      res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this resource.'
      })
    } catch (error) {
      console.error('Error in ownership check:', error)
      res.status(500).json({
        success: false,
        message: 'Server error during authorization check'
      })
    }
  }
}

module.exports = {
  isAdmin,
  isVenueOwner,
  isVenueOwnerOrAdmin,
  isVenueOwnerOfVenue,
  isCustomer,
  hasRole,
  isOwnerOrAdmin
} 