const MatchAnnouncement = require('../models/MatchAnnouncement');
const PopularMatch = require('../models/PopularMatch');
const Venue = require('../models/Venue');
const TenantQuery = require('../utils/tenantQuery');
const { processVenueWithImages } = require('../utils/imageUtils');
const { geocodeVenuesBatch, validateItalianCoordinates } = require('../utils/geocodingUtils');
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
      console.log('🔍 DEBUG: Facilities in req.body:', req.body.facilities);
      console.log('🔍 DEBUG: Features in req.body:', req.body.features);
      
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
        facilities, // ✅ AGGIUNTO: facilities dal payload
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

      // Enforce single-venue policy when multiVenue è disabilitato
      if (!req.tenant.settings.features.multiVenue) {
        // Cerca per tenant, indipendentemente dall'owner: evita duplicati quando cambia l'utente
        const existingVenue = await Venue.findOne({ tenantId: req.tenant._id });
        if (existingVenue) {
          console.log('♻️ Existing venue found for tenant/owner. Updating instead of creating:', existingVenue._id.toString());
          // Non sovrascrivere campi critici
          const updatable = {
            name,
            description,
            contact,
            location,
            hours,
            capacity,
            facilities: facilities || existingVenue.facilities || { screens: 1, services: [] },
            sportsOfferings: sportsOfferings || existingVenue.sportsOfferings,
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
            }
          };
          Object.assign(existingVenue, updatable);
          // Merge immagini se presenti
          if (Array.isArray(images) && images.length > 0) {
            existingVenue.images = images;
          }
          await existingVenue.save();
          return res.status(200).json({ success: true, data: existingVenue, message: 'Venue updated instead of created' });
        }
      }

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
        // ❌ Evita i legacy features che causano errori di enum (usiamo facilities.services)
        features: [],
        facilities: facilities || { screens: 1, services: [] },
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

      // If location provided but coordinates missing, attempt server-side geocoding
      try {
        const geocodingUtils = require('../utils/geocodingUtils');
        const loc = venueData.location;
        const hasCoords = loc && loc.coordinates && (loc.coordinates.latitude || loc.coordinates.longitude);
        if (loc && !hasCoords && loc.address && (loc.address.street || loc.address.city)) {
          console.log('🌍 Geocoding address for new venue:', loc.address.street, loc.address.city);
          const geocoded = await geocodingUtils.geocodeAddress(loc.address.street, loc.address.city).catch(e => null);
          if (geocoded && geocoded.coordinates) {
            venueData.location.coordinates = {
              latitude: geocoded.coordinates.latitude,
              longitude: geocoded.coordinates.longitude
            };
            console.log('✅ Geocoding success, coordinates set on venueData');
          } else {
            console.log('⚠️ Geocoding not available or failed for this address');
          }
        }
      } catch (err) {
        console.warn('⚠️ Geocoding attempt failed (non-fatal):', err.message || err);
      }

      console.log('🔍 DEBUG: Creating venue with images:', venueData.images.length);
      console.log('🔍 DEBUG: Final venueData.facilities:', venueData.facilities);
      console.log('🔍 DEBUG: Final venueData.features:', venueData.features);
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
      // If location is being updated and coordinates missing, attempt server-side geocoding
      try {
        if (updates.location) {
          const geocodingUtils = require('../utils/geocodingUtils');
          const loc = updates.location;
          const hasCoords = loc && loc.coordinates && (loc.coordinates.latitude || loc.coordinates.longitude);
          if (loc && !hasCoords && loc.address && (loc.address.street || loc.address.city)) {
            console.log('🌍 Geocoding address for updated venue:', loc.address.street, loc.address.city);
            const geocoded = await geocodingUtils.geocodeAddress(loc.address.street, loc.address.city).catch(e => null);
            if (geocoded && geocoded.coordinates) {
              updates.location.coordinates = {
                latitude: geocoded.coordinates.latitude,
                longitude: geocoded.coordinates.longitude
              };
              console.log('✅ Geocoding success, coordinates added to updates');
            } else {
              console.log('⚠️ Geocoding not available or failed for this address (update)');
            }
          }
        }
      } catch (err) {
        console.warn('⚠️ Geocoding attempt failed during update (non-fatal):', err.message || err);
      }

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
        .select('name slug location contact amenities capacity rating totalReviews description images coordinates')
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

      let venue = null;
      const mongoose = require('mongoose');
      
      // 🎯 NUOVA LOGICA: Gestisce sia ObjectId che slug
      const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
      
      if (isValidObjectId) {
        console.log(`🔍 Searching by ObjectId: ${id}`);
        // RICERCA PUBBLICA - NO TENANT FILTERING per permettere accesso pubblico
        venue = await Venue.findOne({ 
          _id: id, 
          status: 'approved', 
          isActive: true 
        }).select('-owner -createdAt -updatedAt -__v').lean();
      } else {
        console.log(`🔍 Searching by slug: ${id}`);
        // Cerca per slug se non è un ObjectId
        venue = await Venue.findOne({ 
          slug: id, 
          status: 'approved', 
          isActive: true 
        }).select('-owner -createdAt -updatedAt -__v').lean();
      }

      // Se non trovato e era ObjectId, prova fallback per owner (solo per compatibilità legacy)
      if (!venue && isValidObjectId) {
        console.log(`🔍 Fallback: Searching by owner: ${id}`);
        venue = await Venue.findOne({ 
          owner: id, 
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

      // Canonicalizzazione: se esistono più venue per stesso owner/tenant, scegli quello più aggiornato/con dati completi
      // Cerca tutti i venue del TENANT (non per owner) per gestire i duplicati cross-owner
      const siblings = await Venue.find({ tenantId: venue.tenantId, isActive: true }).sort({ updatedAt: -1 }).lean();
      let canonical = venue;
      if (siblings && siblings.length > 1) {
        const byCompleteness = siblings.find(v => (v.facilities?.services?.length || 0) > 0 || (v.facilities?.screens || 0) > 1) || siblings[0];
        if (byCompleteness && byCompleteness._id.toString() !== venue._id.toString()) {
          console.log(`🔁 Canonicalized venue from ${venue._id} to ${byCompleteness._id}`);
          canonical = byCompleteness;
        }
      }

      console.log(`✅ Found venue: ${canonical.name} (${canonical._id})`);
      console.log(`🖼️ Venue images:`, venue.images);
      console.log(`📊 Images count:`, venue.images ? venue.images.length : 0);

      // Ottieni gli annunci attivi per questo venue
      const todayIso = new Date().toISOString().split('T')[0];
      // Recupera annunci per tutti i sibling IDs, così i vecchi link mostrano ancora gli annunci
      const siblingIds = (siblings && siblings.length > 0 ? siblings.map(v => v._id) : [canonical._id]);
      const announcements = await MatchAnnouncement.find({
        venueId: { $in: siblingIds },
        status: 'published',
        isActive: true,
        $or: [
          { 'match.date': { $gte: todayIso } },
          { 'eventDetails.startDate': { $gte: todayIso } }
        ]
      })
      .select('match eventDetails views clicks')
      .sort({ 'match.date': 1 })
      .limit(10)
      .lean();

      console.log(`✅ Found venue "${venue.name}" with ${announcements.length} active announcements`);

      // Process venue with fixed image URLs e aggiungi fields pubblici utili
      const processedVenue = processVenueWithImages(canonical, req);

      // 🎯 FIX: Normalizza orari in formato coerente { open, close, closed }
      const normalizeHours = (rawHours = {}) => {
        const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
        const out = {};
        for (const d of days) {
          const h = rawHours?.[d] || {};
          
          // 🔥 FIX CRITICO: Se h.closed è false MA non ha orari, usa default
          if (h.closed === false && !h.open && !h.close) {
            out[d] = {
              open: '11:00',
              close: '23:00', 
              closed: false
            };
          } else if (h.closed === true || (!h.open && !h.close && h.closed !== false)) {
            out[d] = {
              open: '',
              close: '',
              closed: true
            };
          } else {
            out[d] = {
              open: h.open || '11:00',
              close: h.close || '23:00',
              closed: false
            };
          }
        }
        return out;
      };

      // 🎯 DEBUG ORARI PRIMA DI NORMALIZZAZIONE
      console.log('🕒 HOURS RAW DEBUG:', {
        'processedVenue.hours': processedVenue.hours,
        'venue.hours': venue.hours,
        'input to normalizeHours': processedVenue.hours || venue.hours || {}
      });

      const normalizedHours = normalizeHours(processedVenue.hours || venue.hours || {});
      
      console.log('🕒 NORMALIZED HOURS:', normalizedHours);

      // 🎯 DEBUG PROFONDO: Vediamo cosa abbiamo nel venue
      console.log('🔍 VENUE RAW DATA:');
      console.log('- facilities:', canonical.facilities);
      console.log('- features:', canonical.features);
      console.log('- capacity:', canonical.capacity);
      
      // 🎯 SERVIZI: Mappa da facilities.services a formato frontend (usa CANONICAL!)
      const publicServices = Array.isArray(canonical.facilities?.services)
        ? canonical.facilities.services.filter(s => s && (s.enabled !== false)).map(s => {
            const rawId = (s.id || s.name || '').toLowerCase();
            const idMap = {
              'food': 'cibo',
              'projector': 'grandi-schermi',
              'outdoor-screen': 'grandi-schermi',
              'garden': 'giardino'
            };
            const id = idMap[rawId] || rawId;
            const labelMap = {
              'wifi': 'Wi‑Fi',
              'cibo': 'Cibo',
              'grandi-schermi': 'Grandi Schermi',
              'prenotabile': 'Prenotabile',
              'pet-friendly': 'Pet Friendly',
              'giardino': 'Giardino',
              'parcheggio': 'Parcheggio',
              'aria-condizionata': 'Aria Condizionata'
            };
            return { id, name: labelMap[id] || id, enabled: true };
          })
        : [];
      
      // 🎯 SCHERMI: Prendi SOLO da facilities.screens (niente fallback sulla capacità)
      const publicScreens = canonical.facilities?.screens || 1;
      
      console.log('🎯 MAPPED DATA:');
      console.log('- publicServices:', publicServices);
      console.log('- publicScreens:', publicScreens);
      
      // 🎯 CRITICAL FIX: processedVenue SOVRASCRIVE i nostri dati!
      // Dobbiamo costruire publicData in modo che le nostre modifiche abbiano PRIORITÀ
      const publicData = {
        // Base venue data (SENZA nostri campi critici)
        ...processedVenue,
        
        // 🎯 OVERRIDE PRIORITARI (applicati DOPO processedVenue)
        
        // Descrizione completa
        description: canonical.description || '',
        
        // Location COMPLETA con città prominente  
        location: {
          ...processedVenue.location,
          city: canonical.location?.address?.city || '',
          fullAddress: `${canonical.location?.address?.street || ''}, ${canonical.location?.address?.city || ''}`.trim().replace(/^,\s*/, '')
        },
        
        // Contatti COMPLETI
        contact: {
          ...processedVenue.contact,
          website: canonical.contact?.website || '',
          phone: canonical.contact?.phone || ''
        },
        
        // 🔥 ORARI: Forza il nostro normalizedHours 
        hours: normalizedHours,
        
        // 🔥 SERVIZI: Forza i nostri services mappati 
        services: publicServices,
        
        // 🔥 SCHERMI: Forza i nostri screens mappati
        screens: publicScreens,
        
        // Features legacy per compatibilità
        features: publicServices.map(s => s.id || s),
        
        // 🎯 FACILITIES: Mantieni per debug ma con i nostri dati
        facilities: {
          screens: publicScreens,
          services: publicServices
        },
        
        // Annunci futuri
        announcements
      };

      console.log('🚀 SENDING TO FRONTEND:');
      console.log('- publicData.services:', publicData.services);
      console.log('- publicData.screens:', publicData.screens);
      console.log('- publicData.hours keys:', Object.keys(publicData.hours || {}));

      res.json({
        success: true,
        venue: publicData,
        data: publicData
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

  /**
   * @desc    Get all announcements for a specific public venue
   * @route   GET /api/venues/:id/announcements
   * @access  Public
   */
  async getPublicVenueAnnouncements(req, res) {
    try {
      const { id } = req.params;
      const { limit = 10, page = 1 } = req.query;

      // Estendi la ricerca agli eventuali duplicati del tenant
      const baseVenue = await Venue.findById(id).lean();
      const siblings = baseVenue
        ? await Venue.find({ tenantId: baseVenue.tenantId, isActive: true }).lean()
        : [];
      const siblingIds = baseVenue
        ? (siblings && siblings.length > 0 ? siblings.map(v => v._id) : [baseVenue._id])
        : [id];

      const announcements = await MatchAnnouncement.find({
        venueId: { $in: siblingIds },
        status: 'published',
        isActive: true,
        'match.date': { $gte: new Date().toISOString().split('T')[0] }
      })
      .sort({ 'match.date': 1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit)
      .lean();

      const total = await MatchAnnouncement.countDocuments({
        venueId: { $in: siblingIds },
        status: 'published',
        isActive: true,
        'match.date': { $gte: new Date().toISOString().split('T')[0] }
      });

      res.json({
        success: true,
        data: announcements,
        pagination: {
          total,
          limit: parseInt(limit),
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting public venue announcements:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  /**
   * @desc    Migrate canonical venue for current tenant: relink announcements and deactivate legacy duplicates
   * @route   POST /api/venues/admin/migrate-canonical
   * @access  Private (Admin or Venue Owner)
   */
  async migrateCanonicalForTenant(req, res) {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({ success: false, message: 'Tenant non trovato' });
      }

      const venues = await Venue.find({ tenantId, isActive: true }).sort({ updatedAt: -1 });
      if (!venues || venues.length === 0) {
        return res.json({ success: true, message: 'Nessun venue da migrare', migrated: false });
      }

      // Scegli canonico per completezza
      const canonical = venues.find(v => (v.facilities?.services?.length || 0) > 0 || (v.facilities?.screens || 0) > 1) || venues[0];

      // Assicura slug
      if (!canonical.slug) {
        canonical.generateSlug();
        await canonical.save();
      }

      const legacy = venues.filter(v => v._id.toString() !== canonical._id.toString());
      let relinked = 0;
      for (const v of legacy) {
        const result = await MatchAnnouncement.updateMany({ venueId: v._id }, { $set: { venueId: canonical._id } });
        relinked += result.modifiedCount || 0;
        v.isActive = false;
        await v.save();
      }

      return res.json({
        success: true,
        migrated: true,
        tenantId,
        canonicalId: canonical._id,
        legacyDeactivated: legacy.map(v => v._id),
        announcementsRelinked: relinked
      });
    } catch (error) {
      console.error('❌ Migration error:', error);
      res.status(500).json({ success: false, message: 'Errore migrazione', error: error.message });
    }
  }

  /**
   * Geocoding automatico per venue senza coordinate
   * POST /api/venues/admin/geocode-batch
   */
  async geocodeBatchVenues(req, res) {
    try {
      const tenantId = req.tenantId;
      
      // Trova venue del tenant senza coordinate valide
      const venuesWithoutCoords = await Venue.find({
        tenantId,
        isActive: true,
        $or: [
          { 'coordinates.latitude': { $exists: false } },
          { 'coordinates.longitude': { $exists: false } },
          { 'coordinates.latitude': null },
          { 'coordinates.longitude': null },
          { 'coordinates.latitude': 0 },
          { 'coordinates.longitude': 0 }
        ],
        // Deve avere almeno un indirizzo per tentare geocoding
        'location.address.street': { $exists: true, $ne: '' }
      }).select('_id name location.address');
      
      if (venuesWithoutCoords.length === 0) {
        return res.json({
          success: true,
          message: 'Tutti i venue hanno già coordinate valide',
          processed: 0,
          skipped: 0
        });
      }
      
      console.log(`🌍 Avvio geocoding per ${venuesWithoutCoords.length} venue senza coordinate`);
      
      // Prepara dati per geocoding
      const addressesToGeocode = venuesWithoutCoords.map(venue => ({
        _id: venue._id,
        address: venue.location?.address?.street || '',
        city: venue.location?.address?.city || ''
      }));
      
      // Esegui geocoding batch
      const geocodingResults = await geocodeVenuesBatch(addressesToGeocode);
      
      let updated = 0;
      let failed = 0;
      const errors = [];
      
      // Applica risultati al database
      for (const result of geocodingResults) {
        try {
          if (result.success) {
            const { latitude, longitude } = result.data.coordinates;
            
            // Valida coordinate per Italia
            if (validateItalianCoordinates(latitude, longitude)) {
              await Venue.findByIdAndUpdate(result.venueId, {
                $set: {
                  'coordinates.latitude': latitude,
                  'coordinates.longitude': longitude,
                  'location.geoData': {
                    formattedAddress: result.data.formattedAddress,
                    accuracy: result.data.accuracy,
                    geocodedAt: new Date()
                  }
                }
              });
              
              updated++;
              console.log(`✅ Aggiornato venue ${result.venueId} con coordinate (${latitude}, ${longitude})`);
            } else {
              failed++;
              errors.push(`Coordinate non valide per Italia: ${result.originalAddress}`);
              console.log(`❌ Coordinate invalide per ${result.venueId}: (${latitude}, ${longitude})`);
            }
          } else {
            failed++;
            errors.push(`${result.originalAddress}: ${result.error}`);
            console.log(`❌ Geocoding fallito per ${result.venueId}: ${result.error}`);
          }
        } catch (updateError) {
          failed++;
          errors.push(`Errore aggiornamento venue ${result.venueId}: ${updateError.message}`);
          console.error(`❌ Errore aggiornamento venue ${result.venueId}:`, updateError);
        }
      }
      
      console.log(`🏁 Geocoding completato: ${updated} aggiornati, ${failed} falliti`);
      
      res.json({
        success: true,
        message: `Geocoding completato: ${updated} venue aggiornati, ${failed} falliti`,
        processed: updated,
        failed: failed,
        errors: errors.length > 0 ? errors : undefined
      });
      
    } catch (error) {
      console.error('❌ Errore geocoding batch:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Errore durante geocoding batch', 
        error: error.message 
      });
    }
  }
}

module.exports = new VenueController(); 