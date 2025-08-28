const NodeCache = require('node-cache');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

/**
 * 🤖 CURRENT SEASON SERVICE - AUTO DETECTION
 * 
 * Automatizza la detection del current season per ogni lega
 * eliminando la necessità di hardcodare Season ID che diventano obsoleti.
 * 
 * Features:
 * - Auto-detection tramite API Sportmonks (is_current_season: true)
 * - Cache intelligente 24h (season data cambia raramente)
 * - Fallback resiliente a mapping hardcoded
 * - Error handling robusto
 * - Future-proof per cambi stagione automatici
 */

class CurrentSeasonService {
  constructor() {
    // Cache con TTL di 24 ore per season data (cambiano raramente)
    this.seasonCache = new NodeCache({ 
      stdTTL: 86400, // 24 ore
      checkperiod: 3600 // Check cleanup ogni ora
    });
    
    // 🎯 LOAD SEASON MAPPINGS from JSON (authoritative source)
    this.seasonMappings = this._loadSeasonMappings();
    
    // ✅ LEAGUE MAPPING REALI - Verificati dai discovery script
    this.LEAGUE_MAPPING = {
      // Leghe principali European Plan
      'premier-league': 8,    // ✅ Verificato
      'serie-a': 384,         // ✅ Verificato  
      'serie-b': 387,         // ✅ Verificato (era 501 sbagliato!)
      'ligue-1': 301,         // ✅ Verificato
      'la-liga': 564,         // ✅ Verificato
      'bundesliga': 82,       // ✅ Verificato
      'championship': 9,      // ✅ Verificato
      'eredivisie': 72,       // ✅ Verificato
      'la-liga-2': 567        // ✅ Verificato
    };
    
    // ✅ FALLBACK AGGIORNATO: Mapping da seasonMappings.json verificato
    this.FALLBACK_SEASONS = {
      'premier-league': '25583',  // 2025/2026 ✅ Verified
      'serie-a': '25533',         // 2025/2026 ✅ Verified  
      'serie-b': '26164',         // 2025/2026 ✅ FIXED: era 23839 obsoleto!
      'ligue-1': '25651',         // 2025/2026 ✅ FIXED: era 23643 obsoleto!
      'ligue-2': '25658',         // 2025/2026 ✅ Added
      'la-liga': '25659',         // 2025/2026 ✅ Verified
      'bundesliga': '25646',      // 2025/2026 ✅ Verified
      'championship': '25648',    // 2025/2026 ✅ Verified
      'eredivisie': '25597',      // 2025/2026 ✅ FIXED: era 23628 obsoleto!
      'la-liga-2': '25673'        // 2025/2026 ✅ Verified
    };
    
    // API client setup
    this.apiClient = axios.create({
      baseURL: 'https://api.sportmonks.com/v3/football',
      params: {
        api_token: process.env.SPORTMONKS_API_TOKEN
      },
      timeout: 10000
    });
    
    console.log('[CurrentSeasonService] Initialized with 24h cache and league mapping');
  }
  
