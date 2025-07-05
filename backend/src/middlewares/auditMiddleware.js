const AuditLog = require('../models/AuditLog')

/**
 * Middleware per audit logging automatico
 */
class AuditMiddleware {
  
  /**
   * Middleware principale per logging delle richieste
   */
  static auditLogger(options = {}) {
    const {
      includeBody = true,
      includeQuery = true,
      includeHeaders = false,
      sensitiveFields = ['password', 'token', 'secret', 'apiKey'],
      skipSuccessfulReads = false
    } = options
    
    return async (req, res, next) => {
      const startTime = Date.now()
      
      // Intercetta la risposta
      const originalSend = res.send
      let responseBody = null
      let statusCode = null
      
      res.send = function(body) {
        responseBody = body
        statusCode = res.statusCode
        return originalSend.call(this, body)
      }
      
      // Continua con la richiesta
      res.on('finish', async () => {
        try {
          const endTime = Date.now()
          const responseTime = endTime - startTime
          
          // Skip logging per letture successful se richiesto
          if (skipSuccessfulReads && req.method === 'GET' && statusCode < 400) {
            return
          }
          
          // Determina action e resource
          const action = AuditMiddleware.determineAction(req.method, req.originalUrl, statusCode)
          const resource = AuditMiddleware.determineResource(req.originalUrl)
          
          // Prepara dati per audit log
          const auditData = {
            tenantId: req.tenant?._id,
            userId: req.user?._id,
            action,
            resource,
            resourceId: req.params?.id || req.body?.id,
            method: req.method,
            endpoint: req.originalUrl,
            success: statusCode < 400,
            statusCode,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID,
            responseTime,
            requestData: {}
          }
          
          // Aggiungi dati richiesta se richiesto
          if (includeQuery && Object.keys(req.query).length > 0) {
            auditData.requestData.query = AuditMiddleware.sanitizeData(req.query, sensitiveFields)
          }
          
          if (includeBody && req.body && Object.keys(req.body).length > 0) {
            auditData.requestData.body = AuditMiddleware.sanitizeData(req.body, sensitiveFields)
          }
          
          if (includeHeaders) {
            auditData.requestData.headers = AuditMiddleware.sanitizeHeaders(req.headers)
          }
          
          // Aggiungi error message se presente
          if (statusCode >= 400 && responseBody) {
            try {
              const parsedBody = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody
              auditData.errorMessage = parsedBody.error || parsedBody.message
            } catch (e) {
              // Ignore parsing errors
            }
          }
          
          // Determina flags di sicurezza
          auditData.flags = AuditMiddleware.determineSecurityFlags(req, statusCode, auditData)
          
          // Log audit
          await AuditLog.logActivity(auditData)
          
        } catch (error) {
          console.error('Audit logging error:', error)
          // Non bloccare la risposta se il logging fallisce
        }
      })
      
      next()
    }
  }
  
  /**
   * Determina l'azione basata su metodo HTTP e endpoint
   */
  static determineAction(method, url, statusCode) {
    // Azioni specifiche per endpoint
    if (url.includes('/auth/login')) return 'LOGIN'
    if (url.includes('/auth/logout')) return 'LOGOUT'
    if (url.includes('/auth/register') || url.includes('/tenants/register')) return 'REGISTER'
    if (url.includes('/tenants') && method === 'POST') return 'TENANT_CREATE'
    if (url.includes('/tenants') && method === 'PUT') return 'TENANT_UPDATE'
    if (url.includes('/plan')) return 'PLAN_CHANGE'
    
    // Azioni per risorse specifiche
    if (url.includes('/bookings')) {
      switch (method) {
        case 'POST': return 'BOOKING_CREATE'
        case 'PUT':
        case 'PATCH': return 'BOOKING_UPDATE'
        case 'DELETE': return 'BOOKING_DELETE'
        case 'GET': return 'READ'
      }
    }
    
    if (url.includes('/venues')) {
      switch (method) {
        case 'POST': return 'VENUE_CREATE'
        case 'PUT':
        case 'PATCH': return 'VENUE_UPDATE'
        case 'DELETE': return 'VENUE_DELETE'
        case 'GET': return 'READ'
      }
    }
    
    // Azioni generiche
    switch (method) {
      case 'POST': return 'CREATE'
      case 'GET': return 'READ'
      case 'PUT':
      case 'PATCH': return 'UPDATE'
      case 'DELETE': return 'DELETE'
      default: return 'UNKNOWN'
    }
  }
  
