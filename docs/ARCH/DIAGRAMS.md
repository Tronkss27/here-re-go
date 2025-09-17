## Diagrammi Architettura (Mermaid)

### C4 – Container (High-level)
```mermaid
C4Context
title SPOrTS – C4 Container
Person(user, "Utente/Amministratore")
System_Boundary(s1, "SPOrTS") {
  Container(web, "Frontend (React)", "Browser")
  Container(api, "Backend API (Express)", "Node.js")
  ContainerDb(db, "MongoDB", "Database")
  Container(job, "Scheduler/Jobs", "Agenda/Cron")
}
System_Ext(ext, "Sportmonks API", "Fixtures & Leagues")
Rel(user, web, "Usa")
Rel(web, api, "HTTP/JSON (Axios)")
Rel(api, db, "CRUD (Mongoose)")
Rel(api, ext, "HTTP (token)")
Rel(job, db, "Legge/Scrive")
```

### Sequence – Login
```mermaid
sequenceDiagram
  participant U as Utente
  participant FE as Frontend
  participant API as Backend /api
  participant DB as MongoDB
  U->>FE: Inserisce email/password
  FE->>API: POST /api/auth/login { email, password }
  API->>DB: User.findOne(email) + matchPassword
  DB-->>API: user
  API-->>FE: { token (JWT), user, venue? }
  FE->>FE: Salva JWT, imposta header Authorization
```

### Sequence – Ricerca Locali
```mermaid
sequenceDiagram
  participant U as Utente
  participant FE as Frontend
  participant API as Backend /api
  participant DB as MongoDB
  U->>FE: Cerca partite/locali
  FE->>API: GET /api/match-announcements/hot (o /search/public)
  API->>DB: Aggregazioni Annunci/Fixture
  DB-->>API: risultati
  API-->>FE: lista partite/annunci
  FE->>API: GET /api/venues/with-announcements
  API->>DB: find Venues con annunci attivi
  DB-->>API: venues
  API-->>FE: lista venues
```

### Sequence – Prenotazione
```mermaid
sequenceDiagram
  participant U as Utente
  participant FE as Frontend
  participant API as Backend /api
  participant DB as MongoDB
  U->>FE: Seleziona locale/data/orario
  FE->>API: GET /api/bookings/availability/:venueId?date=<ISO>
  API->>DB: calcolo slot disponibili
  DB-->>API: slots
  API-->>FE: slots
  U->>FE: Conferma prenotazione
  FE->>API: POST /api/bookings { venue, date, timeSlot, partySize, customer }
  API->>DB: create Booking
  DB-->>API: booking
  API-->>FE: { success, data: booking }
```

### Sequence – CRUD Admin (Annuncio Partita)
```mermaid
sequenceDiagram
  participant OW as Venue Owner (JWT)
  participant FE as Frontend Admin
  participant API as Backend /api
  participant DB as MongoDB
  FE->>API: GET /api/offer-templates (Authorization, X-Tenant-ID)
  API->>DB: Query OfferTemplate per tenant
  DB-->>API: templates
  API-->>FE: templates
  FE->>API: POST /api/match-announcements { match, eventDetails, selectedOffers }
  API->>API: authenticateVenue → resolve req.venue, req.tenantId
  API->>DB: Validazioni duplicati + insert MatchAnnouncement
  DB-->>API: nuovo annuncio
  API-->>FE: { success, data: annuncio }
```