  /**
   * 🎯 MAIN METHOD: Ottiene Current Season ID per una lega
   * Usa cache intelligente + auto-detection + fallback resiliente
   */
  async getCurrentSeasonId(leagueKey) {
    const cacheKey = `current_season_${leagueKey}`;
    
    // 1. Controllo cache prima (24h TTL)
    const cached = this.seasonCache.get(cacheKey);
    if (cached) {
      console.log(`[CurrentSeasonService] 🎯 Cache HIT for ${leagueKey}: Season ${cached.seasonId} (${cached.name})`);
      return cached.seasonId;
    }
    
    // 2. Auto-detection dalla API
    try {
      console.log(`[CurrentSeasonService] 🔍 Auto-detecting current season for ${leagueKey}...`);
      
      const leagueId = this.LEAGUE_MAPPING[leagueKey];
      if (!leagueId) {
        throw new Error(`League ID not found for ${leagueKey}. Available: ${Object.keys(this.LEAGUE_MAPPING).join(', ')}`);
      }
      
      const seasonData = await this._detectCurrentSeason(leagueId, leagueKey);
      
      if (seasonData) {
        // Cache del risultato per 24h
        this.seasonCache.set(cacheKey, seasonData);
        console.log(`[CurrentSeasonService] ✅ Auto-detected ${leagueKey}: Season ${seasonData.seasonId} (${seasonData.name}) - Cached 24h`);
        return seasonData.seasonId;
      }
      
    } catch (error) {
      console.warn(`[CurrentSeasonService] ⚠️ Auto-detection failed for ${leagueKey}:`, error.message);
    }
    
    // 3. Fallback a mapping hardcoded (con warning)
    const fallbackSeasonId = this.FALLBACK_SEASONS[leagueKey];
    if (fallbackSeasonId) {
      console.warn(`[CurrentSeasonService] 🚨 Using FALLBACK season for ${leagueKey}: ${fallbackSeasonId} (may be outdated!)`);
      
      // Cache anche il fallback (ma con TTL più breve - 6h)
      const fallbackData = { seasonId: fallbackSeasonId, name: 'Fallback', source: 'hardcoded' };
      this.seasonCache.set(cacheKey, fallbackData, 21600); // 6 ore per fallback
      return fallbackSeasonId;
    }
    
    // 4. Fallimento completo
    throw new Error(`No current season found for ${leagueKey} - neither auto-detection nor fallback available`);
  }
  
