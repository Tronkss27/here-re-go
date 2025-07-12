# Sistema Multi-Tenant SPOrTS

## 📋 Panoramica

SPOrTS implementa un sistema multi-tenant completo che permette a diversi bar sportivi di utilizzare la stessa piattaforma mantenendo i propri dati completamente isolati.

## 🏗️ Architettura

### **Principi Fondamentali**
- **Isolamento completo dei dati** tra tenant
- **Identificazione tenant obbligatoria** per tutte le operazioni
- **Validazione automatica ownership** di tutte le risorse
- **Audit logging** per compliance e debugging
- **Rate limiting** specifico per piano tenant

### **Strategia di Identificazione Tenant**

#### **1. Header-Based (PRIORITÀ ALTA)**
```http
X-Tenant-ID: tenant-slug
```

#### **2. Subdomain-Based (FALLBACK)**
```
tenant-slug.sports.app
```

#### **3. JWT-Based (SECONDARY)**
```javascript
// Token include tenant context
{
  "tenantId": "tenant-slug",
  "userId": "user-id",
  "role": "venue_owner"
}
```

## 🔧 Implementazione

### **Middleware di Estrazione Tenant**

```javascript
// backend/src/middlewares/tenantMiddleware.js
const extractTenant = async (req, res, next) => {
  try {
    let tenantId = null
    let tenant = null
    
    // 1. Header X-Tenant-ID (priorità alta)
    if (req.headers['x-tenant-id']) {
      tenantId = req.headers['x-tenant-id']
    }
    
    // 2. Subdomain extraction
    else if (req.get('host')) {
      const subdomain = extractSubdomain(req.get('host'))
      if (subdomain) {
        tenant = await Tenant.findOne({ 
          subdomain: subdomain,
          status: { $in: ['active', 'trial'] }
        })
        if (tenant) tenantId = tenant._id.toString()
      }
    }
    
    // 3. JWT token
    if (!tenantId && req.headers.authorization) {
      const token = req.headers.authorization.replace('Bearer ', '')
      const decoded = jwt.decode(token, { complete: true })
      if (decoded?.payload?.tenantId) {
        tenantId = decoded.payload.tenantId
      }
    }
    
    // 4. Default tenant per sviluppo
    if (!tenant && process.env.NODE_ENV === 'development') {
      tenant = await Tenant.findOne({ slug: 'default' })
      tenantId = tenant?._id.toString()
    }
    
    // Validazione tenant
    if (tenantId && !tenant) {
      tenant = await Tenant.findById(tenantId)
    }
    
    if (!tenant) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tenant',
        message: 'Tenant not found or inactive'
      })
    }
    
    // Aggiungi al request
    req.tenant = tenant
    req.tenantId = tenant._id
    
    next()
  } catch (error) {
    console.error('Tenant extraction error:', error)
    return res.status(500).json({
      success: false,
      error: 'Tenant resolution failed'
    })
  }
}
```

### **Validazione Tenant**

```javascript
const requireTenant = (req, res, next) => {
  if (!req.tenant) {
    return res.status(400).json({
      success: false,
      error: 'Tenant context required'
    })
  }
  
  // Verifica stato tenant
  if (!req.tenant.isActive && req.tenant.status !== 'trial') {
    return res.status(403).json({
      success: false,
      error: 'Tenant access denied',
      message: `Tenant status: ${req.tenant.status}`
    })
  }
  
  // Verifica trial scaduto
  if (req.tenant.isTrialExpired) {
    return res.status(402).json({
      success: false,
      error: 'Trial expired',
      message: 'Please upgrade your subscription'
    })
  }
  
  next()
}
```

## 🗄️ Isolamento Dati

### **Schema Modello con Tenant**

```javascript
// Tutti i modelli includono tenantId
const venueSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  // ... altri campi
})

// Indici composti per performance
venueSchema.index({ tenantId: 1, name: 1 })
venueSchema.index({ tenantId: 1, createdAt: -1 })
```

### **Query Isolation**

