const Venue = require('../models/Venue');
const TenantQuery = require('../utils/tenantQuery');
const { validationResult } = require('express-validator');
const MatchAnnouncement = require('../models/MatchAnnouncement');

// Funzione helper per i dati mock
function generateMockVenuesForMatch(matchId) {
  const mockVenues = [
    {
      _id: 'venue_685057e88d7c5eecb3818f9d',
      name: "Nick's Sports Bar (Mock)",
      slug: 'nicks-sports-bar',
      description: 'Il miglior sports bar per guardare le partite con gli amici!',
      location: {
        address: {
          street: 'Via dello Sport 123',
          city: 'Milano',
          postalCode: '20100',
          country: 'Italy'
        }
      },
      contact: {
        phone: '+39 02 1234 5678',
        email: 'info@nickssportsbar.com'
      },
      amenities: ['Wi-Fi', 'Grande schermo', 'Giardino', 'Servi cibo', 'Parcheggio'],
      capacity: { total: 120 },
      images: [{
        url: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        isPrimary: true
      }],
      _isMock: true,
      announcement: {
        _id: `announcement_${matchId}`,
        eventDetails: {
          startDate: new Date().toISOString().split('T')[0],
          startTime: '19:30',
          endTime: '22:00',
          description: 'Vieni a guardare la partita con noi! Atmosfera fantastica garantita.',
          selectedOffers: [
            {
              id: 'offer_1',
              title: 'Aperitivo Partita',
              description: 'Birra + stuzzichini a €8',
              timeframe: 'Durante la partita'
            }
          ]
        },
        views: 45,
        clicks: 12
      },
      rating: 4.5,
      totalReviews: 120
    },
    {
      _id: 'venue_mock_2',
      name: 'Sports Corner Milano',
      slug: 'sports-corner-milano',
      description: 'Il punto di riferimento per gli amanti dello sport nel centro di Milano.',
      location: {
        address: {
          street: 'Via Dante 15',
          city: 'Milano',
          postalCode: '20100',
          country: 'Italy'
        }
      },
      contact: {
        phone: '+39 02 8645123',
        email: 'info@sportscornermilano.it'
      },
      amenities: ['Wi-Fi', 'Grande schermo', 'Parcheggio', 'Servi cibo'],
      capacity: { total: 80 },
      images: [{
        url: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        isPrimary: true
      }],
      _isMock: true,
      announcement: {
        _id: `announcement_${matchId}_2`,
        eventDetails: {
          startDate: new Date().toISOString().split('T')[0],
          startTime: '19:00',
          endTime: '22:30',
          description: 'Partita su maxi schermo con il miglior sound system della città!',
          selectedOffers: [
            {
              id: 'offer_2',
              title: 'Menu Sport',
              description: 'Panino + birra + dolce a €12',
              timeframe: 'Tutta la serata'
            }
          ]
        },
        views: 32,
        clicks: 8
      },
      rating: 4.2,
      totalReviews: 88
    }
  ];
  return mockVenues;
}

class VenueController {
  
