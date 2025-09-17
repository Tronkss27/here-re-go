# CONTRACTS FREEZE — SPOrTS API (Express 5)

Stato: congelamento contratti REST correnti. Fonte: `backend/src/app.js` + `backend/src/routes/*`.

- Base URL: `http://localhost:3001/api`
- Sicurezza: Bearer JWT (alcune rotte pubbliche marcate `Public`)
- Multi-tenant: contesto estratto da middleware; non influenza la forma dei payload.

## Indice Endpoint (macro-aree)
- Auth: `/auth/*`
- Tenants: `/tenants/*`
- Venues: `/venues/*`
- Bookings: `/bookings/*`
- Match Announcements: `/match-announcements/*`
- Global Matches: `/global-matches/*`
- Fixtures: `/fixtures/*`
- Matches: `/matches/*`
- Analytics: `/analytics/*` e `/venues/:venueId/analytics/*`
- Reviews: `/reviews/*` e `/venues/:venueId/reviews*`
- Offer Templates: `/offer-templates/*`
- Sync Jobs: `/sync-jobs/*`

---

## Auth
- POST `/auth/register` — Public
  - body: `{ name, email, password, isVenueOwner?, businessInfo? }`
  - 201 `{ success, token, user, venue? }`
- POST `/auth/login` — Public
  - body: `{ email, password }`
  - 200 `{ success, token, user, venue? }`
- GET `/auth/verify` — Private (JWT)
  - 200 `{ success: true, valid: true, user }`
- GET `/auth/me` — Private
  - 200 `{ success: true, user }`
- POST `/auth/demo` — Public
  - 200 `{ success, token, user }`

## Tenants
- GET `/tenants/test` — Public debug
- POST `/tenants/register` — Private
- GET `/tenants/current` — Private
- PUT `/tenants/current` — Private (role: admin)
- PUT `/tenants/current/plan` — Private (dev: venue_owner consentito)
- GET `/tenants/current/usage` — Private
- GET `/tenants` — Private (lista)

## Venues
Public:
- GET `/venues/public` — lista
- GET `/venues/search` — query match
- GET `/venues/public/:id` — dettaglio
- GET `/venues/details/:id` — alias dettaglio
- GET `/venues/with-announcements` — lista enriched
- GET `/venues/:id/announcements` — annunci del venue (pubblico)
- GET `/venues/debug-tenant` — debug
- GET `/venues/test-debug` — debug
- GET `/venues/:id` — dettaglio (optional auth)

Private:
- POST `/venues/admin/migrate-canonical`
- POST `/venues/test`
- POST `/venues` — crea
- GET `/venues` — lista tenant
- PUT `/venues/:id` — update
- DELETE `/venues/:id` — soft delete
- POST `/venues/:id/images` — upload
- DELETE `/venues/:id/images` — bulk delete
- DELETE `/venues/:id/images/:imageId` — delete
- PATCH `/venues/:id/booking-settings` — update
- GET `/venues/admin/:id` — admin view
- POST `/venues/admin/geocode-batch` — batch tool

## Bookings
- GET `/bookings` — Private (owner/admin)
- GET `/bookings/stats` — Private
- GET `/bookings/availability/:venueId` — Public
- GET `/bookings/confirm/:code` — Public
- GET `/bookings/:id` — Private
- POST `/bookings` — Public (crea prenotazione)
- PUT `/bookings/:id` — Private
- DELETE `/bookings/:id` — Private
- GET `/bookings/venue/:venueId` — Private
- GET `/bookings/user/me` — Private
- PATCH `/bookings/:id/status` — Private
- GET `/bookings/upcoming/:venueId` — Private
- POST `/bookings/check-conflict` — Public

## Match Announcements
Public:
- DELETE `/match-announcements/test/cleanup`
- GET `/match-announcements/search/matches`
- GET `/match-announcements/search/public`
- GET `/match-announcements/competitions`
- GET `/match-announcements/public/:id`
- POST `/match-announcements/track/click/:id`
- POST `/match-announcements/track/match-click`
- POST `/match-announcements/announcements/:id/track/view`
- GET `/match-announcements/hot`
- GET `/match-announcements/match/:matchId/venues`
- GET `/match-announcements/test/api-connection`

Private (authenticateVenue):
- POST `/match-announcements` — crea
- GET `/match-announcements/venue` — lista del venue
- GET `/match-announcements/venue/stats`
- GET `/match-announcements/:id` — dettaglio
- PUT `/match-announcements/:id`
- PATCH `/match-announcements/:id/archive`
- DELETE `/match-announcements/:id`
- GET `/match-announcements/analytics/venue-detailed`

## Global Matches
- GET `/global-matches` — lista
- GET `/global-matches/leagues`
- GET `/global-matches/rounds`

## Fixtures / Matches
- (fixtures.js: non mappato in dettaglio qui, incluso in OpenAPI)
- GET `/matches/search` — Private

## Analytics
Public (no JWT):
- POST `/analytics/profile-view` — body `{ venueId }`
- POST `/analytics/profile-click` — body `{ venueId }`
- POST `/analytics/match-click` — body `{ matchId }`
- GET `/analytics/matches/top` — query `{ from?, to?, limit? }`
- GET `/debug/fixtures/:id`
- GET `/debug/announcements/by-match/:id`
- GET `/debug/provider/fixture/:id`

Private (JWT):
- GET `/venues/:venueId/analytics/overview` — query `{ from?, to? }`
- GET `/venues/:venueId/analytics/top` — query `{ metric?, limit? }`
- GET `/venues/:venueId/analytics/timeseries` — query `{ metric?, from?, to? }`
- GET `/venues/:venueId/analytics/match-traffic` — query `{ from?, to? }`

## Reviews
- GET `/venues/:venueId/reviews/summary` — Public
- GET `/venues/:venueId/reviews` — Public (filtri rating/limit)
- POST `/reviews/:id/reply` — Private

## Offer Templates (authenticateVenue)
- GET `/offer-templates` — lista
- POST `/offer-templates` — crea
- PUT `/offer-templates/:id` — update
- DELETE `/offer-templates/:id` — delete

## Sync Jobs
- POST `/sync-jobs` — Private
- GET `/sync-jobs/:jobId` — Private
- GET `/sync-jobs` — Private

---

## Errori (pattern)
- 400 validation errors: `{ errors: [ { msg, param, ... } ] }` o `{ success:false, message }`
- 401 auth: `{ message: 'Invalid credentials' }` o `{ success:false, error:'Unauthorized' }`
- 403 forbidden: `{ success:false, error:'Forbidden' }`
- 404 not found: `{ success:false, message:'... non trovato' }` o `{ success:false, error:'Route not found' }`
- 429 rate limit: `{ success:false, error:'Rate limit exceeded', message:'Too many requests for your plan' }`
- 500 internal: `{ success:false, error:'Internal server error', message:'...' }`

---

## Note di compatibilità
- Il CORS accetta `FRONTEND_URL` e `http://localhost:5174/5175`.
- Header `X-Tenant-ID` richiesto in varie POST/GET lato backend per corretto scoping; non altera i payload.
- Tutti i contratti sono congelati al commit corrente; modifiche successive richiedono bump di versione.
