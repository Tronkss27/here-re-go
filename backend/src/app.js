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

// Rate limiting per tenant
const tenantRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Limiti diversi per piano tenant
    const plan = req.tenant?.plan || 'trial'
    const limits = {
      trial: 100,
      basic: 500,
      premium: 2000,
      enterprise: 10000
    }
    return limits[plan] || 100
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
app.use('/api/auth', require('./routes/auth'))

// Routes che richiedono tenant context
app.use('/api/venues', TenantMiddleware.requireTenant, require('./routes/venues'))
app.use('/api/fixtures', TenantMiddleware.requireTenant, require('./routes/fixtures'))
app.use('/api/bookings', TenantMiddleware.requireTenant, require('./routes/bookings'))
app.use('/api/match-announcements', TenantMiddleware.requireTenant, require('./routes/matchAnnouncements'))

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