```javascript
// Tutte le query filtrano per tenant
const getVenues = async (req, res) => {
  try {
    const venues = await Venue.find({ 
      tenantId: req.tenantId 
    }).populate('tenantId')
    
    res.json({
      success: true,
      data: venues
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch venues'
    })
  }
}
```

### **Create/Update Isolation**

```javascript
// Assegnazione automatica tenantId
const createVenue = async (req, res) => {
  try {
    const venue = new Venue({
      ...req.body,
      tenantId: req.tenantId // Assegnazione automatica
    })
    
    await venue.save()
    
    res.status(201).json({
      success: true,
      data: venue
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create venue'
    })
  }
}
```

## 🔒 Sicurezza

### **Validazione Ownership**

```javascript
const validateOwnership = async (req, res, next) => {
  const { id } = req.params
  
  try {
    const resource = await Resource.findById(id)
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      })
    }
    
    if (resource.tenantId.toString() !== req.tenantId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Resource belongs to different tenant'
      })
    }
    
    req.resource = resource
    next()
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Validation failed'
    })
  }
}
```

### **Rate Limiting per Tenant**

```javascript
const tenantRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
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
    return `${req.tenantId}-${req.ip}`
  },
  message: {
    success: false,
    error: 'Rate limit exceeded',
    message: 'Too many requests for your plan'
  }
})
```

## 📊 Audit Logging

### **Logging Automatico**

```javascript
const auditLogger = (operation) => {
  return async (req, res, next) => {
    const originalSend = res.send
    
    res.send = function(data) {
      // Log dopo la risposta
      const auditLog = {
        tenantId: req.tenantId,
        userId: req.user?.id,
        operation: operation,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        timestamp: new Date(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
      
      // Salva log (async)
      AuditLog.create(auditLog).catch(console.error)
      
      originalSend.call(this, data)
    }
    
    next()
  }
}
```

## 🧪 Testing

### **Test Isolamento Dati**

```javascript
describe('Multi-Tenant Data Isolation', () => {
  it('should not allow cross-tenant access', async () => {
    // Crea dati per tenant A
    const tenantA = await createTenant('tenant-a')
    const venueA = await createVenue(tenantA.id, 'Venue A')
    
    // Crea dati per tenant B
    const tenantB = await createTenant('tenant-b')
    const venueB = await createVenue(tenantB.id, 'Venue B')
    
    // Prova accesso cross-tenant
    const response = await request(app)
      .get(`/api/venues/${venueA.id}`)
      .set('X-Tenant-ID', tenantB.slug)
    
    expect(response.status).toBe(403)
    expect(response.body.error).toBe('Access denied')
  })
})
```

## 🚀 Frontend Integration

### **API Client con Tenant**

```typescript
// frontend/src/services/apiClient.ts
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor per tenant ID
api.interceptors.request.use((config) => {
  const tenantId = localStorage.getItem('tenantId')
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId
  }
  return config
})

// Interceptor per error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 400 && error.response.data.error === 'Invalid tenant') {
      // Redirect to tenant selection
      window.location.href = '/select-tenant'
    }
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

### **Tenant Context**

```typescript
// frontend/src/contexts/TenantContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react'

interface TenantContextType {
  tenant: Tenant | null
  setTenant: (tenant: Tenant) => void
  clearTenant: () => void
}

const TenantContext = createContext<TenantContextType | null>(null)

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tenant, setTenantState] = useState<Tenant | null>(() => {
    const saved = localStorage.getItem('tenant')
    return saved ? JSON.parse(saved) : null
  })

  const setTenant = (newTenant: Tenant) => {
    setTenantState(newTenant)
    localStorage.setItem('tenant', JSON.stringify(newTenant))
    localStorage.setItem('tenantId', newTenant.slug)
  }

  const clearTenant = () => {
    setTenantState(null)
    localStorage.removeItem('tenant')
    localStorage.removeItem('tenantId')
  }

  return (
    <TenantContext.Provider value={{ tenant, setTenant, clearTenant }}>
      {children}
    </TenantContext.Provider>
  )
}

export const useTenant = () => {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider')
  }
  return context
}
```

## 📈 Performance

### **Database Indexing**

```javascript
// Indici ottimizzati per multi-tenant
// Indice principale per tenant
schema.index({ tenantId: 1 })

