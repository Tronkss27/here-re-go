const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const GlobalMatch = require('../models/GlobalMatch');

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
    
    // Costruisci query
    const query = {};
    
    if (league) {
      query['league.id'] = league;
    }
    
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) query.date.$lte = new Date(toDate);
    }
    
    // Esegui query con paginazione
    const skip = (page - 1) * limit;
    const matches = await GlobalMatch.find(query)
      .sort({ date: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalMatches = await GlobalMatch.countDocuments(query);
    
    console.log(`🔍 Found ${matches.length} global matches for admin selection`);
    
    // Trasforma in formato atteso dal frontend
    const formattedMatches = matches.map(match => ({
      id: match.providerId,
      homeTeam: match.participants.home.name,
      awayTeam: match.participants.away.name,
      competition: {
        id: match.league.id,
        name: match.league.name,
        logo: match.league.logo
      },
      date: match.date.toISOString().split('T')[0],
      time: match.time,
      venue: match.venue?.name || 'Stadium',
      source: 'api-football' // Indica che è da API esterna
    }));
    
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

// GET /api/global-matches/leagues - Lista leghe disponibili
router.get('/leagues', async (req, res) => {
  try {
    const leagues = await GlobalMatch.distinct('league');
    
    console.log(`🏆 Found ${leagues.length} leagues`);
    
    res.json({
      success: true,
      data: leagues.filter(l => l && l.name) // Filtra leghe valide
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

module.exports = router; 