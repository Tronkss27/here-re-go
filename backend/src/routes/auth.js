const express = require('express')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const User = require('../models/User')
const Venue = require('../models/Venue')
const { auth } = require('../middlewares/auth')
const TenantMiddleware = require('../middlewares/TenantMiddleware')

const router = express.Router()

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  })
}

// @route   POST /api/auth/register
// @desc    Register a new user and create venue if isVenueOwner
// @access  Public
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('isVenueOwner').optional().isBoolean().withMessage('isVenueOwner must be boolean'),
  body('businessInfo.businessName').optional().isLength({ min: 2 }).withMessage('Business name must be at least 2 characters'),
  body('businessInfo.businessPhone').optional().isLength({ min: 8 }).withMessage('Business phone must be at least 8 characters'),
  body('businessInfo.businessAddress').optional().isLength({ min: 5 }).withMessage('Business address must be at least 5 characters'),
  body('businessInfo.businessCity').optional().isLength({ min: 2 }).withMessage('Business city must be at least 2 characters')
], 
TenantMiddleware.extractTenant,
async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, password, isVenueOwner, businessInfo } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    // Determine role based on isVenueOwner flag
    const role = isVenueOwner ? 'venue_owner' : 'user'

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role
    })

    // If it's a venue owner, create the venue
    let venue = null
    if (isVenueOwner && businessInfo) {
      try {
        // STRATEGIA TENANTID: Usa l'ID dell'utente come tenantId per creare tenant univoci
        const tenantId = user._id.toString();
        
        console.log('🏗️ DEBUG: Creating venue with user-based tenant context');
        console.log('- User ID:', user._id.toString());
        console.log('- Generated TenantId:', tenantId);
        
        venue = await Venue.create({
          name: businessInfo.businessName,
          owner: user._id,
          tenantId: tenantId, // CORRETTO: Usa user._id come tenantId
          contact: {
            email: email,
            phone: businessInfo.businessPhone
          },
          location: {
            address: {
              street: businessInfo.businessAddress,
              city: businessInfo.businessCity,
              postalCode: '00000', // Default, can be updated later
              country: 'Italy'
            }
          },
          capacity: {
            total: 50 // Default capacity, can be updated later
          },
          status: 'approved',
          isActive: true
        })

        console.log('✅ DEBUG: Venue created with ID:', venue._id, 'and tenantId:', venue.tenantId);

        // Update user with venue reference
        user.venueId = venue._id
        await user.save()
      } catch (venueError) {
        console.error('Venue creation error:', venueError)
        // If venue creation fails, still return success for user creation
        // The venue can be created later through the admin panel
      }
    }

    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      token,
      user: {
        ...user.toJSON(),
        isVenueOwner: role === 'venue_owner'
      },
      venue: venue ? venue.toJSON() : null
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Server error during registration' })
  }
})

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    // Check if user exists
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Check password
    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Se è un venue owner, recupera anche i dati del venue
    let venue = null
    if (user.role === 'venue_owner' && user.venueId) {
      try {
        venue = await Venue.findById(user.venueId)
      } catch (venueError) {
        console.error('Error loading venue:', venueError)
      }
    }

    const token = generateToken(user._id)

    res.json({
      success: true,
      token,
      user: {
        ...user.toJSON(),
        isVenueOwner: user.role === 'venue_owner'
      },
      venue: venue ? venue.toJSON() : null
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error during login' })
  }
})

// @route   GET /api/auth/verify
// @desc    Verify JWT token
// @access  Private
router.get('/verify', auth, async (req, res) => {
  try {
    // Se siamo qui, il middleware auth ha già verificato il token
    // e req.user contiene i dati dell'utente
    res.json({
      success: true,
      valid: true,
      user: req.user
    })
  } catch (error) {
    console.error('Token verification error:', error)
    res.status(500).json({ message: 'Server error during token verification' })
  }
})

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('venueId')
    res.json({ success: true, user })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/auth/demo
// @desc    Demo login
// @access  Public
router.post('/demo', async (req, res) => {
  try {
    // Create or find demo user
    let demoUser = await User.findOne({ email: 'demo@sports.it' })
    
    if (!demoUser) {
      demoUser = await User.create({
        name: 'Demo User',
        email: 'demo@sports.it',
        password: 'demo123',
        role: 'venue_owner'
      })
    }

    demoUser.lastLogin = new Date()
    await demoUser.save()

    const token = generateToken(demoUser._id)

    res.json({
      success: true,
      token,
      user: demoUser
    })
  } catch (error) {
    console.error('Demo login error:', error)
    res.status(500).json({ message: 'Server error during demo login' })
  }
})

module.exports = router 