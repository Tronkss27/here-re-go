const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const matchAnnouncementController = require('../controllers/matchAnnouncementController');
const { authenticateVenue } = require('../middlewares/auth');

// ================================
// 🔍 RICERCA PUBBLICA (NO AUTH)
// ================================

// 🧪 Cleanup dati di test (solo development)
router.delete('/test/cleanup',
  matchAnnouncementController.cleanupTestData
);

// Ricerca partite tramite API esterne
router.get('/search/matches',
  [
    query('query').optional().isString().trim().isLength({ max: 100 }),
    query('league').optional().isString().trim(),
    query('fromDate').optional().isISO8601(),
    query('toDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  matchAnnouncementController.searchMatches
);

// Ricerca pubblica annunci (tutti i locali)
router.get('/search/public',
  [
    query('query').optional().isString().trim().isLength({ max: 100 }),
    query('date').optional().isISO8601(),
    query('competition').optional().isString().trim(),
    query('city').optional().isString().trim().isLength({ max: 50 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('page').optional().isInt({ min: 1 })
  ],
  matchAnnouncementController.searchPublicAnnouncements
);

// Ottieni competizioni disponibili
router.get('/competitions',
  matchAnnouncementController.getCompetitions
);

// Ottieni singolo annuncio (pubblico)
router.get('/public/:id',
  [
    param('id').isMongoId(),
    query('incrementView').optional().isBoolean()
  ],
  matchAnnouncementController.getAnnouncement
);

// Track click su annuncio
router.post('/track/click/:id',
  [param('id').isMongoId()],
  matchAnnouncementController.trackClick
);

// Track click su match (per analytics - NO AUTH RICHIESTA)
router.post('/track/match-click',
  [
    body('matchId').isString().notEmpty(),
    body('venueId').optional().isString(),
    body('timestamp').optional().isISO8601()
  ],
  matchAnnouncementController.trackMatchClick
);

// Track view su annuncio (PUBLIC - NO AUTH)
router.post('/announcements/:id/track/view',
  [param('id').isMongoId()],
  matchAnnouncementController.trackAnnouncementView
);

// Test connessione API (admin)
router.get('/test/api-connection',
  matchAnnouncementController.testApiConnection
);

// ================================
// 🏟️ GESTIONE VENUE (REQUIRE AUTH)
// ================================

// Middleware di autenticazione per tutte le route successive
router.use(authenticateVenue);

// Crea nuovo annuncio
router.post('/',
  [
    // Validazione match object
    body('match.id').isString().notEmpty(),
    body('match.homeTeam').isString().trim().isLength({ min: 1, max: 100 }),
    body('match.awayTeam').isString().trim().isLength({ min: 1, max: 100 }),
    body('match.competition.id').isString().notEmpty(),
    body('match.competition.name').isString().trim().isLength({ min: 1, max: 100 }),
    body('match.date').isISO8601(),
    body('match.time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    
    // Validazione event details
    body('eventDetails.startDate').isISO8601(),
    body('eventDetails.startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('eventDetails.endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('eventDetails.description').optional().isString().isLength({ max: 1000 }),
    // Validazione offerte
    body('eventDetails.selectedOffers').optional().isArray({ max: 10 }),
    body('eventDetails.selectedOffers.*.id').optional().isString().notEmpty(),
    body('eventDetails.selectedOffers.*.title').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('eventDetails.selectedOffers.*.description').optional().isString().trim().isLength({ min: 1, max: 500 })
  ],
  matchAnnouncementController.createAnnouncement
);

// Ottieni annunci del venue corrente
router.get('/venue',
  [
    query('status').optional().isIn(['published', 'draft', 'archived']),
    query('fromDate').optional().isISO8601(),
    query('competition').optional().isString().trim(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('page').optional().isInt({ min: 1 }),
    query('includeArchived').optional().isBoolean(),
    query('includeExpired').optional().isBoolean(),
    query('lockHours').optional().isInt({ min: 0, max: 24 })
  ],
  matchAnnouncementController.getVenueAnnouncements
);

// Ottieni statistiche venue
router.get('/venue/stats',
  matchAnnouncementController.getVenueStats
);

// Ottieni singolo annuncio del venue
router.get('/:id',
  [param('id').isMongoId()],
  matchAnnouncementController.getAnnouncement
);

// Aggiorna annuncio
router.put('/:id',
  [
    param('id').isMongoId(),
    
    // Campi aggiornabili
    body('eventDetails.startDate').optional().isISO8601(),
    body('eventDetails.startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('eventDetails.endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('eventDetails.description').optional().isString().isLength({ max: 1000 }),
    body('eventDetails.selectedOffers').optional().isArray({ max: 10 }),
    body('status').optional().isIn(['published', 'draft', 'archived']),
    body('isActive').optional().isBoolean()
  ],
  matchAnnouncementController.updateAnnouncement
);

// Archivia annuncio (soft delete)
router.patch('/:id/archive',
  [param('id').isMongoId()],
  matchAnnouncementController.archiveAnnouncement
);

// Elimina (archivia) annuncio
router.delete('/:id',
  [param('id').isMongoId()],
  matchAnnouncementController.deleteAnnouncement
);

// ================================
// 📊 ANALYTICS & REPORTING
// ================================

// Statistiche dettagliate venue
router.get('/analytics/venue-detailed',
  matchAnnouncementController.getVenueStats
);

// ================================
// 🛠️ UTILITY ROUTES
// ================================

// Validazione comune per date
const validateDateRange = (req, res, next) => {
  const { fromDate, toDate } = req.query;
  
  if (fromDate && toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    
    if (from > to) {
      return res.status(400).json({
        success: false,
        message: 'La data di inizio deve essere precedente alla data di fine'
      });
    }
    
    // Limite massimo di 1 anno
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (to - from > oneYear) {
      return res.status(400).json({
        success: false,
        message: 'Il range di date non può superare 1 anno'
      });
    }
  }
  
  next();
};

// Validazione date applicata direttamente alle route specifiche che la necessitano

// 🔥 HOT MATCHES per Homepage (pubblico)
router.get('/hot', matchAnnouncementController.getHotMatches);

// 🏟️ Venues per una partita specifica (pubblico)
router.get('/match/:matchId/venues', matchAnnouncementController.getVenuesForMatch);

// Error handler per route non trovate
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} non trovata`,
    availableEndpoints: [
      'GET /search/matches - Ricerca partite',
      'GET /search/public - Ricerca pubblica annunci',
      'GET /competitions - Lista competizioni',
      'GET /hot - Hot matches per homepage',
      'GET /match/:matchId/venues - Venues per partita specifica',
      'GET /public/:id - Dettaglio annuncio pubblico',
      'POST /track/click/:id - Track click',
      'POST / - Crea annuncio (auth)',
      'GET /venue - Annunci venue (auth)',
      'GET /venue/stats - Statistiche venue (auth)',
      'GET /:id - Dettaglio annuncio (auth)',
      'PUT /:id - Aggiorna annuncio (auth)',
      'DELETE /:id - Elimina annuncio (auth)'
    ]
  });
});

// Error handler per errori di validazione
router.use((error, req, res, next) => {
  if (error) {
    console.error('❌ Match Announcements Route Error:', error);
    
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Errore interno del server',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  } else {
    next();
  }
});

module.exports = router; 