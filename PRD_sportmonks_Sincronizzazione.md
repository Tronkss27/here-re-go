### PRD Unificato — Integrazione Sportmonks + Risoluzione sincronizzazione frontend↔backend

Breve descrizione
- Obiettivo: rendere l’integrazione con Sportmonks corretta, consistente e resiliente e risolvere tutti i problemi che impediscono la sincronizzazione delle partite dal backend al frontend (sia via job `/api/sync-jobs` sia via sync diretto `/api/fixtures/sync`), con test automatici e monitoraggio.

Scope
- Backend: provider layer, mapping DTO, `sportsApiService`, `fixturesService`, `fixtureController`, `jobQueue` (Agenda), `syncJobs` routes, seeding (`backend/scripts/seedRealMatches.js`), modelli `GlobalMatch/PopularMatch/Fixture/SyncJob`.
- Frontend: modale creazione annunci (`frontend/src/components/forms/SimpleCreateAnnouncementForm.tsx`), pagina admin calendario (`frontend/src/pages/admin/CalendarioPartite.tsx`), `apiClient`, `vite` proxy/config.
- Non incluso: refactor UI visuale oltre debug delle chiamate e correzione bug TSX di compilation.

Vincoli e precondizioni
- Token JWT valido per azioni protette (admin / venue_owner).
- MongoDB disponibile e raggiungibile (usato da Agenda e da SyncJob).
- Variabili d’ambiente: `SPORTMONKS_API_TOKEN`, `USE_MOCK_API`, `MONGODB_URI`, `VITE_API_URL`, `JWT_SECRET`, caching TTL config.

Principali problemi da risolvere (oggettivo)
1. Provider duplicati e mapping incoerente tra Sportmonks e API-Football → rischio alto di crash/mapping errato.
2. `seedRealMatches.js` e `fixtureController.syncFixtures` assumono shape dati non uniforme (es. `league_id` vs `league.id`).
3. Cache/TTL non standardizzata e nomi `*_no_venue` confusi.
4. Circuit breaker creato ad-hoc; manca gestione riutilizzabile e metriche.
5. JobQueue/Agenda potrebbe non partire se `MONGODB_URI` errato; job creati ma non eseguiti.
6. Frontend non compila (errore Vite su `SimpleCreateAnnouncementForm.tsx`) → UI bloccata.
7. Frontend usa endpoint `/api/sync-jobs` e polling; possibili problemi di token/headers o parsing delle risposte.
8. Error handling e logging non sempre espliciti (per fixture processing errors).

Priorità sintetica
- P0 (critico): Adapter unificato + fix seed/sync + risolvere compilazione frontend.
- P1 (alto): JobQueue/Agenda reliability + auth/token checks + cache policy.
- P2 (medio): Circuit breaker riutilizzabile, metrics, mapping leagues/tvChannels persistente.
- P3 (basso): Pulizia hard-coded ids, UI polish.

Deliverable attesi
- Adapter provider + DTO standard.
- Seed & Sync che non crashano con mock e real API.
- Frontend compilabile; modale funzione; pulsanti sync creano job e polling visualizza progresso.
- Test automatici mapping + integrazione (mock).
- Documentazione operativa e runbook per troubleshooting.

TASKS (dettagliate, con subtasks, acceptance criteria, stima)

1) P0 — Creare Provider Layer e DTO interno (adapter)
- Descrizione: centralizzare tutte le chiamate ai provider usando adapter che restituiscono uno schema comune `StandardFixture`.
- File nuovi/proposti:
  - `backend/src/services/providers/index.js` (factory).
  - `backend/src/services/providers/sportmonksAdapter.js`
  - `backend/src/services/providers/apiFootballAdapter.js` (legacy/optional)
  - `backend/src/types/StandardFixture.md` (spec)
- Subtasks:
  - 1.1 Definire DTO `StandardFixture` (campi obbligatori: fixtureId, league{id,name,logo}, date ISO, time HH:mm, participants [{id,name,role,image_path}], venue {id,name,city}|null, scores, status normalizzato).
  - 1.2 Implementare `sportmonksAdapter.mapToDTO(apiResponse)` con test su `mocks/sportmonks_fixtures.json`.
  - 1.3 Aggiornare `fixturesService.getApiFixtures` e `seedRealMatches.js` per consumare DTO.
  - 1.4 Scrivere unit tests mapping (jest/mocha).
- Acceptance:
  - Mapping mock Sportmonks → DTO passa i test.
  - `seedRealMatches` funziona con `USE_MOCK_API=true` e non lancia eccezioni per proprietà mancanti.
- Stima: 8-16h.

