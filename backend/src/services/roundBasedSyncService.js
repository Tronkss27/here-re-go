const NodeCache = require('node-cache');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const sportsApiService = require('./sportsApiService');
const stagesRoundsService = require('./stagesRoundsService');
const standardFixturesService = require('./standardFixturesService');

/**
 * 🎯 ROUND-BASED SYNC SERVICE - VERO APPROCCIO GIORNATE
 * 
 * Risolve definitivamente il problema della sincronizzazione implementando:
 * 
 * 1. **VERO ROUND-BASED FILTERING**: 
 *    - "Prossima giornata" = ottieni date del prossimo round e sincronizza quelle date
 *    - "Prossime 3 giornate" = ottieni date dei prossimi 3 rounds e sincronizza
 * 
 * 2. **DATE-BASED PRECISO**: 
 *    - Usa `/fixtures/date/{date}` invece di season filtering problematico
 *    - Garantisce completezza: TUTTE le partite delle date specificate
 * 
 * 3. **RISOLVE TUTTI I PROBLEMI**:
 *    - ✅ Ligue 1, Serie B, Eredivisie funzioneranno (no più Season ID obsoleti)
 *    - ✅ Giornate complete (10/10 partite invece di 3/10)
 *    - ✅ Precisione temporale (date reali dei rounds invece di stime)
 */

class RoundBasedSyncService {
  constructor() {
    // Cache per ottimizzazioni
    this.roundDatesCache = new NodeCache({ 
      stdTTL: 3600, // 1 ora - le date dei rounds cambiano raramente
      checkperiod: 600 
    });
    
    console.log('[RoundBasedSyncService] Initialized with round-based filtering approach');
  }
  
  /**
   * 🎯 MAIN METHOD: Sincronizza fixtures basato su rounds o giorni
   * 
   * @param {string} leagueKey - Chiave lega (e.g., 'serie-a', 'ligue-1')
   * @param {Object} options - Opzioni sync
   * @param {string} options.type - 'rounds' o 'days'
   * @param {number} options.count - Numero rounds/giorni
   * @param {Date} options.startDate - Data inizio (per legacy)
   * @param {Date} options.endDate - Data fine (per legacy)
   * @returns {Promise<Object>} Risultato sincronizzazione
   */
  async syncFixtures(leagueKey, options = {}) {
    const { type = 'days', count = 7, startDate, endDate } = options;
    
    console.log(`[RoundBasedSyncService] 🎯 Starting ${type}-based sync for ${leagueKey}:`);
    console.log(`   Type: ${type}, Count: ${count}`);
    
    try {
      let datesToSync = [];
      let metadata = { approach: type, leagueKey, count };
      
      if (type === 'rounds') {
        // 🎯 NUOVO APPROCCIO: Round-based (giornate reali)
        const roundDates = await this.getRoundDates(leagueKey, count);
        
        if (roundDates.length === 0) {
          console.log(`⚠️ No round dates found for ${leagueKey}, fallback to date-based approach`);
          // Fallback: usa approccio date se rounds non disponibili
          datesToSync = this.generateDateRange(new Date(), count * 7); // count giornate ≈ count*7 giorni
          metadata.fallback = 'date_based';
        } else {
          datesToSync = roundDates;
          metadata.roundsFound = roundDates.length;
          metadata.actualDates = roundDates.map(d => d.toISOString().split('T')[0]);
        }
        
        console.log(`   🎯 Round-based approach: ${datesToSync.length} dates to sync`);
        
      } else {
        // 📅 APPROCCIO LEGACY: Date-based tradizionale
        if (startDate && endDate) {
          datesToSync = this.generateDateRangeFromDates(startDate, endDate);
        } else {
          datesToSync = this.generateDateRange(new Date(), count);
        }
        
        console.log(`   📅 Date-based approach: ${datesToSync.length} days to sync`);
      }
      
      if (datesToSync.length === 0) {
        return {
          success: false,
          error: 'No dates determined for synchronization',
          metadata
        };
      }
      
      console.log(`   📅 Dates to sync: ${datesToSync.map(d => d.toISOString().split('T')[0]).join(', ')}`);
      
      // Sincronizza per ogni data specificata
      const syncResults = await this.syncFixturesForDates(leagueKey, datesToSync);
      
      return {
        success: true,
        totalFixtures: syncResults.totalFixtures,
        newMatches: syncResults.newMatches,
        cacheHits: syncResults.cacheHits,
        errors: syncResults.errors,
        datesProcessed: syncResults.datesProcessed,
        metadata: {
          ...metadata,
          syncResults: syncResults.dateResults
        }
      };
      
    } catch (error) {
      console.error(`[RoundBasedSyncService] Sync failed for ${leagueKey}:`, error.message);
      throw new Error(`Round-based sync failed for ${leagueKey}: ${error.message}`);
    }
  }
  
