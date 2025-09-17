## Piano di Cleanup (candidati a rimozione/archiviazione)

Obiettivo: ridurre rumore e superfici di errore senza modificare la logica attuale. Nessuna rimozione automatica: valutazione manuale consigliata.

### Candidati
1) `backend/src/routes/placeholder.js`
   - **Motivo**: file placeholder non referenziato nei mount principali
   - **Impatto**: nullo a runtime; rimozione/archiviazione migliora chiarezza

2) Endpoint debug temporanei
   - `backend/src/routes/venues.js` → `GET /api/venues/test-debug`
   - `backend/src/routes/matchAnnouncements.js` → `DELETE /api/match-announcements/test/cleanup`
   - `backend/src/routes/analytics.js` → `/api/debug/*`
   - **Motivo**: utili in sviluppo, da proteggere dietro flag o rimuovere in prod
   - **Impatto**: rimozione in prod riduce rischi; in dev mantenerli documentati

3) Script legacy DB multipli (vari `scripts/clean_*`, `scripts/cleanup*`, `scripts/restore_*`)
   - **Motivo**: funzioni sovrapposte, target DB differenti (`sports-bar`, `sports_db`)
   - **Impatto**: consolidare naming/target; tenere solo quelli usati nel workflow

4) Duplicazione naming DB in script
   - `MONGODB_URI` fallback eterogenei (`sports-bar`, `sports_db`)
   - **Motivo**: incoerenza naming
   - **Impatto**: uniformare a `sports-bar` per evitare confusione

5) Log di debug prolissi in middleware
   - `tenantMiddleware.extractTenant` stampa dettagli ogni richiesta
   - **Motivo**: rumore in log, possibile leak header in prod
   - **Impatto**: dietro guard `NODE_ENV==='development'` o logger di livello debug

6) Rotte admin non documentate (es. `venues/admin/*`, `sync-jobs`, `global-matches`)
   - **Motivo**: superficie API non mappata nell'OpenAPI base
   - **Impatto**: aggiungere documentazione o limitarne l'esposizione

7) File/route non utilizzati
   - Verificare `backend/src/routes/offers.js` (non montata in `app.js`)
   - **Motivo**: codice orfano
   - **Impatto**: rimuovere/archiviare o montare se necessario

Note: questo piano è solo propositivo; nessun file è stato rimosso.


