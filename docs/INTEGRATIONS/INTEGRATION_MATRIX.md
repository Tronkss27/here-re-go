## Matrice di Integrazione (User + Admin)

Questa matrice collega feature → endpoint → schermate → dipendenze (auth, storage, notifiche, mappe) per l’allineamento tra Web corrente e futura app Flutter. I contratti REST sono quelli definiti in `openapi.json` (freeze, non-breaking). Non è richiesto modificare il backend.

### Legenda dipendenze
- Auth: richiede `Authorization: Bearer <JWT>`
- Storage: persistenza sicura di token/tenant (es. Secure Storage)
- Notifiche: push/locale opzionali
- Mappe: provider mappa per UI (es. Google/Apple)

### Base URL e Headers
- Base URL: `http://localhost:3001/api` (Dev). Override per Staging/Prod via ENV (vedi `INTEGRATIONS/CONFIG_GUIDE.md`).
- Multi-tenant: includere sempre `X-Tenant-ID` per chiamate tenant-scoped o analytics per garantire consistenza dei dati tra admin e pubblici quando applicabile.

### Tabella: Feature ↔ Endpoint ↔ Schermate ↔ Dipendenze

| Feature | Persona | Schermata/Modulo | Endpoint | Auth | Storage | Notifiche | Mappe | Note |
|---|---|---|---|---|---|---|---|---|
| Health check | Tutti | Splash/Bootstrap | `GET /health` | No | No | No | No | Verifica reachability/tenant attivo |
| Registrazione | User/Admin | Auth → Register | `POST /auth/register` | No | No | No | No | Restituisce utente/venue opzionale |
| Login | User/Admin | Auth → Login | `POST /auth/login` | No | Sì (token) | No | No | Salvare JWT in storage sicuro |
| Me/Verify | Admin | Profilo/Bootstrap | `GET /auth/me`, `GET /auth/verify` | Sì | Sì | No | No | Validazione token all’avvio |
| Cerca locali | User | Ricerca | `GET /venues/search` | No | No | No | Facolt. | Query testuale/filtri |
| Lista locali pubblici | User | Home/Lista | `GET /venues/public` | No | No | No | Facolt. | Paginazione lato server opzionale |
| Dettaglio locale | User | Venue Detail | `GET /venues/public/{id}` | No | No | No | Facolt. | Mostra info e posizione |
| Annunci pubblici (search) | User | Annunci/Lista | `GET /match-announcements/search/public` | No | No | No | No | Filtri: query, data, competition, city |
| Annuncio pubblico (detail) | User | Annunci/Detail | `GET /match-announcements/public/{id}` | No | No | No | No | `incrementView` opzionale |
| Venue che trasmettono match | User | Match → Venue list | `GET /match-announcements/match/{matchId}/venues` | No | No | No | No | Collegamento da global matches |
| Annunci hot | User | Home/Hot | `GET /match-announcements/hot` | No | No | No | No | Curazione contenuti |
| Global matches (liste) | User | Calendario | `GET /global-matches`, `/leagues`, `/rounds?league=...` | No | No | No | No | Sincronizzazione leghe/turni |
| Disponibilità prenotazioni | User | Booking → Availability | `GET /bookings/availability/{venueId}` | No | No | No | No | UI fasce orarie |
| Crea prenotazione | User | Booking → Create | `POST /bookings` | No | Facolt. (draft) | Facolt. | No | Conferma e recap |
| Traccia view profilo | User | Venue Detail visibile | `POST /analytics/profile-view` | No | Facolt. (queue) | No | No | Includere `X-Tenant-ID` coerente |
| Traccia click profilo | User | CTA click | `POST /analytics/profile-click` | No | Facolt. (queue) | No | No | Come sopra |
| Traccia click match | User | Click su match | `POST /analytics/match-click` | No | Facolt. (queue) | No | No | Consistenza tenant |
| Top match (global) | User | Statistiche pubbliche | `GET /analytics/matches/top` | No | No | No | No | Parametri from/to/limit |
| Dashboard annunci (lista) | Admin | Admin → Annunci | `GET /match-announcements/venue` | Sì | Sì | No | No | Filtri status |
| Crea annuncio | Admin | Admin → Annunci → Nuovo | `POST /match-announcements` | Sì | Sì | Facolt. | No | Validazioni lato client |
| Modifica/Elimina annuncio | Admin | Admin → Annunci → Detail/Edit | `GET/PUT/DELETE /match-announcements/{id}` | Sì | Sì | No | No | Stati: published/draft/archived |
| Template offerte: lista/crea | Admin | Admin → Offerte/Template | `GET/POST /offer-templates` | Sì | Sì | No | No | CRUD template riutilizzabili |
| Template offerte: update/del | Admin | Admin → Offerte/Template → Edit | `PUT/DELETE /offer-templates/{id}` | Sì | Sì | No | No | Soft toggle `isActive` |
| Prenotazioni: lista | Admin | Admin → Prenotazioni | `GET /bookings` | Sì | Sì | No | No | Scope tenant |
| Prenotazione: get/update/del | Admin | Admin → Prenotazioni → Detail | `GET/PUT/DELETE /bookings/{id}` | Sì | Sì | No | No | Update stato |
| Analytics venue overview | Admin | Admin → Statistiche → Overview | `GET /venues/{venueId}/analytics/overview` | Sì | Sì | No | No | Header `Cache-Control: no-store` lato client |
| Analytics top | Admin | Admin → Statistiche → Top | `GET /venues/{venueId}/analytics/top` | Sì | Sì | No | No | Param `metric`, `limit` |
| Analytics timeseries | Admin | Admin → Statistiche → Grafico | `GET /venues/{venueId}/analytics/timeseries` | Sì | Sì | No | No | Param date range, `metric` |
| Match traffic | Admin | Admin → Statistiche → Traffico match | `GET /venues/{venueId}/analytics/match-traffic` | Sì | Sì | No | No | Range date |

### Collegamento componenti (senza modificare backend)
1) Configurare base URL/tenant a livello di client (Flutter): leggere ENV per `API_BASE_URL` e `TENANT_ID` e inserirli negli interceptor dell’HTTP client.
2) Autenticazione: dopo `POST /auth/login`, salvare `JWT` in Secure Storage; allegarlo in `Authorization` per endpoint protetti.
3) Multi-tenant: allegare `X-Tenant-ID` dove richiesto (admin + analytics) per coerenza dei dati.
4) Tracking resiliente: accodare eventi analytics offline, inviare con retry/backoff e marcare come sincronizzati.
5) Caching: per GET pubblici (venues, matches) usare cache con invalidazione time-based; per analytics usare `no-store`.
6) Mappe: opzionale, mostrare posizione venue su dettaglio usando provider scelto.


