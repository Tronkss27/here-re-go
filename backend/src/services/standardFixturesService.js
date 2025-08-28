const sportsApiService = require('./sportsApiService');
const providerFactory = require('./providers/index');

/**
 * Service che fornisce fixtures standardizzate usando gli adapter
 * Sostituisce l'accesso diretto a sportsApiService con StandardFixture DTO
 */
class StandardFixturesService {
  constructor() {
    this.provider = process.env.PROVIDER || 'sportmonks';
    console.log(`[StandardFixturesService] Initialized with provider: ${this.provider}`);
  }

  /**
   * Ottiene fixtures per una data specifica e le converte in StandardFixture DTO
   * @param {string} date - Data in formato YYYY-MM-DD
   * @returns {Promise<Array>} Array di StandardFixture DTO
   */
  async getStandardFixturesByDate(date) {
    try {
      console.log(`[StandardFixturesService] Getting fixtures for date: ${date}`);
      
      // Ottieni fixtures raw dal provider
      const rawFixtures = await sportsApiService.getFixturesByDate(date);
      
      if (!Array.isArray(rawFixtures)) {
        console.log(`[StandardFixturesService] No fixtures returned for ${date}`);
        return [];
      }

      console.log(`[StandardFixturesService] Got ${rawFixtures.length} raw fixtures, mapping to StandardFixture...`);

      // Mappa a StandardFixture usando l'adapter
      const adapter = providerFactory.getAdapter(this.provider);
      const mappingResult = adapter.mapMultipleFixtures(rawFixtures);

      // Log errori di mapping se presenti
      if (mappingResult.errors.length > 0) {
        console.error(`[StandardFixturesService] Mapping errors for ${date}:`, mappingResult.errors);
      }

      console.log(`[StandardFixturesService] Successfully mapped ${mappingResult.successful.length}/${rawFixtures.length} fixtures`);
      
      return mappingResult.successful;

    } catch (error) {
      console.error(`[StandardFixturesService] Error getting fixtures for ${date}:`, error.message);
      throw new Error(`Failed to get standard fixtures for ${date}: ${error.message}`);
    }
  }

  /**
   * Ottiene una fixture specifica per ID e la converte in StandardFixture DTO
   * @param {string} fixtureId - ID della fixture
   * @returns {Promise<Object|null>} StandardFixture DTO o null se non trovata
   */
  async getStandardFixtureById(fixtureId) {
    try {
      console.log(`[StandardFixturesService] Getting fixture by ID: ${fixtureId}`);
      
      // Ottieni fixture raw dal provider
      const rawFixture = await sportsApiService.getFixtureById(fixtureId);
      
      if (!rawFixture) {
        console.log(`[StandardFixturesService] Fixture not found: ${fixtureId}`);
        return null;
      }

      // Mappa a StandardFixture usando l'adapter
      const adapter = providerFactory.getAdapter(this.provider);
      const standardFixture = adapter.mapToStandardFixture(rawFixture);

      console.log(`[StandardFixturesService] Successfully mapped fixture ${fixtureId}`);
      
      return standardFixture;

    } catch (error) {
      console.error(`[StandardFixturesService] Error getting fixture ${fixtureId}:`, error.message);
      throw new Error(`Failed to get standard fixture ${fixtureId}: ${error.message}`);
    }
  }

