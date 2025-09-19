const express = require('express')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const User = require('../models/User')
const Venue = require('../models/Venue')
const Tenant = require('../models/Tenant') // Importa il modello Tenant
const { auth } = require('../middlewares/auth')
const TenantMiddleware = require('../middlewares/tenantMiddleware')

const router = express.Router()

// Generate JWT token - ora accetta anche tenantId
const generateToken = (id, tenantId = null) => {
  const payload = { id }
  if (tenantId) {
    payload.tenantId = tenantId
  }
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  })
}

// @route   POST /api/auth/register
// @desc    Register a new user and create venue if isVenueOwner
// @access  Public
router.post(
  '/register',
  [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('isVenueOwner').optional().isBoolean().withMessage('isVenueOwner must be boolean'),
  body('businessInfo.businessName').optional().isLength({ min: 2 }).withMessage('Business name must be at least 2 characters'),
  body('businessInfo.businessPhone').optional().isLength({ min: 8 }).withMessage('Business phone must be at least 8 characters'),
  body('businessInfo.businessAddress').optional().isLength({ min: 5 }).withMessage('Business address must be at least 5 characters'),
  body('businessInfo.businessCity').optional().isLength({ min: 2 }).withMessage('Business city must be at least 2 characters')
], 
async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, password, isVenueOwner, businessInfo } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Un utente con questa email esiste già. Prova ad effettuare il login o usa un\'altra email.' })
    }

    const role = isVenueOwner ? 'venue_owner' : 'user'

    const user = await User.create({
      name,
      email,
      password,
      role
    })

    let venue = null
      let tenant = null
      let tokenPayload = { id: user._id }

    if (isVenueOwner && businessInfo) {
        // 1. Crea un Tenant unico per il nuovo venue_owner
        const tenantSlug = businessInfo.businessName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + user._id.toString().slice(-4)
        tenant = await Tenant.create({
          name: businessInfo.businessName,
          slug: tenantSlug,
          ownerUser: user._id
        })

        console.log(`✅ [REGISTER] Tenant creato:`, {
          tenantId: tenant._id,
          slug: tenant.slug,
          name: tenant.name
        })

        // 2. Crea il Venue associato a questo nuovo Tenant
        venue = await Venue.create({
          name: businessInfo.businessName,
          owner: user._id,
          tenantId: tenant._id,
          contact: {
            email: email,
            phone: businessInfo.businessPhone
          },
          location: {
            address: {
              street: businessInfo.businessAddress,
              city: businessInfo.businessCity,
              postalCode: businessInfo.businessPostalCode || '00000',
              country: 'Italy'
            }
          },
          capacity: {
            total: 50 // Default capacity, can be updated later
          },
          bookingSettings: {
            enabled: true // ✅ Assicura che le prenotazioni siano abilitate di default
          },
          status: 'approved',
          isActive: true
        })

        console.log(`✅ [REGISTER] Venue creato:`, {
          venueId: venue._id,
          tenantId: venue.tenantId,
          name: venue.name
        })

        // 3. Aggiorna l'utente con i riferimenti corretti
        user.venueId = venue._id
        user.tenantId = tenant._id
        await user.save()

        console.log(`✅ [REGISTER] User aggiornato:`, {
          userId: user._id,
          venueId: user.venueId,
          tenantId: user.tenantId
        })

        // 4. Aggiungi tenantId al payload del token
        tokenPayload.tenantId = tenant._id
    }

      const token = generateToken(tokenPayload.id, tokenPayload.tenantId)

      // Ricarica l'utente per avere i dati più recenti
      const updatedUser = await User.findById(user._id)

      console.log(`✅ [REGISTER] UpdatedUser dopo il reload:`, {
        userId: updatedUser._id,
        venueId: updatedUser.venueId,
        tenantId: updatedUser.tenantId
      })

    res.status(201).json({
      success: true,
      token,
      user: {
        id: updatedUser._id,
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        venueId: updatedUser.venueId,
          tenantId: updatedUser.tenantId, // ✅ Il tenantId corretto è qui
        isActive: updatedUser.isActive,
        isVenueOwner: role === 'venue_owner',
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      },
        venue: venue
          ? {
        id: venue._id,
        _id: venue._id,
        name: venue.name,
        owner: venue.owner,
        contact: venue.contact,
        location: venue.location,
        status: venue.status,
        isActive: venue.isActive
            }
          : null
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Server error during registration' })
  }
  }
)

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

// Dev helper: CORS preflight for auth endpoints
router.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-ID')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  return res.sendStatus(200)
})

module.exports = router 