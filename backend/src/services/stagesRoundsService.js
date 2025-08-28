const NodeCache = require('node-cache');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const currentSeasonService = require('./currentSeasonService');

/**
 * 🎯 STAGES/ROUNDS SERVICE - APPROACH GIORNATE
 * 
 * Implementa l'approccio basato su giornate/rounds invece che su date:
 * - "Prossime 3 giornate" invece di "prossimi 10 giorni"
 * - Più preciso, intuitivo e performante
 * - Struttura gerarchica: League → Season → Stage → Rounds → Fixtures
 * 
 * Vantaggi:
 * - 🎯 Precisione: Le giornate sono fisse, le date possono cambiare
 * - ⚡ Performance: Scarica solo i dati necessari (non tutta la stagione)
 * - 🧠 UX: Gli utenti pensano per giornate ("prossima giornata di Serie A")
 * - 📅 Stabilità: Rounds non cambiano, date possono slittare
 */

class StagesRoundsService {
  constructor() {
    // Cache con TTL differenziati per tipologia di dati
    this.stageCache = new NodeCache({ 
      stdTTL: 21600, // 6 ore per stages (cambia raramente durante stagione)
      checkperiod: 3600 
    });
    
    this.roundsCache = new NodeCache({ 
      stdTTL: 10800, // 3 ore per rounds (possono essere creati nuovi rounds)
      checkperiod: 1800 
    });
    
    this.fixturesCache = new NodeCache({ 
      stdTTL: 3600, // 1 ora per fixtures (possono avere aggiornamenti)
      checkperiod: 600 
    });
    
    // API client setup
    this.apiClient = axios.create({
      baseURL: 'https://api.sportmonks.com/v3/football',
      params: {
        api_token: process.env.SPORTMONKS_API_TOKEN
      },
      timeout: 15000
    });
    
    console.log('[StagesRoundsService] Initialized with tiered caching (stages:6h, rounds:3h, fixtures:1h)');
  }
  
  /**
   * 🎯 MAIN METHOD: Ottieni fixtures per le prossime N giornate
   * 
   * @param {string} leagueKey - Chiave lega (e.g., 'serie-a', 'premier-league')
   * @param {number} roundCount - Numero di giornate da recuperare (default: 3)
   * @returns {Promise<Object>} { fixtures, rounds, metadata }
   */
  async getFixturesByNextRounds(leagueKey, roundCount = 3) {
    try {
      console.log(`[StagesRoundsService] 🎯 Getting next ${roundCount} rounds for ${leagueKey}`);
      
      // 1. Ottieni current season per la lega
      const seasonId = await currentSeasonService.getCurrentSeasonId(leagueKey);
      console.log(`[StagesRoundsService] Using season ID: ${seasonId}`);
      
      // 2. Ottieni lo stage principale (Regular Season)
      const stage = await this.getCurrentStage(seasonId, leagueKey);
      if (!stage) {
        throw new Error(`No current stage found for ${leagueKey} season ${seasonId}`);
      }
      
      console.log(`[StagesRoundsService] Using stage: ${stage.name} (ID: ${stage.id})`);
      
      // 3. Ottieni i prossimi rounds
      const nextRounds = await this.getNextRounds(stage.id, leagueKey, roundCount);
      console.log(`[StagesRoundsService] Found ${nextRounds.length} upcoming rounds`);
      
      if (nextRounds.length === 0) {
        return {
          fixtures: [],
          rounds: [],
          metadata: {
            leagueKey,
            seasonId,
            stageId: stage.id,
            stageName: stage.name,
            requestedRounds: roundCount,
            foundRounds: 0,
            message: 'No upcoming rounds found'
          }
        };
      }
      
      // 4. Ottieni fixtures per questi rounds
      const fixtures = await this.getFixturesByRounds(nextRounds.map(r => r.id), leagueKey);
      console.log(`[StagesRoundsService] Retrieved ${fixtures.length} fixtures from ${nextRounds.length} rounds`);
      
      return {
        fixtures,
        rounds: nextRounds.map(r => ({
          id: r.id,
          name: r.name,
          round: r.round,
          startDate: r.starting_at,
          endDate: r.ending_at
        })),
        metadata: {
          leagueKey,
          seasonId,
          stageId: stage.id,
          stageName: stage.name,
          requestedRounds: roundCount,
          foundRounds: nextRounds.length,
          fixturesCount: fixtures.length
        }
      };
      
    } catch (error) {
      console.error(`[StagesRoundsService] Error getting next rounds for ${leagueKey}:`, error.message);
      throw new Error(`Failed to get next ${roundCount} rounds for ${leagueKey}: ${error.message}`);
    }
  }
  
