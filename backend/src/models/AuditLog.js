const mongoose = require('mongoose')

const auditLogSchema = new mongoose.Schema({
  // Identificatori
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Dettagli operazione
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE', 'READ', 'UPDATE', 'DELETE',
      'LOGIN', 'LOGOUT', 'REGISTER',
      'TENANT_CREATE', 'TENANT_UPDATE', 'TENANT_DELETE',
      'PLAN_CHANGE', 'LIMIT_EXCEEDED',
      'SECURITY_VIOLATION', 'ACCESS_DENIED',
      'DATA_EXPORT', 'DATA_IMPORT',
      'BOOKING_CREATE', 'BOOKING_UPDATE', 'BOOKING_DELETE',
      'VENUE_CREATE', 'VENUE_UPDATE', 'VENUE_DELETE'
    ],
    index: true
  },
  
  resource: {
    type: String,
    required: true,
    enum: [
      'tenant', 'user', 'venue', 'booking', 'fixture', 'offer', 'review',
      'auth', 'security', 'system', 'api'
    ],
    index: true
  },
  
  resourceId: {
    type: String, // ID della risorsa interessata
    index: true
  },
  
  // Dettagli richiesta
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    required: true
  },
  
  endpoint: {
    type: String,
    required: true
  },
  
  // Dati della richiesta (sanitizzati)
  requestData: {
    headers: mongoose.Schema.Types.Mixed,
    query: mongoose.Schema.Types.Mixed,
    body: mongoose.Schema.Types.Mixed // Dati sensibili rimossi
  },
  
  // Risultato operazione
  success: {
    type: Boolean,
    required: true,
    index: true
  },
  
  statusCode: {
    type: Number,
    required: true
  },
  
  errorMessage: String,
  
  // Metadati sicurezza
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  
  userAgent: String,
  
  sessionId: String,
  
  // Geolocalizzazione (opzionale)
  location: {
    country: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Performance
  responseTime: {
    type: Number, // millisecondi
    index: true
  },
  
  // Flags di sicurezza
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW',
    index: true
  },
  
  flags: [{
    type: String,
    enum: [
      'SUSPICIOUS_IP', 'MULTIPLE_FAILED_ATTEMPTS', 'UNUSUAL_ACTIVITY',
      'CROSS_TENANT_ATTEMPT', 'PRIVILEGE_ESCALATION', 'DATA_BREACH_ATTEMPT',
      'RATE_LIMIT_EXCEEDED', 'INVALID_TOKEN', 'EXPIRED_SESSION'
    ]
  }],
  
  // Metadati aggiuntivi
  metadata: mongoose.Schema.Types.Mixed,
  
  // Retention
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 anno
    index: { expireAfterSeconds: 0 }
  }
  
}, {
  timestamps: true,
  collection: 'auditLogs'
})

// Indici composti per query efficienti
auditLogSchema.index({ tenantId: 1, createdAt: -1 })
auditLogSchema.index({ userId: 1, createdAt: -1 })
auditLogSchema.index({ action: 1, resource: 1, createdAt: -1 })
auditLogSchema.index({ success: 1, riskLevel: 1, createdAt: -1 })
auditLogSchema.index({ ipAddress: 1, createdAt: -1 })

// Metodi statici per query comuni
auditLogSchema.statics.logActivity = async function(data) {
  try {
    // Sanitizza dati sensibili
    const sanitizedData = { ...data }
    
    if (sanitizedData.requestData?.body) {
      const body = { ...sanitizedData.requestData.body }
      
      // Rimuovi campi sensibili
      delete body.password
      delete body.token
      delete body.secret
      delete body.apiKey
      
      sanitizedData.requestData.body = body
    }
    
    // Determina risk level
    if (!sanitizedData.riskLevel) {
      sanitizedData.riskLevel = this.calculateRiskLevel(sanitizedData)
    }
    
    const auditLog = new this(sanitizedData)
    await auditLog.save()
    
    return auditLog
  } catch (error) {
    console.error('Failed to log audit activity:', error)
    // Non bloccare l'operazione principale se il logging fallisce
  }
}

auditLogSchema.statics.calculateRiskLevel = function(data) {
  let riskScore = 0
  
  // Fattori di rischio
  if (!data.success) riskScore += 2
  if (data.action.includes('DELETE')) riskScore += 3
  if (data.action.includes('SECURITY')) riskScore += 4
  if (data.flags?.length > 0) riskScore += data.flags.length * 2
  if (data.statusCode >= 400) riskScore += 1
  if (data.statusCode >= 500) riskScore += 2
  
  // Determina livello
  if (riskScore >= 8) return 'CRITICAL'
  if (riskScore >= 5) return 'HIGH'
  if (riskScore >= 2) return 'MEDIUM'
  return 'LOW'
}

auditLogSchema.statics.getSecurityReport = async function(tenantId, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  
  const pipeline = [
    {
      $match: {
        tenantId: new mongoose.Types.ObjectId(tenantId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          action: '$action',
          success: '$success',
          riskLevel: '$riskLevel'
        },
        count: { $sum: 1 },
        avgResponseTime: { $avg: '$responseTime' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]
  
  return await this.aggregate(pipeline)
}

auditLogSchema.statics.getSuspiciousActivity = async function(tenantId, hours = 24) {
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000)
  
  return await this.find({
    tenantId,
    createdAt: { $gte: startDate },
    $or: [
      { riskLevel: { $in: ['HIGH', 'CRITICAL'] } },
      { flags: { $exists: true, $ne: [] } },
      { success: false, action: { $in: ['LOGIN', 'REGISTER'] } }
    ]
  }).sort({ createdAt: -1 }).limit(100)
}

module.exports = mongoose.model('AuditLog', auditLogSchema) 