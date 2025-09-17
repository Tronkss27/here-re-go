## Contratti API (Matrice)

Formato colonne: Endpoint | Metodo | Path | Auth | RequestSchema | ResponseSchema | Errori

| Endpoint | Metodo | Path | Auth | RequestSchema (estratto) | ResponseSchema (estratto) | Errori |
|---|---|---|---|---|---|---|
| Auth Register | POST | /api/auth/register | No | { name, email, password, isVenueOwner?, businessInfo? } | { success, token, user, venue? } | 400 validation, 500 |
| Auth Login | POST | /api/auth/login | No | { email, password } | { success, token, user, venue? } | 401 invalid, 500 |
| Auth Verify | GET | /api/auth/verify | Bearer | - | { success, valid, user } | 401, 500 |
| Me | GET | /api/auth/me | Bearer | - | { success, user } | 401, 500 |
| Demo | POST | /api/auth/demo | No | - | { success, token, user } | 500 |
| Venues Public List | GET | /api/venues/public | No | query opzionali | { success, data[] } | 500 |
| Venue Details Public | GET | /api/venues/details/:id | No | params.id | { success, data } | 404, 500 |
| Venue Announcements (pubblico) | GET | /api/venues/:id/announcements | No | params.id | { success, data[] } | 400, 500 |
| Venues With Announcements | GET | /api/venues/with-announcements | No | - | { success, data[] } | 500 |
| Venues Private List | GET | /api/venues | Bearer + Tenant | query: page, limit, status... | { success, data[], pagination } | 400, 401, 403, 500 |
| Create Venue | POST | /api/venues | Bearer + Tenant | body validato | { success, data } | 400, 401, 403, 500 |
| Update Venue | PUT | /api/venues/:id | Bearer + Tenant | params.id + body | { success, data } | 400, 401, 403, 404, 500 |
| Delete Venue | DELETE | /api/venues/:id | Bearer + Tenant | params.id | { success } | 400, 401, 403, 404, 500 |
| Upload Images | POST | /api/venues/:id/images | Bearer + Tenant | multipart form | { success, data } | 400, 401, 403, 404, 500 |
| Booking Settings | PATCH | /api/venues/:id/booking-settings | Bearer + Tenant | params.id + body | { success, data } | 400, 401, 403, 500 |
| Availability | GET | /api/bookings/availability/:venueId | Tenant (no Bearer) | params.venueId + date | { success, data: slots[] } | 400, 500 |
| Create Booking | POST | /api/bookings | Tenant (no Bearer) | { venue, date, timeSlot, partySize, customer } | { success, data } | 400, 500 |
| Booking by Code | GET | /api/bookings/confirm/:code | No | params.code | { success, data } | 400, 404, 500 |
| Bookings List | GET | /api/bookings | Bearer + Tenant | query | { success, data[], pagination } | 400, 401, 403, 500 |
| Update Booking | PUT | /api/bookings/:id | Bearer + Tenant | params.id + body | { success, data } | 400, 401, 403, 404, 500 |
| Delete Booking | DELETE | /api/bookings/:id | Bearer + Tenant | params.id | { success } | 400, 401, 403, 404, 500 |
| Fixtures List | GET | /api/fixtures | No | query | { success, data[] } | 500 |
| Fixture By Id | GET | /api/fixtures/:id | No | params.id | { success, data } | 404, 500 |
| Popular Fixtures | GET | /api/fixtures/popular | No | - | { success, data[] } | 500 |
| Match Anns Hot | GET | /api/match-announcements/hot | No | query | { success, data[] } | 500 |
| Match → Venues | GET | /api/match-announcements/match/:matchId/venues | No | params.matchId | { success, data[] } | 400, 500 |
| Annunci Public Search | GET | /api/match-announcements/search/public | No | query | { success, data[], pagination? } | 400, 500 |
| Annuncio Pubblico | GET | /api/match-announcements/public/:id | No | params.id | { success, data } | 400, 404, 500 |
| Track Match Click | POST | /api/match-announcements/track/match-click | No | { matchId } | { success } | 400, 500 |
| Create Announcement | POST | /api/match-announcements | Bearer (venue) | body validato | { success, data } | 400, 401, 403, 409, 500 |
| Venue Announcements | GET | /api/match-announcements/venue | Bearer (venue) | query | { success, data[] } | 400, 401, 403, 500 |
| Update Announcement | PUT | /api/match-announcements/:id | Bearer (venue) | params.id + body | { success, data } | 400, 401, 403, 404, 500 |
| Archive Announcement | PATCH | /api/match-announcements/:id/archive | Bearer (venue) | params.id | { success } | 400, 401, 403, 404, 500 |
| Delete Announcement | DELETE | /api/match-announcements/:id | Bearer (venue) | params.id | { success } | 400, 401, 403, 404, 500 |
| Analytics Overview | GET | /api/venues/:venueId/analytics/overview | Bearer | params.venueId + range | { success, data } | 400, 401, 500 |
| Analytics Timeseries | GET | /api/venues/:venueId/analytics/timeseries | Bearer | params.venueId + metric + range | { success, data } | 400, 401, 500 |
| Analytics Match Traffic | GET | /api/venues/:venueId/analytics/match-traffic | Bearer | params.venueId + range | { success, data } | 400, 401, 500 |
| Track Profile View | POST | /api/analytics/profile-view | No | { venueId, matchId? } | { success } | 400, 500 |
| Track Profile Click | POST | /api/analytics/profile-click | No | { venueId, matchId? } | { success } | 400, 500 |
| Top Matches (global) | GET | /api/analytics/matches/top?global=true | No | range + limit | { success, data } | 500 |
| Offer Templates List | GET | /api/offer-templates | Bearer (venue) | query | { success, data[] } | 401, 403, 500 |
| Offer Templates Create | POST | /api/offer-templates | Bearer (venue) | body | { success, data } | 400, 401, 403, 500 |
| Offer Templates Update | PUT | /api/offer-templates/:id | Bearer (venue) | params.id + body | { success, data } | 400, 401, 403, 404, 500 |
| Offer Templates Delete | DELETE | /api/offer-templates/:id | Bearer (venue) | params.id | { success } | 400, 401, 403, 404, 500 |
| Reviews Summary | GET | /api/venues/:venueId/reviews/summary | No | params.venueId | { success, data } | 400, 500 |
| Reviews List | GET | /api/venues/:venueId/reviews | No | params.venueId + query | { success, data[] } | 400, 500 |
| Reviews Reply | POST | /api/reviews/:id/reply | Bearer | params.id + { text } | { success } | 400, 401, 404, 500 |
| Health | GET | /api/health | No | - | { status, message, timestamp, tenant } | - |