  /**
   * 🏟️ Ottieni lo stage corrente per una stagione (di solito "Regular Season")
   */
  async getCurrentStage(seasonId, leagueKey) {
    const cacheKey = `stage_${seasonId}_${leagueKey}`;
    
    // Controllo cache
    const cached = this.stageCache.get(cacheKey);
    if (cached) {
      console.log(`[StagesRoundsService] 🎯 Stage cache HIT for season ${seasonId}`);
      return cached;
    }
    
    try {
      console.log(`[StagesRoundsService] 🔍 Finding current stage for season ${seasonId}...`);
      
      // Metodo 1: Prova con include stages
      const seasonResponse = await this.apiClient.get(`/seasons/${seasonId}`, {
        params: {
          include: 'stages'
        }
      });
      
      const stages = seasonResponse.data.data?.stages || [];
      console.log(`[StagesRoundsService] Found ${stages.length} stages for season ${seasonId}`);
      
      if (stages.length === 0) {
        throw new Error(`No stages found for season ${seasonId}`);
      }
      
      // Cerca "Regular Season" o stage principale
      let currentStage = stages.find(stage => 
        stage.name && (
          stage.name.toLowerCase().includes('regular season') ||
          stage.name.toLowerCase().includes('regular') ||
          stage.name.toLowerCase().includes('main') ||
          stage.type_id === 1 // Regular season type
        )
      );
      
      // Fallback: prendi il primo stage se non troviamo "Regular Season"
      if (!currentStage) {
        currentStage = stages[0];
        console.warn(`[StagesRoundsService] No "Regular Season" found, using first stage: ${currentStage.name}`);
      }
      
      console.log(`[StagesRoundsService] Selected stage: ${currentStage.name} (ID: ${currentStage.id})`);
      
      // Cache per 6 ore
      this.stageCache.set(cacheKey, currentStage);
      return currentStage;
      
    } catch (error) {
      console.error(`[StagesRoundsService] Error getting stage for season ${seasonId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * 🗓️ Ottieni i prossimi N rounds di uno stage
   */
  async getNextRounds(stageId, leagueKey, roundCount = 3) {
    const cacheKey = `rounds_${stageId}_${leagueKey}_next${roundCount}`;
    
    // Controllo cache
    const cached = this.roundsCache.get(cacheKey);
    if (cached) {
      console.log(`[StagesRoundsService] 🎯 Rounds cache HIT for stage ${stageId}`);
      return cached;
    }
    
    try {
      console.log(`[StagesRoundsService] 🔍 Finding next ${roundCount} rounds for stage ${stageId}...`);
      
      // Ottieni tutti i rounds dello stage
      const stageResponse = await this.apiClient.get(`/stages/${stageId}`, {
        params: {
          include: 'rounds'
        }
      });
      
      const rounds = stageResponse.data.data?.rounds || [];
      console.log(`[StagesRoundsService] Found ${rounds.length} total rounds for stage ${stageId}`);
      
      if (rounds.length === 0) {
        return [];
      }
      
      // Filtra e ordina rounds futuri/in corso
      const now = new Date();
      const upcomingRounds = rounds
        .filter(round => {
          // Include rounds che:
          // 1. Non hanno ending_at (ancora da giocare)
          // 2. Hanno ending_at ma è nel futuro
          // 3. Hanno starting_at nel futuro o recente (ultimi 2 giorni per rounds in corso)
          
          if (!round.ending_at) return true; // Round non ancora terminato
          
          const endDate = new Date(round.ending_at);
          const startDate = round.starting_at ? new Date(round.starting_at) : null;
          
          // Include se end date è nel futuro
          if (endDate > now) return true;
          
          // Include se start date è recente (ultimi 2 giorni) per round in corso
          if (startDate) {
            const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));
            if (startDate > twoDaysAgo && endDate > twoDaysAgo) return true;
          }
          
          return false;
        })
        .sort((a, b) => {
          // Ordina per round number o per starting_at
          if (a.round && b.round) {
            return a.round - b.round;
          }
          if (a.starting_at && b.starting_at) {
            return new Date(a.starting_at) - new Date(b.starting_at);
          }
          // Fallback: ordina per ID
          return a.id - b.id;
        })
        .slice(0, roundCount);
      
      console.log(`[StagesRoundsService] Selected ${upcomingRounds.length} upcoming rounds:`);
      upcomingRounds.forEach(round => {
        console.log(`  - Round ${round.round || round.id}: ${round.name} (${round.starting_at?.split('T')[0] || 'TBD'})`);
      });
      
      // Cache per 3 ore
      this.roundsCache.set(cacheKey, upcomingRounds);
      return upcomingRounds;
      
    } catch (error) {
      console.error(`[StagesRoundsService] Error getting rounds for stage ${stageId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * ⚽ Ottieni fixtures per round IDs specifici
   */
  async getFixturesByRounds(roundIds, leagueKey) {
    const cacheKey = `fixtures_rounds_${roundIds.join('_')}_${leagueKey}`;
    
    // Controllo cache
    const cached = this.fixturesCache.get(cacheKey);
    if (cached) {
      console.log(`[StagesRoundsService] 🎯 Fixtures cache HIT for rounds ${roundIds.join(',')}`);
      return cached;
    }
    
    try {
      console.log(`[StagesRoundsService] 🔍 Getting fixtures for rounds: ${roundIds.join(',')}`);
      
      // Usa filtro round IDs per ottenere fixtures
      const fixturesResponse = await this.apiClient.get('/fixtures', {
        params: {
          filters: `fixtureRounds:${roundIds.join(',')}`,
          include: 'participants;league;round',
          per_page: 100 // Dovrebbe essere sufficiente per 3 giornate
        }
      });
      
      const fixtures = fixturesResponse.data.data || [];
      console.log(`[StagesRoundsService] Retrieved ${fixtures.length} fixtures for ${roundIds.length} rounds`);
      
      // Cache per 1 ora
      this.fixturesCache.set(cacheKey, fixtures);
      return fixtures;
      
    } catch (error) {
      console.error(`[StagesRoundsService] Error getting fixtures for rounds ${roundIds.join(',')}:`, error.message);
      throw error;
    }
  }
  
  /**
   * 🧪 TEST: Confronta approccio Rounds vs Date per una lega
   */
  async compareApproaches(leagueKey, roundCount = 3, dayCount = 10) {
    console.log(`[StagesRoundsService] 🧪 Comparing Rounds vs Dates approach for ${leagueKey}`);
    
    const results = {
      rounds: { fixtures: [], metadata: null, error: null },
      dates: { fixtures: [], metadata: null, error: null }
    };
    
    // Test approccio Rounds
    try {
      const roundsResult = await this.getFixturesByNextRounds(leagueKey, roundCount);
      results.rounds.fixtures = roundsResult.fixtures;
      results.rounds.metadata = roundsResult.metadata;
    } catch (error) {
      results.rounds.error = error.message;
    }
    
    // Test approccio Date (usando il vecchio sistema)
    try {
      const seasonId = await currentSeasonService.getCurrentSeasonId(leagueKey);
      
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + dayCount);
      
      const datesResult = await this.apiClient.get('/fixtures', {
        params: {
          filters: `fixtureSeasons:${seasonId}`,
          include: 'participants;league',
          per_page: 100
        }
      });
      
      const allFixtures = datesResult.data.data || [];
      const filteredFixtures = allFixtures.filter(fixture => {
        const fixtureDate = new Date(fixture.starting_at);
        return fixtureDate >= today && fixtureDate <= endDate;
      });
      
      results.dates.fixtures = filteredFixtures;
      results.dates.metadata = {
        approach: 'dates',
        totalSeasonFixtures: allFixtures.length,
        filteredFixtures: filteredFixtures.length,
        dateRange: `${today.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`
      };
      
    } catch (error) {
      results.dates.error = error.message;
    }
    
    // Confronto risultati
    const comparison = {
      leagueKey,
      roundsApproach: {
        success: !results.rounds.error,
        fixturesCount: results.rounds.fixtures.length,
        rounds: results.rounds.metadata?.foundRounds || 0,
        error: results.rounds.error
      },
      datesApproach: {
        success: !results.dates.error,
        fixturesCount: results.dates.fixtures.length,
        totalSeason: results.dates.metadata?.totalSeasonFixtures || 0,
        error: results.dates.error
      }
    };
    
    console.log(`[StagesRoundsService] 📊 Comparison results:`, comparison);
    return { results, comparison };
  }
  
  /**
   * 📊 Statistiche e utilità
   */
  getStats() {
    const stats = {
      stageCache: {
        entries: this.stageCache.keys().length,
        keys: this.stageCache.keys()
      },
      roundsCache: {
        entries: this.roundsCache.keys().length,
        keys: this.roundsCache.keys()
      },
      fixturesCache: {
        entries: this.fixturesCache.keys().length,
        keys: this.fixturesCache.keys()
      }
    };
    
    console.log('[StagesRoundsService] 📊 Stats:', stats);
    return stats;
  }
  
  /**
   * 🔄 Invalida cache
   */
  clearCache() {
    this.stageCache.flushAll();
    this.roundsCache.flushAll();
    this.fixturesCache.flushAll();
    console.log('[StagesRoundsService] 🔄 All caches cleared');
  }
}

// Singleton instance
const stagesRoundsService = new StagesRoundsService();

module.exports = stagesRoundsService;
