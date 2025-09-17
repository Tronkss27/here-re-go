const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const path = require('path')
require('dotenv').config()

const app = express()

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: false // Disabilito CORP di helmet per gestirlo manualmente
}))
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174', // Support both development ports
    'http://localhost:5175',  // New port for current frontend instance
    // Support per IP di rete locale per testing mobile/network
    'http://192.168.1.53:5174',
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:517[3-5]$/, // Regex per qualsiasi IP 192.168.x.x con porte 5173-5175
    /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:517[3-5]$/, // Regex per IP 10.x.x.x 
    /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}:517[3-5]$/ // Regex per IP 172.16-31.x.x
  ],
  credentials: true
}))

// Rate limiting per tenant
const tenantRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Limiti più generosi per lo sviluppo e onboarding
    const plan = req.tenant?.plan || 'trial'
    const limits = {
      trial: 1000,     // Aumentato da 100 a 1000
      basic: 2000,     // Aumentato da 500 a 2000
      premium: 5000,   // Aumentato da 2000 a 5000
      enterprise: 20000 // Aumentato da 10000 a 20000
    }
    return limits[plan] || 1000
  },
  keyGenerator: (req) => {
    // Rate limit per tenant
    return `${req.tenantId || 'default'}-${req.ip}`
  },
  message: {
    success: false,
    error: 'Rate limit exceeded',
    message: 'Too many requests for your plan'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Logging middleware
app.use(morgan('combined'))

// Serve static files (images) con headers cross-origin
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, '../uploads')))

// Security middleware avanzato
const SecurityMiddleware = require('./middlewares/security')
const AuditMiddleware = require('./middlewares/auditMiddleware')

// Nonce generation per CSP
app.use(SecurityMiddleware.generateNonce)

// Security headers
app.use(SecurityMiddleware.setSecurityHeaders)

// Input sanitization
app.use(SecurityMiddleware.sanitizeInput)

// Security error logging
app.use(AuditMiddleware.securityErrorLogger)

// Import delle route
const authRoutes = require('./routes/auth');
const tenantRoutes = require('./routes/tenants');
const venueRoutes = require('./routes/venues');
const bookingRoutes = require('./routes/bookings');
const fixtureRoutes = require('./routes/fixtures');
const matchAnnouncementRoutes = require('./routes/matchAnnouncements');
const matchRoutes = require('./routes/matches');
const analyticsRoutes = require('./routes/analytics');
const reviewsRoutes = require('./routes/reviews');
const offerTemplateRoutes = require('./routes/offerTemplates');

// PUBLIC ROUTES (senza autenticazione) - DEVONO VENIRE PRIMA DEI MIDDLEWARE
const matchAnnouncementController = require('./controllers/matchAnnouncementController');
const venueController = require('./controllers/venueController');

// Endpoint pubblici per homepage e navigazione
app.get('/api/match-announcements/hot', matchAnnouncementController.getHotMatches);
app.get('/api/match-announcements/match/:matchId/venues', matchAnnouncementController.getVenuesForMatch);
app.get('/api/match-announcements/search/public', matchAnnouncementController.searchPublicAnnouncements);
// NOTE: /api/venues/public is handled in routes/venues.js - removed duplicate

// Tenant middleware - Extract tenant context from requests
const TenantMiddleware = require('./middlewares/tenantMiddleware')
app.use(TenantMiddleware.extractTenant)

// Rate limiting dopo tenant extraction
app.use(tenantRateLimit)

// Tenant ownership validation
app.use(SecurityMiddleware.validateTenantOwnership)

// Data integrity validation
app.use(SecurityMiddleware.validateDataIntegrity)

// Audit logging per tutte le richieste (skip successful reads)
app.use(AuditMiddleware.auditLogger({ 
  skipSuccessfulReads: true,
  includeHeaders: false 
}))

// Routes con tenant validation
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/fixtures', fixtureRoutes);
app.use('/api/match-announcements', matchAnnouncementRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/offer-templates', offerTemplateRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', reviewsRoutes);
app.use('/api/global-matches', require('./routes/globalMatches'));
app.use('/api/sync-jobs', require('./routes/syncJobs'));

// Health check endpoint (non richiede tenant)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'SPOrTS API is running',
    timestamp: new Date().toISOString(),
    tenant: req.tenant ? req.tenant.slug : 'none'
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

// 404 handler - Fixed: no asterisk, just catch all unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  })
})

module.exports = app 
module.exports = app 