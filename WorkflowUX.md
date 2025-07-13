# 📋 WorkflowUX - SPOrTS Platform
## La Bibbia Completa dei Flussi Utente

### 📑 Indice
1. [Panoramica Sistema](#panoramica-sistema)
2. [Ruoli Utente](#ruoli-utente)
3. [Struttura Progetto](#struttura-progetto)
4. [Workflow Utente Cliente](#workflow-utente-cliente)
5. [Workflow Venue Owner](#workflow-venue-owner)
6. [Workflow Admin Sistema](#workflow-admin-sistema)
7. [API Reference](#api-reference)
8. [File e Componenti Responsabili](#file-e-componenti-responsabili)

---

## 🎯 Panoramica Sistema

SPOrTS è una piattaforma multi-tenant per la gestione di bar sportivi che permette:
- **Clienti**: Prenotare tavoli, visualizzare partite, gestire prenotazioni
- **Venue Owner**: Gestire il proprio locale, prenotazioni, eventi
- **Admin**: Gestire l'intero sistema multi-tenant

### Architettura Multi-Tenant
```
Header: X-Tenant-ID: <tenant-slug>
```

---

## 👥 Ruoli Utente

### 1. **User (Cliente)**
- Registrazione e login
- Ricerca locali
- Visualizzazione dettagli venue
- Prenotazione tavoli
- Gestione prenotazioni personali
- Visualizzazione partite
- Recensioni e valutazioni

### 2. **Venue Owner**
- Tutto quanto sopra +
- Gestione del proprio locale
- Gestione prenotazioni ricevute
- Creazione eventi/partite
- Gestione offerte
- Visualizzazione statistiche
- Onboarding guidato

### 3. **Admin**
- Gestione multi-tenant
- Gestione utenti sistema
- Monitoring e analytics
- Configurazioni globali

---

## 📁 Struttura Progetto

```
SPOrTS/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/           # Componenti autenticazione
│   │   │   ├── ui/             # Componenti UI base
│   │   │   ├── forms/          # Form components
│   │   │   └── layout/         # Layout components
│   │   ├── pages/
│   │   │   ├── admin/          # Pagine admin venue
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── BookingsManagement.tsx
│   │   │   │   ├── CalendarioPartite.tsx
│   │   │   │   ├── ProfiloLocale.tsx
│   │   │   │   ├── Statistiche.tsx
│   │   │   │   └── VenueOnboarding.tsx
│   │   │   ├── Index.tsx       # Homepage
│   │   │   ├── Locali.tsx      # Lista venues
│   │   │   ├── VenueDetail.tsx # Dettaglio venue
│   │   │   ├── MyBookings.tsx  # Prenotazioni utente
│   │   │   ├── Login.jsx       # Login
│   │   │   └── Register.jsx    # Registrazione
│   │   ├── services/           # API services
│   │   ├── contexts/           # React contexts
│   │   └── hooks/              # Custom hooks
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js         # Auth endpoints
│   │   │   ├── venues.js       # Venue endpoints
│   │   │   ├── bookings.js     # Booking endpoints
│   │   │   ├── fixtures.js     # Match endpoints
│   │   │   └── matchAnnouncements.js
│   │   ├── controllers/        # Business logic
│   │   ├── models/            # Database models
│   │   └── middlewares/       # Auth, tenant, etc.
```

---

## 🔄 Workflow Utente Cliente

### 1. **Registrazione/Login**

#### UI Flow:
```
Homepage → "Accedi" → Login/Register → Dashboard
```

#### Components:
- **Pages**: `/pages/Login.jsx`, `/pages/Register.jsx`
- **API**: `POST /api/auth/register`, `POST /api/auth/login`
- **Context**: `/contexts/AuthContext.jsx`

#### Processo:
1. Utente clicca "Accedi" nell'header
2. Scelta tra Login/Registrazione
3. Form validazione client-side
4. API call con tenant context
5. JWT token storage
6. Redirect a dashboard/homepage

### 2. **Ricerca e Visualizzazione Locali**

#### UI Flow:
```
Homepage → "Trova Locali" → Lista Venues → Dettaglio Venue
```

#### Components:
- **Pages**: `/pages/Locali.tsx`, `/pages/VenueDetail.tsx`
- **Components**: `/components/VenueCard.tsx`, `/components/ui/SearchBar.tsx`
- **API**: `GET /api/venues`, `GET /api/venues/:id`

#### Processo:
1. Homepage mostra venues in evidenza
2. Click "Trova Locali" → pagina lista completa
3. Filtri disponibili:
   - Città
   - Features (WiFi, Schermo grande, etc.)
   - Ricerca testuale
4. Click su venue → pagina dettaglio
5. Visualizzazione:
   - Info base (nome, indirizzo, orari)
   - Galleria immagini
   - Features disponibili
   - Partite programmate
   - Form prenotazione

### 3. **Prenotazione Tavolo**

#### UI Flow:
```
Venue Detail → Seleziona Data/Ora → Form Prenotazione → Conferma
```

#### Components:
- **Components**: `/components/BookingForm.tsx`, `/components/CalendarComponent.tsx`
- **API**: `POST /api/bookings`
- **Services**: `/services/bookingsService.js`

#### Processo:
1. Nella pagina venue, sezione prenotazione
2. Selezione data dal calendario
3. Selezione orario disponibile
4. Form dati prenotazione:
   - Numero persone
   - Note speciali
   - Partita di interesse (opzionale)
5. Conferma e pagamento (se richiesto)
6. Email conferma
7. Redirect a "Le mie prenotazioni"

### 4. **Gestione Prenotazioni Personali**

#### UI Flow:
```
Menu Utente → "Le mie prenotazioni" → Lista → Dettaglio/Azioni
```

#### Components:
- **Pages**: `/pages/MyBookings.tsx`
- **Components**: `/components/BookingList.tsx`, `/components/BookingStatusBadge.tsx`
- **API**: `GET /api/bookings/my`, `PUT /api/bookings/:id/cancel`

#### Processo:
1. Accesso da menu utente
2. Lista prenotazioni con filtri:
   - Attive
   - Passate
   - Cancellate
3. Per ogni prenotazione:
   - Status badge (confermata, pending, cancellata)
   - Dettagli venue e orario
   - Azioni: Cancella (se permesso), Modifica
4. Dettaglio prenotazione:
   - QR code (se applicabile)
   - Info complete
   - Mappa venue

### 5. **Visualizzazione Partite ed Eventi**

#### UI Flow:
```
Homepage/Venue → "Partite Oggi" → Lista Eventi → Dettaglio
```

#### Components:
- **Components**: `/components/UpcomingMatches.tsx`, `/components/MatchCard.tsx`
- **API**: `GET /api/fixtures`, `GET /api/match-announcements`
- **Hooks**: `/hooks/useTodaysMatches.js`

#### Processo:
1. Widget "Partite Oggi" in homepage
2. Filtro per sport/competizione
3. Click su partita → venues che la trasmettono
4. Possibilità prenotazione diretta per evento

---

## 🏪 Workflow Venue Owner

### 1. **Onboarding Venue Owner**

#### UI Flow:
```
Registrazione → Selezione "Sono un locale" → Wizard Onboarding → Dashboard Admin
```

#### Components:
- **Pages**: `/pages/admin/VenueOnboarding.tsx`
- **Components**: `/components/wizard-steps/*`
- **API**: `POST /api/venues/onboarding`

#### Processo:
1. **Step 1 - Info Base**:
   - Nome locale
   - Tipologia
   - Indirizzo completo
2. **Step 2 - Contatti**:
   - Email
   - Telefono
   - Sito web
3. **Step 3 - Orari**:
   - Orari apertura per giorno
   - Giorni chiusura
4. **Step 4 - Features**:
   - WiFi, Parcheggio, etc.
   - Numero schermi
   - Capienza
5. **Step 5 - Configurazione Booking**:
   - Abilita prenotazioni
   - Slot orari
   - Capienza per slot
6. **Step 6 - Media**:
   - Upload logo
   - Galleria immagini
   - Immagine copertina

### 2. **Dashboard Admin Venue**

#### UI Flow:
```
Login → Dashboard → Sezioni Gestione
```

#### Components:
- **Pages**: `/pages/admin/AdminDashboard.tsx`
- **Layout**: `/pages/admin/AdminLayout.tsx`
- **API**: `GET /api/venues/dashboard`

#### Sezioni Dashboard:
1. **Overview**:
   - Prenotazioni oggi
   - Statistiche settimana
   - Prossimi eventi
2. **Quick Actions**:
   - Nuova prenotazione manuale
   - Crea evento
   - Gestisci disponibilità

### 3. **Gestione Prenotazioni**

#### UI Flow:
```
Dashboard → "Prenotazioni" → Lista/Calendario → Azioni
```

#### Components:
- **Pages**: `/pages/admin/BookingsManagement.tsx`
- **Components**: `/components/BookingStatusActions.tsx`
- **API**: `GET /api/bookings/venue`, `PUT /api/bookings/:id/status`

#### Processo:
1. Vista lista o calendario
2. Filtri:
   - Data
   - Status
   - Nome cliente
3. Azioni per prenotazione:
   - Conferma
   - Cancella
   - Modifica
   - Check-in
4. Creazione manuale prenotazione
5. Export dati (CSV/PDF)

### 4. **Gestione Eventi e Partite**

#### UI Flow:
```
Dashboard → "Calendario Partite" → Crea/Modifica → Pubblica
```

#### Components:
- **Pages**: `/pages/admin/CalendarioPartite.tsx`
- **Forms**: `/components/forms/CreateMatchAnnouncementForm.tsx`
- **API**: `POST /api/match-announcements`, `GET /api/fixtures/search`

#### Processo:
1. Vista calendario eventi
2. "Crea Evento":
   - Ricerca partita da API sport
   - O creazione manuale evento
3. Dettagli evento:
   - Sport e competizione
   - Squadre
   - Data/ora
   - Canale TV
   - Offerte speciali associate
4. Pubblicazione su piattaforma
5. Notifiche automatiche clienti interessati

### 5. **Gestione Profilo Locale**

#### UI Flow:
```
Dashboard → "Profilo Locale" → Modifica → Salva
```

#### Components:
- **Pages**: `/pages/admin/ProfiloLocale.tsx`
- **API**: `PUT /api/venues/:id`, `POST /api/venues/:id/images`

#### Sezioni Modificabili:
1. **Informazioni Base**:
   - Nome, descrizione
   - Indirizzo
   - Contatti
2. **Orari e Disponibilità**:
   - Orari apertura
   - Chiusure straordinarie
   - Capienza
3. **Features e Servizi**:
   - Aggiunta/rimozione features
   - Prezzi medi
   - Menu disponibili
4. **Media**:
   - Gestione galleria immagini
   - Video promozionali
   - Virtual tour
5. **SEO e Visibilità**:
   - Keywords
   - Descrizione SEO
   - Social links

### 6. **Statistiche e Analytics**

#### UI Flow:
```
Dashboard → "Statistiche" → Periodo → Visualizza Report
```

#### Components:
- **Pages**: `/pages/admin/Statistiche.tsx`
- **API**: `GET /api/venues/analytics`
- **Hooks**: `/hooks/useBookingStats.js`

#### Metriche Disponibili:
1. **Prenotazioni**:
   - Totali per periodo
   - Tasso conversione
   - No-show rate
2. **Clienti**:
   - Nuovi vs ricorrenti
   - Demografia
   - Preferenze
3. **Revenue**:
   - Fatturato per periodo
   - Ticket medio
   - Confronto periodi
4. **Eventi**:
   - Partecipazione eventi
   - Eventi più popolari
   - ROI eventi

---

## 🔑 Workflow Admin Sistema

### 1. **Gestione Multi-Tenant**

#### Components:
- **Middleware**: `/backend/src/middlewares/tenantMiddleware.js`
- **Model**: `/backend/src/models/Tenant.js`

#### Funzionalità:
1. Creazione nuovi tenant
2. Gestione piani e limiti
3. Monitoring utilizzo
4. Billing e fatturazione

### 2. **Gestione Utenti Globale**

#### API:
- `GET /api/admin/users`
- `PUT /api/admin/users/:id/role`
- `DELETE /api/admin/users/:id`

#### Funzionalità:
1. Lista tutti utenti sistema
2. Cambio ruoli
3. Attivazione/disattivazione account
4. Reset password

---

## 🔌 API Reference

### Authentication
```javascript
// Registrazione
POST /api/auth/register
Body: { name, email, password, role }
Response: { token, user }

// Login
POST /api/auth/login
Body: { email, password }
Response: { token, user }

// Current User
GET /api/auth/me
Headers: { Authorization: "Bearer <token>" }
Response: { user }
```

### Venues
```javascript
// Lista venues (con filtri)
GET /api/venues?city=Milano&features=wifi,parking
Headers: { X-Tenant-ID: "<tenant-slug>" }
Response: { venues: [], pagination: {} }

// Dettaglio venue
GET /api/venues/:id
Headers: { X-Tenant-ID: "<tenant-slug>" }
Response: { venue }

// Update venue (owner only)
PUT /api/venues/:id
Headers: { Authorization: "Bearer <token>", X-Tenant-ID: "<tenant-slug>" }
Body: { ...venueData }
Response: { venue }
```

### Bookings
```javascript
// Crea prenotazione
POST /api/bookings
Headers: { Authorization: "Bearer <token>", X-Tenant-ID: "<tenant-slug>" }
Body: { 
  venueId, 
  date, 
  timeSlot, 
  numberOfPeople,
  customerInfo: { name, email, phone },
  notes
}
Response: { booking }

// Le mie prenotazioni (cliente)
GET /api/bookings/my
Headers: { Authorization: "Bearer <token>", X-Tenant-ID: "<tenant-slug>" }
Response: { bookings: [] }

// Prenotazioni venue (owner)
GET /api/bookings/venue
Headers: { Authorization: "Bearer <token>", X-Tenant-ID: "<tenant-slug>" }
Response: { bookings: [] }

// Update status prenotazione
PUT /api/bookings/:id/status
Headers: { Authorization: "Bearer <token>", X-Tenant-ID: "<tenant-slug>" }
Body: { status: "confirmed|cancelled|completed" }
Response: { booking }
```

### Match Announcements
```javascript
// Lista annunci partite
GET /api/match-announcements
Headers: { X-Tenant-ID: "<tenant-slug>" }
Response: { announcements: [] }

// Crea annuncio (venue owner)
POST /api/match-announcements
Headers: { Authorization: "Bearer <token>", X-Tenant-ID: "<tenant-slug>" }
Body: {
  sport,
  competition,
  homeTeam,
  awayTeam,
  dateTime,
  tvChannel,
  specialOffers
}
Response: { announcement }
```

---

## 📂 File e Componenti Responsabili

### Frontend - Componenti Chiave

#### Layout e Navigation
- `/components/Header.tsx` - Header principale con menu
- `/components/AdminSidebar.tsx` - Sidebar admin venue
- `/components/layout/AdminLayout.tsx` - Layout wrapper admin

#### Autenticazione
- `/contexts/AuthContext.jsx` - Gestione stato auth globale
- `/components/ProtectedRoute.jsx` - Route protette
- `/components/VenueProtectedRoute.jsx` - Route solo venue owner

#### Booking System
- `/components/BookingForm.tsx` - Form prenotazione
- `/components/BookingList.tsx` - Lista prenotazioni
- `/components/BookingStatusBadge.tsx` - Badge stato
- `/components/CalendarComponent.tsx` - Calendario disponibilità

#### Venue Management
- `/components/VenueCard.tsx` - Card venue in lista
- `/components/forms/StepBasicInfo.jsx` - Wizard step 1
- `/components/forms/StepHours.tsx` - Wizard orari
- `/components/forms/StepImages.tsx` - Wizard media

#### UI Components
- `/components/ui/Button.tsx` - Bottoni sistema
- `/components/ui/Input.tsx` - Input forms
- `/components/ui/Modal.tsx` - Modali sistema
- `/components/ui/Loading.jsx` - Loading states

### Backend - Controllers e Services

#### Controllers
- `/controllers/venueController.js` - Logica venues
- `/controllers/bookingController.js` - Logica bookings
- `/controllers/matchAnnouncementController.js` - Eventi

#### Services
- `/services/bookingsService.js` - Business logic bookings
- `/services/emailService.js` - Notifiche email
- `/services/sportsApiService.js` - Integrazione API sport

#### Middleware
- `/middlewares/auth.js` - Autenticazione JWT
- `/middlewares/tenantMiddleware.js` - Multi-tenant
- `/middlewares/roleMiddleware.js` - Controllo ruoli
- `/middlewares/validation.js` - Validazione input

### Database Models

#### Models
- `/models/User.js` - Schema utenti
- `/models/Venue.js` - Schema venues
- `/models/Booking.js` - Schema prenotazioni
- `/models/Tenant.js` - Schema tenant
- `/models/MatchAnnouncement.js` - Schema eventi

---

## 🔄 Flussi di Stato

### Auth State Flow
```
Non Autenticato → Login → JWT Storage → Autenticato → Logout → Non Autenticato
```

### Booking State Flow
```
Draft → Pending → Confirmed → Completed/Cancelled
```

### Venue State Flow
```
Onboarding → Draft → Active → Suspended (se necessario)
```

---

## 🎨 UI/UX Guidelines

### Design System
- **Colori Primari**: Orange (#F97316) per CTA principali
- **Font**: System fonts per performance
- **Spacing**: Tailwind spacing system (4, 8, 16, 24, 32)
- **Breakpoints**: Mobile-first (sm: 640px, md: 768px, lg: 1024px)

### Component Patterns
- **Cards**: Rounded corners, subtle shadows
- **Forms**: Label sopra, validazione inline
- **Modals**: Overlay scuro, animazioni smooth
- **Loading**: Skeleton screens dove possibile

### Accessibility
- **ARIA labels** su tutti i componenti interattivi
- **Keyboard navigation** completa
- **Focus indicators** visibili
- **Alt text** su tutte le immagini

---

## 📱 Responsive Behavior

### Mobile (< 768px)
- Menu hamburger
- Form single column
- Cards stack verticale
- Calendario scroll orizzontale

### Tablet (768px - 1024px)
- Sidebar collassabile
- Grid 2 colonne
- Form multi-step

### Desktop (> 1024px)
- Sidebar fissa
- Grid 3-4 colonne
- Form in modal/sidebar

---

## 🚀 Performance Optimizations

### Frontend
- **Lazy loading** routes e immagini
- **Code splitting** per ruolo utente
- **React Query** per cache API
- **Debounce** su ricerche

### Backend
- **Database indexing** su campi ricerca
- **Rate limiting** per tenant
- **Cache** risultati comuni
- **Pagination** su liste lunghe

---

## 🔐 Security Considerations

### Authentication
- JWT con expiry breve
- Refresh token sicuri
- Password hashing bcrypt

### Authorization
- Role-based access control
- Tenant isolation completo
- Ownership validation

### Data Protection
- Input sanitization
- SQL injection prevention
- XSS protection

---

## 📈 Analytics e Tracking

### User Events
- Page views
- Booking conversions
- Search queries
- Feature usage

### Business Metrics
- Booking rate
- User retention
- Venue performance
- Peak hours

---

## 🐛 Error Handling

### Frontend
- Error boundaries React
- Toast notifications
- Fallback UI states
- Retry mechanisms

### Backend
- Centralized error handler
- Proper status codes
- Detailed error messages (dev)
- Generic messages (prod)

---

## 📚 Documentazione Correlata

- [README.md](/README.md) - Overview progetto
- [API.md](/docs/API.md) - Documentazione API completa
- [MULTI_TENANT.md](/docs/MULTI_TENANT.md) - Sistema multi-tenant
- [DEVELOPMENT.md](/docs/DEVELOPMENT.md) - Guida sviluppo

---

## 🎯 Best Practices

### Code Organization
- Componenti piccoli e riutilizzabili
- Separazione logica/presentazione
- Custom hooks per logica condivisa
- Services per API calls

### State Management
- Context per stato globale
- Local state quando possibile
- React Query per server state
- Avoid prop drilling

### Testing
- Unit test componenti critici
- Integration test API
- E2E test flussi principali
- Accessibility testing

---

Questa documentazione rappresenta la **BIBBIA COMPLETA** del sistema SPOrTS, coprendo ogni singolo aspetto dell'applicazione dal punto di vista UX, architettura e implementazione.