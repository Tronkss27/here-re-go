const MatchAnnouncement = require('../models/MatchAnnouncement');
const PopularMatch = require('../models/PopularMatch');
const Venue = require('../models/Venue');
const TenantQuery = require('../utils/tenantQuery');
const { processVenueWithImages } = require('../utils/imageUtils');
const sportsApiService = require('../services/sportsApiService');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

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
      console.log('🔍 DEBUG: Images in request body:', req.body.images ? req.body.images.length : 'NO IMAGES');
      
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
        pricing,
        images // ✅ Aggiungo images al destructuring
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
        // ✅ Aggiungo le immagini se presenti
        images: Array.isArray(images) ? images : [],
        status: 'approved', // Auto-approve per ora
        isActive: true
      };

      console.log('🔍 DEBUG: Creating venue with images:', venueData.images.length);
      if (venueData.images.length > 0) {
        console.log('📸 DEBUG: Images being saved:');
        venueData.images.forEach((img, idx) => {
          console.log(`  ${idx + 1}. ${img.url} (${img.caption})`);
        });
      }

      const venue = new Venue(venueData);
      
      console.log('🔍 DEBUG: Venue object before save:');
      console.log('- Name:', venue.name);
      console.log('- Images count:', venue.images ? venue.images.length : 'NO IMAGES FIELD');
      console.log('- Images:', venue.images);
      
      try {
        await venue.save();
        
        console.log('🔍 DEBUG: Venue object after save:');
        console.log('- ID:', venue._id);
        console.log('- Name:', venue.name);
        console.log('- Images count:', venue.images ? venue.images.length : 'NO IMAGES FIELD');
        console.log('- Images:', venue.images);
      } catch (saveError) {
        console.error('❌ DEBUG: Error saving venue:', saveError);
        console.error('❌ DEBUG: Validation errors:', saveError.errors);
        throw saveError;
      }

      // Aggiorna usage del tenant
      await req.tenant.updateOne({
        $inc: { 'usage.currentVenues': 1 }
      });

      console.log('🔍 DEBUG: Venue before response:');
      console.log('- ID:', venue._id);
      console.log('- Name:', venue.name);
      console.log('- Images count:', venue.images ? venue.images.length : 'NO IMAGES FIELD');
      console.log('- Images:', JSON.stringify(venue.images, null, 2));

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
      console.log('🔍 DEBUG: updateVenue called');
      console.log('- Venue ID:', req.params.id);
      console.log('- User:', req.user ? req.user._id : 'NO USER');
      console.log('- Tenant:', req.tenant ? req.tenant._id : 'NO TENANT');
      console.log('- TenantId:', req.tenantId);
      
      const { id } = req.params;
      const updates = req.body;

      // Trova venue nel tenant context
      console.log('🔍 DEBUG: Searching venue with TenantQuery...');
      const venue = await TenantQuery.findById(Venue, req.tenantId, id);
      console.log('🔍 DEBUG: Venue found:', venue ? venue.name : 'null');

      if (!venue) {
        console.log('❌ DEBUG: Venue not found');
        return res.status(404).json({
          success: false,
          error: 'Venue not found'
        });
      }

      // Verifica ownership (solo owner o admin)
      console.log('🔍 DEBUG: Checking ownership...');
      console.log('- User role:', req.user.role);
      console.log('- Venue owner:', venue.owner.toString());
      console.log('- Request user:', req.user._id.toString());
      
      if (req.user.role !== 'admin' && venue.owner.toString() !== req.user._id.toString()) {
        console.log('❌ DEBUG: Not authorized');
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update this venue'
        });
      }

      // Campi non modificabili
      delete updates.tenantId;
      delete updates.owner;
      delete updates._id;

      console.log('🔍 DEBUG: Updating venue with:', Object.keys(updates));
      Object.assign(venue, updates);
      await venue.save();
      
      console.log('✅ DEBUG: Venue updated successfully');

      res.json({
        success: true,
        data: venue,
        message: 'Venue updated successfully'
      });

    } catch (error) {
      console.error('❌ Update venue error:', error);
      console.error('Error stack:', error.stack);
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
      console.log('🌍 DEBUG: getPublicVenues method called!');
      const { 
        city, 
        amenities, 
        minRating = 0,
        limit = 50, 
        page = 1,
        matchId // ✅ FIX: Nuovo parametro per filtrare per match
      } = req.query;

      console.log('🌍 Getting public venues with filters:', { city, amenities, minRating, matchId });

      // ✅ FIX: Se c'è matchId, usa logica speciale per venue della partita
      if (matchId) {
        console.log(`🏟️ Fetching venues specifically for match: ${matchId}`);
        
        const popularMatch = await PopularMatch.findOne({ matchId }).lean();
        
        if (!popularMatch) {
          return res.json([]); // Restituisci array vuoto se non trova la partita
        }
        
        // Ottieni i dettagli dei venues per questa partita
        const venues = await Promise.all(
          popularMatch.venues.map(async (v) => {
            const venue = await Venue.findById(v.venueId)
              .select('name slug location contact amenities capacity rating totalReviews description images')
              .lean();
              
            if (!venue) return null;
            
            // Process venue with fixed image URLs usando stesso formato di getPublicVenues
            const processedVenue = processVenueWithImages(venue, req);
            
            return {
              _id: venue._id, // ✅ IMPORTANTE: Usa lo stesso ID del venue originale
              ...processedVenue,
              announcement: {
                addedAt: v.addedAt,
                announcementId: v.announcementId
              }
            };
          })
        );
        
        const validVenues = venues.filter(v => v !== null);
        console.log(`✅ Found ${validVenues.length} venues for match ${matchId} using unified format`);
        
        return res.json(validVenues);
      }

      // ✅ Logica normale per tutti i venue (senza filtro match)
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

      // Process venues with fixed image URLs
      const processedVenues = filteredVenues.map(venue => processVenueWithImages(venue, req));

      res.json({
        success: true,
        data: processedVenues,
        pagination: {
          totalDocs: processedVenues.length,
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(processedVenues.length / parseInt(limit, 10)),
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
      console.log(`🖼️ Venue images:`, venue.images);
      console.log(`📊 Images count:`, venue.images ? venue.images.length : 0);

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

      // Process venue with fixed image URLs
      const processedVenue = processVenueWithImages(venue, req);

      res.json({
        success: true,
        venue: processedVenue, // ✅ Aggiungi venue come campo separato per compatibilità frontend
        data: {
          ...processedVenue,
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

  /**
   * @desc    Upload venue images
   * @route   POST /api/venues/:id/images
   * @access  Private (Owner/Admin)
   */
  async uploadVenueImages(req, res) {
    try {
      const { id } = req.params;
      
      console.log(`📸 Uploading images for venue: ${id}`);
      console.log(`📁 Files received: ${req.files ? req.files.length : 0}`);
      console.log(`🔍 TenantId: ${req.tenantId}`);
      console.log(`🔍 User: ${req.user._id} (role: ${req.user.role})`);

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nessun file ricevuto'
        });
      }

      // Trova venue nel tenant context (con fallback)
      console.log(`🔍 Searching venue ${id} with tenantId ${req.tenantId}`);
      let venue = await TenantQuery.findById(Venue, req.tenantId, id);
      
      // Fallback: se non trovato con TenantQuery, prova ricerca diretta
      if (!venue) {
        console.log(`⚠️ Venue not found with TenantQuery, trying direct search...`);
        venue = await Venue.findById(id);
        
        // Verifica ownership come sicurezza aggiuntiva
        if (venue && venue.owner.toString() !== req.user._id.toString()) {
          console.log(`❌ Ownership mismatch: venue.owner=${venue.owner}, user=${req.user._id}`);
          venue = null;
        }
      }
      
      if (!venue) {
        console.log(`❌ Venue not found or access denied`);
        
        // Pulisci file uploadati se venue non trovato
        req.files.forEach(file => {
          fs.unlinkSync(file.path);
        });
        return res.status(404).json({
          success: false,
          message: 'Venue non trovato'
        });
      }

      console.log(`✅ Found venue: ${venue.name} (owner: ${venue.owner})`);

      // Verifica ownership (solo owner o admin)
      if (req.user.role !== 'admin' && venue.owner.toString() !== req.user._id.toString()) {
        // Pulisci file uploadati se non autorizzato
        req.files.forEach(file => {
          fs.unlinkSync(file.path);
        });
        return res.status(403).json({
          success: false,
          message: 'Non autorizzato a caricare immagini per questo venue'
        });
      }

      // Imposta limite massimo immagini per venue
      const MAX_IMAGES = 5;
      if (venue.images.length + req.files.length > MAX_IMAGES) {
        // Pulisci file appena caricati
        req.files.forEach(file => {
          try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
        });
        return res.status(400).json({
          success: false,
          message: `Limite massimo di ${MAX_IMAGES} foto raggiunto. Elimina alcune immagini prima di caricarne di nuove.`
        });
      }

      // Prepara array immagini da aggiungere
      const newImages = req.files.map((file, index) => ({
        url: `/uploads/venues/${file.filename}`,
        caption: req.body[`caption_${index}`] || '',
        isMain: venue.images.length === 0 && index === 0, // Prima immagine come principale se non ce ne sono altre
        uploadedAt: new Date()
      }));

      // Aggiungi le nuove immagini
      venue.images.push(...newImages);

      // Salva venue
      await venue.save();

      console.log(`✅ Successfully uploaded ${newImages.length} images for venue ${venue.name}`);

      res.json({
        success: true,
        message: `${newImages.length} immagini caricate con successo`,
        data: {
          venue: {
            id: venue._id,
            name: venue.name,
            images: venue.images
          },
          uploadedImages: newImages
        }
      });

    } catch (error) {
      console.error('Upload venue images error:', error);
      
      // Pulisci file in caso di errore
      if (req.files) {
        req.files.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (unlinkError) {
            console.error('Error cleaning up file:', unlinkError);
          }
        });
      }

      res.status(500).json({
        success: false,
        message: 'Errore durante l\'upload delle immagini',
        error: error.message
      });
    }
  }

  /**
   * @desc    Delete venue image
   * @route   DELETE /api/venues/:id/images/:imageId
   * @access  Private (Owner/Admin)
   */
  async deleteVenueImage(req, res) {
    try {
      const { id, imageId } = req.params;
      
      console.log(`🗑️ Deleting image ${imageId} from venue: ${id}`);

      // Trova venue nel tenant context
      const venue = await TenantQuery.findById(Venue, req.tenantId, id);

      if (!venue) {
        return res.status(404).json({
          success: false,
          message: 'Venue non trovato'
        });
      }

      // Verifica ownership (solo owner o admin)
      if (req.user.role !== 'admin' && venue.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Non autorizzato a eliminare immagini per questo venue'
        });
      }

      // Trova l'immagine da eliminare
      const imageIndex = venue.images.findIndex(img => img._id.toString() === imageId);

      if (imageIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Immagine non trovata'
        });
      }

      const imageToDelete = venue.images[imageIndex];

      // Elimina file fisico se esiste
      if (imageToDelete.url.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '../../', imageToDelete.url);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Physical file deleted: ${filePath}`);
          }
        } catch (fileError) {
          console.error('Error deleting physical file:', fileError);
          // Non bloccare l'operazione se il file non può essere eliminato
        }
      }

      // Rimuovi l'immagine dall'array
      venue.images.splice(imageIndex, 1);

      // Se era l'immagine principale e ci sono altre immagini, imposta la prima come principale
      if (imageToDelete.isMain && venue.images.length > 0) {
        venue.images[0].isMain = true;
      }

      // Salva venue
      await venue.save();

      console.log(`✅ Successfully deleted image from venue ${venue.name}`);

      res.json({
        success: true,
        message: 'Immagine eliminata con successo',
        data: {
          venue: {
            id: venue._id,
            name: venue.name,
            images: venue.images
          }
        }
      });

    } catch (error) {
      console.error('Delete venue image error:', error);
      res.status(500).json({
        success: false,
        message: 'Errore durante l\'eliminazione dell\'immagine',
        error: error.message
      });
    }
  }

  /**
   * @desc    Delete venue image by URL (alternative method)
   * @route   DELETE /api/venues/:id/images
   * @access  Private (Owner/Admin)
   */
  async deleteVenueImageByUrl(req, res) {
    try {
      const { id } = req.params;
      const { imageUrl } = req.body;
      
      console.log(`🗑️ Deleting image by URL from venue: ${id}`);
      console.log(`🔗 Image URL: ${imageUrl}`);

      // Validazione input
      if (!imageUrl) {
        return res.status(400).json({
          success: false,
          message: 'URL immagine richiesto'
        });
      }

      // Trova venue nel tenant context
      const venue = await TenantQuery.findById(Venue, req.tenantId, id);

      if (!venue) {
        return res.status(404).json({
          success: false,
          message: 'Venue non trovato'
        });
      }

      // Verifica ownership (solo owner o admin)
      if (req.user.role !== 'admin' && venue.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Non autorizzato a eliminare immagini per questo venue'
        });
      }

      // Trova l'immagine da eliminare per URL
      // Normalizza l'URL per il confronto
      let normalizedImageUrl = imageUrl;
      
      // Decodifica caratteri HTML encoded
      normalizedImageUrl = normalizedImageUrl
        .replace(/&#x2F;/g, '/')
        .replace(/&amp;/g, '&');
      
      // Se l'URL include il dominio, estrailo solo la parte relativa
      if (normalizedImageUrl.includes('localhost:3001')) {
        const urlParts = normalizedImageUrl.split('localhost:3001');
        normalizedImageUrl = urlParts[1] || normalizedImageUrl;
      }
      
      // Assicurati che inizi con /
      if (!normalizedImageUrl.startsWith('/')) {
        normalizedImageUrl = '/' + normalizedImageUrl;
      }
      
      console.log(`🔍 Original URL: ${imageUrl}`);
      console.log(`🔍 Normalized URL: ${normalizedImageUrl}`);
      
      const imageIndex = venue.images.findIndex(img => {
        // Normalizza anche l'URL dell'immagine nel database
        let dbImageUrl = img.url;
        dbImageUrl = dbImageUrl
          .replace(/&#x2F;/g, '/')
          .replace(/&amp;/g, '&');
          
        if (dbImageUrl.includes('localhost:3001')) {
          const urlParts = dbImageUrl.split('localhost:3001');
          dbImageUrl = urlParts[1] || dbImageUrl;
        }
        
        if (!dbImageUrl.startsWith('/')) {
          dbImageUrl = '/' + dbImageUrl;
        }
        
        return dbImageUrl === normalizedImageUrl;
      });

      if (imageIndex === -1) {
        console.log(`❌ Image not found with URL: ${imageUrl}`);
        console.log(`📋 Available images:`, venue.images.map(img => img.url));
        return res.status(404).json({
          success: false,
          message: 'Immagine non trovata'
        });
      }

      const imageToDelete = venue.images[imageIndex];
      console.log(`✅ Found image to delete: ${imageToDelete.url}`);

      // Elimina file fisico se esiste
      if (imageToDelete.url.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '../../', imageToDelete.url);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Physical file deleted: ${filePath}`);
          }
        } catch (fileError) {
          console.error('Error deleting physical file:', fileError);
          // Non bloccare l'operazione se il file non può essere eliminato
        }
      }

      // Rimuovi l'immagine dall'array
      venue.images.splice(imageIndex, 1);

      // Se era l'immagine principale e ci sono altre immagini, imposta la prima come principale
      if (imageToDelete.isMain && venue.images.length > 0) {
        venue.images[0].isMain = true;
      }

      // Salva venue
      await venue.save();

      console.log(`✅ Successfully deleted image from venue ${venue.name}`);

      res.json({
        success: true,
        message: 'Immagine eliminata con successo',
        data: {
          venue: {
            id: venue._id,
            name: venue.name,
            images: venue.images
          }
        }
      });

    } catch (error) {
      console.error('Delete venue image by URL error:', error);
      res.status(500).json({
        success: false,
        message: 'Errore durante l\'eliminazione dell\'immagine',
        error: error.message
      });
    }
  }

  /**
   * @desc    Update venue booking settings
   * @route   PATCH /api/venues/:id/booking-settings
   * @access  Private (Venue Owner/Admin)
   */
  async updateBookingSettings(req, res) {
    try {
      console.log('🔍 DEBUG: Updating booking settings for venue:', req.params.id);
      console.log('🔍 DEBUG: New settings:', req.body);
      
      const { enabled, requiresApproval, advanceBookingDays, minimumPartySize, maximumPartySize, timeSlotDuration, cancellationPolicy } = req.body;
      
      // Trova il venue (tenant-aware)
      const venue = await TenantQuery.findById(Venue, req.tenantId, req.params.id);
      
      if (!venue) {
        return res.status(404).json({
          success: false,
          error: 'Venue not found'
        });
      }
      
      // Verifica che l'utente sia owner del venue o admin
      if (req.user.role !== 'admin' && venue.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update this venue'
        });
      }
      
      // Aggiorna solo i campi forniti
      const updateFields = {};
      if (enabled !== undefined) {
        updateFields['bookingSettings.enabled'] = enabled;
        console.log(`🔄 ${enabled ? 'Enabling' : 'Disabling'} bookings for venue: ${venue.name}`);
      }
      if (requiresApproval !== undefined) updateFields['bookingSettings.requiresApproval'] = requiresApproval;
      if (advanceBookingDays !== undefined) updateFields['bookingSettings.advanceBookingDays'] = advanceBookingDays;
      if (minimumPartySize !== undefined) updateFields['bookingSettings.minimumPartySize'] = minimumPartySize;
      if (maximumPartySize !== undefined) updateFields['bookingSettings.maximumPartySize'] = maximumPartySize;
      if (timeSlotDuration !== undefined) updateFields['bookingSettings.timeSlotDuration'] = timeSlotDuration;
      if (cancellationPolicy !== undefined) updateFields['bookingSettings.cancellationPolicy'] = cancellationPolicy;
      
      // Aggiorna il venue
      const updatedVenue = await Venue.findByIdAndUpdate(
        req.params.id,
        { $set: updateFields },
        { new: true, runValidators: true }
      );
      
      console.log('✅ Booking settings updated successfully');
      console.log('📊 New booking enabled status:', updatedVenue.bookingSettings.enabled);
      
      // IMPORTANTE: Le prenotazioni esistenti NON vengono toccate
      // Il toggle influenza solo la possibilità di fare NUOVE prenotazioni
      
      res.json({
        success: true,
        data: {
          venue: updatedVenue,
          bookingSettings: updatedVenue.bookingSettings
        },
        message: enabled !== undefined 
          ? `Bookings ${enabled ? 'enabled' : 'disabled'} successfully. Existing bookings remain unchanged.`
          : 'Booking settings updated successfully'
      });
      
    } catch (error) {
      console.error('❌ Error updating booking settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update booking settings',
        details: error.message
      });
    }
  }

  // 🏟️ GET VENUES WITH ACTIVE ANNOUNCEMENTS
  async getVenuesWithAnnouncements(req, res) {
    try {
      console.log('🏟️ Getting venues with active announcements');
      
      // Trova tutti gli annunci attivi e raggruppa per venue
      const activeAnnouncements = await MatchAnnouncement.find({
        status: 'published',
        isActive: true
      }).distinct('venueId');
      
      if (activeAnnouncements.length === 0) {
        return res.json({
          success: true,
          data: [],
          message: 'Nessun venue con annunci attivi trovato'
        });
      }
      
      // Ottieni i venue con annunci attivi
      const venues = await Venue.find({
        _id: { $in: activeAnnouncements },
        isActive: true,
        status: { $in: ['approved', 'active'] }
      })
      .select('name location.address.city location.address.street images slug rating totalReviews amenities features capacity')
      .lean();
      
      // Arricchisci ogni venue con info sugli annunci
      const venuesWithInfo = await Promise.all(
        venues.map(async (venue) => {
          const announcements = await MatchAnnouncement.find({
            venueId: venue._id,
            status: 'published',
            isActive: true
          })
          .select('match eventDetails createdAt')
          .limit(3) // Max 3 annunci più recenti
          .sort({ createdAt: -1 });
          
          // Process venue with fixed image URLs
          const processedVenue = processVenueWithImages(venue, req);
          
          return {
            ...processedVenue,
            _id: venue._id,
            id: venue._id, // Compatibility
            announcementsCount: announcements.length,
            latestAnnouncements: announcements.map(ann => ({
              matchId: ann.match.id,
              homeTeam: ann.match.homeTeam,
              awayTeam: ann.match.awayTeam,
              date: ann.eventDetails.startDate,
              time: ann.eventDetails.startTime
            }))
          };
        })
      );
      
      console.log(`✅ Found ${venuesWithInfo.length} venues with active announcements`);
      
      res.json({
        success: true,
        data: venuesWithInfo,
        meta: {
          total: venuesWithInfo.length,
          totalAnnouncements: activeAnnouncements.length
        }
      });
      
    } catch (error) {
      console.error('❌ Error getting venues with announcements:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nel caricamento dei locali con annunci',
        error: error.message
      });
    }
  }
}

module.exports = new VenueController(); 