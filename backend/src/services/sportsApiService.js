const axios = require('axios');
const NodeCache = require('node-cache');

// Cache per 30 minuti (API calls sono limitati)
const cache = new NodeCache({ stdTTL: 1800 });

class SportsApiService {
  constructor() {
    this.rapidApiKey = process.env.RAPID_API_KEY || 'fd4d9d50ebmshe430dffa8b07089p19cfbfjsn70f03bbfeaef';
    this.rapidApiHost = 'api-football-v1.p.rapidapi.com';
    this.baseUrl = 'https://api-football-v1.p.rapidapi.com/v3';
    
    // Rate limiting (100 calls per month su plan gratuito)
    this.rateLimiter = {
      calls: 0,
      resetTime: Date.now() + (24 * 60 * 60 * 1000), // Reset ogni 24h
      maxCalls: 100
    };
  }

  // Headers standard per RapidAPI
  getHeaders() {
    return {
      'X-RapidAPI-Key': this.rapidApiKey,
      'X-RapidAPI-Host': this.rapidApiHost,
      'Content-Type': 'application/json'
    };
  }

  // Controllo rate limit
  checkRateLimit() {
    if (Date.now() > this.rateLimiter.resetTime) {
      this.rateLimiter.calls = 0;
      this.rateLimiter.resetTime = Date.now() + (24 * 60 * 60 * 1000);
    }
    
    if (this.rateLimiter.calls >= this.rateLimiter.maxCalls) {
      throw new Error('Rate limit exceeded. Try again tomorrow.');
    }
    
    this.rateLimiter.calls++;
  }

  // Helper per fare chiamate API con cache e rate limiting
  async makeApiCall(endpoint, params = {}) {
    const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      console.log(`📦 Cache hit for ${endpoint}`);
      return cached;
    }

    this.checkRateLimit();
    