2) P0 — Fix `fixtureController.syncFixtures` e seed script
- Descrizione: rendere robusto il parsing delle fixtures, fallback su proprietà mancanti e log espliciti.
- Subtasks:
  - 2.1 Normalizzare accesso a `fixture.league.id` o `fixture.league_id` (usare DTO).
  - 2.2 Avvolgere mapping in try/catch dettagliato e push di errori su `results.errors`.
  - 2.3 Aggiungere log che dumpano il fixture problemativo in caso di errore (solo in dev).
  - 2.4 Aggiornare `backend/scripts/seedRealMatches.js` a consumare DTO e validare campi.
- Acceptance:
  - `/api/fixtures/sync` con `USE_MOCK_API=true` crea/aggiorna `PopularMatch` senza crash; response include `errors` vuoto o con entry leggibili.
- Stima: 4-8h.

3) P0 — Risolvere compilazione frontend (TSX parse error)
- Descrizione: correggere l’errore Vite/Babel in `SimpleCreateAnnouncementForm.tsx` (Unexpected token in riga ~750).
- Subtasks:
  - 3.1 Aprire riga indicata e correggere JSX non chiuso o carattere residuo (`>` isolato). Controllare tutti i return fragments e parentesi.
  - 3.2 Eseguire `npm run dev` in `frontend/` e risolvere eventuali altri errori.
  - 3.3 Aggiungere lint/CI step che verifica build frontend (vite build) per non rompere in futuro.
- Acceptance:
  - `npm run dev` avvia senza errori di parsing; UI admin si apre.
- Stima: 1-4h (dipende severità).

4) P1 — Stabilizzare JobQueue / Agenda / Sync Jobs
- Descrizione: assicurare che Agenda sia inizializzato, job creati vengano eseguiti, e frontend polling mostri stato reale.
- Subtasks:
  - 4.1 Verificare `MONGODB_URI` in env; se assente, fallback o fail con messaggio d’errore visibile in log di startup.
  - 4.2 Aggiungere health-check per Agenda all’avvio: log e endpoint `GET /api/sync-jobs/health` (opzionale).
  - 4.3 Assicurare che `SyncJob` saved contenga `results` e `progress` prima di schedule.
  - 4.4 Migliorare polling response: `syncJobs.get` deve restituire `isRunning/isComplete/isFailed`, `progress.percentage`, `results` (già c’è, verificare consistenza).
  - 4.5 Test end-to-end: chiamata `POST /api/sync-jobs` → job creato → Agenda prende job e lo esegue → `GET /api/sync-jobs/:jobId` mostra progress final.
- Acceptance:
  - Job creato via frontend mostra `jobId`; polling (frontend) passa a `isRunning` e poi a `isComplete` con `results` non null.
- Stima: 4-12h (dipende infra DB).

5) P1 — Verifiche auth / token e CORS / proxy
- Descrizione: assicurare che frontend invii header `Authorization` corretti, che proxy inoltri a backend e che `auth` middleware accetti il token.
- Subtasks:
  - 5.1 Backend: verificare che `auth` legge header `Authorization` corretto (già implementato).
  - 5.2 Frontend: `apiClient.get/post` deve includere `getHeaders()` con Bearer token estratto da `localStorage.token`. Verificare presence in browser.
  - 5.3 Proxy: verificare `frontend/vite.config.js` proxy `/api` → `http://localhost:3001` (già presente). Test con `fetch('/api/sync-jobs')` dalla console devtools.
  - 5.4 Creare test curl per replicare problema: es. curl per `/api/sync-jobs` e `/api/fixtures/sync`.
- Acceptance:
  - Richieste con token valide ritornano 200; senza token 401.
- Stima: 1-3h.

6) P1 — Standardizzare cache / TTL / config
- Descrizione: mettere tutti i TTL e chiavi in `config/sportsApi.json` o `.env` e usare naming `sportmonks:fixtures:YYYY-MM-DD`.
- Subtasks:
  - 6.1 Estrarre TTL constants da `sportsApiService.js` in config.
  - 6.2 Standardizzare chiavi di cache e rimuovere `_no_venue` salvo motivo.
  - 6.3 Documentare policy.
- Acceptance:
  - Config modificata e usata da `sportsApiService`.
- Stima: 2-4h.

7) P2 — Circuit breaker riutilizzabile e log/matriche
- Descrizione: creare breakers per endpoint (leagues, fixtures, fixtureById) invece di istanziarli ad ogni chiamata; esportare metriche open/close counts.
- Subtasks:
  - 7.1 Refactor `callApiWithCircuitBreaker` in una factory che ritorna breaker singletons.
  - 7.2 Integrare metriche (Prometheus/Simple counters + logs).
- Acceptance:
  - Breakers mantengono stato; metriche esposte.
- Stima: 4-8h.

8) P2 — Hardening mapping leagues / tvChannels
- Descrizione: spostare mappature hard-coded in DB `Leagues` o `Config` per manutenzione.
- Acceptance:
  - Modifica runtime senza deploy (admin edit).
- Stima: 3-6h.

Test Plan (unit/integration/manual) — molto specifico
- Unit tests mapping:
  - Test mapping `mocks/sportmonks_fixtures.json` → `StandardFixture`.
  - Tool: jest/mocha. Directory: `backend/test/`.
