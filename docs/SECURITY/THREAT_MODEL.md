## Threat Model (Client Flutter + Backend invariato)

Obiettivo: identificare minacce e mitigazioni lato client, preservando i contratti API esistenti (`openapi.json`). Nessuna modifica al backend.

### Asset da proteggere
- JWT (autenticazione e autorizzazione)
- Dati utente/venue (PII e dati business)
- Eventi analytics (integrità/anti-abuso)
- Config di ambiente (endpoint, tenant)

### Superficie d’attacco (entry points)
- Chiamate HTTP verso `API_BASE_URL` con headers: `Authorization: Bearer <JWT>`, `X-Tenant-ID`
- Deep link e navigation parameters
- Storage locale (Secure Storage)
- Rete (Wi-Fi pubbliche, MITM)

### Minacce e mitigazioni

1) Furto del token (storage/ram dump)
   - Mitigazioni: usare Secure Storage (Keychain/Keystore), evitare log di token/PII, invalidare sessione su logout, opzionale gate biometrico.

2) MITM/TLS downgrade
   - Mitigazioni: solo HTTPS per `API_BASE_URL`, opzionale Certificate Pinning in Prod (`CERT_PIN_SHA256`). Disabilitare richieste su HTTP in release.

3) Spoofing tenant via `X-Tenant-ID`
   - Rischio: un client malevolo può cambiare header.
   - Mitigazioni lato client: non esporre switch tenant non necessario; impostare un `TENANT_ID` controllato a build-time o configurato via UI protetta.
   - Assunzione backend: enforcement dei permessi basato su token/tenant server-side (nessun cambio richiesto qui, ma è prerequisito di sicurezza).

4) Abusi di rate (analytics e search)
   - Mitigazioni: debounce/throttle client per eventi ripetitivi; code di invio con backoff; non fare retry su 4xx eccetto 408/429 con attese.

5) Replay eventi (analytics)
   - Mitigazioni: dedup client (chiave composta, es. `type:venueId:matchId:date`); code offline con marcatore "synced"; timestamp locale per analisi lato server.

6) Validazione input debole lato client
   - Mitigazioni: DTO tipizzati dal client generato da OpenAPI; validazioni form; allowlist per parametri (es. `status`); sanitizzazione ID/route params.

7) Esposizione PII nei log/app crash
   - Mitigazioni: mascherare PII e token nei log; crash reporting con filtri; log livello `info` in Produzione.

8) Cache impropria di dati sensibili
   - Mitigazioni: non cache per analytics/admin; rispettare `Cache-Control: no-store`; cache solo per GET pubblici con scadenze brevi.

9) Deep link malevoli e URL parameters
   - Mitigazioni: validare e sanificare parametri; limitare azioni sensibili da deep link; richiedere autenticazione quando necessario.

10) Permessi e piattaforma
   - Mitigazioni: richiedere solo permessi necessari (notifiche, posizione per mappe), spiegazioni chiare, fallback se negati.

### Residual risk
- Senza modifiche al backend, dedup e rate limit lato server non sono garantiti: il client riduce ma non elimina l’abuso.
- `X-Tenant-ID` può essere manipolato da client custom: assumiamo enforcement ruoli/tenant lato server.

### Policy operative lato client
- Aggiornare generatori OpenAPI ad ogni cambio di `openapi.json`.
- Revisione periodica dipendenze (Dio, Riverpod, plugin Secure Storage) e aggiornamenti sicurezza.
- Test regressione sicurezza (timeout, retry, fallback) ad ogni release.