  /**
   * Determina la risorsa dall'URL
   */
  static determineResource(url) {
    if (url.includes('/auth')) return 'auth'
    if (url.includes('/tenants')) return 'tenant'
    if (url.includes('/users')) return 'user'
    if (url.includes('/venues')) return 'venue'
    if (url.includes('/bookings')) return 'booking'
    if (url.includes('/fixtures')) return 'fixture'
    if (url.includes('/offers')) return 'offer'
    if (url.includes('/reviews')) return 'review'
    if (url.includes('/api')) return 'api'
    return 'system'
  }
  
  /**
   * Sanitizza dati rimuovendo campi sensibili
   */
  static sanitizeData(data, sensitiveFields) {
    if (!data || typeof data !== 'object') return data
    
    const sanitized = { ...data }
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]'
      }
    })
    
    // Sanitizza ricorsivamente oggetti annidati
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = AuditMiddleware.sanitizeData(sanitized[key], sensitiveFields)
      }
    })
    
    return sanitized
  }
  
  /**
   * Sanitizza headers rimuovendo informazioni sensibili
   */
  static sanitizeHeaders(headers) {
    const sanitized = { ...headers }
    
    // Rimuovi headers sensibili
    delete sanitized.authorization
    delete sanitized.cookie
    delete sanitized['x-api-key']
    delete sanitized['x-auth-token']
    
    return sanitized
  }
  
  /**
   * Determina flags di sicurezza basati sulla richiesta
   */
  static determineSecurityFlags(req, statusCode, auditData) {
    const flags = []
    
    // Rate limit exceeded
    if (statusCode === 429) {
      flags.push('RATE_LIMIT_EXCEEDED')
    }
    
    // Authentication failures
    if (statusCode === 401) {
      flags.push('INVALID_TOKEN')
    }
    
    // Authorization failures
    if (statusCode === 403) {
      flags.push('ACCESS_DENIED')
      
      // Cross-tenant access attempt
      if (auditData.errorMessage?.includes('cross-tenant') || 
          auditData.errorMessage?.includes('tenant')) {
        flags.push('CROSS_TENANT_ATTEMPT')
      }
    }
    
    // Multiple failed attempts (da implementare con cache/redis)
    // if (this.checkMultipleFailedAttempts(req.ip, auditData.action)) {
    //   flags.push('MULTIPLE_FAILED_ATTEMPTS')
    // }
    
    // Suspicious IP (da implementare con blacklist)
    // if (this.isSuspiciousIP(req.ip)) {
    //   flags.push('SUSPICIOUS_IP')
    // }
    
    return flags
  }
  
  /**
   * Middleware specifico per operazioni critiche
   */
  static criticalOperationLogger(operation) {
    return AuditMiddleware.auditLogger({
      includeBody: true,
      includeQuery: true,
      includeHeaders: true,
      skipSuccessfulReads: false
    })
  }
  
  /**
   * Middleware per logging errori di sicurezza
   */
  static securityErrorLogger(req, res, next) {
    const originalStatus = res.status
    
    res.status = function(code) {
      if (code >= 400) {
        // Log immediato per errori di sicurezza
        const securityCodes = [401, 403, 429]
        if (securityCodes.includes(code)) {
          AuditLog.logActivity({
            tenantId: req.tenant?._id,
            userId: req.user?._id,
            action: 'SECURITY_VIOLATION',
            resource: 'security',
            method: req.method,
            endpoint: req.originalUrl,
            success: false,
            statusCode: code,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            riskLevel: code === 403 ? 'HIGH' : 'MEDIUM',
            flags: code === 403 ? ['ACCESS_DENIED'] : ['INVALID_TOKEN']
          }).catch(err => console.error('Security audit log failed:', err))
        }
      }
      
      return originalStatus.call(this, code)
    }
    
    next()
  }
}

module.exports = AuditMiddleware 