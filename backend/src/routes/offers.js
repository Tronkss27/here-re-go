const express = require('express')
const { auth, venueOwnerAuth } = require('../middlewares/auth')
const Offer = require('../models/Offer')
const Venue = require('../models/Venue')
const Fixture = require('../models/Fixture')
const eventTargetingService = require('../services/eventTargetingService')
const offerValidationService = require('../services/offerValidationService')

const router = express.Router()

// @route   GET /api/offers
// @desc    Get all offers with filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { venue, status, type, active, featured } = req.query
    const filter = {}

    if (venue) filter.venue = venue
    if (status) filter.status = status
    if (type) filter.type = type
    if (featured === 'true') filter['display.isFeatured'] = true
    
    // Filter for currently active offers
    if (active === 'true') {
      const now = new Date()
      filter.status = 'active'
      filter.validFrom = { $lte: now }
      filter.validUntil = { $gte: now }
      filter['display.isPublic'] = true
    }

    const offers = await Offer.find(filter)
      .populate('venue', 'name location contact')
      .sort({ 'display.isFeatured': -1, createdAt: -1 })

    res.json({
      success: true,
      data: offers,
      count: offers.length
    })
  } catch (error) {
    console.error('Error fetching offers:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel recupero delle offerte' 
    })
  }
})

// @route   GET /api/offers/venue/:venueId
// @desc    Get offers by venue
// @access  Public
router.get('/venue/:venueId', async (req, res) => {
  try {
    const { venueId } = req.params
    const { active } = req.query

    let query = { venue: venueId }
    
    if (active === 'true') {
      const now = new Date()
      query = {
        ...query,
        status: 'active',
        validFrom: { $lte: now },
        validUntil: { $gte: now },
        'display.isPublic': true
      }
    }

    const offers = await Offer.find(query)
      .sort({ 'display.isFeatured': -1, createdAt: -1 })

    res.json({
      success: true,
      data: offers,
      count: offers.length
    })
  } catch (error) {
    console.error('Error fetching venue offers:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel recupero delle offerte del locale' 
    })
  }
})

// @route   GET /api/offers/:id
// @desc    Get single offer
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate('venue', 'name location contact')

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offerta non trovata'
      })
    }

    res.json({
      success: true,
      data: offer
    })
  } catch (error) {
    console.error('Error fetching offer:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel recupero dell\'offerta' 
    })
  }
})

// @route   POST /api/offers
// @desc    Create new offer
// @access  Private (venue owner)
router.post('/', auth, venueOwnerAuth, async (req, res) => {
  try {
    // Ensure user has a venue - create default if needed
    let venueId = req.user.venueId
    
    if (!venueId) {
      // Create a default venue for testing
      const defaultVenue = new Venue({
        name: 'Default Test Venue',
        description: 'Venue di test per sviluppo',
        owner: req.user._id,
        contact: {
          email: req.user.email,
          phone: '+39 000 000 0000'
        },
        location: {
          address: {
            street: 'Via Test 1',
            city: 'Milano',
            postalCode: '20100',
            country: 'Italy'
          }
        },
        capacity: {
          total: 50,
          tables: 10,
          bar: 15
        },
        status: 'approved',
        isActive: true
      })
      
      await defaultVenue.save()
      
      // Update user with venueId
      req.user.venueId = defaultVenue._id
      await req.user.save()
      
      venueId = defaultVenue._id
    }

    const offerData = {
      ...req.body,
      venue: venueId
    }

    // Comprehensive validation using service
    const validation = await offerValidationService.validateOffer(offerData)
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Dati offerta non validi',
        errors: validation.errors,
        warnings: validation.warnings,
        severity: validation.severity
      })
    }

    const offerPayload = {
      ...offerData,
      validFrom: offerData.validFrom ? new Date(offerData.validFrom) : undefined,
      validUntil: offerData.validUntil ? new Date(offerData.validUntil) : undefined,
    }

    const newOffer = new Offer(offerPayload)

    await newOffer.save()
    await newOffer.populate('venue', 'name location contact')

    res.status(201).json({
      success: true,
      message: 'Offerta creata con successo',
      data: newOffer,
      validation: {
        warnings: validation.warnings,
        severity: validation.severity
      }
    })
  } catch (error) {
    console.error('Error creating offer:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Errore nella creazione dell\'offerta' 
    })
  }
})

// @route   POST /api/offers/validate
// @desc    Validate offer data in real-time
// @access  Private (venue owner)
router.post('/validate', auth, venueOwnerAuth, async (req, res) => {
  try {
    const offerData = {
      ...req.body,
      venue: req.user.venueId
    }

    const validation = await offerValidationService.validateOffer(offerData)

    res.json({
      success: true,
      validation
    })
  } catch (error) {
    console.error('Error validating offer:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Errore nella validazione dell\'offerta' 
    })
  }
})

