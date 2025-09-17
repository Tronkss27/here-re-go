### Flussi principali SPOrTS

#### Utente (Cliente)
- "Guest → Onboarding/Login → Ricerca → Dettaglio locale → Prenotazione → (Opz.) Le mie prenotazioni"

1) Guest → Navigazione pubblica
- Route principali: `/`, `/locali`, `/locali/:date/:teamsSlug/:fixtureId`, `/locale/:id`
- Azioni:
  - Esplora venue dalla Home (`/`)
  - Cerca/filtra su `/locali`
  - Apre il dettaglio venue su `/locale/:id`
- Dati caricati:
  - Liste venue: GET `/api/venues` (con filtri)
  - Dettaglio venue: GET `/api/venues/:id`

2) Login/Registrazione (Cliente)
- Percorsi UI: `/client-login`, `/client-register`
- Azioni:
  - Login: POST `/api/auth/login` (email, password) → salva `token` e `user` in `localStorage` (via `AuthContext`)
  - Registrazione: POST `/api/auth/register` (name, email, password, `isVenueOwner=false`)
- Risultato:
  - Utente autenticato può accedere a rotte protette come `/my-bookings`

3) Dettaglio locale → Prenotazione
- Percorso UI: `/locale/:id` → form prenotazione
- Azioni:
  - Seleziona data, time slot, numero persone, note; opzionale: partita/fixture
  - Invio prenotazione: POST `/api/bookings` (pubblico, rate-limited)
- Backend (riassunto):
  - Valida campi richiesti; risolve venue (ObjectId/slug/nome) in contesto tenant
  - Verifica conflitti orari; crea `Booking`; se non richiede approvazione → status `confirmed` + `confirmationCode`
  - Popola `venue`/`fixture`; (quando configurato) invia email conferma
- Risultato UI:
  - Messaggio di conferma; se loggato → link/redirect a `/my-bookings`

4) Account (Cliente)
- Percorso UI: `/profile`
- Azioni:
  -preferenze
  -squadre
  -password
  -localizzazione
  -spots preferiti
*(backend ancora da implementare)*

#### Admin (Venue Owner)
- "Admin → reg/login → if not registered → Onboarding → Dashboard → Statistiche → Calendario → Offerte → Prenotazioni -> Recensioni → Profilo/Account"

1) Login/Registrazione (Venue Owner)
- Percorsi UI: `/sports-login`, `/sports-register`
- Azioni:
  - Registrazione: POST `/api/auth/register` con `isVenueOwner=true` e `businessInfo{...}`
    - Backend: crea `Tenant` e `Venue` associati; ritorna `token`, `user`, `venue`
  - Login: POST `/api/auth/login` → se onboarding incompleto → `/admin/onboarding`

2) Onboarding (sempre e SOLO al primo accesso)
- Percorso UI: `/admin/onboarding` ; `OnboardingProtectedRoute`)
- Azioni: completa dati minimi per attivare l’area admin

3) Admin area (VenueProtectedRoute)
- Entry point: `/admin` → `AdminDashboard`
- Sottosezioni (tutte sotto `/admin`):
  - `statistiche` → `/admin/statistiche`
    - Mostra overview, tendenze, timeseries; aggiornamento in tempo reale lato UI
  - `calendario` → `/admin/calendario`
    - Gestione partite/eventi e contenuti correlati
  - `offers` → `/admin/offers`
    - Gestione template/annunci/offerte
  - `bookings` → `/admin/bookings`
    - Lista prenotazioni del venue; filtri, ricerca, paginazione; azioni gestionali
  - `profilo` → `/admin/profilo`
    - Dati venue, contatti, impostazioni
  - `account` → `/admin/account`
    - Dati account e preferenze proprietario
  - `recensioni` → `/admin/recensioni`
    - Moderazione e visibilità feedback

4) Flusso tipico Admin (navigazione)
- Login → (Onboarding) → Dashboard
- Da Dashboard:
  - Consulta `Statistiche` per performance (viste/click)
  - Pianifica su `Calendario`
  - Prepara contenuti su `Offerte`
  - Gestisce prenotazioni su `Bookings`
  - Aggiorna dati su `Profilo`/`Account`

Note implementative coerenti col codice:
- Autenticazione FE: `AuthContext` gestisce `token/user` in `localStorage` e route guard (`PublicRoute`/`ProtectedRoute`/`VenueProtectedRoute`/`OnboardingProtectedRoute`)
- Auth BE: `POST /api/auth/login`, `POST /api/auth/register`; venue owner riceve `venue` e crea `tenant`
- Prenotazioni BE: `POST /api/bookings` pubblico, validazioni, check conflitti, salvataggio tenant-aware
- Rotte principali FE: definite in `frontend/src/App.jsx`, con lazy loading e guardie


