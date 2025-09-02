const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const PopularMatch = require('../models/PopularMatch');
const roundMappingService = require('../services/roundMappingService');

// GET /api/global-matches - Lista partite disponibili per admin
router.get('/', [
  query('league').optional().isString(),
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('page').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const { league, fromDate, toDate, limit = 20, page = 1 } = req.query;
    
    // Costruisci query per PopularMatch
    const query = {};
    
    // Mappa league.id dal frontend al formato PopularMatch
    if (league) {
      // Mappa gli ID delle leghe dal frontend  
      const leagueMap = {
        'serie-a': 'Serie A',
        'serie-b': 'Serie B',
        'coppa-italia': 'Coppa Italia',
        'premier-league': 'Premier League', 
        'championship': 'Championship',
        'la-liga': 'La Liga',
        'bundesliga': 'Bundesliga',
        'ligue-1': 'Ligue 1',
        'eredivisie': 'Eredivisie',
        'primeira-liga': 'Liga Portugal'
      };
      query.league = leagueMap[league] || league;
    }
    
    // Filtra solo partite future (da oggi in poi)
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = fromDate; // PopularMatch usa string date
      if (toDate) query.date.$lte = toDate;
    } else {
      // Default: solo partite future
      const today = new Date().toISOString().split('T')[0];
      query.date = { $gte: today };
    }
    
    console.log('🔍 Query for PopularMatch:', query);
    
    // Esegui query con paginazione
    const skip = (page - 1) * limit;
    const matches = await PopularMatch.find(query)
      .sort({ date: 1, time: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalMatches = await PopularMatch.countDocuments(query);
    
    console.log(`🔍 Found ${matches.length} global matches for admin selection`);
    
    // Trasforma PopularMatch in formato atteso dal frontend
    const formattedMatches = matches.map(match => ({
      id: match.matchId,
      homeTeam: match.homeTeam,
      homeTeamLogo: match.homeTeamLogo,
      awayTeam: match.awayTeam,
      awayTeamLogo: match.awayTeamLogo,
      competition: {
        id: match.league?.toLowerCase().replace(' ', '-') || 'serie-a',
        name: match.league || 'Serie A',
        logo: match.leagueLogo || getLeagueLogo(match.league)
      },
      date: match.date,
      time: match.time,
      venue: 'Stadium',
      source: 'sync-api' // Indica che è da sincronizzazione
    }));
    
    // Helper per ottenere logo della lega (fallback agli emoji se non disponibili loghi reali)
    function getLeagueLogo(leagueName) {
      // URL reali corretti dall'API Sportmonks  
      const realLogos = {
        'Serie A': 'https://cdn.sportmonks.com/images/soccer/leagues/0/384.png',
        'Serie B': 'https://cdn.sportmonks.com/images/soccer/leagues/3/387.png',
        'Premier League': 'https://cdn.sportmonks.com/images/soccer/leagues/8/8.png', 
        'Championship': 'https://cdn.sportmonks.com/images/soccer/leagues/9/9.png',
        'La Liga': 'https://cdn.sportmonks.com/images/soccer/leagues/20/564.png',
        'LaLiga': 'https://cdn.sportmonks.com/images/soccer/leagues/20/564.png',
        'Bundesliga': 'https://cdn.sportmonks.com/images/soccer/leagues/18/82.png',
        'Ligue 1': 'https://cdn.sportmonks.com/images/soccer/leagues/13/301.png',
        'Eredivisie': 'https://cdn.sportmonks.com/images/soccer/leagues/72.png',
        'Liga Portugal': 'https://cdn.sportmonks.com/images/soccer/leagues/14/462.png',
        'Primeira Liga': 'https://cdn.sportmonks.com/images/soccer/leagues/14/462.png'
      };
      
      // Fallback emoji se loghi reali non disponibili
      const emojiLogos = {
        'Serie A': '🇮🇹',
        'Premier League': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        'Champions League': '🏆',
        'Europa League': '🥈',
        'La Liga': '🇪🇸',
        'Bundesliga': '🇩🇪'
      };
      
      return realLogos[leagueName] || emojiLogos[leagueName] || '⚽';
    }
    
    res.json({
      success: true,
      data: formattedMatches,
      pagination: {
        total: totalMatches,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalMatches / limit)
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching global matches:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero delle partite',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/global-matches/leagues - Lista leghe disponibili con loghi reali
router.get('/leagues', async (req, res) => {
  try {
    // Ottieni leghe dal database PopularMatch (per backward compatibility)
    const dbLeagues = await PopularMatch.distinct('league');
    console.log(`🏆 Found ${dbLeagues.length} leagues from database`);
    
    // 🎯 LEGHE SUPPORTATE DAL NUOVO SISTEMA ROUND-BASED
    // Queste leghe sono sempre disponibili perché supportano il nuovo sync system
    const roundBasedLeagues = [
      'serie-a', 'premier-league', 'ligue-1', 'serie-b', 
      'la-liga', 'bundesliga', 'eredivisie', 'primeira-liga', 'championship'
    ];
    
    // LEGHE REALI PIANO EUROPEAN SPORTMONKS (27 leghe disponibili)
    const availableLeagues = [
      // TOP 5 LEGHE EUROPEE
      {
        id: 'serie-a',
        name: 'Serie A',
        flag: '',
        logo: 'https://cdn.sportmonks.com/images/soccer/leagues/0/384.png',
        available: true // ✅ Sempre disponibile con round-based sync
      },
      {
        id: 'coppa-italia',
        name: 'Coppa Italia',
        flag: '',
        logo: 'https://upload.wikimedia.org/wikipedia/it/thumb/3/3d/Coppa_Italia_logo_2020.svg/1200px-Coppa_Italia_logo_2020.svg.png',
        available: true
      },
      {
        id: 'premier-league', 
        name: 'Premier League',
        flag: '',
        logo: 'https://cdn.sportmonks.com/images/soccer/leagues/8/8.png',
        available: true // ✅ Sempre disponibile con round-based sync
      },
      {
        id: 'la-liga',
        name: 'La Liga',
        flag: '',
        logo: 'https://cdn.sportmonks.com/images/soccer/leagues/20/564.png',
        available: true // ✅ Sempre disponibile con round-based sync
      },
      {
        id: 'bundesliga',
        name: 'Bundesliga',
        flag: '', 
        logo: 'https://cdn.sportmonks.com/images/soccer/leagues/18/82.png',
        available: true // ✅ Sempre disponibile con round-based sync
      },
      {
        id: 'ligue-1',
        name: 'Ligue 1',
        flag: '', 
        logo: 'https://cdn.sportmonks.com/images/soccer/leagues/13/301.png',
        available: true // ✅ Sempre disponibile con round-based sync
      },
      {
        id: 'eredivisie',
        name: 'Eredivisie',
        flag: '', 
        logo: 'https://cdn.sportmonks.com/images/soccer/leagues/72.png',
        available: true // ✅ Sempre disponibile con round-based sync
      },

      // ALTRE LEGHE EUROPEE (Piano European include 20+ leghe)
      {
        id: 'primeira-liga',
        name: 'Primeira Liga',
        flag: '', 
        logo: 'https://cdn.sportmonks.com/images/soccer/leagues/14/462.png',
        available: true // ✅ Sempre disponibile con round-based sync
      },
      {
        id: 'championship',
        name: 'Championship',
        flag: '', 
        logo: 'https://cdn.sportmonks.com/images/soccer/leagues/9/9.png',
        available: true // ✅ Sempre disponibile con round-based sync
      },
      {
        id: 'serie-b',
        name: 'Serie B',
        flag: '', 
        logo: 'https://cdn.sportmonks.com/images/soccer/leagues/3/387.png',
        available: true // ✅ Sempre disponibile con round-based sync
      }
    ];
    
    // Filtra solo leghe disponibili O mostra tutte per sincronizzazione
    const { onlyAvailable = false } = req.query;
    const leagues = onlyAvailable 
      ? availableLeagues.filter(l => l.available)
      : availableLeagues;
    
    console.log(`✅ Returning ${leagues.length} leagues (available filter: ${onlyAvailable})`);
    
    res.json({
      success: true,
      data: leagues,
      availableCount: availableLeagues.filter(l => l.available).length,
      totalCount: availableLeagues.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching leagues:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero delle leghe',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/global-matches/rounds - Partite raggruppate per giornata (round)
router.get('/rounds', [
  query('league').isString().withMessage('league is required'),
  query('limitRounds').optional().isInt({ min: 1, max: 5 })
], async (req, res) => {
  try {
    const { league, limitRounds = 2 } = req.query;

    // Mappa gli ID delle leghe dal frontend al formato PopularMatch.league
    const leagueMap = {
      'serie-a': 'Serie A',
      'serie-b': 'Serie B',
      'coppa-italia': 'Coppa Italia',
      'premier-league': 'Premier League', 
      'championship': 'Championship',
      'la-liga': 'La Liga',
      'bundesliga': 'Bundesliga',
      'ligue-1': 'Ligue 1',
      'eredivisie': 'Eredivisie',
      'primeira-liga': 'Liga Portugal'
    };

    const leagueName = leagueMap[league] || league;

    // Solo future (da oggi in poi)
    const today = new Date().toISOString().split('T')[0];

    // Recupera tutte le partite future con roundId valorizzato
    const matches = await PopularMatch.find({
      league: leagueName,
      roundId: { $ne: null },
      date: { $gte: today }
    })
      .sort({ date: 1, time: 1 })
      .lean();

    // Group by roundId
    const byRound = new Map();
    for (const m of matches) {
      if (!m.roundId) continue;
      if (!byRound.has(m.roundId)) byRound.set(m.roundId, []);
      byRound.get(m.roundId).push(m);
    }

    // Ordina i round per data minima (primi in calendario)
    const sortedRoundEntries = Array.from(byRound.entries()).sort((a, b) => {
      const minA = a[1][0]?.date || '9999-12-31';
      const minB = b[1][0]?.date || '9999-12-31';
      return minA.localeCompare(minB);
    });

    const limitedRounds = sortedRoundEntries.slice(0, Number(limitRounds));

    // Trasforma per frontend
    const rounds = limitedRounds.map(([roundId, list], idx) => {
      // Calcola numero giornata a partire da SEASONID.md per coerenza
      const mappedRoundNumber = roundMappingService.getRoundNumber(league, roundId);
      const inferredRoundNumber = mappedRoundNumber || (list.find(m => typeof m.roundNumber === 'number')?.roundNumber || null);
      const items = list.map(match => ({
        id: match.matchId,
        homeTeam: match.homeTeam,
        homeTeamLogo: match.homeTeamLogo,
        awayTeam: match.awayTeam,
        awayTeamLogo: match.awayTeamLogo,
        competition: {
          id: (match.league || '').toLowerCase().replace(' ', '-'),
          name: match.league,
          logo: match.leagueLogo
        },
        date: match.date,
        time: match.time || null,
        venue: 'Stadium',
        source: 'sync-api'
      })).sort((a, b) => {
        // Ordina per data+ora
        const d = a.date.localeCompare(b.date);
        if (d !== 0) return d;
        return (a.time || '00:00').localeCompare(b.time || '00:00');
      });

      return {
        roundId,
        roundNumber: inferredRoundNumber || idx + 1,
        count: items.length,
        earliestDate: items[0]?.date || null,
        fixtures: items
      };
    });

    res.json({ success: true, data: rounds });

  } catch (error) {
    console.error('❌ Error fetching rounds:', error);
    res.status(500).json({ success: false, message: 'Errore durante il recupero delle giornate' });
  }
});

module.exports = router; 