### Estensioni Admin/Advanced

| Endpoint | Metodo | Path | Auth | RequestSchema (estratto) | ResponseSchema (estratto) | Errori |
|---|---|---|---|---|---|---|
| Global Matches | GET | /api/global-matches | No | league?, fromDate?, toDate?, limit?, page? | { success, data[], pagination } | 500 |
| Global Leagues | GET | /api/global-matches/leagues | No | onlyAvailable? | { success, data[] } | 500 |
| Global Rounds | GET | /api/global-matches/rounds | No | league, limitRounds? | { success, data: rounds[] } | 400, 500 |
| Create Sync Job | POST | /api/sync-jobs | Bearer | { league, dateRange:{startDate,endDate}, syncInfo? } | { success, data:{ jobId, ... } } | 400, 401, 500 |
| Get Sync Job | GET | /api/sync-jobs/:jobId | Bearer | params.jobId | { success, data:{ status, progress... } } | 400, 401, 404, 500 |
| List My Sync Jobs | GET | /api/sync-jobs | Bearer | - | { success, data[] } | 401, 500 |
| Tenants Test | GET | /api/tenants/test | No | - | { success, message } | - |
| Tenants Register | POST | /api/tenants/register | No | body | { success, data } | 400, 500 |
| Tenants Current | GET | /api/tenants/current | No | - | { success, data } | 500 |
| Tenants Update | PUT | /api/tenants/current | Bearer | body | { success, data } | 401, 403, 500 |
| Tenants Plan | PUT | /api/tenants/current/plan | Bearer | body | { success } | 401, 403, 500 |
| Tenants Usage | GET | /api/tenants/current/usage | Bearer | - | { success, data } | 401, 500 |
| Tenants List | GET | /api/tenants | Bearer | - | { success, data[] } | 401, 500 |

Note:
- `Auth`: "Bearer" indica JWT nell'header; "Tenant" indica obbligo `X-Tenant-ID` o risoluzione middleware
- Gli schemi dettagliati sono definiti in `DOCS/ARCH/openapi.json`


