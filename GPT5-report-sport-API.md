Avvio una scansione del codice per trovare tutti i punti rilevanti relativi all'integrazione delle API sportive (servizi, cron, controller, schedulazione, mapping dati). Poi ti fornisco un report con passi operativi per integrare, schedulare e pubblicare le partite reali sul calendario admin. Procedo ora.
Ran tool

Ran tool

Read file: /Users/nicolotroncone/SPOrTS/backend/src/services/sportsApiService.js

Ran tool

Ran tool

Ran tool

Perfetto — faccio una analisi approfondita e ti do un piano operativo completo, con file rilevanti, comandi di test e raccomandazioni pratiche per integrare le API sportive reali (Sportmonks) e pubblicare partite reali in `/admin/calendario` e nella UI di creazione annunci.

Sintesi (in 1 riga)
- Il servizio API sportivo è già presente (`backend/src/services/sportsApiService.js`) con cache, retry e circuit-breaker: bisogna attivarlo (API key), mappare fixtures → PopularMatch / MatchAnnouncement, schedulare sync e creare logica di associazione fixture → locali.

Analisi del codebase (punti chiave)
- Servizio esterno:
  - `backend/src/services/sportsApiService.js` — implementa: `getFixturesByDate(date)`, `getFixtureById(id)`, `getLeagues()`. Ha cache, retry e circuit breaker; supporta mock se `USE_MOCK_API=true`.
- Endpoint / controller per sincronizzazione:
  - `backend/src/controllers/fixtureController.js` — definisce `POST /fixtures/sync` (admin).
  - `backend/src/routes/fixtures.js` — route `POST /fixtures/sync` (auth required).
- Modellistica e flussi interni:
  - `backend/src/models/PopularMatch.js` (usato in controller e in `matchAnnouncementController.js`)
  - `backend/src/models/MatchAnnouncement.js` — annunci pubblicati dai locali.
- Creazione annunci / pubblicazione:
  - `backend/src/controllers/matchAnnouncementController.js` — contiene `searchMatches`, `createAnnouncement`, logica per aggiornare/creare `PopularMatch`.
  - Frontend: `frontend/src/components/forms/CreateMatchAnnouncementForm.tsx` + `SimpleCreateAnnouncementForm` + `frontend/src/services/matchAnnouncementService.js` per chiamare `/match-announcements`.
- Frontend: esistono servizi per fixtures/hot matches:
  - `frontend/src/services/fixturesService.js`
  - `frontend/src/services/hotMatchesService.js` + `frontend/src/pages/Locali.tsx` usa `hotMatchesService.getVenuesForMatch(...)` per mostrare venues per partita.
- Cron / job: non ho trovato job schedulati già attivi per polling; c'è endpoint `POST /fixtures/sync` e utility per script.

Problemi/ostacoli tipici da risolvere
1. API key non configurata / `USE_MOCK_API` ancora true => nessuna chiamata reale.
2. Mapping fixture → venue: non esiste un collegamento 1:1 automatico; bisogna definire regole (city matching, league, keywords, o manual linking in admin).
3. Rate-limits Sportmonks e gestione errori: già parzialmente coperto (retry/circuit breaker), ma va testato e parametrizzato.
4. Policy pubblicazione: auto-publish vs review manuale (admin). Serve regola di business.

Piano operativo (passi concreti, in ordine)
1) Preparazione (config)
   - Inserire la API key reale in `.env` (dev) e nella configurazione MCP/produzione:
     - VITE / backend: `SPORTMONKS_API_TOKEN=xxx`
     - Disabilitare mock: `USE_MOCK_API=false`
   - Verificare env: `echo $SPORTMONKS_API_TOKEN` lato server.

2) Test manuale chiamata API
   - Eseguire (server dev in esecuzione):
     - curl di prova:
       - curl "http://localhost:3001/api/internal/test-sportmonks?date=2025-08-15"
       - (Se non esiste, usare script/endpoint: `node backend/src/services/sportsApiService.js` non è invocabile direttamente; usa `POST /fixtures/sync` o scrivi test rapido)
   - Oppure: POST sync (admin):
     - curl -X POST -H "Authorization: Bearer <token-admin>" http://localhost:3001/fixtures/sync
   - Risultato atteso: elenco fixtures per data, log `API MISS/HIT`, e response con fixtures.

