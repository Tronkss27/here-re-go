## Panoramica Architettura Backend SPOrTS

### Stack e Pattern
- **Server**: Express 5 (Node.js)
- **Database**: MongoDB con Mongoose 8 (ODM)
- **Auth**: JWT (Bearer), ruoli base (user, venue_owner, admin)
- **Multi-tenant**: risoluzione `tenant` via `X-Tenant-ID` (priorità), subdominio, o payload JWT
- **Jobs/Scheduler**: Agenda/cron per sincronizzazioni e manutenzioni
- **Pattern**: separazione `routes/` → `controllers/` → `models/`, middleware trasversali in `middlewares/`, servizi in `services/`

### Componenti Principali (backend/src)
- `app.js`: configura sicurezza (Helmet, CORS), logging (morgan), rate limit per tenant, parsing body, static `/uploads`, middleware di sicurezza, montaggio router, healthcheck `/api/health`, error/404 handler
- `server.js`: bootstrap → connessione DB (`config/database.js`), avvio HTTP, avvio scheduler (`services/backgroundScheduler`)
- `config/database.js`: connessione Mongoose con gestione eventi (error/disconnected/reconnected) e chiusura gracefull
- `routes/*`: definizione degli endpoint REST e validazioni
- `controllers/*`: business logic per dominio (auth, venues, bookings, fixtures, match-announcements, analytics, reviews, offer-templates)
- `middlewares/*`:
  - `tenantMiddleware`: estrae/valida `tenant`, fallback `default` in dev
  - `auth`: verifica JWT; variante `authenticateVenue` collega utente → venue del tenant
  - `security`: header CSP, sanitizzazione input, validazioni ownership/data integrity
- `services/*`: integrazioni (es. Sportmonks), scheduler, code condiviso (job queue)
- `models/*`: schemi Mongoose (Users, Tenants, Venues, Bookings, Fixtures, MatchAnnouncements, Offers, Reviews, PopularMatch)

### Responsabilità e Flussi
- **Autenticazione**: `/api/auth/*` gestisce registrazione/login, emissione JWT; `auth` middleware popola `req.user`
- **Multi-tenant**: ogni richiesta passa per `tenantMiddleware.extractTenant`; i controller filtrano/scoprono risorse nel tenant corrente; in dev fallback `default`
- **Venue e Annunci**: i proprietari creano annunci partita (match-announcements) collegati al proprio `Venue` e al `tenant`
- **Prenotazioni**: pubblico può cercare disponibilità e creare prenotazioni; proprietari/admin gestiscono CRUD e stati
- **Analytics**: tracking di view/click salva contatori giornalieri su collezione `analyticsdaily`; overview/timeseries/top aggregano nel range
- **Fixtures/Matches**: lettura ibrida (DB + provider Sportmonks) per eventi sportivi e arricchimenti meta

### Dipendenze Chiave
- `express`, `cors`, `helmet`, `morgan`, `express-rate-limit`
- `mongoose`, `mongoose-paginate-v2`
- `jsonwebtoken`, `bcryptjs`
- `agenda`, `node-cron`

### Ambienti e Configurazione
- Dev default: backend su `PORT=3001`, frontend Vite su `5174` (proxy `/api` → backend)
- CORS consentiti: `FRONTEND_URL` e host locali (5173–5175, IP LAN)
- Variabili ENV principali: `NODE_ENV`, `PORT`, `FRONTEND_URL`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `SPORTMONKS_API_TOKEN`, `USE_MOCK_API`, `PROVIDER`

### Endpoints Core (sintesi)
- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/verify`, `/api/auth/me`, `/api/auth/demo`
- Venues pubblici: `/api/venues/public`, `/api/venues/details/:id`, `/api/venues/with-announcements`, `GET /api/venues/:id/announcements`, `GET /api/venues/:id`
- Venues privati: `GET/POST /api/venues`, `PUT/DELETE /api/venues/:id`, immagini, booking-settings
- Bookings: `GET /api/bookings/availability/:venueId`, `POST /api/bookings`, `GET /api/bookings/confirm/:code`, CRUD/private
- Fixtures: `GET /api/fixtures[/*]`, `GET /api/fixtures/:id`
- Match Announcements: pubblici `GET /api/match-announcements/(hot|match/:matchId/venues|search/public|public/:id)`; privati CRUD su `/api/match-announcements`
- Analytics: venue overview/timeseries/top/match-traffic; tracking POST `profile-view|profile-click|match-click`; top matches globali

### Health & Error Handling
- Healthcheck: `GET /api/health` → 200 OK con timestamp e `tenant` attivo
- Errori: risposta JSON consistente con `success`, `message` e opzionale `error`; status comuni 400/401/403/404/429/500

