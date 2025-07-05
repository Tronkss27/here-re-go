const MatchAnnouncement = require('../models/MatchAnnouncement');
const Venue = require('../models/Venue');
const sportsApiService = require('../services/sportsApiService');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

class MatchAnnouncementController {
  
  // 🔍 RICERCA PARTITE TRAMITE API ESTERNE
  async searchMatches(req, res) {
    try {
      const { query = '', league, fromDate, toDate, limit = 20 } = req.query;
      
      console.log(`🔍 Searching matches: "${query}" in league: ${league}`);
      
      const options = {
        league,
        fromDate,
        toDate,
        limit: parseInt(limit)
      };

      const result = await sportsApiService.searchMatches(query, options);
      
      // Log per analytics
      if (result.success && result.data.length > 0) {
        console.log(`✅ Found ${result.data.length} matches from ${result.source}`);
      }

      res.json({
        success: true,
        message: `Trovate ${result.data.length} partite`,
        data: result.data,
        meta: {
          source: result.source,
          rateLimitRemaining: result.rateLimitRemaining,
          disclaimer: result.disclaimer
        }
      });
    } catch (error) {
      console.error('❌ Error searching matches:', error);
      res.status(500).json({
        success: false,
        message: 'Errore durante la ricerca delle partite',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // 🏟️ CREA NUOVO ANNUNCIO PARTITA
  async createAnnouncement(req, res) {
    try {
      // Validazione input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dati di input non validi',
          errors: errors.array()
        });
      }

      const venueId = req.venue._id;
      const { match, eventDetails } = req.body;

      console.log(`🏟️ Creating announcement for venue ${venueId}:`, {
        match: `${match.homeTeam} vs ${match.awayTeam}`,
        date: eventDetails.startDate,
        offers: eventDetails.selectedOffers?.length || 0
      });

      // Verifica che il locale esista - se non esiste, crea uno di default per testing
      let venue = await Venue.findById(venueId);
      if (!venue) {
        console.log('🏗️ Creating demo venue for testing...');
        venue = new Venue({
          _id: venueId,
          name: 'Demo Sports Bar',
          owner: req.user._id,
          contact: {
            email: req.user.email,
            phone: '+39 123 456 7890'
          },
          location: {
            address: {
              street: 'Via Demo 123',
              city: 'Roma',
              postalCode: '00100',
              country: 'Italy'
            },
            coordinates: {
              lat: 41.9028,
              lng: 12.4964
            }
          },
          capacity: {
            total: 100,
            standing: 60,
            seating: 40
          },
          amenities: ['tv_screens', 'food', 'drinks'],
          status: 'approved'
        });
        await venue.save();
        console.log('✅ Demo venue created');
      }

      // 🎯 STEP 1: CONTROLLO DUPLICATO PER LO STESSO VENUE
      const existingVenueAnnouncement = await MatchAnnouncement.findOne({
        venueId,
        'match.id': match.id,
        'eventDetails.startDate': eventDetails.startDate,
        status: { $ne: 'archived' }
      });

      if (existingVenueAnnouncement) {
        return res.status(409).json({
          success: false,
          message: 'Esiste già un annuncio per questa partita in questa data',
          existingId: existingVenueAnnouncement._id
        });
      }

      // 🎯 STEP 2: CONTROLLO GLOBALE PER RIUSO MATCHID
      // Verifica se esiste già un annuncio per la stessa partita (stesso homeTeam, awayTeam, date)
      const existingGlobalMatch = await MatchAnnouncement.findOne({
        'match.homeTeam': match.homeTeam,
        'match.awayTeam': match.awayTeam,
        'eventDetails.startDate': eventDetails.startDate,
        status: 'published',
        isActive: true
      });

      let matchToUse = match;
      
      if (existingGlobalMatch) {
        // Riutilizza lo stesso matchId se la partita esiste già
        matchToUse = {
          ...match,
          id: existingGlobalMatch.match.id
        };
        console.log(`🔄 Reusing existing matchId: ${existingGlobalMatch.match.id} for ${match.homeTeam} vs ${match.awayTeam}`);
      } else {
        // Genera un nuovo matchId univoco se è la prima volta che viene pubblicata
        matchToUse = {
          ...match,
          id: match.id || `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        console.log(`🆕 Creating new matchId: ${matchToUse.id} for ${match.homeTeam} vs ${match.awayTeam}`);
      }

      // Crea nuovo annuncio
      const eventDetailsToSave = {
        ...eventDetails
      };
      
      // Validazione e pulizia delle offerte selezionate
      if (eventDetails.selectedOffers && Array.isArray(eventDetails.selectedOffers)) {
        // Filtra solo le offerte valide con tutti i campi richiesti
        const validOffers = eventDetails.selectedOffers.filter(offer => 
          offer && 
          typeof offer === 'object' &&
          offer.id && 
          offer.title && 
          offer.description
        );
        
        if (validOffers.length > 0) {
          eventDetailsToSave.selectedOffers = validOffers;
          console.log(`✅ Validated ${validOffers.length} offers out of ${eventDetails.selectedOffers.length}`);
        } else {
          delete eventDetailsToSave.selectedOffers;
          console.log('⚠️ No valid offers found, removing selectedOffers field');
        }
      } else {
        delete eventDetailsToSave.selectedOffers;
        console.log('⚠️ No selectedOffers provided or invalid format');
      }
      
      const announcement = new MatchAnnouncement({
        venueId,
        match: {
          ...matchToUse,
          source: matchToUse.source || 'manual'
        },
        eventDetails: eventDetailsToSave,
        status: 'published',
        isActive: true
      });

      console.log('💾 About to save announcement:', {
        venueId: announcement.venueId,
        venueIdType: typeof announcement.venueId,
        matchId: announcement.match.id,
        status: announcement.status,
        isReusedMatchId: !!existingGlobalMatch
      });

      try {
        await announcement.save();
        console.log(`✅ Announcement saved successfully with ID: ${announcement._id}`);
      } catch (saveError) {
        console.error('💥 Error saving announcement:', saveError);
        throw saveError;
      }

      console.log(`✅ Announcement created with ID: ${announcement._id}`);

      // Restituisci direttamente l'annuncio senza populate per evitare errori
      res.status(201).json({
        success: true,
        message: 'Annuncio creato con successo!',
        data: {
          _id: announcement._id,
          venueId: announcement.venueId,
          match: announcement.match,
          eventDetails: announcement.eventDetails,
          status: announcement.status,
          isActive: announcement.isActive,
          createdAt: announcement.createdAt,
          updatedAt: announcement.updatedAt
        },
        meta: {
          venueId: venueId,
          matchId: matchToUse.id,
          offersCount: eventDetails.selectedOffers?.length || 0,
          isReusedMatchId: !!existingGlobalMatch
        }
      });

    } catch (error) {
      console.error('❌ Error creating announcement:', error);
      res.status(500).json({
        success: false,
        message: 'Errore durante la creazione dell\'annuncio',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // 📋 OTTIENI ANNUNCI DEL VENUE
  async getVenueAnnouncements(req, res) {
    try {
      const venueId = req.venue._id;
      const { 
        status = 'published', 
        fromDate, 
        competition, 
        limit = 20, 
        page = 1,
        includeArchived = 'false'
      } = req.query;

      console.log(`📋 Getting announcements for venue ${venueId}`);

      const query = { venueId };
      
      // Filtri status
      if (includeArchived === 'true') {
        // Se includeArchived è true, non filtrare per status
      } else {
        query.status = status;
        query.isActive = true;
      }

      // Filtro data
      if (fromDate) {
        query['match.date'] = { $gte: fromDate };
      }
      
      // Filtro competizione
      if (competition) {
        query['match.competition.id'] = competition;
      }
      
      console.log('🔍 Query:', JSON.stringify(query));
      
      // Usa find normale invece di paginate per debug
      const announcements = await MatchAnnouncement.find(query)
        .populate('venueId', 'name slug')
        .sort({ 'match.date': -1, 'createdAt': -1 })
        .limit(parseInt(limit, 10))
        .lean();

      console.log(`✅ Found ${announcements.length} announcements`);

      res.json({
        success: true,
        data: announcements,
        pagination: {
          totalDocs: announcements.length,
          limit: parseInt(limit, 10),
          totalPages: 1,
          page: parseInt(page, 10),
          hasNextPage: false,
          hasPrevPage: false
        }
      });
    } catch (error) {
      console.error('❌ Error getting venue announcements:', error);
      res.status(500).json({
        success: false,
        message: 'Errore durante il recupero degli annunci',
        error: process.env.NODE_ENV === 'development' ? { message: error.message, stack: error.stack } : {}
      });
    }
  }

  // 🌍 RICERCA PUBBLICA ANNUNCI (TUTTI I LOCALI)
  async searchPublicAnnouncements(req, res) {
    try {
      const { 
        query = '', 
        date, 
        competition, 
        city,
        limit = 50, 
        page = 1 
      } = req.query;

      console.log(`🌍 Public search: "${query}" in ${city || 'all cities'}`);

      const searchQuery = {
        status: 'published',
        isActive: true
      };

      // Filtro testo
      if (query) {
        searchQuery.searchTags = { $in: [new RegExp(query, 'i')] };
      }

      // Filtro data
      if (date) {
        searchQuery['match.date'] = date;
      }

      // Filtro competizione
      if (competition) {
        searchQuery['match.competition.id'] = competition;
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { 'match.date': 1, views: -1 },
        populate: {
          path: 'venueId',
          select: 'name location contact slug',
          ...(city && {
            match: { 'location.city': new RegExp(city, 'i') }
          })
        }
      };

      const results = await MatchAnnouncement.paginate(searchQuery, options);

      // Filtra per città se specificata (dopo populate)
      let filteredDocs = results.docs;
      if (city) {
        filteredDocs = results.docs.filter(doc => 
          doc.venueId?.location?.city?.toLowerCase().includes(city.toLowerCase())
        );
      }

      res.json({
        success: true,
        message: `Trovati ${filteredDocs.length} eventi`,
        data: filteredDocs,
        pagination: {
          page: results.page,
          pages: results.totalPages,
          total: filteredDocs.length,
          limit: results.limit
        }
      });

    } catch (error) {
      console.error('❌ Error in public search:', error);
      res.status(500).json({
        success: false,
        message: 'Errore durante la ricerca pubblica'
      });
    }
  }

  // 📖 OTTIENI SINGOLO ANNUNCIO
  async getAnnouncement(req, res) {
    try {
      const { id } = req.params;
      const { incrementView = false } = req.query;

      const announcement = await MatchAnnouncement.findById(id)
        .populate('venueId', 'name location contact slug website');

      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Annuncio non trovato'
        });
      }

      // Incrementa views se richiesto (da ricerca pubblica)
      if (incrementView === 'true') {
        await announcement.incrementViews();
        console.log(`👁️ View incremented for announcement ${id}`);
      }

      res.json({
        success: true,
        data: announcement
      });

    } catch (error) {
      console.error('❌ Error getting announcement:', error);
      res.status(500).json({
        success: false,
        message: 'Errore durante il recupero dell\'annuncio'
      });
    }
  }

  // ✏️ AGGIORNA ANNUNCIO
  async updateAnnouncement(req, res) {
    try {
      const { id } = req.params;
      const venueId = req.venue._id;
      const updates = req.body;

      console.log(`✏️ Updating announcement ${id} for venue ${venueId}`);

      // Verifica ownership
      const announcement = await MatchAnnouncement.findOne({
        _id: id,
        venueId: venueId
      });

      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Annuncio non trovato o non autorizzato'
        });
      }

      // Aggiorna campi consentiti
      const allowedUpdates = ['eventDetails', 'status', 'isActive'];
      const updateData = {};
      
      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      });

      Object.assign(announcement, updateData);
      await announcement.save();

      await announcement.populate('venueId', 'name location contact slug');

      res.json({
        success: true,
        message: 'Annuncio aggiornato con successo',
        data: announcement
      });

    } catch (error) {
      console.error('❌ Error updating announcement:', error);
      res.status(500).json({
        success: false,
        message: 'Errore durante l\'aggiornamento dell\'annuncio'
      });
    }
  }

  // 📦 ARCHIVIA ANNUNCIO (SOFT DELETE)
  async archiveAnnouncement(req, res) {
    try {
      const { id } = req.params;
      const venueId = req.venue._id;

      console.log(`📦 Archiving announcement ${id} for venue ${venueId}`);

      const announcement = await MatchAnnouncement.findOne({
        _id: id,
        venueId: venueId
      });

      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Annuncio non trovato o non autorizzato'
        });
      }

      // Soft delete (archivia)
      announcement.status = 'archived';
      announcement.isActive = false;
      await announcement.save();

      res.json({
        success: true,
        message: 'Annuncio archiviato con successo'
      });

    } catch (error) {
      console.error('❌ Error archiving announcement:', error);
      res.status(500).json({
        success: false,
        message: 'Errore durante l\'archiviazione dell\'annuncio'
      });
    }
  }

  // 🗑️ ELIMINA ANNUNCIO DEFINITIVAMENTE (HARD DELETE)
  async deleteAnnouncement(req, res) {
    try {
      const { id } = req.params;
      const venueId = req.venue._id;

      console.log(`🗑️ PERMANENTLY deleting announcement ${id} for venue ${venueId}`);

      const announcement = await MatchAnnouncement.findOne({
        _id: id,
        venueId: venueId
      });

      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Annuncio non trovato o non autorizzato'
        });
      }

      // Hard delete (eliminazione definitiva)
      await MatchAnnouncement.deleteOne({ _id: id });

      res.json({
        success: true,
        message: 'Annuncio eliminato definitivamente'
      });

    } catch (error) {
      console.error('❌ Error permanently deleting announcement:', error);
      res.status(500).json({
        success: false,
        message: 'Errore durante l\'eliminazione definitiva dell\'annuncio'
      });
    }
  }

  // 📊 STATISTICHE VENUE
  async getVenueStats(req, res) {
    try {
      const venueId = req.venue._id;
      const stats = await this.calculateVenueStats(venueId);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('❌ Error getting venue stats:', error);
      res.status(500).json({
        success: false,
        message: 'Errore durante il recupero delle statistiche'
      });
    }
  }

  // 📈 INCREMENTA CLICK (TRACKING)
  async trackClick(req, res) {
    try {
      const { id } = req.params;
      
      const announcement = await MatchAnnouncement.findById(id);
      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Annuncio non trovato'
        });
      }

      await announcement.incrementClicks();
      console.log(`🖱️ Click tracked for announcement ${id}`);

      res.json({
        success: true,
        message: 'Click registrato'
      });

    } catch (error) {
      console.error('❌ Error tracking click:', error);
      res.status(500).json({
        success: false,
        message: 'Errore durante il tracking del click'
      });
    }
  }

  // 🏆 OTTIENI COMPETIZIONI DISPONIBILI
  async getCompetitions(req, res) {
    try {
      const result = await sportsApiService.getLeagues();
      
      res.json({
        success: true,
        data: result.data,
        meta: {
          source: result.source,
          disclaimer: result.disclaimer
        }
      });

    } catch (error) {
      console.error('❌ Error getting competitions:', error);
      res.status(500).json({
        success: false,
        message: 'Errore durante il recupero delle competizioni'
      });
    }
  }

  // 🔧 HELPER: CALCOLA STATISTICHE VENUE
  async calculateVenueStats(venueId) {
    try {
      const stats = await MatchAnnouncement.aggregate([
        {
          $match: {
            venueId: venueId,
            status: { $ne: 'archived' }
          }
        },
        {
          $group: {
            _id: null,
            totalAnnouncements: { $sum: 1 },
            activeAnnouncements: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            },
            totalViews: { $sum: '$views' },
            totalClicks: { $sum: '$clicks' },
            avgViews: { $avg: '$views' },
            totalOffers: {
              $sum: { $size: { $ifNull: ['$eventDetails.selectedOffers', []] } }
            }
          }
        }
      ]);

      const result = stats[0] || {
        totalAnnouncements: 0,
        activeAnnouncements: 0,
        totalViews: 0,
        totalClicks: 0,
        avgViews: 0,
        totalOffers: 0
      };

      // Calcola engagement rate
      result.engagementRate = result.totalViews > 0 
        ? ((result.totalClicks / result.totalViews) * 100).toFixed(2)
        : 0;

      return result;

    } catch (error) {
      console.error('❌ Error calculating stats:', error);
      return {
        totalAnnouncements: 0,
        activeAnnouncements: 0,
        totalViews: 0,
        totalClicks: 0,
        avgViews: 0,
        totalOffers: 0,
        engagementRate: 0
      };
    }
  }

  // 🧪 TEST API CONNECTION
  async testApiConnection(req, res) {
    try {
      const result = await sportsApiService.testConnection();
      
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Errore durante il test della connessione API',
        error: error.message
      });
    }
  }

  // 🧪 TEST DATABASE CLEANUP (solo per development)
  async cleanupTestData(req, res) {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({
          success: false,
          error: 'Cleanup only available in development mode'
        });
      }

      console.log('🧹 Cleaning up test data...');

      // Rimuovi annunci di test
      const deletedAnnouncements = await MatchAnnouncement.deleteMany({
        $or: [
          { 'match.homeTeam': { $regex: /test|demo/i } },
          { 'match.awayTeam': { $regex: /test|demo/i } },
          { status: 'draft' }
        ]
      });

      console.log(`🗑️ Deleted ${deletedAnnouncements.deletedCount} test announcements`);

      res.json({
        success: true,
        message: 'Test data cleaned successfully',
        deletedAnnouncements: deletedAnnouncements.deletedCount
      });

    } catch (error) {
      console.error('❌ Error cleaning test data:', error);
      res.status(500).json({
        success: false,
        error: 'Error cleaning test data'
      });
    }
  }
}

module.exports = new MatchAnnouncementController(); 