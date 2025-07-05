const rateLimit = require('express-rate-limit')
const MongoStore = require('rate-limit-mongo')

/**
 * Rate limiting per tenant con limiti personalizzati
 */
class TenantRateLimit {
  
  /**
   * Crea rate limiter basato sul piano del tenant
   */
  static createTenantLimiter() {
    return rateLimit({
      store: new MongoStore({
        uri: process.env.MONGODB_URI,
        collectionName: 'rateLimits',
        expireTimeMs: 15 * 60 * 1000 // 15 minuti
      }),
      
      // Chiave personalizzata per tenant
      keyGenerator: (req) => {
        const tenantId = req.tenant?._id || req.tenantId || 'anonymous'
        const userIp = req.ip || req.connection.remoteAddress
        return `${tenantId}:${userIp}`
      },
      
      // Limiti dinamici basati sul piano
      max: (req) => {
        if (!req.tenant) return 100 // Default per richieste senza tenant
        
        const planLimits = {
          trial: 200,
          basic: 500,
          premium: 1000,
          enterprise: 2000
        }
        
        return planLimits[req.tenant.plan] || 100
      },
      
      windowMs: 15 * 60 * 1000, // 15 minuti
      
      message: (req) => ({
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many requests for tenant ${req.tenant?.slug || 'unknown'}. Please try again later.`,
        retryAfter: Math.ceil(15 * 60), // secondi
        limit: req.rateLimit?.limit,
        remaining: req.rateLimit?.remaining,
        resetTime: new Date(Date.now() + 15 * 60 * 1000)
      }),
      
      standardHeaders: true,
      legacyHeaders: false,
      
      // Skip per system admin
      skip: (req) => {
        return req.user?.role === 'system_admin'
      },
      
      // Handler per quando il limite è superato
      onLimitReached: (req, res, options) => {
        console.warn(`Rate limit exceeded for tenant: ${req.tenant?.slug || 'unknown'}, IP: ${req.ip}`)
        
        // Log per monitoring
        if (req.tenant) {
          req.tenant.usage.lastActivity = new Date()
          req.tenant.save().catch(err => console.error('Failed to update tenant activity:', err))
        }
      }
    })
  }
  
  /**
   * Rate limiter specifico per operazioni critiche (registrazione, login)
   */
  static createStrictLimiter() {
    return rateLimit({
      store: new MongoStore({
        uri: process.env.MONGODB_URI,
        collectionName: 'strictRateLimits',
        expireTimeMs: 60 * 60 * 1000 // 1 ora
      }),
      
      keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress
      },
      
      max: 10, // Solo 10 tentativi per ora per IP
      windowMs: 60 * 60 * 1000, // 1 ora
      
      message: {
        success: false,
        error: 'Strict rate limit exceeded',
        message: 'Too many authentication attempts. Please try again later.',
        retryAfter: 3600
      },
      
      standardHeaders: true,
      legacyHeaders: false
    })
  }
  
  /**
   * Rate limiter per API endpoints specifici
   */
  static createAPILimiter(maxRequests = 100, windowMinutes = 15) {
    return rateLimit({
      store: new MongoStore({
        uri: process.env.MONGODB_URI,
        collectionName: 'apiRateLimits',
        expireTimeMs: windowMinutes * 60 * 1000
      }),
      
      keyGenerator: (req) => {
        const tenantId = req.tenant?._id || 'anonymous'
        const endpoint = req.route?.path || req.path
        return `${tenantId}:${endpoint}`
      },
      
      max: maxRequests,
      windowMs: windowMinutes * 60 * 1000,
      
      message: {
        success: false,
        error: 'API rate limit exceeded',
        message: `Too many requests to this endpoint. Limit: ${maxRequests} per ${windowMinutes} minutes.`
      }
    })
  }
}

module.exports = TenantRateLimit 