// @route   POST /api/offers/validate-field
// @desc    Quick field validation for real-time feedback
// @access  Private (venue owner)
router.post('/validate-field', auth, venueOwnerAuth, async (req, res) => {
  try {
    const { field, value, offerData } = req.body

    const validation = offerValidationService.quickValidate(field, value, offerData)

    res.json({
      success: true,
      validation
    })
  } catch (error) {
    console.error('Error validating field:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Errore nella validazione del campo' 
    })
  }
})

// @route   PUT /api/offers/:id
// @desc    Update offer
// @access  Private (venue owner)
router.put('/:id', auth, venueOwnerAuth, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id)
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offerta non trovata'
      })
    }

    // Check ownership
    if (offer.venue.toString() !== req.user.venueId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorizzato a modificare questa offerta'
      })
    }

    // Prepare updated data
    const updatedData = { ...offer.toObject(), ...req.body }

    // Comprehensive validation using service
    const validation = await offerValidationService.validateOffer(updatedData, offer._id)
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Dati offerta non validi',
        errors: validation.errors,
        warnings: validation.warnings,
        severity: validation.severity
      })
    }

    // Update fields
    const updateFields = [
      'title', 'description', 'type', 'discount', 'validFrom', 'validUntil',
      'timeRestrictions', 'limits', 'applicableItems', 'terms', 'status', 'display',
      'eventTargeting'
    ]

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        offer[field] = req.body[field]
      }
    })

    // Convert dates if provided
    if (req.body.validFrom) offer.validFrom = new Date(req.body.validFrom)
    if (req.body.validUntil) offer.validUntil = new Date(req.body.validUntil)

    await offer.save()
    await offer.populate('venue', 'name location contact')

    res.json({
      success: true,
      message: 'Offerta aggiornata con successo',
      data: offer,
      validation: {
        warnings: validation.warnings,
        severity: validation.severity
      }
    })
  } catch (error) {
    console.error('Error updating offer:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Errore nell\'aggiornamento dell\'offerta' 
    })
  }
})

// @route   DELETE /api/offers/:id
// @desc    Delete offer
// @access  Private (venue owner)
router.delete('/:id', auth, venueOwnerAuth, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id)
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offerta non trovata'
      })
    }

    // Check ownership
    if (offer.venue.toString() !== req.user.venueId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorizzato a eliminare questa offerta'
      })
    }

    await Offer.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: 'Offerta eliminata con successo'
    })
  } catch (error) {
    console.error('Error deleting offer:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Errore nell\'eliminazione dell\'offerta' 
    })
  }
})

// @route   PATCH /api/offers/:id/status
// @desc    Update offer status
// @access  Private (venue owner)
router.patch('/:id/status', auth, venueOwnerAuth, async (req, res) => {
  try {
    const { status } = req.body
    
    if (!['draft', 'active', 'paused', 'expired'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status non valido'
      })
    }

    const offer = await Offer.findById(req.params.id)
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offerta non trovata'
      })
    }

    // Check ownership
    if (offer.venue.toString() !== req.user.venueId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorizzato a modificare questa offerta'
      })
    }

    offer.status = status
    await offer.save()

    res.json({
      success: true,
      message: 'Status offerta aggiornato con successo',
      data: { id: offer._id, status: offer.status }
    })
  } catch (error) {
    console.error('Error updating offer status:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Errore nell\'aggiornamento dello status' 
    })
  }
})

// @route   GET /api/offers/:id/analytics
// @desc    Get offer analytics
// @access  Private (venue owner)
router.get('/:id/analytics', auth, venueOwnerAuth, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id)
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offerta non trovata'
      })
    }

    // Check ownership
    if (offer.venue.toString() !== req.user.venueId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorizzato a visualizzare questi dati'
      })
    }

    res.json({
      success: true,
      data: {
        id: offer._id,
        title: offer.title,
        analytics: offer.analytics,
        isCurrentlyValid: offer.isCurrentlyValid,
        isAvailableNow: offer.isAvailableNow
      }
    })
  } catch (error) {
    console.error('Error fetching offer analytics:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel recupero delle statistiche' 
    })
  }
})

