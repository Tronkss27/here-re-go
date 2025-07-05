const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const app = express()

// Security middleware
app.use(helmet())
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174', // Support both development ports
    'http://localhost:5175'  // New port for current frontend instance
  ],
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // More permissive in development
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(15 * 60 * 1000 / 1000) // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Logging middleware
app.use(morgan('combined'))

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

// Tenant middleware - Extract tenant context from requests
const TenantMiddleware = require('./middlewares/tenantMiddleware')
app.use(TenantMiddleware.extractTenant)
app.use(TenantMiddleware.updateLastActivity)

// Tenant ownership validation
app.use(SecurityMiddleware.validateTenantOwnership)

// Data integrity validation
app.use(SecurityMiddleware.validateDataIntegrity)

// Audit logging per tutte le richieste (skip successful reads)
app.use(AuditMiddleware.auditLogger({ 
  skipSuccessfulReads: true,
  includeHeaders: false 
}))

// Routes
app.use('/api/auth', require('./routes/auth'))
// app.use('/api/tenants', require('./routes/tenants'))
app.use('/api/venues', require('./routes/venues'))
app.use('/api/fixtures', require('./routes/fixtures'))
app.use('/api/bookings', require('./routes/bookings'))
// app.use('/api/offers', require('./routes/offers'))
// app.use('/api/reviews', require('./routes/reviews'))

// 🚀 NEW: Match announcements routes - WORKING NOW
app.use('/api/match-announcements', require('./routes/matchAnnouncements'))

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'SPOrTS API is running',
    timestamp: new Date().toISOString()
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  })
})

// 404 handler - Fixed: no asterisk, just catch all unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  })
})

module.exports = app 