3) Sync / Popolamento dati interni
   - Implementare (o verificare) `fixtureController.syncFixtures` per:
     - chiamare `sportsApiService.getFixturesByDate` per un range di date
     - per ogni fixture:
       - creare/aggiornare `GlobalMatch` / `PopularMatch` con `matchId` = fixture.id (campo univoco)
       - eventualmente creare `MatchAnnouncement` SUGGERITO oppure preparare una lista di possibili locali rilevanti (vedi step mapping)
   - Comando admin per sync manuale: `POST /fixtures/sync` (già esistente) — usare per deploy/test.

4) Mapping fixture → locale (strategia consigliata)
   - Preferibile: 2 fasi (automazione + revisione manuale)
     - Fase A (automation): per ogni fixture:
       - cerca venue in città della partita (match.homeTeam/awayTeam → city via metadata, o parametro league → metadata)
       - query: `Venue.findByCity(match.city).limit(n)` oppure cerca per neighborhood
       - punteggio/heuristic: screens >1, capacity > X, servizi 'grandi-schermi' → preferisci
       - CREA un preliminare `PopularMatch` e **non** pubblicare annunci automaticamente; invece popola una proposta che l’admin può confermare -> crea `MatchAnnouncement`.
     - Fase B (auto publish optional): se vuoi pubblicazione totalmente automatica, definire regole rigorose (es. only venues with `isVerified: true` and `screens >= 2`), e poi creare `MatchAnnouncement` con status `published`.
   - Implementazione esatta:
     - in `matchAnnouncementController.createAnnouncement` c’è già `updateOrCreatePopularMatchStandalone(match, venueId, announcementId)` → estendere per creare `PopularMatch` quando si sincronizza fixture.

5) UI / Admin
   - `/admin/calendario` usa `MatchAnnouncement`/`PopularMatch`. Azioni:
     - aggiungere pulsante `Sincronizza partite` (chiave admin) che chiama `POST /fixtures/sync`
     - mostrare elenco fixture importati (con stato: proposed / published)
     - Form semplice per associare fixture → venue e creare annuncio (es. `CreateMatchAnnouncementForm.tsx` integra `searchMatches` -> `sportsApiService.searchMatches` già usato lato controller)
   - Frontend integrazioni:
     - `frontend/src/services/fixturesService.js`: assicurarsi che chiami il backend endpoints corretti (`/fixtures`, `/fixtures/sync`)
     - `frontend/src/pages/admin/CalendarioPartite.tsx` già usa `getVenueAnnouncements` — estendere per mostrare fixtures importati.

6) Scheduling (automazione)
   - Opzioni:
     - A. Cron server (es. `node-cron`): schedula giornaliera `syncFixtures` (es. ogni mattina)
     - B. External scheduler (CI/CD, Kubernetes CronJob) consigliato in produzione.
   - Configurare:
     - crea job che chiama `POST /fixtures/sync` con header admin oppure esegue direttamente funzione di sync server-side.

7) Logging, monitoring e rollbacks
   - Log dettagliati in `sportsApiService` (già presenti), abilitare livello `debug` su dev.
   - Prima di creare massivamente `PopularMatch`/`MatchAnnouncement` fai backup:
     - `db.popularmatches.find().pretty()` e `db.matchannouncements.find().pretty()` -> dump o export
   - Test in staging con `USE_MOCK_API=true` e mock fixtures file.

8) Performance, limiti e rate-limits
   - Sportmonks ha limiti (controlla piano). Tenere `stdTTL` cache e circuit-breaker (già presenti).
   - Limita chiamate: usa batch per range di date e rispetta rate limit (delay).

