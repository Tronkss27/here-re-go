### Test UX — Scenari passo‑passo

Obiettivo: verificare i flussi principali da prospettiva utente e admin, con aspettative di UI, dati e stati.

#### 1) Cliente — Navigazione → Ricerca → Dettaglio → Prenotazione
Passi:
1. Apri `/`
   - Atteso: entry points visibili per “Trova Locali”
2. Vai a `/locali`
   - Atteso: filtri visibili; elenco venue
   - Edge: nessun risultato → empty con suggerimenti
3. Apri `/locale/:id`
   - Atteso: info venue, partite, form prenotazione
4. Compila form: data, orario, persone (opz. fixture)
5. Invia → POST `/api/bookings`
   - Atteso: feedback successo; se auto‑approve → status confirmed
   - Edge: conflitto orario → messaggio chiaro + suggerimenti

#### 2) Cliente — Login/Registrazione e “Le mie prenotazioni”
Passi:
1. Vai a `/client-register` e registra (isVenueOwner=false)
   - Atteso: login automatico e redirect
   - Edge: email esistente → errore
2. Vai a `/client-login` e accedi
   - Atteso: salvataggio sessione; redirect alla pagina protetta richiesta
3. Vai a `/my-bookings`
   - Atteso: elenco prenotazioni; CTA “Nuova prenotazione”
   - Edge: nessuna prenotazione → empty

#### 3) Admin — Registrazione/Login → Onboarding → Dashboard
Passi:
1. Vai a `/sports-register` (isVenueOwner=true + businessInfo)
   - Atteso: Tenant/Venue creati; sessione attiva
2. Se onboarding incompleto → `/admin/onboarding`
   - Atteso: form/setup minimo per abilitare admin
3. Vai a `/sports-login`
   - Atteso: redirect a `/admin` se onboarding completo

#### 4) Admin — Statistiche
Passi:
1. Vai a `/admin/statistiche`
   - Atteso: overview, timeseries, top; aggiornamenti UI in tempo reale sugli eventi di tracking
   - Edge: nessun dato → empty con istruzioni

#### 5) Admin — Calendario
Passi:
1. Vai a `/admin/calendario`
   - Atteso: elenco partite/eventi; strumenti pianificazione
   - Edge: nessuna partita → empty

#### 6) Admin — Offerte
Passi:
1. Vai a `/admin/offers`
   - Atteso: lista template/offerte; CTA “Crea”
   - Edge: nessun template → empty esplicito

#### 7) Admin — Prenotazioni venue
Passi:
1. Vai a `/admin/bookings`
   - Atteso: lista prenotazioni con filtri/ricerca/paginazione
   - Edge: nessuna prenotazione → empty; errori rete gestiti

#### 8) Admin — Profilo e Account
Passi:
1. Vai a `/admin/profilo` e `/admin/account`
   - Atteso: form editabile; validazioni visibili; salvataggi confermati

Note generali di verifica:
- Stati: loading (skeleton), success, errore con messaggi chiari
- Accessibilità: focus visibile, navigazione tastiera, contrasti adeguati
- Deep‑link: `/locali/:date/:teamsSlug/:fixtureId`, `/locale/:id`, sottosezioni `/admin/*`