  /**
   * Ottiene fixtures per un range di date
   * @param {Date} startDate - Data inizio
   * @param {Date} endDate - Data fine  
   * @param {Object} options - Opzioni aggiuntive (league, etc.)
   * @returns {Promise<Array>} Array di StandardFixture DTO
   */
  async getStandardFixturesForDateRange(startDate, endDate, options = {}) {
    try {
      console.log(`[StandardFixturesService] Getting fixtures from ${startDate.toISOString().slice(0,10)} to ${endDate.toISOString().slice(0,10)}`);
      
      const allFixtures = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().slice(0, 10);
        
        try {
          const dayFixtures = await this.getStandardFixturesByDate(dateString);
          
          // Applica filtri se specificati
          let filteredFixtures = dayFixtures;
          
          if (options.league) {
            filteredFixtures = dayFixtures.filter(fixture => 
              this._matchesLeague(fixture, options.league)
            );
          }
          
          allFixtures.push(...filteredFixtures);
          
        } catch (dayError) {
          console.error(`[StandardFixturesService] Error for date ${dateString}:`, dayError.message);
          // Continua con le altre date anche se una fallisce
        }
        
        // Passa al giorno successivo
        currentDate.setDate(currentDate.getDate() + 1);
        
        // Rate limiting
        await this._delay(100);
      }
      
      console.log(`[StandardFixturesService] Retrieved ${allFixtures.length} total fixtures for date range`);
      
      return allFixtures;

    } catch (error) {
      console.error(`[StandardFixturesService] Error getting fixtures for date range:`, error.message);
      throw new Error(`Failed to get fixtures for date range: ${error.message}`);
    }
  }

  /**
   * Ottiene fixtures per una stagione specifica e le converte in StandardFixture DTO
   * @param {string} leagueKey - Chiave della lega (e.g., 'serie-b', 'premier-league')
   * @param {Object} dateRange - Oggetto con startDate e endDate
   * @returns {Promise<Array>} Array di StandardFixture DTO
   */
  async getStandardFixturesBySeason(leagueKey, dateRange = null) {
    try {
      console.log(`[StandardFixturesService] Getting fixtures for season: ${leagueKey}${dateRange ? ` (${dateRange.startDate} - ${dateRange.endDate})` : ''}`);
      
      // Ottieni fixtures raw dal provider usando season filter
      const rawFixtures = await sportsApiService.getFixturesBySeason(leagueKey, dateRange);
      
      if (!Array.isArray(rawFixtures)) {
        console.log(`[StandardFixturesService] No fixtures returned for season ${leagueKey}`);
        return [];
      }

      console.log(`[StandardFixturesService] Got ${rawFixtures.length} raw fixtures for ${leagueKey}, mapping to StandardFixture...`);

      // Mappa a StandardFixture usando l'adapter
      const adapter = providerFactory.getAdapter(this.provider);
      const mappingResult = adapter.mapMultipleFixtures(rawFixtures);

      // Log errori di mapping se presenti
      if (mappingResult.errors.length > 0) {
        console.error(`[StandardFixturesService] Mapping errors for ${leagueKey}:`, mappingResult.errors);
      }

      console.log(`[StandardFixturesService] Successfully mapped ${mappingResult.successful.length}/${rawFixtures.length} fixtures for ${leagueKey}`);
      
      return mappingResult.successful;

    } catch (error) {
      console.error(`[StandardFixturesService] Error getting fixtures for season ${leagueKey}:`, error.message);
      throw new Error(`Failed to get standard fixtures for season ${leagueKey}: ${error.message}`);
    }
  }

  /**
   * 🎯 FIXED: Verifica se una fixture appartiene alla lega specificata usando league_id
   * Più affidabile del string matching per nomi leghe
   */
  _matchesLeague(fixture, leagueFilter) {
    // ✅ ROBUST: Mapping basato su league_id numerico (non nomi)
    const leagueIdMapping = {
      'premier-league': 8,
      'serie-a': 384,
      'serie-b': 387,
      'champions-league': 2, 
      'europa-league': 5,
      'conference-league': 848,
      'championship': 9,
      'la-liga': 564,
      'bundesliga': 82,
      'ligue-1': 301,
      'ligue-2': 302,
      'eredivisie': 72,
      'primeira-liga': 271,
      'la-liga-2': 567
    };
    
    const expectedLeagueId = leagueIdMapping[leagueFilter];
    
    if (!expectedLeagueId) {
      console.warn(`[StandardFixturesService] Unknown league filter: ${leagueFilter}`);
      return false;
    }
    
    // Check sia fixture.league.id che fixture.competition.id per compatibilità
    const fixtureLeagueId = fixture.league?.id || fixture.competition?.id;
    
    if (!fixtureLeagueId) {
      console.warn(`[StandardFixturesService] Missing league/competition ID in fixture ${fixture.id}`);
      return false;
    }
    
    const matches = parseInt(fixtureLeagueId) === expectedLeagueId;
    
    if (matches) {
      console.log(`[StandardFixturesService] ✅ Fixture ${fixture.id} matches ${leagueFilter} (league_id: ${fixtureLeagueId})`);
    }
    
    return matches;
  }

  /**
   * Converte StandardFixture DTO nel formato PopularMatch per retrocompatibilità
   * @param {Object} standardFixture - StandardFixture DTO
   * @returns {Object} Dati formattati per PopularMatch
   */
  convertToPopularMatchFormat(standardFixture) {
    const homeParticipant = standardFixture.participants.find(p => p.role === 'home');
    const awayParticipant = standardFixture.participants.find(p => p.role === 'away');
    
    return {
      matchId: standardFixture.externalId, // ID nel sistema provider
      homeTeam: homeParticipant?.name || 'Home Team',
      homeTeamLogo: homeParticipant?.image_path || null,
      awayTeam: awayParticipant?.name || 'Away Team',
      awayTeamLogo: awayParticipant?.image_path || null,
      date: standardFixture.date,
      time: standardFixture.time,
      league: standardFixture.league.name,
      leagueLogo: standardFixture.league.logo,
      status: standardFixture.status.code,
      venues: [],
      venueCount: 0,
      popularityScore: 5.0,
      isHot: false,
      clickCount: 0
    };
  }

  /**
   * Converte StandardFixture DTO nel formato GlobalMatch per retrocompatibilità
   * @param {Object} standardFixture - StandardFixture DTO
   * @returns {Object} Dati formattati per GlobalMatch
   */
  convertToGlobalMatchFormat(standardFixture) {
    const homeParticipant = standardFixture.participants.find(p => p.role === 'home');
    const awayParticipant = standardFixture.participants.find(p => p.role === 'away');
    
    return {
      providerId: standardFixture.externalId,
      league: {
        id: standardFixture.league.id,
        name: standardFixture.league.name,
        image_path: standardFixture.league.logo,
      },
      date: new Date(standardFixture.datetime),
      status: {
        name: standardFixture.status.description,
      },
      participants: {
        home: {
          id: homeParticipant?.id,
          name: homeParticipant?.name,
          image_path: homeParticipant?.image_path,
        },
        away: {
          id: awayParticipant?.id,
          name: awayParticipant?.name,
          image_path: awayParticipant?.image_path,
        },
      },
      scores: standardFixture.scores ? [
        {
          score: { 
            goals: standardFixture.scores.home || 0 
          },
          description: 'HOME',
        },
        {
          score: { 
            goals: standardFixture.scores.away || 0 
          },
          description: 'AWAY',
        }
      ] : [],
      venue: standardFixture.venue,
      lastUpdatedFromProvider: new Date(),
    };
  }

  /**
   * Health check per il service
   */
  async healthCheck() {
    try {
      const providerStatus = providerFactory.healthCheck();
      
      return {
        service: 'StandardFixturesService',
        status: 'healthy',
        provider: this.provider,
        providerFactory: providerStatus,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'StandardFixturesService',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Delay helper per rate limiting
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new StandardFixturesService();