- Integration tests:
  - Scenario A (mock): set `USE_MOCK_API=true`, run `node backend/scripts/seedRealMatches.js` → assert `GlobalMatch` inserted > 0.
  - Scenario B (sync job): POST `/api/sync-jobs` (curl) with valid token → poll `/api/sync-jobs/:jobId` until `isComplete` → assert `results.newMatches` >= 0.
  - Scenario C (direct sync): POST `/api/fixtures/sync` with admin token → response success and `popularMatches` increment.
- Frontend tests:
  - Dev: `npm run dev` → open admin page → open Create Announcement modal → select league → if no matches, click Sync → modal poll shows progress → available matches list populates.
  - Automated: e2e test (Cypress) that simulates admin login, create sync job, assert UI progress changes.
- Commands di debug rapidi:
  - Frontend build: `cd frontend && npm run dev`
  - Backend start: `cd backend && NODE_ENV=development node server.js` (o `npm run dev` se configurato)
  - Curl create job:
    ```bash
    curl -X POST http://localhost:3001/api/sync-jobs \
      -H "Authorization: Bearer <TOKEN>" \
      -H "Content-Type: application/json" \
      -d '{"league":"serie-a","dateRange":{"startDate":"2025-09-01T00:00:00Z","endDate":"2025-09-30T00:00:00Z"}}'
    ```
  - Curl direct sync:
    ```bash
    curl -X POST http://localhost:3001/api/fixtures/sync \
      -H "Authorization: Bearer <TOKEN>" \
      -H "Content-Type: application/json" \
      -d '{"dateRange":30}'
    ```
- Log markers da osservare:
  - Backend: "🔄 Avvio sincronizzazione fixtures da Sportmonks API...", "📋 Created sync job", "📋 Job queue initialized successfully", "🚀 Starting sync job", "Error processing fixture".
  - Frontend console: token, response bodies di `apiClient` e fetch `/api/sync-jobs`.

Rollback / mitigation
- Mantieni versione precedente `fixturesService` come legacy adapter fino a completare e testare il nuovo adapter.
- Feature flag `PROVIDER=sportmonks` vs `PROVIDER=apifootball` in env per rollback rapido.
- Se Agenda non parte in prod, fallback a sync sincrono per range ridotto (es. 7 giorni) come stop-gap.

Metriche & monitoraggio (minimo)
- Counters: calls_to_sportmonks_total, failures_total, circuitbreaker_open_total.
- Job metrics: jobs_created, jobs_completed, jobs_failed, job_duration_seconds.
- Alert: jobs_failed_rate > X% o circuitbreaker_open_count > threshold.

Checklist finale di verifica (prima di merge)
- [ ] Unit tests mapping passano.
- [ ] `USE_MOCK_API=true` seed script esegue senza eccezioni.
- [ ] Frontend `npm run dev` compila senza errori TSX.
- [ ] Creazione job (`/api/sync-jobs`) ritorna jobId e Agenda lo esegue.
- [ ] Polling frontend riceve `isRunning` → `isComplete`.
- [ ] `/api/fixtures/sync` con admin token risponde `success:true`.
- [ ] Config TTL e season ID estratti in file config/.env.
- [ ] Documentazione: README operations + runbook per troubleshooting.

Stime temporalie (indicativo)
- Fase 1 (adapter + seed + frontend compile): 2–4 giornate uomo.
- Fase 2 (Agenda hardening, cache, circuit breaker): 1–2 giornate aggiuntive.
- Test + monitor + docs: 1 giornata.

Risultati attesi (criteri di accettazione sintetici)
- Sistema in grado di sincronizzare partite (sia via job che via sync diretto) senza crash; frontend mostra progresso e le partite sono visibili nel modal di creazione annunci; mapping coerente tra provider e DB; job queue affidabile.

Note finali oggettive
- consolidare adapter per evitare errori di mapping in produzione.
- Evitare cambiamenti simultanei su provider e jobQueue in un unico commit: separare PR per adapter+seed e per jobQueue+monitoring per semplificare rollback.

Se vuoi, procedo immediatamente a:
- A) generare la bozza di codice per `sportmonksAdapter.js` + test mapping (edito file e test), oppure
- B) scrivere la checklist GitHub/PR con le modifiche da applicare e i comandi di test da inserire nel CI.

Dimmi quale preferisci e inizio.  

- Breve riassunto delle modifiche richieste (per tua rapida lettura):
  - **Unificare provider con adapter/DTO**; correggere seed & sync per usare DTO.
  - **Correggere errore Vite** in `SimpleCreateAnnouncementForm.tsx`.
  - **Verificare Agenda/Mongo** e assicurare job execution + polling.
  - **Standardizzare cache/TTL e config**; rendere season/ids configurabili.
  - **Aggiungere test E2E/unit e monitoring**.