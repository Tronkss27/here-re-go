const crypto = require('crypto')
const validator = require('validator')

/**
 * Middleware di sicurezza avanzato per sistema multi-tenant
 */
class SecurityMiddleware {
  
  /**
   * Sanitizzazione input per prevenire injection attacks
   */
  static sanitizeInput(req, res, next) {
    const sanitizeValue = (value) => {
      if (typeof value === 'string') {
        // Rimuovi caratteri potenzialmente pericolosi
        return validator.escape(value.trim())
      }
      if (typeof value === 'object' && value !== null) {
        const sanitized = {}
        for (const [key, val] of Object.entries(value)) {
          sanitized[key] = sanitizeValue(val)
        }
        return sanitized
      }
      return value
    }
    
    // Sanitizza body, query, params
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeValue(req.body)
    }
    
    // Query è read-only, creiamo una copia sanitizzata
    if (req.query && Object.keys(req.query).length > 0) {
      const sanitizedQuery = sanitizeValue(req.query)
      // Sostituiamo i valori uno per uno invece di riassegnare l'oggetto
      Object.keys(req.query).forEach(key => {
        if (sanitizedQuery[key] !== undefined) {
          req.query[key] = sanitizedQuery[key]
        }
      })
    }
    
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeValue(req.params)
    }
    
    next()
  }
  
  /**
   * Validazione tenant ownership per prevenire cross-tenant access
   */
  static validateTenantOwnership(req, res, next) {
    // Skip per system admin
    if (req.user?.role === 'system_admin') {
      return next()
    }
    
    // Verifica che user appartenga al tenant corrente
    if (req.user && req.tenant) {
      if (req.user.tenantId.toString() !== req.tenant._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Cross-tenant access denied',
          message: 'User does not belong to the requested tenant'
        })
      }
    }
    
    next()
  }
  
  /**
   * Logging di sicurezza per operazioni sensibili
   */
  static securityLogger(operation) {
    return (req, res, next) => {
      const logData = {
        timestamp: new Date().toISOString(),
        operation,
        tenantId: req.tenant?._id,
        tenantSlug: req.tenant?.slug,
        userId: req.user?._id,
        userRole: req.user?.role,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        method: req.method,
        url: req.originalUrl,
        body: operation.includes('sensitive') ? '[REDACTED]' : req.body
      }
      
      console.log(`[SECURITY] ${operation}:`, JSON.stringify(logData, null, 2))
      
      // In produzione, invia a servizio di logging esterno
      if (process.env.NODE_ENV === 'production') {
        // TODO: Integrare con servizio di logging (es. Winston, Datadog)
      }
      
      next()
    }
  }
  
  /**
   * Validazione CSRF token per operazioni critiche
   */
  static validateCSRF(req, res, next) {
    // Skip per API calls con JWT
    if (req.headers.authorization) {
      return next()
    }
    
    const csrfToken = req.headers['x-csrf-token'] || req.body._csrf
    const sessionToken = req.session?.csrfToken
    
    if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
      return res.status(403).json({
        success: false,
        error: 'CSRF token validation failed',
        message: 'Invalid or missing CSRF token'
      })
    }
    
    next()
  }
  
  /**
   * Controllo integrità dati per prevenire tampering
   */
  static validateDataIntegrity(req, res, next) {
    // Verifica che i dati critici non siano stati modificati
    if (req.body && req.body._id) {
      // Previeni modifica diretta di _id
      delete req.body._id
    }
    
    if (req.body && req.body.tenantId) {
      // Verifica che tenantId corrisponda al tenant corrente
      if (req.tenant && req.body.tenantId !== req.tenant._id.toString()) {
        return res.status(400).json({
          success: false,
          error: 'Data integrity violation',
          message: 'TenantId mismatch detected'
        })
      }
    }
    
    next()
  }
  
  /**
   * Controllo limiti di upload per tenant
   */
  static validateUploadLimits(req, res, next) {
    if (!req.tenant) {
      return next()
    }
    
    const maxFileSize = req.tenant.settings.limits.storageLimit * 1024 * 1024 // MB to bytes
    const currentUsage = req.tenant.usage.storageUsed * 1024 * 1024
    
    // Stima dimensione richiesta
    const contentLength = parseInt(req.headers['content-length'] || '0')
    
    if (currentUsage + contentLength > maxFileSize) {
      return res.status(413).json({
        success: false,
        error: 'Storage limit exceeded',
        message: `Upload would exceed storage limit of ${req.tenant.settings.limits.storageLimit}MB`,
        current: Math.round(currentUsage / (1024 * 1024)),
        limit: req.tenant.settings.limits.storageLimit
      })
    }
    
    next()
  }
  
  /**
   * Generazione nonce per CSP
   */
  static generateNonce(req, res, next) {
    req.nonce = crypto.randomBytes(16).toString('base64')
    res.locals.nonce = req.nonce
    next()
  }
  
  /**
   * Headers di sicurezza avanzati
   */
  static setSecurityHeaders(req, res, next) {
    // Content Security Policy
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${req.nonce || ''}'`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
    
    res.setHeader('Content-Security-Policy', csp)
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-XSS-Protection', '1; mode=block')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
    
    // HSTS per HTTPS
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    }
    
    next()
  }
  
  /**
   * Validazione formato email sicura
   */
  static validateEmail(email) {
    if (!email || typeof email !== 'string') return false
    
    // Validazione base
    if (!validator.isEmail(email)) return false
    
    // Controlli aggiuntivi
    const [localPart, domain] = email.split('@')
    
    // Lunghezza massima
    if (email.length > 254) return false
    if (localPart.length > 64) return false
    
    // Caratteri pericolosi
    const dangerousChars = /[<>'"&]/
    if (dangerousChars.test(email)) return false
    
    return true
  }
  
  /**
   * Validazione password sicura
   */
  static validatePassword(password) {
    if (!password || typeof password !== 'string') return false
    
    // Lunghezza minima
    if (password.length < 8) return false
    
    // Deve contenere almeno:
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    
    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
  }
}

module.exports = SecurityMiddleware 