// @route   GET /api/offers/templates/predefined
// @desc    Get predefined offer templates
// @access  Private (venue owner)
router.get('/templates/predefined', auth, venueOwnerAuth, async (req, res) => {
  try {
    const templates = [
      {
        id: 'happy_hour',
        name: 'Happy Hour',
        description: 'Sconto su bevande in fascia oraria specifica',
        type: 'percentage',
        discount: { value: 30, unit: 'percentage' },
        timeRestrictions: {
          daysOfWeek: [1, 2, 3, 4, 5], // Lun-Ven
          startTime: '17:00',
          endTime: '19:00'
        },
        applicableItems: [
          { name: 'Birre', category: 'beverages' },
          { name: 'Cocktail', category: 'beverages' }
        ],
        display: {
          backgroundColor: '#ff6b35',
          textColor: '#ffffff'
        }
      },
      {
        id: 'derby_special',
        name: 'Derby Special',
        description: 'Offerta speciale per eventi Derby e partite importanti',
        type: 'buy_one_get_one',
        discount: { value: 1, unit: 'item' },
        limits: {
          minimumPartySize: 2,
          minimumAmount: 15
        },
        applicableItems: [
          { name: 'Birre', category: 'beverages' },
          { name: 'Panini', category: 'food' }
        ],
        display: {
          backgroundColor: '#2563eb',
          textColor: '#ffffff'
        }
      },
      {
        id: 'group_discount',
        name: 'Sconto Gruppo',
        description: 'Sconto per gruppi numerosi',
        type: 'percentage',
        discount: { value: 15, unit: 'percentage' },
        limits: {
          minimumPartySize: 6
        },
        display: {
          backgroundColor: '#16a34a',
          textColor: '#ffffff'
        }
      },
      {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Sconto per prenotazioni anticipate',
        type: 'fixed_amount',
        discount: { value: 10, unit: 'euro' },
        limits: {
          minimumAmount: 30
        },
        display: {
          backgroundColor: '#dc2626',
          textColor: '#ffffff'
        }
      }
    ]

    res.json({
      success: true,
      data: templates
    })
  } catch (error) {
    console.error('Error fetching templates:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel recupero dei template' 
    })
  }
})

// @route   GET /api/offers/targeting/leagues
// @desc    Get available leagues for targeting
// @access  Private (Venue Owner)
router.get('/targeting/leagues', auth, venueOwnerAuth, async (req, res) => {
  try {
    const leagues = await eventTargetingService.getAvailableLeagues()
    res.json({
      success: true,
      data: leagues
    })
  } catch (error) {
    console.error('Error fetching leagues:', error)
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle leghe'
    })
  }
})

// @route   GET /api/offers/targeting/teams
// @desc    Get available teams for targeting
// @access  Private (Venue Owner)
router.get('/targeting/teams', auth, venueOwnerAuth, async (req, res) => {
  try {
    const teams = await eventTargetingService.getAvailableTeams()
    res.json({
      success: true,
      data: teams
    })
  } catch (error) {
    console.error('Error fetching teams:', error)
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle squadre'
    })
  }
})

// @route   GET /api/offers/targeting/fixtures
// @desc    Get upcoming fixtures for targeting
// @access  Private (Venue Owner)
router.get('/targeting/fixtures', auth, venueOwnerAuth, async (req, res) => {
  try {
    const { days = 30 } = req.query
    const now = new Date()
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000))

    const fixtures = await Fixture.find({
      date: { $gte: now, $lte: futureDate },
      status: 'scheduled',
      isActive: true
    }).sort({ date: 1 }).limit(100)

    res.json({
      success: true,
      data: fixtures
    })
  } catch (error) {
    console.error('Error fetching fixtures:', error)
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero degli eventi'
    })
  }
})

// @route   GET /api/offers/event/:fixtureId
// @desc    Get offers for a specific event
// @access  Public
router.get('/event/:fixtureId', async (req, res) => {
  try {
    const { fixtureId } = req.params
    const { venue } = req.query

    if (!venue) {
      return res.status(400).json({
        success: false,
        message: 'Venue ID richiesto'
      })
    }

    const offers = await eventTargetingService.getOffersForFixture(venue, fixtureId)
    
    res.json({
      success: true,
      data: offers
    })
  } catch (error) {
    console.error('Error fetching offers for event:', error)
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle offerte per l\'evento'
    })
  }
})

// @route   POST /api/offers/auto-activation/process
// @desc    Manually trigger auto-activation process
// @access  Private (Admin only)
router.post('/auto-activation/process', auth, async (req, res) => {
  try {
    // Only allow admin users to trigger this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accesso negato'
      })
    }

    const result = await eventTargetingService.processAutoActivation()
    
    res.json({
      success: true,
      data: result,
      message: `Processo completato: ${result.activated} offerte attivate, ${result.deactivated} disattivate`
    })
  } catch (error) {
    console.error('Error in manual auto-activation:', error)
    res.status(500).json({
      success: false,
      message: 'Errore nel processo di auto-attivazione'
    })
  }
})

module.exports = router 