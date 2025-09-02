const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Import existing services
const roundBasedSyncService = require('./roundBasedSyncService');
const standardFixturesService = require('./standardFixturesService');
const currentSeasonService = require('./currentSeasonService');
const sportsApiService = require('./sportsApiService');
const roundMappingService = require('./roundMappingService');

/**
 * 🎯 LEAGUE MANAGER - SISTEMA GESTIONE LEGHE AUTOMATICO
 * 
 * Centralizza tutta la logica di gestione leghe con:
 * - Configurazione tier (TIER_1, TIER_2, TIER_3)
 * - Pattern matching per partite importanti
 * - Sliding window automatico
 * - Smart refresh logic
 * - Featured matches detection
 * 
 * Integra seamlessly con backgroundScheduler per automazione completa.
 */

class LeagueManager {
  constructor() {
    // Load configuration from JSON
    this.config = this._loadConfiguration();
    this.importantMatchPatterns = this._loadImportantMatchPatterns();
    
    console.log('[LeagueManager] Initialized with tier-based league management');
    this.logConfiguration();
  }
  
  /**
   * 🏆 Get complete league configuration with tiers
   */
  async getLeagueConfiguration() {
    return this.config;
  }
  
  /**
   * 🔄 Refresh a specific league with smart options
   */
  async refreshLeague(leagueKey, options = {}) {
    const startTime = Date.now();
    console.log(`\n🔄 [LeagueManager] Refreshing ${leagueKey}...`);
    
    try {
      const leagueConfig = this.config.leagues.find(l => l.key === leagueKey);
      
      if (!leagueConfig) {
        throw new Error(`League ${leagueKey} not found in configuration`);
      }
      
      const refreshOptions = {
        type: 'rounds',
        count: options.rounds || leagueConfig.roundsToLoad || 2,
        forceRefresh: options.forceRefresh || false,
        sliding: options.sliding !== false // Default true
      };
      
      console.log(`📊 Refresh options for ${leagueKey}:`, refreshOptions);
      
      // Use existing roundBasedSyncService but with our smart logic
      const syncResult = await roundBasedSyncService.syncFixtures(leagueKey, refreshOptions);
      
      if (options.sliding && syncResult.success) {
        // After successful refresh, run sliding window cleanup
        await this.runSlidingWindow(leagueKey);
      }
      
      // Check for important matches in the refreshed data
      if (syncResult.success) {
        await this.detectImportantMatches(leagueKey);
      }
      
      const duration = Date.now() - startTime;
      
      const result = {
        success: syncResult.success,
        totalFixtures: syncResult.totalFixtures || 0,
        newMatches: syncResult.newMatches || 0,
        cacheHits: syncResult.cacheHits || 0,
        errors: syncResult.errors || 0,
        apiCalls: this._estimateApiCalls(refreshOptions),
        duration: duration,
        tier: leagueConfig.tier,
        error: syncResult.error || null
      };
      
      console.log(`✅ ${leagueKey} refresh completed: ${result.totalFixtures} fixtures in ${duration}ms`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Failed to refresh ${leagueKey}:`, error.message);
      return {
        success: false,
        error: error.message,
        totalFixtures: 0,
        newMatches: 0,
        cacheHits: 0,
        errors: 1,
        apiCalls: 0,
        duration: Date.now() - startTime
      };
    }
  }
  
  /**
   * 🔄 Sliding Window: Remove old matches, ensure future coverage
   */
  async runSlidingWindow(leagueKey) {
    try {
      console.log(`🔄 Running sliding window cleanup for ${leagueKey}...`);
      
      const PopularMatch = require('../models/PopularMatch');
      const leagueConfig = this.config.leagues.find(l => l.key === leagueKey);
      
      if (!leagueConfig) return;
      
      // Get current date
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      // Remove matches older than yesterday
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];
      
      const oldMatches = await PopularMatch.find({
        league: { $regex: new RegExp(leagueConfig.name, 'i') },
        date: { $lt: yesterdayString }
      });
      
      if (oldMatches.length > 0) {
        await PopularMatch.deleteMany({
          league: { $regex: new RegExp(leagueConfig.name, 'i') },
          date: { $lt: yesterdayString }
        });
        
        console.log(`🗑️ Removed ${oldMatches.length} old matches for ${leagueKey}`);
      }
      
      // Backfill roundId per match futuri senza round (migliora grouping e conteggio)
      try {
        await this.backfillRoundIds(leagueKey);
      } catch (bfErr) {
        console.warn(`⚠️ Backfill roundId failed for ${leagueKey}: ${bfErr.message}`);
      }

      // Conta SOLO match con roundId valorizzato
      const futureMatches = await PopularMatch.find({
        league: { $regex: new RegExp(leagueConfig.name, 'i') },
        date: { $gte: todayString },
        roundId: { $ne: null }
      }).countDocuments();
      
      const expectedFutureMatches = (leagueConfig.roundsToLoad || 2) * (leagueConfig.matchesPerRound || 10);
      
      console.log(`📊 ${leagueKey}: ${futureMatches} future matches (expected: ${expectedFutureMatches})`);
      
      if (futureMatches < expectedFutureMatches) {
        console.log(`⚠️ ${leagueKey} insufficient future matches WITH ROUND (${futureMatches} < ${expectedFutureMatches}), triggering top-up refresh...`);
        try {
          await this.refreshLeague(leagueKey, { rounds: leagueConfig.roundsToLoad, sliding: false });
        } catch (err) {
          console.error(`❌ Top-up refresh failed for ${leagueKey}:`, err.message);
        }
      }
      
    } catch (error) {
      console.error(`❌ Sliding window failed for ${leagueKey}:`, error.message);
    }
  }

  /**
   * 🩹 Backfill roundId per match futuri senza round, usando BETWEEN e mapping round
   */
  async backfillRoundIds(leagueKey) {
    const PopularMatch = require('../models/PopularMatch');
    const leagueConfig = this.config.leagues.find(l => l.key === leagueKey);
    if (!leagueConfig) return;

    const today = new Date();
    const start = today.toISOString().slice(0,10);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30);
    const end = endDate.toISOString().slice(0,10);

    const missing = await PopularMatch.find({
      league: { $regex: new RegExp(leagueConfig.name, 'i') },
      date: { $gte: start },
      $or: [{ roundId: { $eq: null } }, { roundId: { $exists: false } }]
    }).lean();

    if (missing.length === 0) {
      return;
    }

    console.log(`🩹 Backfilling roundId for ${missing.length} future matches in ${leagueKey} using BETWEEN ${start} → ${end}`);

    // Prendi fixtures raw tra le date e costruisci mappa id->round
    const raw = await sportsApiService.getFixturesBetween(start, end, { leagueKey });
    const idToRound = new Map();
    raw.forEach(fx => {
      if (fx && fx.id && (fx.round_id || fx.round?.id)) {
        idToRound.set(String(fx.id), String(fx.round_id || fx.round.id));
      }
    });

    // Applica backfill
    let updated = 0;
    for (const m of missing) {
      const rid = idToRound.get(String(m.matchId));
      if (rid) {
        await PopularMatch.updateOne({ _id: m._id }, { $set: { roundId: rid } });
        updated++;
      }
    }

    console.log(`🩹 Backfill result for ${leagueKey}: updated ${updated}/${missing.length} matches with roundId`);
  }
  
  /**
   * 🔥 Detect and mark important matches based on patterns
   */
  async detectImportantMatches(leagueKey) {
    try {
      console.log(`🔍 Detecting important matches for ${leagueKey}...`);
      
      const PopularMatch = require('../models/PopularMatch');
      const leagueConfig = this.config.leagues.find(l => l.key === leagueKey);
      
      if (!leagueConfig) return;
      
      // Get recent matches for this league
      const recentMatches = await PopularMatch.find({
        league: { $regex: new RegExp(leagueConfig.name, 'i') },
        date: { $gte: new Date().toISOString().split('T')[0] }
      });
      
      let importantCount = 0;
      
      for (const match of recentMatches) {
        const isImportant = this._checkIfMatchIsImportant(match.homeTeam, match.awayTeam, leagueKey);
        
        if (isImportant) {
          // Mark as featured (you could extend PopularMatch schema for this)
          console.log(`🔥 Important match detected: ${match.homeTeam} vs ${match.awayTeam} (${isImportant.reason})`);
          importantCount++;
          
          // Could add a featured flag or priority score here
          // For now, we just log it
        }
      }
      
      if (importantCount > 0) {
        console.log(`✨ Found ${importantCount} important matches in ${leagueKey}`);
      }
      
    } catch (error) {
      console.error(`❌ Important match detection failed for ${leagueKey}:`, error.message);
    }
  }
  
  /**
   * 🎯 Check if a match is important based on patterns
   */
  _checkIfMatchIsImportant(homeTeam, awayTeam, leagueKey) {
    const patterns = this.importantMatchPatterns;
    
    // Check derbies and clasicos
    for (const derby of patterns.derbies) {
      if (this._teamsMatch(derby.teams, [homeTeam, awayTeam])) {
        return {
          type: 'derby',
          reason: derby.label,
          priority: derby.priority
        };
      }
    }
    
    // Check big club matches
    const homeIsBig = patterns.bigClubs.some(club => 
      homeTeam.toLowerCase().includes(club.toLowerCase())
    );
    const awayIsBig = patterns.bigClubs.some(club => 
      awayTeam.toLowerCase().includes(club.toLowerCase())
    );
    
    if (homeIsBig && awayIsBig) {
      return {
        type: 'bigClubVsBigClub',
        reason: 'Two big clubs',
        priority: 'MEDIUM'
      };
    }
    
    // Check specific rivalries by league
    const leaguePatterns = patterns.byLeague[leagueKey];
    if (leaguePatterns) {
      for (const rivalry of leaguePatterns) {
        if (this._teamsMatch(rivalry.teams, [homeTeam, awayTeam])) {
          return {
            type: 'rivalry',
            reason: rivalry.label,
            priority: rivalry.priority
          };
        }
      }
    }
    
    return false;
  }
  
  /**
   * 🔍 Helper to check if two teams match a pattern
   */
  _teamsMatch(patternTeams, matchTeams) {
    return patternTeams.every(patternTeam => 
      matchTeams.some(matchTeam => 
        matchTeam.toLowerCase().includes(patternTeam.toLowerCase()) ||
        patternTeam.toLowerCase().includes(matchTeam.toLowerCase())
      )
    );
  }
  
  /**
   * 📊 Estimate API calls needed for a refresh operation
   */
  _estimateApiCalls(options) {
    // Each round-based sync typically uses 1 API call per date
    // For 2 rounds over ~7 days = ~7 calls maximum
    // But with caching, usually 1-2 calls
    return options.count || 1;
  }
  
  /**
   * 📁 Load league configuration from JSON
   */
  _loadConfiguration() {
    try {
      // Load base season mappings
      const mappingsPath = path.join(__dirname, '../data/seasonMappings.json');
      const seasonMappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
      
      // Build league configuration with tier information
      const leagues = [
        // TIER 1: Always fresh (Italian priority)
        {
          key: 'serie-a',
          name: 'Serie A',
          tier: 'TIER_1',
          priority: 'HIGH',
          roundsToLoad: 2,
          matchesPerRound: 10,
          refreshInterval: 'daily',
          ...seasonMappings.leagues['serie-a']
        },
        {
          key: 'serie-b',
          name: 'Serie B',
          tier: 'TIER_1',
          priority: 'HIGH',
          roundsToLoad: 2,
          matchesPerRound: 10,
          refreshInterval: 'daily',
          ...seasonMappings.leagues['serie-b']
        },
        {
          key: 'coppa-italia',
          name: 'Coppa Italia',
          tier: 'TIER_1',
          priority: 'HIGH',
          roundsToLoad: 1,
          matchesPerRound: 8,
          refreshInterval: 'daily',
          id: 81, // Coppa Italia ID
          currentSeasonId: 25721, // Example
          regularSeasonId: 77476985 // Example
        },
        
        // TIER 2: Semi-automatic (Major international)
        {
          key: 'premier-league',
          name: 'Premier League',
          tier: 'TIER_2',
          priority: 'MEDIUM',
          roundsToLoad: 2,
          matchesPerRound: 10,
          refreshInterval: '2days',
          ...seasonMappings.leagues['premier-league']
        },
        {
          key: 'la-liga',
          name: 'La Liga',
          tier: 'TIER_2',
          priority: 'MEDIUM',
          roundsToLoad: 2,
          matchesPerRound: 10,
          refreshInterval: '2days',
          ...seasonMappings.leagues['la-liga']
        },
        {
          key: 'champions-league',
          name: 'Champions League',
          tier: 'TIER_2',
          priority: 'MEDIUM',
          roundsToLoad: 1,
          matchesPerRound: 16,
          refreshInterval: '2days',
          id: 2, // Champions League ID
          currentSeasonId: 25632, // Example
          regularSeasonId: 77476889 // Example
        },
        {
          key: 'europa-league',
          name: 'Europa League',
          tier: 'TIER_2',
          priority: 'MEDIUM',
          roundsToLoad: 1,
          matchesPerRound: 12,
          refreshInterval: '2days',
          id: 5, // Europa League ID
          currentSeasonId: 25633, // Example
          regularSeasonId: 77476890 // Example
        },
        
        // TIER 3: Standard refresh (Other leagues)
        {
          key: 'ligue-1',
          name: 'Ligue 1',
          tier: 'TIER_3',
          priority: 'LOW',
          roundsToLoad: 2,
          matchesPerRound: 9,
          refreshInterval: '3days',
          ...seasonMappings.leagues['ligue-1']
        },
        {
          key: 'bundesliga',
          name: 'Bundesliga',
          tier: 'TIER_3',
          priority: 'LOW',
          roundsToLoad: 2,
          matchesPerRound: 9,
          refreshInterval: '3days',
          ...seasonMappings.leagues['bundesliga']
        },
        {
          key: 'eredivisie',
          name: 'Eredivisie',
          tier: 'TIER_3',
          priority: 'LOW',
          roundsToLoad: 2,
          matchesPerRound: 9,
          refreshInterval: '3days',
          ...seasonMappings.leagues['eredivisie']
        },
        {
          key: 'primeira-liga',
          name: 'Liga Portugal',
          tier: 'TIER_3',
          priority: 'LOW',
          roundsToLoad: 2,
          matchesPerRound: 9,
          refreshInterval: '3days',
          id: 271, // Primeira Liga ID
          currentSeasonId: 25703, // Example
          regularSeasonId: 77476969 // Example
        }
      ];
      
      return {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        leagues: leagues,
        metadata: {
          totalLeagues: leagues.length,
          tier1Count: leagues.filter(l => l.tier === 'TIER_1').length,
          tier2Count: leagues.filter(l => l.tier === 'TIER_2').length,
          tier3Count: leagues.filter(l => l.tier === 'TIER_3').length
        }
      };
      
    } catch (error) {
      console.error('[LeagueManager] Failed to load configuration:', error.message);
      // Return minimal fallback configuration
      return {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        leagues: [],
        metadata: { error: 'Failed to load configuration' }
      };
    }
  }
  
  /**
   * 🔥 Load important match patterns
   */
  _loadImportantMatchPatterns() {
    return {
      // Universal derbies and clasicos
      derbies: [
        { teams: ['Real Madrid', 'Barcelona'], label: 'El Clasico', priority: 'HIGH' },
        { teams: ['Real Madrid', 'Atletico Madrid'], label: 'Derby Madrid', priority: 'MEDIUM' },
        { teams: ['Milan', 'Inter'], label: 'Derby Milano', priority: 'HIGH' },
        { teams: ['Juventus', 'Inter'], label: 'Derby d\'Italia', priority: 'HIGH' },
        { teams: ['Roma', 'Lazio'], label: 'Derby Roma', priority: 'MEDIUM' },
        { teams: ['Manchester United', 'Manchester City'], label: 'Manchester Derby', priority: 'HIGH' },
        { teams: ['Liverpool', 'Everton'], label: 'Merseyside Derby', priority: 'MEDIUM' },
        { teams: ['Arsenal', 'Tottenham'], label: 'North London Derby', priority: 'MEDIUM' },
        { teams: ['Bayern Munich', 'Borussia Dortmund'], label: 'Der Klassiker', priority: 'HIGH' }
      ],
      
      // Big clubs (always interesting when they play each other)
      bigClubs: [
        'Real Madrid', 'Barcelona', 'Atletico Madrid',
        'Manchester United', 'Manchester City', 'Liverpool', 'Arsenal', 'Chelsea',
        'Bayern Munich', 'Borussia Dortmund',
        'Juventus', 'Milan', 'Inter', 'Roma', 'Napoli',
        'Paris Saint-Germain', 'Marseille',
        'Ajax', 'PSV',
        'Porto', 'Benfica', 'Sporting'
      ],
      
      // League-specific important matches
      byLeague: {
        'serie-a': [
          { teams: ['Juventus', 'Milan'], label: 'Juventus vs Milan', priority: 'HIGH' },
          { teams: ['Juventus', 'Roma'], label: 'Juventus vs Roma', priority: 'MEDIUM' },
          { teams: ['Napoli', 'Juventus'], label: 'Napoli vs Juventus', priority: 'MEDIUM' }
        ],
        'premier-league': [
          { teams: ['Liverpool', 'Manchester United'], label: 'Liverpool vs Man United', priority: 'HIGH' },
          { teams: ['Arsenal', 'Chelsea'], label: 'Arsenal vs Chelsea', priority: 'MEDIUM' }
        ],
        'la-liga': [
          { teams: ['Barcelona', 'Atletico Madrid'], label: 'Barcelona vs Atletico', priority: 'MEDIUM' },
          { teams: ['Valencia', 'Barcelona'], label: 'Valencia vs Barcelona', priority: 'MEDIUM' }
        ]
      }
    };
  }
  
  /**
   * 📋 Log current configuration
   */
  logConfiguration() {
    const config = this.config;
    console.log('\n📋 [LeagueManager] Configuration loaded:');
    console.log(`   📊 Total leagues: ${config.metadata.totalLeagues}`);
    console.log(`   🥇 TIER 1: ${config.metadata.tier1Count} leagues (daily refresh)`);
    console.log(`   🥈 TIER 2: ${config.metadata.tier2Count} leagues (2-day refresh)`);
    console.log(`   🥉 TIER 3: ${config.metadata.tier3Count} leagues (3-day refresh)`);
    console.log(`   🔥 Important match patterns: ${this.importantMatchPatterns.derbies.length} derbies, ${this.importantMatchPatterns.bigClubs.length} big clubs`);
    console.log('');
  }
  
  /**
   * 📊 Get league statistics
   */
  async getLeagueStats() {
    try {
      const PopularMatch = require('../models/PopularMatch');
      
      const stats = {};
      
      for (const league of this.config.leagues) {
        const matchCount = await PopularMatch.find({
          league: { $regex: new RegExp(league.name, 'i') }
        }).countDocuments();
        
        const futureMatchCount = await PopularMatch.find({
          league: { $regex: new RegExp(league.name, 'i') },
          date: { $gte: new Date().toISOString().split('T')[0] }
        }).countDocuments();
        
        stats[league.key] = {
          tier: league.tier,
          totalMatches: matchCount,
          futureMatches: futureMatchCount,
          lastCheck: new Date()
        };
      }
      
      return stats;
      
    } catch (error) {
      console.error('Failed to get league stats:', error.message);
      return {};
    }
  }
}

// Singleton instance
const leagueManager = new LeagueManager();

module.exports = leagueManager;




