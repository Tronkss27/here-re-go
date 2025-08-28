const MatchAnnouncement = require('../models/MatchAnnouncement');
const PopularMatch = require('../models/PopularMatch');
const Venue = require('../models/Venue');
const TenantQuery = require('../utils/tenantQuery');
const { processVenueWithImages } = require('../utils/imageUtils');
const sportsApiService = require('../services/sportsApiService');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// 🎯 Helper function per ottenere loghi leghe fallback
function getLeagueLogoUrl(leagueName) {
  const leagueLogos = {
    'Serie A': 'https://cdn.sportmonks.com/images/soccer/leagues/0/384.png',
    'Premier League': 'https://cdn.sportmonks.com/images/soccer/leagues/1/609.png', 
    'Champions League': 'https://cdn.sportmonks.com/images/soccer/leagues/1/2.png',
    'UEFA Champions League': 'https://cdn.sportmonks.com/images/soccer/leagues/1/2.png',
    'Europa League': 'https://cdn.sportmonks.com/images/soccer/leagues/1/3.png',
    'UEFA Europa League': 'https://cdn.sportmonks.com/images/soccer/leagues/1/3.png',
    'La Liga': 'https://cdn.sportmonks.com/images/soccer/leagues/20/564.png',
    'LaLiga': 'https://cdn.sportmonks.com/images/soccer/leagues/20/564.png',
    'Bundesliga': 'https://cdn.sportmonks.com/images/soccer/leagues/20/78.png'
  };
  return leagueLogos[leagueName] || null;
}

