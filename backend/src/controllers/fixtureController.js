const fixturesService = require('../services/fixturesService')
const Fixture = require('../models/Fixture')

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

      const fixtures = await Fixture.find({
        isActive: true,
        date: { $gte: new Date() },
        status: 'scheduled'
      })
      .sort({ popularity: -1, totalBookings: -1, date: 1 })
      .limit(parseInt(limit))
      .lean()

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
   * Sincronizza fixtures popolari dal servizio API
   */
  async syncFixtures(req, res) {
    try {
      // Solo admin possono sincronizzare
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'Solo gli admin possono sincronizzare le fixtures'
        })
      }

      const result = await fixturesService.syncPopularFixtures()
      
      res.json({
        success: true,
        ...result,
        message: `Sincronizzazione completata: ${result.created} create, ${result.updated} aggiornate`
      })

    } catch (error) {
      console.error('Sync fixtures error:', error)
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
}

module.exports = new FixtureController() 