    try {
      console.log(`🌐 API call to ${endpoint} (${this.rateLimiter.calls}/${this.rateLimiter.maxCalls})`);
      
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: this.getHeaders(),
        params,
        timeout: 10000
      });

      const data = response.data;
      cache.set(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error(`❌ API Error for ${endpoint}:`, error.response?.data || error.message);
      
      // Fallback con dati mock se API fallisce
      return this.getFallbackData(endpoint, params);
    }
  }

  // Ottieni leghe/competizioni disponibili
  async getLeagues() {
    try {
      const data = await this.makeApiCall('/leagues', {
        current: true,
        type: 'league'
      });

      const leagues = data.response
        ?.filter(league => 
          ['Serie A', 'Premier League', 'Champions League', 'La Liga', 'Bundesliga', 'Ligue 1', 'Europa League']
          .includes(league.league?.name)
        )
        .map(this.formatLeague) || [];

      return {
        success: true,
        data: leagues,
        source: 'api-football',
        disclaimer: 'Dati forniti da API Football. Verificare sempre con fonti ufficiali.'
      };
    } catch (error) {
      return this.getLeaguesFallback();
    }
  }

  // Ricerca partite
  async searchMatches(searchQuery = '', options = {}) {
    try {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
      
      // Parametri per API Football
      const params = {
        from: options.fromDate || today.toISOString().split('T')[0],
        to: options.toDate || nextWeek.toISOString().split('T')[0],
        status: 'NS', // Not Started
        timezone: 'Europe/Rome'
      };

      // Filtra per lega se specificata
      if (options.league) {
        params.league = this.getLeagueApiId(options.league);
      }

      const data = await this.makeApiCall('/fixtures', params);
      
      let matches = data.response?.map(this.formatMatch) || [];

      // Filtro locale per search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        matches = matches.filter(match => 
          match.homeTeam.toLowerCase().includes(query) ||
          match.awayTeam.toLowerCase().includes(query) ||
          match.competition.name.toLowerCase().includes(query)
        );
      }

      // Limita risultati per performance
      matches = matches.slice(0, options.limit || 20);

      // 🚀 Se l'API reale non trova partite, mostra dati di fallback per testing
      if (matches.length === 0) {
        console.log('⚠️ No real matches found, showing fallback data for testing');
        const fallbackResult = this.getMatchesFallback(searchQuery, options);
        return {
          ...fallbackResult,
          meta: {
            source: 'api-football-fallback',
            rateLimitRemaining: this.rateLimiter.maxCalls - this.rateLimiter.calls,
            disclaimer: 'Nessuna partita trovata nel periodo specificato. Mostrando dati di esempio per test.'
          },
          message: `Trovate ${fallbackResult.data.length} partite (dati di esempio)`
        };
      }

      return {
        success: true,
        data: matches,
        count: matches.length,
        source: 'api-football',
        rateLimitRemaining: this.rateLimiter.maxCalls - this.rateLimiter.calls,
        disclaimer: 'Dati forniti da API Football. SPOrTS non è responsabile dell\'accuratezza dei dati.',
        message: `Trovate ${matches.length} partite`
      };
    } catch (error) {
      console.error('❌ Error searching matches:', error.message);
      return this.getMatchesFallback(searchQuery, options);
    }
  }

  // Ottieni partite per data specifica
  async getMatchesByDate(date, league = null) {
    try {
      const params = {
        date,
        timezone: 'Europe/Rome'
      };

      if (league) {
        params.league = this.getLeagueApiId(league);
      }

      const data = await this.makeApiCall('/fixtures', params);
      const matches = data.response?.map(this.formatMatch) || [];

      return {
        success: true,
        data: matches,
        count: matches.length,
        source: 'api-football'
      };
    } catch (error) {
      return this.getMatchesFallback('', { date, league });
    }
  }

  // Formatta lega da API response
  formatLeague(apiLeague) {
    const league = apiLeague.league;
    const logoMap = {
      'Serie A': '🇮🇹',
      'Premier League': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      'Champions League': '🏆',
      'La Liga': '🇪🇸', 
      'Bundesliga': '🇩🇪',
      'Ligue 1': '🇫🇷',
      'Europa League': '🏅'
    };

    return {
      id: league.id.toString(),
      name: league.name,
      country: apiLeague.country?.name,
      logo: logoMap[league.name] || '⚽',
      season: apiLeague.seasons?.[0]?.year,
      apiId: league.id
    };
  }

  // Formatta partita da API response
  formatMatch(apiFixture) {
    const fixture = apiFixture.fixture;
    const teams = apiFixture.teams;
    const league = apiFixture.league;

    // Emoji per squadre famose
    const teamEmojis = {
      'Juventus': '⚪⚫',
      'Inter': '🔵⚫', 
      'Milan': '🔴⚫',
      'Napoli': '🔵',
      'Roma': '🟡🔴',
      'Lazio': '💙🤍',
      'Real Madrid': '⚪',
      'Barcelona': '🔴🔵',
      'Liverpool': '🔴',
      'Manchester City': '🔵',
      'Arsenal': '🔴⚪',
      'Chelsea': '🔵',
      'Bayern Munich': '🔴⚪',
      'Borussia Dortmund': '🟡⚫',
      'PSG': '🔴🔵⚪'
    };

    const homeTeam = teams.home.name;
    const awayTeam = teams.away.name;

    return {
      id: fixture.id.toString(),
      homeTeam,
      awayTeam,
      competition: {
        id: league.id.toString(),
        name: league.name,
        logo: this.getLeagueLogo(league.name)
      },
      date: new Date(fixture.date).toISOString().split('T')[0],
      time: new Date(fixture.date).toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      homeTeamLogo: teamEmojis[homeTeam] || '🏠',
      awayTeamLogo: teamEmojis[awayTeam] || '✈️',
      venue: fixture.venue?.name,
      source: 'api-football',
      externalId: fixture.id.toString(),
      isLive: fixture.status.short === '1H' || fixture.status.short === '2H'
    };
  }

  // Mapping ID leghe per API
  getLeagueApiId(leagueName) {
    const mapping = {
      'serie-a': 135,
      'premier': 39,
      'champions': 2,
      'laliga': 140,
      'bundesliga': 78,
      'ligue1': 61,
      'europa': 3
    };
    return mapping[leagueName] || null;
  }

  // Logo per leghe
  getLeagueLogo(leagueName) {
    const logos = {
      'Serie A': '🇮🇹',
      'Premier League': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      'UEFA Champions League': '🏆',
      'La Liga': '🇪🇸',
      'Bundesliga': '🇩🇪',
      'Ligue 1': '🇫🇷',
      'UEFA Europa League': '🏅'
    };
    return logos[leagueName] || '⚽';
  }

  // Fallback data quando API non disponibile
  getFallbackData(endpoint, params) {
    console.log(`📝 Using fallback data for ${endpoint}`);
    
    if (endpoint.includes('leagues')) {
      return this.getLeaguesFallback();
    }
    
    if (endpoint.includes('fixtures')) {
      return this.getMatchesFallback();
    }
    
    return { success: false, error: 'API unavailable and no fallback data' };
  }

  getLeaguesFallback() {
    return {
      success: true,
      data: [
        { id: 'serie-a', name: 'Serie A', logo: '🇮🇹', country: 'Italy' },
        { id: 'premier', name: 'Premier League', logo: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'England' },
        { id: 'champions', name: 'Champions League', logo: '🏆', country: 'Europe' },
        { id: 'laliga', name: 'La Liga', logo: '🇪🇸', country: 'Spain' },
        { id: 'bundesliga', name: 'Bundesliga', logo: '🇩🇪', country: 'Germany' },
        { id: 'ligue1', name: 'Ligue 1', logo: '🇫🇷', country: 'France' }
      ],
      source: 'fallback',
      disclaimer: 'Dati mock - API non disponibile'
    };
  }

  getMatchesFallback(searchQuery = '', options = {}) {
    const mockMatches = [
      {
        id: 'mock_1',
        homeTeam: 'Juventus',
        awayTeam: 'Inter',
        competition: { id: 'serie-a', name: 'Serie A', logo: '🇮🇹' },
        date: '2024-01-20',
        time: '20:45',
        homeTeamLogo: '⚪⚫',
        awayTeamLogo: '🔵⚫',
        source: 'fallback'
      },
      {
        id: 'mock_2',
        homeTeam: 'Real Madrid',
        awayTeam: 'Barcelona',
        competition: { id: 'champions', name: 'Champions League', logo: '🏆' },
        date: '2024-01-22',
        time: '21:00',
        homeTeamLogo: '⚪',
        awayTeamLogo: '🔴🔵',
        source: 'fallback'
      }
    ];

    // Filtro per search query
    let filteredMatches = mockMatches;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredMatches = mockMatches.filter(match =>
        match.homeTeam.toLowerCase().includes(query) ||
        match.awayTeam.toLowerCase().includes(query)
      );
    }

    return {
      success: true,
      data: filteredMatches,
      count: filteredMatches.length,
      source: 'fallback',
      disclaimer: 'Dati mock - API non disponibile. Utilizzare solo per test.'
    };
  }

  // Metodo per testare connessione API
  async testConnection() {
    try {
      const data = await this.makeApiCall('/status');
      return {
        success: true,
        status: 'connected',
        remaining: this.rateLimiter.maxCalls - this.rateLimiter.calls,
        resetTime: this.rateLimiter.resetTime
      };
    } catch (error) {
      return {
        success: false,
        status: 'disconnected',
        error: error.message
      };
    }
  }

  // Pulisci cache (per admin)
  clearCache() {
    cache.flushAll();
    return { success: true, message: 'Cache cleared' };
  }
}

module.exports = new SportsApiService(); 