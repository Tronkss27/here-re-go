# SPOrTS - Sports Bar Management System

Sistema completo per la gestione di bar sportivi con prenotazioni, eventi e gestione clienti multi-tenant.

## 🚀 Quick Start

### Prerequisiti
- Node.js 18+
- npm 9+
- Docker e Docker Compose
- MongoDB (se non si usa Docker)

### Installazione Locale

1. **Clona il repository**
   ```bash
   git clone https://github.com/your-repo/sports.git
   cd sports
   ```

2. **Installa le dipendenze**
   ```bash
   npm run install:all
   ```

3. **Configura le variabili di ambiente**
   ```bash
   cp .env.example .env
   # Modifica il file .env con le tue configurazioni
   ```

4. **Avvia il progetto**
   ```bash
   npm run dev
   ```

### Con Docker (Raccomandato)

1. **Avvia tutti i servizi**
   ```bash
   npm run docker:dev
   ```

2. **Accedi all'applicazione**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - MongoDB: localhost:27017

## 📁 Struttura del Progetto

```
SPOrTS/
├── frontend/              # React 18+ Application
│   ├── src/
│   │   ├── components/    # Componenti UI riutilizzabili
│   │   ├── pages/         # Pagine dell'applicazione
│   │   ├── services/      # API services
│   │   ├── hooks/         # Custom React hooks
│   │   ├── contexts/      # React contexts
│   │   ├── utils/         # Utility functions
│   │   └── types/         # TypeScript definitions
├── backend/               # Node.js + Express API
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── middlewares/   # Express middlewares
│   │   ├── services/      # Business logic
│   │   ├── config/        # Configuration files
│   │   └── utils/         # Utility functions
├── scripts/               # Database & Setup Scripts
├── docs/                  # Documentazione API
├── .cursor/               # Cursor IDE rules
└── docker-compose.dev.yml # Docker Development
```

## 🛠️ Tecnologie

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **React Router** - Routing
- **React Query** - Data fetching
- **React Hook Form** - Form management

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Helmet** - Security headers

### DevOps
- **Docker** - Containerization
- **MongoDB** - Database
- **Nginx** - Reverse proxy (production)

## 🔧 Scripts Disponibili

### Sviluppo
```bash
npm run dev              # Avvia frontend + backend
npm run frontend:dev     # Solo frontend
npm run backend:dev      # Solo backend
```

### Build
```bash
npm run build            # Build completo
npm run frontend:build   # Build frontend
npm run backend:build    # Build backend
```

### Docker
```bash
npm run docker:dev       # Development con Docker
npm run docker:prod      # Production con Docker
npm run docker:down      # Ferma tutti i container
```

### Database
```bash
npm run seed             # Popola database con dati demo
npm run backend:seed     # Seeding del backend (alias)
```

### Utilità
```bash
npm run install:all      # Installa tutte le dipendenze
npm run clean           # Pulisce node_modules e build
npm test                # Esegue tutti i test
```

## 🌐 API Endpoints

### Autenticazione
- `POST /api/auth/register` - Registrazione utente
- `POST /api/auth/login` - Login utente
- `GET /api/auth/me` - Profilo utente corrente

### Locali
- `GET /api/venues` - Lista locali
- `POST /api/venues` - Crea locale
- `GET /api/venues/:id` - Dettagli locale

### Partite
- `GET /api/fixtures` - Lista partite
- `GET /api/fixtures/search` - Ricerca partite

### Prenotazioni
- `GET /api/bookings` - Lista prenotazioni
- `POST /api/bookings` - Crea prenotazione

### Match Announcements
- `GET /api/match-announcements` - Lista annunci partite
- `POST /api/match-announcements` - Crea annuncio partita

## 🔑 Autenticazione Demo

Per il testing è disponibile un utente demo:
- **Email**: `demo@sports.it`
- **Password**: `demo123`
- **Ruolo**: `venue_owner`

## 🏢 Sistema Multi-Tenant

SPOrTS supporta un sistema multi-tenant completo:

### Identificazione Tenant
- **Header**: `X-Tenant-ID: <tenant-slug>`
- **Subdomain**: `tenant-slug.sports.app`
- **JWT Token**: Include tenant context

### Isolamento Dati
- Ogni tenant ha dati completamente isolati
- Validazione automatica ownership
- Rate limiting per tenant
- Audit logging completo

### Configurazione Tenant
- Features abilitate/disabilitate
- Limiti di utilizzo
- Branding personalizzato
- Configurazione business

## 🐳 Docker Development

Il progetto include una configurazione Docker completa:

```yaml
services:
  - mongodb (Database)
  - backend (API Node.js)
  - frontend (React App)
```

### Comandi Docker Utili
```bash
# Visualizza logs
docker-compose -f docker-compose.dev.yml logs -f

# Ricostruisci un servizio
docker-compose -f docker-compose.dev.yml up --build backend

# Accedi a un container
docker exec -it sports_backend_dev sh
```

## 📊 Database

### MongoDB Collections
- `users` - Utenti del sistema
- `tenants` - Configurazioni tenant
- `venues` - Bar sportivi
- `fixtures` - Partite sportive
- `bookings` - Prenotazioni
- `matchAnnouncements` - Annunci partite
- `offers` - Offerte e promozioni
- `reviews` - Recensioni clienti

### Schema Validation
Il database include validazione automatica per:
- Email format
- Password minima lunghezza
- Ruoli utente validi
- Coordinate geografiche
- Tenant isolation

## 🔒 Sicurezza

- **JWT Tokens** per autenticazione
- **bcryptjs** per hashing password
- **Helmet** per security headers
- **CORS** configurato
- **Rate limiting** sulle API
- **Input validation** con express-validator
- **Tenant isolation** per isolamento dati
- **Audit logging** per compliance

## 🧪 Testing

```bash
# Test completi
npm test

# Test frontend
npm run frontend:test

# Test backend
npm run backend:test

# Test multi-tenant
npm run test:multi-tenant
```

## 📈 Monitoring

- **Health checks** su tutti i servizi
- **Logging** strutturato con Morgan
- **Error handling** centralizzato
- **Performance monitoring** con Web Vitals
- **Audit trail** per tutte le operazioni

## 🚀 Deploy Production

1. **Configura variabili production**
   ```bash
   cp .env.example .env.production
   # Configura le variabili per production
   ```

2. **Avvia in production**
   ```bash
   npm run docker:prod
   ```

## 🤝 Contribuire

1. Fork del progetto
2. Crea feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Apri Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Supporto

- **Email**: support@sports.it
- **Documentazione**: `/docs/`
- **API Docs**: `/docs/API.md` 