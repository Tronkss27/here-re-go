# Guida Sviluppo SPOrTS

## 🚀 Setup Iniziale

### **Prerequisiti**
- Node.js 18+
- npm 9+
- Docker e Docker Compose
- MongoDB (se non si usa Docker)

### **Installazione**
```bash
# Clona il repository
git clone https://github.com/your-repo/sports.git
cd sports

# Installa tutte le dipendenze
npm run install:all

# Copia file di configurazione
cp .env.example .env

# Avvia in modalità sviluppo
npm run dev
```

## 🏗️ Architettura del Progetto

### **Struttura Backend**
```
backend/src/
├── controllers/        # Route controllers
├── models/            # Mongoose models
├── routes/            # API routes
├── middlewares/       # Express middlewares
├── services/          # Business logic
├── config/            # Configuration files
└── utils/             # Utility functions
```

### **Struttura Frontend**
```
frontend/src/
├── components/        # Componenti UI riutilizzabili
├── pages/            # Pagine dell'applicazione
├── services/         # API services
├── hooks/            # Custom React hooks
├── contexts/         # React contexts
├── utils/            # Utility functions
├── types/            # TypeScript definitions
└── styles/           # CSS e styling
```

## 🔧 Configurazione

### **Environment Variables**
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/sports-bar

# Server
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Multi-Tenant
DEFAULT_TENANT_SLUG=default
ENABLE_MULTI_TENANT=true
```

### **Docker Development**
```bash
# Avvia tutti i servizi
npm run docker:dev

# Solo backend
docker-compose -f docker-compose.dev.yml up backend

# Solo frontend
docker-compose -f docker-compose.dev.yml up frontend

# Logs
docker-compose -f docker-compose.dev.yml logs -f
```

## 🧪 Testing

### **Test Backend**
```bash
# Test unitari
npm run backend:test

# Test multi-tenant
npm run test:multi-tenant

# Test specifico
cd backend && npm test -- --grep "venue"
```

### **Test Frontend**
```bash
# Test unitari
npm run frontend:test

# Test E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

### **Test Multi-Tenant**
```bash
# Esegui suite completa
npm run test:multi-tenant

# Test specifico
cd backend && node test-multi-tenant.js --test=isolation
```

## 🔍 Debugging

### **Backend Debug**
```bash
# Avvia con debug
cd backend && npm run dev:debug

# Logs dettagliati
DEBUG=* npm run backend:dev

# MongoDB shell
docker exec -it sports_mongodb_dev mongosh
```

### **Frontend Debug**
```bash
# DevTools
# Apri Chrome DevTools (F12)
# Tab Console per logs
# Tab Network per API calls
# Tab Performance per profiling
```

### **Database Debug**
```bash
# Connessione MongoDB
mongosh mongodb://localhost:27017/sports-bar

# Query di debug
db.tenants.find({})
db.venues.find({}).limit(5)
db.bookings.aggregate([{ $group: { _id: "$tenantId", count: { $sum: 1 } } }])
```

## 📊 Performance

### **Bundle Analysis**
```bash
# Frontend bundle
cd frontend && npm run build:analyze

# Backend dependencies
cd backend && npm ls --depth=0
```

### **Database Performance**
```bash
# Indici
db.venues.getIndexes()
db.bookings.getIndexes()

# Query performance
db.venues.find({ tenantId: ObjectId("...") }).explain("executionStats")
```

### **API Performance**
```bash
# Test performance
ab -n 1000 -c 10 http://localhost:3001/api/health

# Monitor con Artillery
npm install -g artillery
artillery quick --count 100 --num 10 http://localhost:3001/api/health
```

## 🔒 Sicurezza

### **Validazione Input**
```javascript
// Usa express-validator
const { body, validationResult } = require('express-validator')

const validateVenue = [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    next()
  }
]
```

### **Autenticazione**
```javascript
// JWT middleware
const auth = require('../middlewares/auth')

// Proteggi route
router.get('/venues', auth, venueController.getVenues)
```

### **Multi-Tenant Security**
```javascript
// Tenant validation
const TenantMiddleware = require('../middlewares/tenantMiddleware')

// Richiedi tenant context
router.use(TenantMiddleware.requireTenant)

// Valida ownership
router.use(SecurityMiddleware.validateTenantOwnership)
```

## 🚀 Deployment

### **Development**
```bash
# Avvia sviluppo
npm run dev

# Build per test
npm run build
npm run preview
```

### **Production**
```bash
# Build production
npm run build:prod

# Docker production
npm run docker:prod

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### **Environment Variables Production**
```bash
# Copia template
cp .env.example .env.production