  /**
   * 🔍 AUTO-DETECTION: Trova current season tramite API
   */
  async _detectCurrentSeason(leagueId, leagueKey) {
    try {
      // Metodo 1: Prova con include=currentSeason (più efficiente)
      try {
        const leagueResponse = await this.apiClient.get(`/leagues/${leagueId}`, {
          params: { include: 'currentSeason' }
        });
        
        const currentSeason = leagueResponse.data.data?.currentSeason;
        if (currentSeason) {
          return {
            seasonId: currentSeason.id.toString(),
            name: currentSeason.name || 'Unknown',
            source: 'currentSeason_include'
          };
        }
        
      } catch (includeError) {
        console.log(`[CurrentSeasonService] Method 1 (include) failed for ${leagueKey}, trying method 2...`);
      }
      
      // Metodo 2: Cerca manualmente tra tutte le stagioni della lega
      const seasonsResponse = await this.apiClient.get('/seasons', {
        params: {
          filters: `leagueId:${leagueId}`,
          per_page: 50,
          sortBy: 'id:desc' // Più recenti prime
        }
      });
      
      const seasons = seasonsResponse.data.data || [];
      console.log(`[CurrentSeasonService] Found ${seasons.length} seasons for league ${leagueId}`);
      
      if (seasons.length === 0) {
        throw new Error(`No seasons found for league ${leagueId}`);
      }
      
      // Cerca stagione con is_current = true
      let currentSeason = seasons.find(s => s.is_current === true);
      
      if (!currentSeason) {
        // Fallback: prendi la più recente (ID più alto)
        currentSeason = seasons[0];
        console.warn(`[CurrentSeasonService] No is_current=true found for ${leagueKey}, using latest: ${currentSeason.name}`);
      }
      
      return {
        seasonId: currentSeason.id.toString(),
        name: currentSeason.name || 'Unknown',
        source: 'manual_search'
      };
      
    } catch (error) {
      console.error(`[CurrentSeasonService] Detection failed for league ${leagueId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * 🔄 UTILITY: Invalida cache per una lega (utile per refresh forzato)
   */
  invalidateCache(leagueKey) {
    const cacheKey = `current_season_${leagueKey}`;
    const wasDeleted = this.seasonCache.del(cacheKey);
    console.log(`[CurrentSeasonService] Cache invalidated for ${leagueKey}: ${wasDeleted ? 'success' : 'not_found'}`);
    return wasDeleted;
  }
  
  /**
   * 🔄 UTILITY: Refresh cache per tutte le leghe (utile per cron job)
   */
  async refreshAllSeasons() {
    console.log('[CurrentSeasonService] 🔄 Refreshing all seasons cache...');
    const results = {};
    
    for (const leagueKey of Object.keys(this.LEAGUE_MAPPING)) {
      try {
        this.invalidateCache(leagueKey);
        const seasonId = await this.getCurrentSeasonId(leagueKey);
        results[leagueKey] = { success: true, seasonId };
      } catch (error) {
        results[leagueKey] = { success: false, error: error.message };
      }
    }
    
    console.log('[CurrentSeasonService] ✅ Refresh completed:', results);
    return results;
  }
  
  /**
   * 📊 UTILITY: Statistiche cache e sistema
   */
  getStats() {
    const cacheKeys = this.seasonCache.keys();
    const stats = {
      cacheEntries: cacheKeys.length,
      supportedLeagues: Object.keys(this.LEAGUE_MAPPING).length,
      cacheKeys,
      leagueMapping: this.LEAGUE_MAPPING
    };
    
    console.log('[CurrentSeasonService] 📊 Stats:', stats);
    return stats;
  }
  
  /**
   * 🧪 TEST: Verifica funzionamento per tutte le leghe
   */
  async testAllLeagues() {
    console.log('[CurrentSeasonService] 🧪 Testing all leagues...');
    const results = {};
    
    for (const leagueKey of Object.keys(this.LEAGUE_MAPPING)) {
      try {
        console.log(`\n🔍 Testing ${leagueKey}...`);
        const seasonId = await this.getCurrentSeasonId(leagueKey);
        
        // Test anche che il season ID funzioni con fixtures
        const testResponse = await this.apiClient.get('/fixtures', {
          params: {
            filters: `fixtureSeasons:${seasonId}`,
            per_page: 1
          }
        });
        
        const fixturesCount = testResponse.data.data?.length || 0;
        results[leagueKey] = { 
          success: true, 
          seasonId, 
          hasFixtures: fixturesCount > 0,
          fixturesCount
        };
        
        console.log(`✅ ${leagueKey}: Season ${seasonId}, Fixtures: ${fixturesCount}`);
        
      } catch (error) {
        results[leagueKey] = { success: false, error: error.message };
        console.log(`❌ ${leagueKey}: ${error.message}`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n📊 Test Summary:');
    Object.entries(results).forEach(([key, result]) => {
      const status = result.success ? '✅' : '❌';
      const details = result.success ? `Season ${result.seasonId} (${result.fixturesCount} fixtures)` : result.error;
      console.log(`${status} ${key.padEnd(20)}: ${details}`);
    });
    
    return results;
  }
  
  /**
   * 📁 Load season mappings from authoritative JSON file
   */
  _loadSeasonMappings() {
    try {
      const mappingsPath = path.join(__dirname, '../data/seasonMappings.json');
      const mappingsData = fs.readFileSync(mappingsPath, 'utf8');
      const mappings = JSON.parse(mappingsData);
      
      console.log(`[CurrentSeasonService] 🎯 Loaded ${Object.keys(mappings.leagues).length} league mappings from JSON`);
      console.log(`[CurrentSeasonService] 📅 Version: ${mappings.metadata.version}, Last updated: ${mappings.metadata.lastUpdated}`);
      
      return mappings;
    } catch (error) {
      console.error('[CurrentSeasonService] ❌ Failed to load season mappings:', error.message);
      console.warn('[CurrentSeasonService] 🚨 Falling back to hardcoded mappings');
      return null;
    }
  }
  
  /**
   * 🎯 Get league data from JSON mappings (if available)
   */
  getLeagueDataFromMappings(leagueKey) {
    if (this.seasonMappings && this.seasonMappings.leagues[leagueKey]) {
      return this.seasonMappings.leagues[leagueKey];
    }
    return null;
  }
}

// Singleton instance
const currentSeasonService = new CurrentSeasonService();

module.exports = currentSeasonService;