// 🎯 FUNZIONE STANDALONE PER POPULAR MATCH
async function updateOrCreatePopularMatchStandalone(match, venueId, announcementId) {
  try {
    console.log(`🎯 Updating PopularMatch for matchId: ${match.id}`);
    
    // Cerca se esiste già un PopularMatch per questo matchId
    let popularMatch = await PopularMatch.findOne({ matchId: match.id });
    
    if (popularMatch) {
      // Aggiorna PopularMatch esistente
      console.log(`🔄 Updating existing PopularMatch: ${popularMatch._id}`);
      await popularMatch.addVenue(venueId, announcementId);
      console.log(`✅ PopularMatch updated: ${popularMatch.venueCount} venues, score: ${popularMatch.popularityScore}`);
    } else {
      // Crea nuovo PopularMatch
      console.log(`🆕 Creating new PopularMatch for: ${match.homeTeam} vs ${match.awayTeam}`);
      
      popularMatch = new PopularMatch({
        matchId: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        competition: match.competition,
        date: match.date,
        time: match.time,
        venues: [{
          venueId,
          announcementId,
          addedAt: new Date()
        }],
        venueCount: 1,
        firstAnnouncedAt: new Date()
      });
      
      await popularMatch.save();
      await popularMatch.updatePopularity();
      
      console.log(`✅ PopularMatch created: ${popularMatch._id} with matchId: ${match.id}`);
    }
    
    return popularMatch;
  } catch (error) {
    console.error('❌ Error updating PopularMatch:', error);
    // Non bloccare la creazione dell'annuncio per errori di PopularMatch
    return null;
  }
}

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

      // Verifica che il locale esista nel tenant context
      const venue = await TenantQuery.findById(Venue, req.tenantId, venueId);
      if (!venue) {
        console.log(`❌ Venue not found: venueId=${venueId}, tenantId=${req.tenantId}`);
        return res.status(404).json({
          success: false,
          message: 'Locale non trovato. Completa prima l\'onboarding del tuo locale.'
        });
      }
      
      console.log(`✅ Venue found: ${venue.name} (ID: ${venue._id})`);;

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
        
        // 🎯 AGGIORNA/CREA POPULAR MATCH
        try {
          await updateOrCreatePopularMatchStandalone(matchToUse, venueId, announcement._id);
        } catch (popularMatchError) {
          console.error('❌ Error with PopularMatch (non-blocking):', popularMatchError);
          // Non bloccare la creazione dell'annuncio per errori di PopularMatch
        }
        
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



  // 🎯 ENDPOINT PER OTTENERE HOT MATCHES (HOMEPAGE)
  async getHotMatches(req, res) {
    try {
      const { limit = 10 } = req.query;
      
      console.log(`🔥 Getting hot matches, limit: ${limit}`);
      console.log(`🚨 DEBUG: About to call PopularMatch.getHotMatches(${limit})`);
      
      const hotMatches = await PopularMatch.getHotMatches(parseInt(limit));
      console.log(`🚨 DEBUG: PopularMatch.getHotMatches returned:`, hotMatches.length, 'matches');
      console.log(`🚨 DEBUG: Matches data:`, JSON.stringify(hotMatches, null, 2));
      
      // Popola i dati dei venues per ogni partita
      const enrichedMatches = await Promise.all(
        hotMatches.map(async (match) => {
          const venues = await Promise.all(
            match.venues.map(async (v) => {
              console.log(`🔍 DEBUG: Looking for venue ID: ${v.venueId}`);
              const venue = await Venue.findById(v.venueId)
                .select('name location.address.city location.address.street images slug')
                .lean();
              console.log(`🔍 DEBUG: Venue found:`, venue);
              
              const result = {
                ...venue,
                _id: v.venueId,
                announcementId: v.announcementId,
                addedAt: v.addedAt
              };
              console.log(`🔍 DEBUG: Final venue result:`, result);
              return result;
            })
          );
          
          return {
            matchId: match.matchId,
            homeTeam: match.homeTeam,
            homeTeamLogo: match.homeTeamLogo,
            awayTeam: match.awayTeam,
            awayTeamLogo: match.awayTeamLogo,
            league: match.league,
            leagueLogo: match.leagueLogo || getLeagueLogoUrl(match.league),
            competition: match.competition,
            date: match.date,
            time: match.time,
            venueCount: match.venueCount,
            popularityScore: match.popularityScore,
            isHot: match.isHot,
            venues: venues.filter(v => v !== null) // Rimuovi venues cancellati
          };
        })
      );
      
      console.log(`✅ Found ${enrichedMatches.length} hot matches`);
      
      res.json({
        success: true,
        data: enrichedMatches,
        meta: {
          total: enrichedMatches.length,
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('❌ Error getting hot matches:', error);
      res.status(500).json({
        success: false,
        message: 'Errore durante il recupero delle partite popolari',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // 🎯 ENDPOINT PER OTTENERE VENUES DI UNA PARTITA SPECIFICA
  async getVenuesForMatch(req, res) {
    try {
      const { matchId } = req.params;
      
      console.log(`🏟️ Getting venues for match: ${matchId}`);
      
      const popularMatch = await PopularMatch.findOne({ matchId }).lean();
      
      if (!popularMatch) {
        return res.status(404).json({
          success: false,
          message: 'Partita non trovata'
        });
      }
      
      // Ottieni i dettagli dei venues
      const venues = await Promise.all(
        popularMatch.venues.map(async (v) => {
          const venue = await Venue.findById(v.venueId)
            .select('name location contact images amenities slug status')
            .lean();
            
          if (!venue) return null;
          
          // Ottieni anche i dettagli dell'annuncio
          const announcement = await MatchAnnouncement.findById(v.announcementId)
            .select('eventDetails views clicks status')
            .lean();
          
          // Process venue with fixed image URLs
          const processedVenue = processVenueWithImages(venue, req);
          
          return {
            ...processedVenue,
            _id: v.venueId,
            announcement: announcement || {},
            addedAt: v.addedAt
          };
        })
      );
      
      const validVenues = venues.filter(v => v !== null);
      
      console.log(`✅ Found ${validVenues.length} venues for match ${matchId}`);
      
      res.json({
        success: true,
        data: {
          match: {
            matchId: popularMatch.matchId,
            homeTeam: popularMatch.homeTeam,
            awayTeam: popularMatch.awayTeam,
            competition: popularMatch.competition,
            date: popularMatch.date,
            time: popularMatch.time,
            venueCount: validVenues.length,
            popularityScore: popularMatch.popularityScore
          },
          venues: validVenues
        },
        meta: {
          total: validVenues.length
        }
      });
    } catch (error) {
      console.error('❌ Error getting venues for match:', error);
      res.status(500).json({
        success: false,
        message: 'Errore durante il recupero dei locali per la partita',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Track click su match per analytics (PUBLIC - NO AUTH)
  async trackMatchClick(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dati di input non validi',
          errors: errors.array()
        });
      }

      const { matchId, venueId, timestamp } = req.body;
      
      console.log(`📊 Tracking click for match: ${matchId}, venue: ${venueId || 'N/A'}`);

      // Incrementa il clickCount nella PopularMatch
      const updateResult = await PopularMatch.updateOne(
        { matchId },
        { 
          $inc: { clickCount: 1 },
          $set: { lastActivity: new Date() }
        }
      );

      if (updateResult.matchedCount === 0) {
        console.log(`⚠️ PopularMatch not found for matchId: ${matchId}`);
        return res.status(404).json({
          success: false,
          message: 'Partita non trovata'
        });
      }

      console.log(`✅ Click tracked for match ${matchId}`);

      res.json({
        success: true,
        message: 'Click tracciato con successo'
      });

    } catch (error) {
      console.error('❌ Error tracking match click:', error);
      res.status(500).json({
        success: false,
        message: 'Errore durante il tracking del click',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new MatchAnnouncementController(); 