# Configura per production
NODE_ENV=production
MONGODB_URI=mongodb://prod-db:27017/sports-bar-prod
JWT_SECRET=your-production-secret
```

## 📝 Coding Standards

### **JavaScript/TypeScript**
```javascript
// ✅ DO: Usa ES6+ features
const { name, email } = user
const venues = await Venue.find({ tenantId: req.tenantId })

// ✅ DO: Error handling
try {
  const result = await someAsyncOperation()
  return res.json({ success: true, data: result })
} catch (error) {
  console.error('Operation failed:', error)
  return res.status(500).json({ success: false, error: 'Operation failed' })
}

// ✅ DO: TypeScript per frontend
interface Venue {
  id: string
  name: string
  description?: string
  tenantId: string
}
```

### **React Components**
```typescript
// ✅ DO: Functional components con hooks
import React from 'react'
import { useQuery } from '@tanstack/react-query'

interface VenueCardProps {
  venue: Venue
  onSelect?: (venue: Venue) => void
}

export const VenueCard: React.FC<VenueCardProps> = ({ venue, onSelect }) => {
  const handleClick = () => {
    onSelect?.(venue)
  }

  return (
    <div className="venue-card" onClick={handleClick}>
      <h3>{venue.name}</h3>
      <p>{venue.description}</p>
    </div>
  )
}
```

### **API Design**
```javascript
// ✅ DO: Response format consistente
{
  success: true,
  data: { ... },
  message: "Operation successful",
  pagination: { ... } // se applicabile
}

// ✅ DO: Error format consistente
{
  success: false,
  error: "Error type",
  message: "User-friendly message"
}
```

## 🔄 Git Workflow

### **Branch Strategy**
```bash
# Feature branch
git checkout -b feature/venue-management

# Bug fix
git checkout -b fix/tenant-isolation

# Hotfix
git checkout -b hotfix/security-patch
```

### **Commit Messages**
```bash
# Formato: type(scope): description
feat(venues): add venue creation endpoint
fix(auth): resolve tenant validation issue
docs(api): update authentication documentation
test(multi-tenant): add isolation tests
```

### **Pull Request**
1. **Crea feature branch**
2. **Implementa feature**
3. **Aggiungi test**
4. **Aggiorna documentazione**
5. **Crea Pull Request**
6. **Code review**
7. **Merge**

## 🐛 Troubleshooting

### **Problemi Comuni**

#### **1. Database Connection**
```bash
# Verifica MongoDB
docker ps | grep mongodb
docker logs sports_mongodb_dev

# Test connessione
mongosh mongodb://localhost:27017/sports-bar
```

#### **2. Port Conflicts**
```bash
# Verifica porte in uso
lsof -i :3001
lsof -i :5173

# Cambia porta
PORT=3002 npm run backend:dev
```

#### **3. Multi-Tenant Issues**
```bash
# Debug tenant
curl -H "X-Tenant-ID: default" http://localhost:3001/api/health

# Verifica tenant nel database
db.tenants.find({ slug: "default" })
```

#### **4. Frontend Build Issues**
```bash
# Pulisci cache
cd frontend && rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### **Logs e Monitoring**
```bash
# Backend logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Frontend logs
docker-compose -f docker-compose.dev.yml logs -f frontend

# Database logs
docker-compose -f docker-compose.dev.yml logs -f mongodb
```

## 📚 Risorse

### **Documentazione**
- [README.md](../README.md) - Overview progetto
- [API.md](./API.md) - Documentazione API
- [MULTI_TENANT.md](./MULTI_TENANT.md) - Sistema multi-tenant

### **Regole Cursor**
- [project_structure.mdc](../.cursor/rules/project_structure.mdc) - Struttura progetto
- [multi_tenant.mdc](../.cursor/rules/multi_tenant.mdc) - Regole multi-tenant
- [react_frontend.mdc](../.cursor/rules/react_frontend.mdc) - Frontend React

### **Librerie Principali**
- **Backend**: Express, Mongoose, JWT, bcryptjs
- **Frontend**: React, TypeScript, Tailwind CSS, React Query
- **Testing**: Jest, React Testing Library
- **DevOps**: Docker, MongoDB

### **Comandi Utili**
```bash
# Sviluppo
npm run dev              # Avvia frontend + backend
npm run frontend:dev     # Solo frontend
npm run backend:dev      # Solo backend

# Build
npm run build            # Build completo
npm run build:prod       # Build production

# Test
npm test                 # Tutti i test
npm run test:multi-tenant # Test multi-tenant

# Database
npm run seed             # Popola database
npm run db:reset         # Reset database

# Docker
npm run docker:dev       # Development
npm run docker:prod      # Production
npm run docker:down      # Ferma container
``` 