9) Test end-to-end (procedura consigliata)
   - Step 1: Impostare env:
     - in backend `.env`: SPORTMONKS_API_TOKEN=xxx ; USE_MOCK_API=false
   - Step 2: Chiamare manuale:
     - curl -X POST -H "Authorization: Bearer <ADMIN_TOKEN>" http://localhost:3001/fixtures/sync
   - Step 3: Verificare:
     - `GET /fixtures` o `GET /fixtures/upcoming` (backend endpoints)
     - controlla `PopularMatch` collection: `db.popularmatches.find().limit(5).pretty()`
     - controlla `/admin/calendario` in UI: dovresti vedere i match importati come proposte/popular
   - Step 4: Creare annuncio manuale via UI (admin):
     - Apri `CreateMatchAnnouncementForm`, scegli fixture importata -> crea annuncio; verifica che appaia in `/locali` e nelle `hot matches`.
   - Step 5: End-to-end publish:
     - Se politica automatica: verificare che `MatchAnnouncement` creati abbiano `status: 'published'` e compaiano in UI pubblica.

File rilevanti da controllare/modificare (sorgenti)
- Backend
  - `backend/src/services/sportsApiService.js` (già pronto, config & cache)
  - `backend/src/controllers/fixtureController.js` (route `POST /fixtures/sync`) — aggiungere logica mapping & creare `PopularMatch`
  - `backend/src/controllers/matchAnnouncementController.js` — logica `createAnnouncement`, `searchMatches`, `updateOrCreatePopularMatchStandalone`
  - `backend/src/models/PopularMatch.js`, `backend/src/models/MatchAnnouncement.js`, `backend/src/models/GlobalMatch.js` (verificare schema; includere `matchId`, home/away, date, league)
  - `backend/src/routes/fixtures.js` (esporre endpoints `GET /fixtures`, `POST /fixtures/sync`)
  - Scripts utili: `backend/scripts/recreateAnnouncement.js` (esempio di scripting)

- Frontend
  - `frontend/src/services/fixturesService.js` — assicurarsi che esponga endpoint per `fixtures` e `sync`.
  - `frontend/src/services/matchAnnouncementService.js`
  - `frontend/src/pages/admin/CalendarioPartite.tsx` — UI per mostrare fixtures/popular matches
  - `frontend/src/pages/Locali.tsx` — già usa `hotMatchesService.getVenuesForMatch(...)`

Esempi di comandi / curl per test
- Sync (admin):
  - curl -X POST -H "Authorization: Bearer <ADMIN_TOKEN>" http://localhost:3001/fixtures/sync
- Lista fixtures per data:
  - curl "http://localhost:3001/api/fixtures?date=2025-08-15"
- Singola fixture:
  - curl "http://localhost:3001/api/fixtures/12345"
- Creare annuncio (via API):
  - curl -X POST -H "Authorization: Bearer <ADMIN_TOKEN>" -H "Content-Type: application/json" -d '{ "venue": "<venueId>", "globalMatch": "<fixtureId>", "title":"Roma-Lazio", "status":"published", "eventTime":"2025-08-20T20:45:00Z" }' http://localhost:3001/api/match-announcements

Rischi & raccomandazioni
- Non auto-pubblicare massivamente senza regole (potresti creare annunci errati).
- Testa in staging (USE_MOCK_API=true) prima di produrre.
- Metti rate-limit e backoff corretto (già c’è axios-retry + circuit-breaker).
- Aggiungi campo `source`/`importedAt` su `PopularMatch` / `MatchAnnouncement` per tracking.

Deliverable che posso fare subito (se mi dai ok)
1. Abilitare pipeline end-to-end: config `.env`, chiamata `POST /fixtures/sync`, e log completa (test).
2. Implementare mapping automatico minimal: per ogni fixture, trovare fino a N locali nella stessa città e creare `PopularMatch` + `proposed` MatchAnnouncement (non pubblicato), con UI admin per approvazione.
3. Aggiungere Cron job (node-cron) per sync giornaliero.
4. Fornire script per test automatizzati (curl + checks) e guide manuali.

Vuoi che proceda subito con:
- A) implementazione automatica (crea `PopularMatch` + `MatchAnnouncement` in status `proposed`) e aggiunga pulsante admin per approvare/publish?
- B) solo abilitare e testare lo `sync` manuale (ti do i comandi e controllo i risultati)?
- C) preparo prima un PR con il codice proposto, te lo mostro e poi lo eseguo?

Dimmi come preferisci procedere e parto con il passo successivo.