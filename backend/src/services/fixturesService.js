const axios = require('axios')
const Fixture = require('../models/Fixture')

class FixturesService {
  constructor() {
    this.apiConfig = {
      baseURL: 'https://api-football-v1.p.rapidapi.com/v3',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || 'your-api-key',
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
      }
    }
    
    // Cache per le chiamate API (TTL: 15 minuti)
    this.cache = new Map()
    this.cacheTTL = 15 * 60 * 1000 // 15 minuti
    
    // Popular leagues configuration
    this.popularLeagues = {
      39: 'Premier League',
      140: 'La Liga',
      135: 'Serie A',
      78: 'Bundesliga',
      61: 'Ligue 1',
      2: 'UEFA Champions League',
      3: 'UEFA Europa League'
    }
    
    // TV channels mapping
    this.tvChannels = {
      'Premier League': ['Sky Sport', 'DAZN'],
      'Serie A': ['DAZN', 'Sky Sport'],
      'Champions League': ['Sky Sport', 'Mediaset Infinity'],
      'Europa League': ['Sky Sport', 'DAZN'],
      'La Liga': ['DAZN'],
      'Bundesliga': ['Sky Sport'],
      'Ligue 1': ['DAZN']
    }
  }

  // METODI PRINCIPALI

  /**
   * Ottiene fixtures con sistema ibrido (DB + API)
   */
  async getFixtures(options = {}) {
    const {
      limit = 20,
      source = 'hybrid', // 'local', 'api', 'hybrid'
      league = null,
      team = null,
      date = null,
      status = 'scheduled'
    } = options

    try {
      let fixtures = []

      if (source === 'local' || source === 'hybrid') {
        fixtures = await this.getLocalFixtures(options)
      }

      // Se non abbiamo abbastanza fixtures locali, usa l'API
      if ((source === 'api' || source === 'hybrid') && fixtures.length < limit) {
        const apiFixtures = await this.getApiFixtures({
          ...options,
          limit: limit - fixtures.length
        })
        fixtures = [...fixtures, ...apiFixtures]
      }

      // Aggiunge informazioni sui canali TV
      fixtures = fixtures.map(fixture => this.enrichWithTvChannels(fixture))

      return {
        success: true,
        data: fixtures.slice(0, limit),
        source: source,
        count: fixtures.length
      }

    } catch (error) {
      console.error('Error fetching fixtures:', error)
      
      // Fallback automatico al database locale
      if (source === 'hybrid' || source === 'api') {
        try {
          const localFixtures = await this.getLocalFixtures(options)
          return {
            success: true,
            data: localFixtures,
            source: 'local_fallback',
            count: localFixtures.length,
            warning: 'API unavailable, using local data'
          }
        } catch (localError) {
          throw new Error('Both API and local data unavailable')
        }
      }
      
      throw error
    }
  }

  /**
   * Ottiene fixtures dal database locale
   */
  async getLocalFixtures(options = {}) {
    const { limit = 20, league, team, date, status } = options
    
    let query = { isActive: true }
    
    // Filtri
    if (status) query.status = status
    if (league) query['league.id'] = league
    if (team) {
      query.$or = [
        { 'homeTeam.id': team },
        { 'awayTeam.id': team }
      ]
    }
    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
      query.date = { $gte: startDate, $lt: endDate }
    }

    return await Fixture.find(query)
      .sort({ date: 1 })
      .limit(limit)
      .lean()
  }

  /**
   * Ottiene fixtures dall'API Football
   */
  async getApiFixtures(options = {}) {
    const { limit = 20, league, team, date, status } = options
    
    // Controlla cache
    const cacheKey = `api_fixtures_${JSON.stringify(options)}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      let endpoint = '/fixtures'
      const params = {
        timezone: 'Europe/Rome'
      }

      // Parametri per l'API
      if (league) params.league = league
      if (team) params.team = team
      if (date) params.date = date
      if (status) params.status = status
      if (limit) params.limit = limit

      const response = await axios.get(endpoint, {
        baseURL: this.apiConfig.baseURL,
        headers: this.apiConfig.headers,
        params
      })

      if (!response.data.response) {
        throw new Error('Invalid API response')
      }

      const fixtures = response.data.response.map(this.transformApiFixture)
      
      // Salva in cache
      this.setInCache(cacheKey, fixtures)
      
      return fixtures

    } catch (error) {
      console.error('API Football error:', error.message)
      throw error
    }
  }

  /**
   * Sincronizza fixtures popolari nel database
   */
  async syncPopularFixtures() {
    console.log('🔄 Sincronizzazione fixtures popolari...')
    
    const results = {
      total: 0,
      created: 0,
      updated: 0,
      errors: []
    }

    try {
      // Per ogni lega popolare
      for (const [leagueId, leagueName] of Object.entries(this.popularLeagues)) {
        try {
          const fixtures = await this.getApiFixtures({
            league: leagueId,
            limit: 20
          })

          for (const fixture of fixtures) {
            try {
              const existingFixture = await Fixture.findOne({ 
                fixtureId: fixture.fixtureId 
              })

              if (existingFixture) {
                // Aggiorna fixture esistente
                await Fixture.updateOne(
                  { fixtureId: fixture.fixtureId },
                  { $set: fixture }
                )
                results.updated++
              } else {
                // Crea nuovo fixture
                await Fixture.create(fixture)
                results.created++
              }
              
              results.total++
            } catch (error) {
              results.errors.push(`Fixture ${fixture.fixtureId}: ${error.message}`)
            }
          }

          // Delay per evitare rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000))

        } catch (error) {
          results.errors.push(`League ${leagueName}: ${error.message}`)
        }
      }

      console.log('✅ Sincronizzazione completata:', results)
      return results

    } catch (error) {
      console.error('❌ Errore sincronizzazione:', error)
      throw error
    }
  }

  /**
   * Ricerca avanzata fixtures
   */
  async searchFixtures(query) {
    const {
      text = '',
      leagues = [],
      teams = [],
      dateFrom = null,
      dateTo = null,
      status = null,
      tvChannel = null,
      limit = 50
    } = query

    try {
      let mongoQuery = { isActive: true }

      // Ricerca testuale su squadre e leghe
      if (text) {
        mongoQuery.$or = [
          { 'homeTeam.name': { $regex: text, $options: 'i' } },
          { 'awayTeam.name': { $regex: text, $options: 'i' } },
          { 'league.name': { $regex: text, $options: 'i' } }
        ]
      }

      // Filtri per leghe
      if (leagues.length > 0) {
        mongoQuery['league.id'] = { $in: leagues }
      }

      // Filtri per squadre
      if (teams.length > 0) {
        mongoQuery.$or = [
          { 'homeTeam.id': { $in: teams } },
          { 'awayTeam.id': { $in: teams } }
        ]
      }

      // Range di date
      if (dateFrom || dateTo) {
        mongoQuery.date = {}
        if (dateFrom) mongoQuery.date.$gte = new Date(dateFrom)
        if (dateTo) mongoQuery.date.$lte = new Date(dateTo)
      }

      // Status
      if (status) {
        mongoQuery.status = status
      }

      let fixtures = await Fixture.find(mongoQuery)
        .sort({ date: 1 })
        .limit(limit)
        .lean()

      // Filtro per canale TV
      if (tvChannel) {
        fixtures = fixtures.filter(fixture => {
          const channels = this.getTvChannels(fixture.league.name)
          return channels.includes(tvChannel)
        })
      }

      // Arricchisce con info canali TV
      fixtures = fixtures.map(fixture => this.enrichWithTvChannels(fixture))

      return {
        success: true,
        data: fixtures,
        count: fixtures.length,
        query: query
      }

    } catch (error) {
      console.error('Search error:', error)
      throw error
    }
  }

  // METODI HELPER

  /**
   * Trasforma fixture dall'API nel formato del database
   */
  transformApiFixture = (apiFixture) => {
    return {
      fixtureId: apiFixture.fixture.id.toString(),
      homeTeam: {
        id: apiFixture.teams.home.id.toString(),
        name: apiFixture.teams.home.name,
        logo: apiFixture.teams.home.logo
      },
      awayTeam: {
        id: apiFixture.teams.away.id.toString(),
        name: apiFixture.teams.away.name,
        logo: apiFixture.teams.away.logo
      },
      league: {
        id: apiFixture.league.id.toString(),
        name: apiFixture.league.name,
        country: apiFixture.league.country,
        logo: apiFixture.league.logo,
        season: apiFixture.league.season.toString()
      },
      date: new Date(apiFixture.fixture.date),
      status: this.mapApiStatus(apiFixture.fixture.status.short),
      score: {
        home: apiFixture.goals.home,
        away: apiFixture.goals.away
      },
      popularity: this.calculatePopularity(apiFixture),
      totalBookings: 0,
      isActive: true
    }
  }

  /**
   * Mappa status dell'API al nostro formato
   */
  mapApiStatus(apiStatus) {
    const statusMap = {
      'TBD': 'scheduled',
      'NS': 'scheduled',
      '1H': 'live',
      'HT': 'live',
      '2H': 'live',
      'ET': 'live',
      'P': 'live',
      'FT': 'finished',
      'AET': 'finished',
      'PEN': 'finished',
      'PST': 'postponed',
      'CANC': 'cancelled',
      'ABD': 'cancelled'
    }
    return statusMap[apiStatus] || 'scheduled'
  }

  /**
   * Calcola popolarità basata su lega e squadre
   */
  calculatePopularity(apiFixture) {
    let popularity = 5 // Base

    // Bonus per leghe popolari
    const leagueId = apiFixture.league.id.toString()
    if (this.popularLeagues[leagueId]) {
      popularity += 3
    }

    // Bonus per squadre famose (esempio semplificato)
    const famousTeams = ['Real Madrid', 'Barcelona', 'Juventus', 'AC Milan', 'Inter', 'Manchester United', 'Liverpool']
    if (famousTeams.includes(apiFixture.teams.home.name) || 
        famousTeams.includes(apiFixture.teams.away.name)) {
      popularity += 2
    }

    return Math.min(popularity, 10)
  }

  /**
   * Arricchisce fixture con informazioni canali TV
   */
  enrichWithTvChannels(fixture) {
    return {
      ...fixture,
      tvChannels: this.getTvChannels(fixture.league.name)
    }
  }

  /**
   * Ottiene canali TV per una lega
   */
  getTvChannels(leagueName) {
    for (const [league, channels] of Object.entries(this.tvChannels)) {
      if (leagueName.includes(league)) {
        return channels
      }
    }
    return ['Da verificare']
  }

  // CACHE MANAGEMENT

  setInCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  getFromCache(key) {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }

  clearCache() {
    this.cache.clear()
  }
}

module.exports = new FixturesService() 