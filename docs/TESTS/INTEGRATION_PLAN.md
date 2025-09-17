## Piano Test di Integrazione (parità contratti, chiamate reali)

Obiettivo: verificare che l’app Flutter rispetti i contratti `openapi.json` eseguendo chiamate reali verso il backend esistente (Dev/Staging/Prod), inclusi scenari d’errore e timeout.

### Ambiente
- Config tramite `--dart-define-from-file` (vedi `INTEGRATIONS/CONFIG_GUIDE.md`).
- Tenant di test dedicato (`TENANT_ID`) e utenti di test.
- Dati non distruttivi, cleanup laddove necessario.

### Strumenti
- Test Flutter/Dart (integrazione) con `dio` e client generato OpenAPI.
- Schema validation: opzionale con libreria JSON schema o controllo tipizzato del client generato.
- Monitoraggio: log HTTP con masking di PII.

### Casi di test (User)
1) Health: `GET /health` → 200, struttura `Health` valida.
2) Registrazione: `POST /auth/register` → 201 per dati validi, 400 per invalidi.
3) Login: `POST /auth/login` → 200 token presente; credenziali errate → 401.
4) Me/Verify: `GET /auth/me`, `GET /auth/verify` con token → 200; senza token → 401.
5) Venues pubblici: `GET /venues/public` → 200; dettaglio `GET /venues/public/{id}` → 200 o 404.
6) Search venues: `GET /venues/search?query=...` → 200 con risultati coerenti.
7) Annunci pubblici: search/detail/venues per match → 200.
8) Global matches/leagues/rounds → 200, coerenza dati.
9) Booking availability: `GET /bookings/availability/{venueId}` → 200.
10) Create booking: `POST /bookings` → 201; validazione 400.
11) Analytics pubblici: `POST /analytics/profile-view|profile-click|match-click` → 200 con `X-Tenant-ID` corretto.
12) Top matches: `GET /analytics/matches/top` → 200, limiti e range.

### Casi di test (Admin)
1) Annunci venue: `GET /match-announcements/venue` (Bearer + `X-Tenant-ID`) → 200.
2) Crea/Update/Delete annuncio: `POST/PUT/DELETE /match-announcements` → esiti corretti, 404 su id inesistente.
3) Templates offerte: `GET/POST/PUT/DELETE /offer-templates*` → esiti coerenti.
4) Prenotazioni: `GET /bookings` e `GET/PUT/DELETE /bookings/{id}` → 200 e transizioni stato.
5) Analytics venue: `overview`, `top`, `timeseries`, `match-traffic` → 200; header `no-store` rispettato lato client.

### Errori, timeout, retry
- Simulare timeout (`connectTimeout/receiveTimeout` bassi): verificare surface d’errore user-friendly.
- Network offline: verificare cache per GET pubblici e coda analytics con flush al ripristino.
- 401: scadenza token → refresh login UX.
- 404: risorsa inesistente.
- 429/5xx: backoff esponenziale con jitter; nessun retry su 4xx (eccetto 408/429 con attesa).

### Dati e isolamenti
- Usare utenti di test (es. `/auth/demo` se disponibile) per ridurre impatto su dati reali.
- Tenere traccia di ID creati e ripulire dove necessario (DELETE) nel teardown.

### Criteri di accettazione
- Tutti gli endpoint principali rispondono come da `openapi.json` (tipi e codici).
- Nessun blocco UI su timeout/errore; retry e messaggi consistenti.
- Coerenza tenant tra eventi analytics e admin.