  /**
   * 🎯 Ottiene le date reali dei prossimi N rounds per una lega
   */
  async getRoundDates(leagueKey, roundCount = 3) {
    const cacheKey = `round_dates_${leagueKey}_${roundCount}`;
    
    // Controllo cache
    const cached = this.roundDatesCache.get(cacheKey);
    if (cached) {
      console.log(`[RoundBasedSyncService] 🎯 Round dates cache HIT for ${leagueKey}`);
      return cached;
    }
    
    try {
      console.log(`[RoundBasedSyncService] 🔍 Getting next ${roundCount} round dates for ${leagueKey}...`);
      
      // Usa StagesRoundsService per ottenere rounds e date
      const roundsData = await stagesRoundsService.getFixturesByNextRounds(leagueKey, roundCount);
      
      if (!roundsData.rounds || roundsData.rounds.length === 0) {
        console.log(`[RoundBasedSyncService] No rounds data found for ${leagueKey}`);
        return [];
      }
      
      console.log(`[RoundBasedSyncService] Found ${roundsData.rounds.length} rounds for ${leagueKey}`);
      
      // Estrai tutte le date uniche dai rounds
      const allDates = new Set();
      
      roundsData.rounds.forEach(round => {
        if (round.startDate) {
          const startDate = new Date(round.startDate);
          allDates.add(startDate.toISOString().split('T')[0]);
        }
        
        if (round.endDate) {
          const endDate = new Date(round.endDate);
          // Aggiungi tutte le date tra start e end
          const current = new Date(round.startDate || round.endDate);
          const end = new Date(round.endDate);
          
          while (current <= end) {
            allDates.add(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
          }
        }
      });
      
      // Converti in array di Date objects e ordina
      const dates = Array.from(allDates)
        .map(dateStr => new Date(dateStr))
        .sort((a, b) => a - b);
      
      console.log(`[RoundBasedSyncService] Extracted ${dates.length} unique dates from rounds:`);
      dates.forEach(date => {
        console.log(`   - ${date.toISOString().split('T')[0]}`);
      });
      
      // Cache per 1 ora
      this.roundDatesCache.set(cacheKey, dates);
      
      return dates;
      
    } catch (error) {
      console.warn(`[RoundBasedSyncService] Error getting round dates for ${leagueKey}:`, error.message);
      // Fallback: restituisci array vuoto, il chiamante userà date-based approach
      return [];
    }
  }
  
  /**
   * 📅 Genera range di date da data di inizio per N giorni
   */
  generateDateRange(startDate, dayCount) {
    const dates = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < dayCount; i++) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }
  
  /**
   * 📅 Genera range di date tra due date specifiche
   */
  generateDateRangeFromDates(startDate, endDate) {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }
  
