const fixturesService = require('../services/fixturesService')
const sportsApiService = require('../services/sportsApiService')
const standardFixturesService = require('../services/standardFixturesService')
const roundBasedSyncService = require('../services/roundBasedSyncService')
const Fixture = require('../models/Fixture')
const PopularMatch = require('../models/PopularMatch')
const MatchAnnouncement = require('../models/MatchAnnouncement')
const TenantQuery = require('../utils/tenantQuery')

class FixtureController {
  
  /**
   * GET /fixtures
   * Ottiene lista fixtures con sistema ibrido
   */
  async getFixtures(req, res) {
    try {
      const {
        limit = 20,
        source = 'hybrid',
        league,
        team,
        date,
        status = 'scheduled'
      } = req.query

      const options = {
        limit: parseInt(limit),
        source,
        league,
        team,
        date,
        status
      }

      const result = await fixturesService.getFixtures(options)
      
      res.json({
        success: true,
        ...result,
        message: `Retrieved ${result.count} fixtures from ${result.source}`
      })

    } catch (error) {
      console.error('Get fixtures error:', error)
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Errore durante il recupero delle fixtures'
      })
    }
  }

  /**
   * GET /fixtures/search
   * Ricerca avanzata fixtures
   */
  async searchFixtures(req, res) {
    try {
      const {
        text,
        leagues,
        teams,
        dateFrom,
        dateTo,
        status,
        tvChannel,
        limit = 50
      } = req.query

      const searchQuery = {
        text: text || '',
        leagues: leagues ? leagues.split(',') : [],
        teams: teams ? teams.split(',') : [],
        dateFrom,
        dateTo,
        status,
        tvChannel,
        limit: parseInt(limit)
      }

      const result = await fixturesService.searchFixtures(searchQuery)
      
      res.json({
        success: true,
        ...result,
        message: `Found ${result.count} fixtures matching criteria`
      })

    } catch (error) {
      console.error('Search fixtures error:', error)
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Errore durante la ricerca delle fixtures'
      })
    }
  }

  /**
   * GET /fixtures/upcoming
   * Ottiene fixtures in arrivo (prossimi 7 giorni)
   */
  async getUpcomingFixtures(req, res) {
    try {
      const { limit = 20, source = 'hybrid' } = req.query
      
      const today = new Date()
      const nextWeek = new Date()
      nextWeek.setDate(today.getDate() + 7)

      const options = {
        limit: parseInt(limit),
        source,
        status: 'scheduled',
        dateFrom: today.toISOString().split('T')[0],
        dateTo: nextWeek.toISOString().split('T')[0]
      }

      const result = await fixturesService.getFixtures(options)
      
      res.json({
        success: true,
        ...result,
        message: `Retrieved ${result.count} upcoming fixtures`
      })

    } catch (error) {
      console.error('Get upcoming fixtures error:', error)
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Errore durante il recupero delle fixtures in arrivo'
      })
    }
  }

  /**
   * GET /fixtures/live
   * Ottiene fixtures live
   */
  async getLiveFixtures(req, res) {
    try {
      const { limit = 10, source = 'hybrid' } = req.query

      const options = {
        limit: parseInt(limit),
        source,
        status: 'live'
      }

      const result = await fixturesService.getFixtures(options)
      
      res.json({
        success: true,
        ...result,
        message: `Retrieved ${result.count} live fixtures`
      })

    } catch (error) {
      console.error('Get live fixtures error:', error)
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Errore durante il recupero delle fixtures live'
      })
    }
  }

  /**
   * GET /fixtures/popular
   * Ottiene fixtures più popolari
   */
  async getPopularFixtures(req, res) {
    try {
      const { limit = 15 } = req.query

      // ✅ FIX: Usa TenantQuery per consistenza, ma con fallback per fixtures globali
      let fixtures;
      try {
        // Prima prova con tenant context se disponibile
        if (req.tenantId) {
          fixtures = await TenantQuery.find(Fixture, req.tenantId, {
        isActive: true,
        date: { $gte: new Date() },
        status: 'scheduled'
      })
      .sort({ popularity: -1, totalBookings: -1, date: 1 })
      .limit(parseInt(limit))
          .lean();
        }
        
        // Se non ci sono fixtures tenant-specific o non c'è tenant, usa query globale
        if (!fixtures || fixtures.length === 0) {
          fixtures = await Fixture.find({
            isActive: true,
            date: { $gte: new Date() },
            status: 'scheduled'
          })
          .sort({ popularity: -1, totalBookings: -1, date: 1 })
          .limit(parseInt(limit))
          .lean();
        }
      } catch (error) {
        console.log('⚠️ TenantQuery failed, falling back to direct query:', error.message);
        fixtures = await Fixture.find({
          isActive: true,
          date: { $gte: new Date() },
          status: 'scheduled'
        })
        .sort({ popularity: -1, totalBookings: -1, date: 1 })
        .limit(parseInt(limit))
        .lean();
      }

      // Arricchisce con canali TV
      const enrichedFixtures = fixtures.map(fixture => 
        fixturesService.enrichWithTvChannels(fixture)
      )

      res.json({
        success: true,
        data: enrichedFixtures,
        count: enrichedFixtures.length,
        source: 'local',
        message: `Retrieved ${enrichedFixtures.length} popular fixtures`
      })

    } catch (error) {
      console.error('Get popular fixtures error:', error)
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Errore durante il recupero delle fixtures popolari'
      })
    }
  }

  /**
   * GET /fixtures/leagues
   * Ottiene lista delle leghe disponibili
   */
  async getAvailableLeagues(req, res) {
    try {
      const leagues = await Fixture.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$league.id',
            name: { $first: '$league.name' },
            country: { $first: '$league.country' },
            logo: { $first: '$league.logo' },
            fixtureCount: { $sum: 1 }
          }
        },
        { $sort: { fixtureCount: -1 } }
      ])

      res.json({
        success: true,
        data: leagues,
        count: leagues.length,
        message: `Retrieved ${leagues.length} available leagues`
      })

    } catch (error) {
      console.error('Get leagues error:', error)
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Errore durante il recupero delle leghe'
      })
    }
  }

  /**
   * GET /fixtures/teams
   * Ottiene lista delle squadre disponibili
   */
  async getAvailableTeams(req, res) {
    try {
      const { league, search } = req.query
      
      let matchStage = { isActive: true }
      if (league) {
        matchStage['league.id'] = league
      }

      const pipeline = [
        { $match: matchStage }
      ]

      // Ottiene squadre home
      const homeTeams = await Fixture.aggregate([
        ...pipeline,
        {
          $group: {
            _id: '$homeTeam.id',
            name: { $first: '$homeTeam.name' },
            logo: { $first: '$homeTeam.logo' },
            fixtureCount: { $sum: 1 }
          }
        }
      ])

      // Ottiene squadre away
      const awayTeams = await Fixture.aggregate([
        ...pipeline,
        {
          $group: {
            _id: '$awayTeam.id',
            name: { $first: '$awayTeam.name' },
            logo: { $first: '$awayTeam.logo' },
            fixtureCount: { $sum: 1 }
          }
        }
      ])

      // Combina e deduplica
      const teamsMap = new Map()
      
      const allTeams = homeTeams.concat(awayTeams)
      allTeams.forEach(team => {
        const existing = teamsMap.get(team._id)
        if (existing) {
          existing.fixtureCount += team.fixtureCount
        } else {
          teamsMap.set(team._id, team)
        }
      })

      let teams = Array.from(teamsMap.values())

      // Filtro per ricerca
      if (search) {
        teams = teams.filter(team => 
          team.name.toLowerCase().includes(search.toLowerCase())
        )
      }

      // Ordina per numero di fixtures
      teams.sort((a, b) => b.fixtureCount - a.fixtureCount)

      res.json({
        success: true,
        data: teams,
        count: teams.length,
        filters: { league, search },
        message: `Retrieved ${teams.length} available teams`
      })

    } catch (error) {
      console.error('Get teams error:', error)
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Errore durante il recupero delle squadre'
      })
    }
  }

  /**
   * POST /fixtures/sync
   * Sincronizza fixtures popolari da Sportmonks API e crea PopularMatch
   */
  async syncFixtures(req, res) {
    try {
      // Solo admin e venue_owner possono sincronizzare
      if (req.user.role !== 'admin' && req.user.role !== 'venue_owner') {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'Solo gli admin e proprietari di locali possono sincronizzare le fixtures'
        })
      }

      console.log('🔄 Avvio sincronizzazione fixtures da Sportmonks API...')
      
      const { dateRange = 30, league } = req.body; // Default: prossimi 30 giorni, lega opzionale
      
      if (league) {
        console.log(`🎯 Sincronizzazione specifica per lega: ${league}`);
      } else {
        console.log('🌍 Sincronizzazione per tutte le leghe');
      }
      
      // ✅ FIX: Gestisci dateRange come numero (legacy) o oggetto (da jobQueue)
      let startDate, endDate, dayCount;
      
      if (typeof dateRange === 'object' && dateRange.startDate && dateRange.endDate) {
        // Nuovo formato da jobQueue con date specifiche
        startDate = new Date(dateRange.startDate);
        endDate = new Date(dateRange.endDate);
        dayCount = dateRange.days || Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        console.log(`📅 Using specific date range from jobQueue: ${startDate.toISOString().split('T')[0]} → ${endDate.toISOString().split('T')[0]} (${dayCount} days)`);
      } else {
        // Formato legacy: numero di giorni da oggi
        dayCount = typeof dateRange === 'number' ? dateRange : 30;
        startDate = new Date();
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + dayCount);
        console.log(`📅 Using legacy date range: oggi + ${dayCount} giorni (${startDate.toISOString().split('T')[0]} → ${endDate.toISOString().split('T')[0]})`);
      }
      const results = {
        total: 0,
        created: 0,
        updated: 0,
        popularMatches: 0,
        errors: []
      }

      let allStandardFixtures = [];

      if (league) {
        // 🎯 NUOVO APPROCCIO: Usa season filter per lega specifica
        console.log(`🎯 Using season filter approach for league: ${league}`);
        
        const dateRangeObj = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        };
        
        try {
          console.log(`📅 Sincronizzando fixtures per stagione ${league} (${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]})`);
          
          // ✅ USA NUOVO METODO SEASON-BASED CON DATE CORRETTE
          allStandardFixtures = await standardFixturesService.getStandardFixturesBySeason(league, dateRangeObj);
          
          if (!Array.isArray(allStandardFixtures) || allStandardFixtures.length === 0) {
            console.log(`⚠️ No standard fixtures returned for season ${league}, ending sync...`);
          } else {
            console.log(`✅ Retrieved ${allStandardFixtures.length} fixtures for ${league} season`);
          }
        } catch (error) {
          console.error(`❌ Error getting season fixtures for ${league}:`, error.message);
          return res.status(500).json({
            success: false,
            error: error.message,
            message: `Errore durante la sincronizzazione della stagione ${league}`
          });
        }
      } else {
        // 📅 APPROCCIO LEGACY: Itera giorno per giorno (quando non è specificata una lega)
        console.log('📅 Using legacy date-by-date approach for all leagues');
        
        const today = new Date()
        const mockDates = ['2025-09-14', '2025-09-15', '2025-09-21'] // Date presenti nei mock
        
        for (let i = 0; i < dateRange; i++) {
          const currentDate = new Date(today)
          currentDate.setDate(today.getDate() + i)
          let dateString = currentDate.toISOString().split('T')[0]
          
          // Per test con mock, usa anche date future specifiche
          if (process.env.USE_MOCK_API === 'true' && i < mockDates.length) {
            dateString = mockDates[i]
            console.log(`📅 Using mock date for testing: ${dateString}`)
          }
          
          try {
            console.log(`📅 Sincronizzando fixtures per: ${dateString}`)
            
            // ✅ USA STANDARDFIXTURES SERVICE CON ADAPTER (legacy)
            const standardFixtures = await standardFixturesService.getStandardFixturesByDate(dateString)
            
            if (!Array.isArray(standardFixtures) || standardFixtures.length === 0) {
              console.log(`⚠️ No standard fixtures returned for ${dateString}, skipping...`)
              continue
            }
            
            // Aggiungi fixtures di questo giorno al totale
            allStandardFixtures.push(...standardFixtures);
            
          } catch (error) {
            console.error(`❌ Error getting fixtures for ${dateString}:`, error.message)
            results.errors.push(`Errore per ${dateString}: ${error.message}`)
          }
        }
      }

      // Processa tutte le fixtures ottenute (sia da season che da date)
      if (allStandardFixtures.length > 0) {
        console.log(`🔄 Processing ${allStandardFixtures.length} total fixtures...`);
        
        for (const standardFixture of allStandardFixtures) {
          try {
            // Per l'approccio season-based, non è necessario filtrare per lega (già fatto dall'API)
            // Per l'approccio legacy, manteniamo il filtro se necessario
            if (league && !league.includes('all') && !standardFixturesService._matchesLeague(standardFixture, league)) {
              console.log(`⏭️ Skipping fixture from different league: ${standardFixture.league.name}`);
              continue;
            }
            
            // Crea/aggiorna PopularMatch usando DTO standardizzato
            let popularMatch = await PopularMatch.findOne({ matchId: standardFixture.externalId })
            
            if (popularMatch) {
              // ♻️ CACHE HIT: Riutilizza match esistente e aggiorna con DTO standardizzato
              console.log(`♻️ Reusing existing PopularMatch: ${standardFixture.externalId} (${popularMatch.homeTeam} vs ${popularMatch.awayTeam})`);
              
              // Aggiorna usando StandardFixture DTO
              const homeParticipant = standardFixture.participants.find(p => p.role === 'home')
              const awayParticipant = standardFixture.participants.find(p => p.role === 'away')
              
              popularMatch.homeTeam = homeParticipant?.name || 'TBD'
              popularMatch.homeTeamLogo = homeParticipant?.image_path || null
              popularMatch.awayTeam = awayParticipant?.name || 'TBD'
              popularMatch.awayTeamLogo = awayParticipant?.image_path || null
              popularMatch.date = standardFixture.date
              popularMatch.time = standardFixture.time
              popularMatch.league = standardFixture.league.name
              popularMatch.leagueLogo = standardFixture.league.logo
              await popularMatch.save()
              results.updated++
            } else {
              // 🆕 CACHE MISS: Crea nuovo PopularMatch da StandardFixture DTO
              console.log(`🆕 Creating new PopularMatch from StandardFixture: ${standardFixture.externalId}`);
              
              // Usa il metodo helper per convertire DTO a PopularMatch format
              const popularMatchData = standardFixturesService.convertToPopularMatchFormat(standardFixture)
              
              popularMatch = new PopularMatch(popularMatchData)
              
              await popularMatch.save()
              await popularMatch.updatePopularity() // Calcola popolarità iniziale
              results.created++
              results.popularMatches++
            }
            
            results.total++
            
          } catch (fixtureError) {
            console.error(`❌ Error processing StandardFixture ${standardFixture.fixtureId}:`, fixtureError.message)
            results.errors.push(`StandardFixture ${standardFixture.fixtureId}: ${fixtureError.message}`)
          }
        }
      } else {
        console.log('⚠️ No fixtures found to process')
      }
      
      console.log('✅ Sincronizzazione completata:', results)
      
      // Calcola statistiche cache per lega specifica
      const cacheHitRate = results.total > 0 ? ((results.updated / results.total) * 100).toFixed(1) : 0;
      
      res.json({
        success: true,
        ...results,
        message: league 
          ? `Sincronizzazione ${league} completata: ${results.total} fixtures, ${results.created} nuove, ${results.updated} cache hits (${cacheHitRate}%)`
          : `Sincronizzazione completata: ${results.created} create, ${results.updated} aggiornate, ${results.popularMatches} PopularMatch processati`,
        cacheStats: {
          hitRate: `${cacheHitRate}%`,
          reusedMatches: results.updated,
          newMatches: results.created,
          league: league || 'all'
        }
      })

    } catch (error) {
      console.error('❌ Sync fixtures error:', error)
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Errore durante la sincronizzazione delle fixtures'
      })
    }
  }

  /**
   * GET /fixtures/:id
   * Ottiene dettagli di una fixture specifica
   */
  async getFixtureById(req, res) {
    try {
      const { id } = req.params
      
      const fixture = await Fixture.findOne({
        $or: [
          { _id: id },
          { fixtureId: id }
        ],
        isActive: true
      }).lean()

      if (!fixture) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Fixture non trovata'
        })
      }

      // Arricchisce con canali TV
      const enrichedFixture = fixturesService.enrichWithTvChannels(fixture)

      res.json({
        success: true,
        data: enrichedFixture,
        message: 'Fixture retrieved successfully'
      })

    } catch (error) {
      console.error('Get fixture by ID error:', error)
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Errore durante il recupero della fixture'
      })
    }
  }

  /**
   * PUT /fixtures/:id/popularity
   * Aggiorna popolarità di una fixture (basato su bookings)
   */
  async updateFixturePopularity(req, res) {
    try {
      const { id } = req.params
      const { increment = 1 } = req.body

      const fixture = await Fixture.findOneAndUpdate(
        { fixtureId: id },
        { 
          $inc: { 
            totalBookings: increment,
            popularity: increment > 0 ? 0.1 : -0.1 
          }
        },
        { new: true }
      )

      if (!fixture) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Fixture non trovata'
        })
      }

      res.json({
        success: true,
        data: fixture,
        message: 'Popularity updated successfully'
      })

    } catch (error) {
      console.error('Update popularity error:', error)
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Errore durante l\'aggiornamento della popolarità'
      })
    }
  }

  /**
   * DELETE /fixtures/cache
   * Svuota la cache delle fixtures
   */
  async clearCache(req, res) {
    try {
      // Solo admin possono svuotare la cache
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'Solo gli admin possono svuotare la cache'
        })
      }

      fixturesService.clearCache()
      
      res.json({
        success: true,
        message: 'Cache svuotata con successo'
      })

    } catch (error) {
      console.error('Clear cache error:', error)
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Errore durante lo svuotamento della cache'
      })
    }
  }

  /**
   * 🎯 NUOVO SYNC FIXTURES V2 - Round-Based Filtering
   * 
   * Usa RoundBasedSyncService per sincronizzazione avanzata:
   * - Supporta "prossime giornate" (rounds) e "giorni" (date-based)
   * - Risolve problemi Ligue 1, Serie B, etc.  
   * - Usa `/fixtures/date/{date}` invece di season filtering
   * - Garantisce completezza delle partite
   */
  async syncFixturesV2(req, res) {
    try {
      // Solo admin e venue_owner possono sincronizzare
      if (req.user.role !== 'admin' && req.user.role !== 'venue_owner') {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'Solo gli admin e proprietari di locali possono sincronizzare le fixtures'
        })
      }

      console.log('🎯 Avvio sincronizzazione V2 con RoundBasedSyncService...')
      
      const { dateRange, league, syncInfo } = req.body;
      
      if (!league) {
        return res.status(400).json({
          success: false,
          error: 'League required',
          message: 'È necessario specificare una lega per la sincronizzazione V2'
        })
      }
      
      console.log(`🎯 Sincronizzazione V2 per lega: ${league}`);
      console.log(`📊 Sync info:`, syncInfo);
      
      // Determina il tipo di sincronizzazione
      let syncOptions = {
        type: 'days', // default
        count: 7
      };
      
      if (syncInfo && syncInfo.type === 'rounds') {
        syncOptions = {
          type: 'rounds',
          count: syncInfo.roundCount || 3
        };
        console.log(`⚽ Round-based sync: ${syncOptions.count} giornate`);
      } else if (typeof dateRange === 'object' && dateRange.startDate && dateRange.endDate) {
        syncOptions = {
          type: 'days',
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate)
        };
        console.log(`📅 Date-based sync: ${syncOptions.startDate.toISOString().split('T')[0]} → ${syncOptions.endDate.toISOString().split('T')[0]}`);
      } else {
        const dayCount = typeof dateRange === 'number' ? dateRange : 7;
        syncOptions = {
          type: 'days',
          count: dayCount
        };
        console.log(`📅 Date-based sync: ${dayCount} giorni da oggi`);
      }
      
      // Esegui sincronizzazione con RoundBasedSyncService
      const syncResult = await roundBasedSyncService.syncFixtures(league, syncOptions);
      
      if (!syncResult.success) {
        return res.status(500).json({
          success: false,
          error: syncResult.error,
          message: `Errore durante la sincronizzazione V2 per ${league}`
        });
      }
      
      // 💾 VERO SALVATAGGIO NEL DATABASE
      console.log(`💾 Salvando ${syncResult.totalFixtures} fixtures nel database...`);
      
      const dbResults = {
        total: 0,
        created: 0,
        updated: 0,
        popularMatches: 0,
        errors: []
      };
      
      // 🎯 Ottieni e salva le StandardFixtures reali
      if (syncResult.metadata && syncResult.metadata.syncResults) {
        for (const dateResult of syncResult.metadata.syncResults) {
          if (dateResult.success && dateResult.fixtures > 0) {
            try {
              // Ri-ottieni le StandardFixtures per questa data 
              const dateString = dateResult.date;
              console.log(`💾 Saving fixtures for date: ${dateString}`);
              
              const standardFixtures = await standardFixturesService.getStandardFixturesByDate(dateString);
              const leagueFixtures = standardFixtures.filter(fixture => 
                standardFixturesService._matchesLeague(fixture, league)
              );
              
              console.log(`💾 Found ${leagueFixtures.length} fixtures for ${league} on ${dateString}`);
              
              // Salva ogni fixture nel database come PopularMatch
              for (const standardFixture of leagueFixtures) {
                try {
                  const existingMatch = await PopularMatch.findOne({ matchId: standardFixture.externalId });
                  
                  if (existingMatch) {
                    // Aggiorna match esistente
                    console.log(`♻️ Updating existing PopularMatch: ${standardFixture.externalId}`);
                    
                    existingMatch.homeTeam = standardFixture.participants.find(p => p.role === 'home')?.name || 'TBD';
                    existingMatch.awayTeam = standardFixture.participants.find(p => p.role === 'away')?.name || 'TBD';
                    existingMatch.homeTeamLogo = standardFixture.participants.find(p => p.role === 'home')?.image_path || null;
                    existingMatch.awayTeamLogo = standardFixture.participants.find(p => p.role === 'away')?.image_path || null;
                    existingMatch.league = standardFixture.league.name;
                    existingMatch.leagueLogo = standardFixture.league.image_path || null;
                    existingMatch.date = new Date(standardFixture.startingAt);
                    existingMatch.lastUpdated = new Date();
                    
                    await existingMatch.save();
                    dbResults.updated++;
                  } else {
                    // Crea nuovo match
                    console.log(`🆕 Creating new PopularMatch: ${standardFixture.externalId}`);
                    
                    // ✅ USA campi già validati dal provider adapter
                    const newMatch = new PopularMatch({
                      matchId: standardFixture.externalId,
                      homeTeam: standardFixture.participants.find(p => p.role === 'home')?.name || 'TBD',
                      awayTeam: standardFixture.participants.find(p => p.role === 'away')?.name || 'TBD',
                      homeTeamLogo: standardFixture.participants.find(p => p.role === 'home')?.image_path || null,
                      awayTeamLogo: standardFixture.participants.find(p => p.role === 'away')?.image_path || null,
                      league: standardFixture.league.name,
                      leagueLogo: standardFixture.league.logo || null,
                      date: standardFixture.date,        // ✅ SICURO: già validato YYYY-MM-DD
                      time: standardFixture.time,        // ✅ SICURO: già validato HH:MM
                      source: 'sync-api',
                      lastUpdated: new Date()
                    });
                    
                    await newMatch.save();
                    await newMatch.updatePopularity(); // Calcola popolarità iniziale
                    dbResults.created++;
                  }
                  
                  dbResults.total++;
                  dbResults.popularMatches++;
                  
                } catch (fixtureError) {
                  console.error(`❌ Error saving fixture ${standardFixture.externalId}:`, fixtureError.message);
                  dbResults.errors.push(`Fixture ${standardFixture.externalId}: ${fixtureError.message}`);
                }
              }
              
            } catch (dateError) {
              console.error(`❌ Error processing date ${dateResult.date}:`, dateError.message);
              dbResults.errors.push(`Date ${dateResult.date}: ${dateError.message}`);
            }
          }
        }
      }
      
      console.log(`✅ Sincronizzazione V2 completata: ${dbResults.total} fixtures processati`);
      
      const cacheStats = {
        totalFixtures: syncResult.totalFixtures, // ✅ FIX: Campo mancante per jobQueue
        hitRate: syncResult.cacheHits > 0 ? ((syncResult.cacheHits / syncResult.totalFixtures) * 100).toFixed(1) : 0,
        reusedMatches: syncResult.cacheHits,
        newMatches: syncResult.newMatches,
        league: league
      };
      
      res.json({
        success: true,
        message: `Sincronizzazione ${syncOptions.type === 'rounds' ? 'per giornate' : 'per giorni'} completata per ${league}`,
        data: {
          ...dbResults,
          cacheStats,
          syncInfo: {
            approach: syncOptions.type,
            count: syncOptions.count,
            datesProcessed: syncResult.datesProcessed,
            metadata: syncResult.metadata
          }
        }
      });

    } catch (error) {
      console.error('Sync V2 error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Errore durante la sincronizzazione V2'
      });
    }
  }
}

module.exports = new FixtureController();