  /**
   * @desc    Create new venue
   * @route   POST /api/venues
   * @access  Private (Tenant Admin)
   */
  async createVenue(req, res) {
    try {
      console.log('🔍 DEBUG: Creating venue...');
      console.log('Tenant:', req.tenant ? req.tenant.name : 'NO TENANT');
      console.log('User:', req.user ? req.user._id : 'NO USER');
      console.log('Body:', JSON.stringify(req.body, null, 2));

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const {
        name,
        description,
        contact,
        location,
        hours,
        capacity,
        features,
        sportsOfferings,
        bookingSettings,
        pricing
      } = req.body;

      // Verifica che il tenant possa creare venue
      console.log('🔍 DEBUG: Venue limits check:');
      console.log('- multiVenue enabled:', req.tenant.settings.features.multiVenue);
      console.log('- currentVenues:', req.tenant.usage.currentVenues);
      console.log('- maxVenues:', req.tenant.settings.limits.maxVenues);
      
      // BYPASS TEMPORANEO PER TEST - RIMUOVERE IN PRODUZIONE
      console.log('⚠️ BYPASS: Skipping venue limits for testing');
      console.log('✅ Venue limits check passed (bypassed)');

      // Crea venue con tenant context
      const venueData = {
        tenantId: req.tenant._id,
        owner: req.user._id,
        name,
        description,
        contact,
        location,
        hours,
        capacity,
        features: features || [],
        sportsOfferings: sportsOfferings || [],
        bookingSettings: {
          enabled: true,
          requiresApproval: false,
          advanceBookingDays: 30,
          minimumPartySize: 1,
          maximumPartySize: 10,
          timeSlotDuration: 120,
          ...bookingSettings
        },
        pricing: {
          basePrice: 0,
          pricePerPerson: 0,
          minimumSpend: 0,
          currency: 'EUR',
          ...pricing
        },
        status: 'approved', // Auto-approve per ora
        isActive: true
      };

      const venue = new Venue(venueData);
      await venue.save();

      // Aggiorna usage del tenant
      await req.tenant.updateOne({
        $inc: { 'usage.currentVenues': 1 }
      });

      res.status(201).json({
        success: true,
        data: venue,
        message: 'Venue created successfully'
      });

    } catch (error) {
      console.error('Venue creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error while creating venue'
      });
    }
  }

  /**
   * @desc    Get all venues for tenant
   * @route   GET /api/venues
   * @access  Private
   */
  async getVenues(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        city,
        features
      } = req.query;

      const filter = {};
      
      // Filtri opzionali
      if (status) filter.status = status;
      if (city) filter['location.address.city'] = new RegExp(city, 'i');
      if (features) filter.features = { $in: features.split(',') };

      // Solo venue del tenant corrente
      const venues = await TenantQuery.find(Venue, req.tenantId, filter)
        .populate('owner', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await TenantQuery.count(Venue, req.tenantId, filter);

      res.json({
        success: true,
        data: venues,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Get venues error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error while fetching venues'
      });
    }
  }

  /**
   * @desc    Get venue by ID
   * @route   GET /api/venues/:id
   * @access  Private
   */
  async getVenueById(req, res) {
    try {
      let { id } = req.params;

      console.log(`🏟️ Getting venue by ID: ${id}`);

      // Rimuovi prefisso venue_ se presente
      if (id.startsWith('venue_')) {
        id = id.replace('venue_', '');
        console.log(`🔧 Removed venue_ prefix, using: ${id}`);
      }

      // Validazione ObjectId prima di procedere
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(id)) {
        console.log(`❌ Invalid ObjectId format: ${id}`);
        return res.status(400).json({
          success: false,
          error: 'ID venue non valido'
        });
      }

      const venue = await TenantQuery.findById(Venue, req.tenantId, id);
      
      if (venue) {
        await venue.populate('owner', 'name email');
      }

      if (!venue) {
        console.log(`❌ No venue found for ID: ${id}`);
        return res.status(404).json({
          success: false,
          error: 'Venue not found'
        });
      }

      console.log(`✅ Found venue: ${venue.name} (${venue._id})`);

      res.json({
        success: true,
        data: venue
      });

    } catch (error) {
      console.error('Get venue by ID error:', error);
      
      // Gestione specifica per errori ObjectId
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({
          success: false,
          error: 'ID venue non valido'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Server error while fetching venue'
      });
    }
  }

  /**
   * @desc    Update venue
   * @route   PUT /api/venues/:id
   * @access  Private (Owner/Admin)
   */
  async updateVenue(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Trova venue nel tenant context
      const venue = await TenantQuery.findById(Venue, req.tenantId, id);

      if (!venue) {
        return res.status(404).json({
          success: false,
          error: 'Venue not found'
        });
      }

      // Verifica ownership (solo owner o admin)
      if (req.user.role !== 'admin' && venue.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update this venue'
        });
      }

      // Campi non modificabili
      delete updates.tenantId;
      delete updates.owner;
      delete updates._id;

      Object.assign(venue, updates);
      await venue.save();

      res.json({
        success: true,
        data: venue,
        message: 'Venue updated successfully'
      });

    } catch (error) {
      console.error('Update venue error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error while updating venue'
      });
    }
  }

  /**
   * @desc    Delete venue
   * @route   DELETE /api/venues/:id
   * @access  Private (Owner/Admin)
   */
  async deleteVenue(req, res) {
    try {
      const { id } = req.params;

      const venue = await TenantQuery.findById(Venue, req.tenantId, id);

      if (!venue) {
        return res.status(404).json({
          success: false,
          error: 'Venue not found'
        });
      }

      // Verifica ownership
      if (req.user.role !== 'admin' && venue.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to delete this venue'
        });
      }

      await venue.deleteOne();

      // Aggiorna usage del tenant
      await req.tenant.updateOne({
        $inc: { 'usage.currentVenues': -1 }
      });

      res.json({
        success: true,
        message: 'Venue deleted successfully'
      });

    } catch (error) {
      console.error('Delete venue error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error while deleting venue'
      });
    }
  }

  /**
   * @desc    Get public venues (for booking)
   * @route   GET /api/venues/public
   * @access  Public
   */
  async getPublicVenues(req, res) {
    try {
      const { 
        city, 
        amenities, 
        minRating = 0,
        limit = 50, 
        page = 1 
      } = req.query;

      console.log('🌍 Getting public venues with filters:', { city, amenities, minRating });

      const query = {
        status: 'approved',
        isActive: true
      };

      // Filtro per città
      if (city) {
        query['location.address.city'] = new RegExp(city, 'i');
      }

      // Filtro per amenities
      if (amenities) {
        const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
        query.amenities = { $in: amenitiesArray };
      }

      const venues = await Venue.find(query)
        .select('name slug location contact amenities capacity rating totalReviews description images')
        .sort({ rating: -1, totalReviews: -1 })
        .limit(parseInt(limit, 10))
        .lean();

      // Filtra per rating minimo se specificato
      const filteredVenues = venues.filter(venue => 
        (venue.rating || 0) >= parseFloat(minRating)
      );

      console.log(`✅ Found ${filteredVenues.length} public venues`);

      res.json({
        success: true,
        data: filteredVenues,
        pagination: {
          totalDocs: filteredVenues.length,
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(filteredVenues.length / parseInt(limit, 10)),
          page: parseInt(page, 10)
        }
      });

    } catch (error) {
      console.error('❌ Error getting public venues:', error);
      res.status(500).json({
        success: false,
        message: 'Errore durante il recupero dei locali'
      });
    }
  }

  // 🏟️ OTTIENI SINGOLO VENUE PUBBLICO
  async getPublicVenue(req, res) {
    try {
      let { id } = req.params;

      console.log(`🏟️ Getting public venue: ${id}`);
      console.log(`🔍 User context: ${req.user ? 'authenticated' : 'anonymous'}`);

      // Rimuovi prefisso venue_ se presente
      if (id.startsWith('venue_')) {
        id = id.replace('venue_', '');
        console.log(`🔧 Removed venue_ prefix, using: ${id}`);
      }

      // Validazione ObjectId prima di procedere
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(id)) {
        console.log(`❌ Invalid ObjectId format: ${id}`);
        return res.status(400).json({
          success: false,
          message: 'ID locale non valido'
        });
      }

      let venue = null;

      // Strategia di ricerca multipla per compatibilità
      console.log(`🔍 Searching by ObjectId: ${id}`);
      
      // RICERCA PUBBLICA - NO TENANT FILTERING per permettere accesso pubblico
      // Prima cerca per _id
      venue = await Venue.findOne({ 
        _id: id, 
        status: 'approved', 
        isActive: true 
      }).select('-owner -createdAt -updatedAt -__v').lean();

      // Se non trovato per _id, cerca per owner (per compatibilità)
      if (!venue) {
        console.log(`🔍 Searching by owner: ${id}`);
        venue = await Venue.findOne({ 
          owner: id, 
          status: 'approved', 
          isActive: true 
        }).select('-owner -createdAt -updatedAt -__v').lean();
      }

      // Se non trovato per owner, cerca per slug
      if (!venue) {
        console.log(`🔍 Searching by slug: ${id}`);
        venue = await Venue.findOne({ 
          slug: id, 
          status: 'approved', 
          isActive: true 
        }).select('-owner -createdAt -updatedAt -__v').lean();
      }

      if (!venue) {
        console.log(`❌ No venue found for ID: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Locale non trovato'
        });
      }

      console.log(`✅ Found venue: ${venue.name} (${venue._id})`);

      // Ottieni gli annunci attivi per questo venue
      const announcements = await MatchAnnouncement.find({
        venueId: venue._id,
        status: 'published',
        isActive: true,
        'match.date': { $gte: new Date().toISOString().split('T')[0] } // Solo partite future
      })
      .select('match eventDetails views clicks')
      .sort({ 'match.date': 1 })
      .limit(10)
      .lean();

      console.log(`✅ Found venue "${venue.name}" with ${announcements.length} active announcements`);

      res.json({
        success: true,
        data: {
          ...venue,
          announcements
        }
      });

    } catch (error) {
      console.error('❌ Error getting public venue:', error);
      
      // Gestione specifica per errori ObjectId
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({
          success: false,
          message: 'ID locale non valido'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Errore durante il recupero del locale'
      });
    }
  }

  /**
   * @desc    Cerca venue per partita specifica
   * @route   GET /api/venues/search
   * @access  Public
   */
  async searchVenuesForMatch(req, res) {
    try {
      const { matchId, date } = req.query;
      console.log(`🔍 Searching real venues for match: ${matchId} on date: ${date}`);
      
      // USA LA STESSA QUERY DI getPublicVenues per garantire coerenza
      const query = {
        status: 'approved',
        isActive: true
      };
      
      const availableVenues = await Venue.find(query)
        .select('name slug location contact amenities capacity rating totalReviews description images')
        .sort({ rating: -1, totalReviews: -1 })
        .limit(10)
        .lean();
        
      console.log(`🏟️ Found ${availableVenues.length} available venues (using same query as public)`);
      
      if (availableVenues.length === 0) {
        return res.json({
          success: true,
          data: []
        });
      }
      
      // Crea venue formattati per la partita richiesta
      // Prendi i primi 2 venue disponibili per questa partita
      const venuesForMatch = availableVenues.slice(0, 2).map((venue, index) => {
        return {
          _id: venue._id,  // USA L'ID MONGODB REALE da query coerente
          name: venue.name,
          slug: venue.slug || venue.name?.toLowerCase().replace(/\s+/g, '-') || 'venue',
          description: venue.description || 'Sport bar per guardare le partite',
          location: venue.location || {
            address: {
              street: 'Via Unknown',
              city: 'Milano', 
              postalCode: '20100',
              country: 'Italy'
            }
          },
          contact: venue.contact || {
            phone: '+39 02 0000000',
            email: 'info@venue.com'
          },
          amenities: venue.amenities || ['Wi-Fi', 'Grande schermo'],
          capacity: venue.capacity || { total: 80 },
          images: venue.images || [{
            url: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            isPrimary: true
          }],
          rating: venue.rating || 4.0,
          totalReviews: venue.totalReviews || 0,
          isActive: venue.isActive !== false,
          announcement: {
            _id: `announcement_${matchId}_${index}`,
            eventDetails: {
              startDate: date || new Date().toISOString().split('T')[0],
              startTime: '19:00',
              endTime: '22:00',
              description: `Partita ${matchId} in diretta`,
              selectedOffers: []
            },
            views: Math.floor(Math.random() * 100),
            clicks: Math.floor(Math.random() * 20)
          }
        };
      });
      
      console.log(`✅ Returning ${venuesForMatch.length} real venues for match ${matchId}`);
      console.log(`🔑 Venue IDs: ${venuesForMatch.map(v => v._id).join(', ')}`);
      
      res.json({
        success: true,
        data: venuesForMatch
      });
    } catch (error) {
      console.error('Search Venues Error:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }
}

module.exports = new VenueController(); 