  /**
   * ⚡ Sincronizza fixtures per un array di date specifiche
   */
  async syncFixturesForDates(leagueKey, dates) {
    const results = {
      totalFixtures: 0,
      newMatches: 0,
      cacheHits: 0,
      errors: [],
      datesProcessed: 0,
      dateResults: []
    };
    
    console.log(`[RoundBasedSyncService] 🔄 Syncing ${dates.length} dates for ${leagueKey}...`);
    
    for (const date of dates) {
      const dateString = date.toISOString().split('T')[0];
      
      try {
        console.log(`[RoundBasedSyncService] 📅 Processing date: ${dateString}`);
        
        // Usa StandardFixturesService per ottenere fixtures per questa data specifica
        const standardFixtures = await standardFixturesService.getStandardFixturesByDate(dateString);
        
        // Filtra solo per la lega richiesta
        const leagueFixtures = standardFixtures.filter(fixture => 
          standardFixturesService._matchesLeague(fixture, leagueKey)
        );
        
        console.log(`[RoundBasedSyncService] Found ${leagueFixtures.length} fixtures for ${leagueKey} on ${dateString}`);
        
        if (leagueFixtures.length > 0) {
          // ✅ FIXED: Salvataggio reale invece di simulazione
          for (const standardFixture of leagueFixtures) {
            try {
              // Cerca se esiste già nel DB
              const PopularMatch = require('../models/PopularMatch');
              const existingMatch = await PopularMatch.findOne({ 
                matchId: standardFixture.externalId 
              });
              
              if (existingMatch) {
                // Update existing match
                existingMatch.homeTeam = standardFixture.participants.find(p => p.role === 'home')?.name || 'TBD';
                existingMatch.awayTeam = standardFixture.participants.find(p => p.role === 'away')?.name || 'TBD';
                existingMatch.homeTeamLogo = standardFixture.participants.find(p => p.role === 'home')?.image_path || null;
                existingMatch.awayTeamLogo = standardFixture.participants.find(p => p.role === 'away')?.image_path || null;
                existingMatch.league = standardFixture.league.name;
                existingMatch.leagueLogo = standardFixture.league.logo || null;
                existingMatch.date = standardFixture.date;
                existingMatch.time = standardFixture.time;
                existingMatch.lastUpdated = new Date();
                
                await existingMatch.save();
                console.log(`♻️ Updated existing PopularMatch: ${standardFixture.externalId}`);
                results.cacheHits++;
              } else {
                // Create new match
                console.log(`🆕 Creating new PopularMatch: ${standardFixture.externalId}`);
                const newMatch = new PopularMatch({
                  matchId: standardFixture.externalId,
                  homeTeam: standardFixture.participants.find(p => p.role === 'home')?.name || 'TBD',
                  awayTeam: standardFixture.participants.find(p => p.role === 'away')?.name || 'TBD',
                  homeTeamLogo: standardFixture.participants.find(p => p.role === 'home')?.image_path || null,
                  awayTeamLogo: standardFixture.participants.find(p => p.role === 'away')?.image_path || null,
                  league: standardFixture.league.name,
                  leagueLogo: standardFixture.league.logo || null,
                  date: standardFixture.date,
                  time: standardFixture.time,
                  source: 'sync-api',
                  lastUpdated: new Date()
                });
                
                await newMatch.save();
                await newMatch.updatePopularity();
                results.newMatches++;
              }
              
              results.totalFixtures++;
              
            } catch (saveError) {
              console.error(`❌ Error saving fixture ${standardFixture.externalId}:`, saveError.message);
              results.errors.push(`Fixture ${standardFixture.externalId}: ${saveError.message}`);
            }
          }
        }
        
        results.dateResults.push({
          date: dateString,
          fixtures: leagueFixtures.length,
          success: true
        });
        
        results.datesProcessed++;
        
        // Rate limiting tra date
        await this.delay(200);
        
      } catch (dateError) {
        console.error(`[RoundBasedSyncService] Error processing ${dateString}:`, dateError.message);
        results.errors.push(`${dateString}: ${dateError.message}`);
        
        results.dateResults.push({
          date: dateString,
          fixtures: 0,
          success: false,
          error: dateError.message
        });
      }
    }
    
    console.log(`[RoundBasedSyncService] ✅ Sync completed: ${results.totalFixtures} fixtures, ${results.errors.length} errors`);
    
    return results;
  }
  
  /**
   * ⏱️ Utility per delay
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * 📊 Test method per confrontare approaches
   */
  async testApproaches(leagueKey, roundCount = 3, dayCount = 7) {
    console.log(`[RoundBasedSyncService] 🧪 Testing approaches for ${leagueKey}`);
    
    const results = {};
    
    // Test round-based
    try {
      const startTime = Date.now();
      const roundResult = await this.syncFixtures(leagueKey, { type: 'rounds', count: roundCount });
      const roundDuration = Date.now() - startTime;
      
      results.rounds = {
        success: roundResult.success,
        fixtures: roundResult.totalFixtures,
        duration: roundDuration,
        metadata: roundResult.metadata
      };
    } catch (error) {
      results.rounds = { success: false, error: error.message };
    }
    
    // Test date-based
    try {
      const startTime = Date.now();
      const dateResult = await this.syncFixtures(leagueKey, { type: 'days', count: dayCount });
      const dateDuration = Date.now() - startTime;
      
      results.dates = {
        success: dateResult.success,
        fixtures: dateResult.totalFixtures,
        duration: dateDuration,
        metadata: dateResult.metadata
      };
    } catch (error) {
      results.dates = { success: false, error: error.message };
    }
    
    console.log('[RoundBasedSyncService] 📊 Test results:', results);
    return results;
  }
}

// Singleton instance
const roundBasedSyncService = new RoundBasedSyncService();

module.exports = roundBasedSyncService;