// Indici composti per query comuni
schema.index({ tenantId: 1, createdAt: -1 })
schema.index({ tenantId: 1, status: 1 })
schema.index({ tenantId: 1, category: 1 })

// Indici per ricerca
schema.index({ tenantId: 1, name: 'text' })
```

### **Caching Strategy**

```javascript
const getTenantCache = (tenantId) => {
  return new NodeCache({
    stdTTL: 1800, // 30 minuti
    checkperiod: 600,
    useClones: false
  })
}

const getCachedData = async (tenantId, key, fetchFunction) => {
  const cache = getTenantCache(tenantId)
  const cacheKey = `${tenantId}:${key}`
  
  let data = cache.get(cacheKey)
  if (!data) {
    data = await fetchFunction()
    cache.set(cacheKey, data)
  }
  
  return data
}
```

## 🔧 Configurazione

### **Environment Variables**

```bash
# Tenant Configuration
DEFAULT_TENANT_SLUG=default
TENANT_TRIAL_DAYS=30
MAX_TENANTS_PER_USER=5

# Feature Flags
ENABLE_MULTI_TENANT=true
ENABLE_AUDIT_TRAIL=true

# Development
DEBUG_TENANT=true
```

### **Piani Tenant**

```javascript
const tenantPlans = {
  trial: {
    maxVenues: 1,
    maxUsers: 5,
    maxBookingsPerMonth: 100,
    features: {
      bookingSystem: true,
      multiVenue: false,
      eventManagement: true,
      analytics: false,
      customDomain: false
    }
  },
  basic: {
    maxVenues: 3,
    maxUsers: 20,
    maxBookingsPerMonth: 1000,
    features: {
      bookingSystem: true,
      multiVenue: true,
      eventManagement: true,
      analytics: true,
      customDomain: false
    }
  },
  premium: {
    maxVenues: 10,
    maxUsers: 100,
    maxBookingsPerMonth: 10000,
    features: {
      bookingSystem: true,
      multiVenue: true,
      eventManagement: true,
      analytics: true,
      customDomain: true
    }
  },
  enterprise: {
    maxVenues: -1, // Unlimited
    maxUsers: -1, // Unlimited
    maxBookingsPerMonth: -1, // Unlimited
    features: {
      bookingSystem: true,
      multiVenue: true,
      eventManagement: true,
      analytics: true,
      customDomain: true
    }
  }
}
```

## 🚨 Troubleshooting

### **Problemi Comuni**

#### **1. Tenant Not Found**
```javascript
// Errore: "Tenant not found or inactive"
// Soluzione: Verificare header X-Tenant-ID o subdomain
```

#### **2. Cross-Tenant Access**
```javascript
// Errore: "Access denied - Resource belongs to different tenant"
// Soluzione: Verificare tenantId nel modello e validazione ownership
```

#### **3. Rate Limit Exceeded**
```javascript
// Errore: "Rate limit exceeded"
// Soluzione: Verificare piano tenant e limiti
```

### **Debug Commands**

```bash
# Test tenant isolation
npm run test:multi-tenant

# Debug tenant extraction
curl -H "X-Tenant-ID: default" http://localhost:3001/api/health

# Check tenant status
curl -H "X-Tenant-ID: tenant-slug" http://localhost:3001/api/tenants/current
```

## 📚 Best Practices

### **DO's**
- ✅ **Sempre validare tenant context** prima di operazioni
- ✅ **Filtrare query per tenantId** automaticamente
- ✅ **Loggare tutte le operazioni** per audit
- ✅ **Implementare rate limiting** per tenant
- ✅ **Validare ownership** di tutte le risorse
- ✅ **Usare indici database** ottimizzati
- ✅ **Testare isolamento dati** completamente

### **DON'Ts**
- ❌ **Non permettere accesso cross-tenant**
- ❌ **Non dimenticare tenantId** in create/update
- ❌ **Non esporre dati di altri tenant**
- ❌ **Non saltare validazione ownership**
- ❌ **Non usare cache globale** per dati tenant-specific
- ❌ **Non loggare dati sensibili** in audit log