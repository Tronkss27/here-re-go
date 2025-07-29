# SPOrTS - Piano di Implementazione Dettagliato

Questo documento espande la to-do list del progetto, fornendo dettagli tecnici, obiettivi e criteri di accettazione per ogni EPIC e task. Serve come guida strategica e operativa per lo sviluppo, assicurando che ogni passo sia allineato con la visione del prodotto e tecnicamente solido.

---

## EPIC 1 – Integrazione API Sport (Sportmonks)

**Obiettivo**: Integrare una fonte dati esterna affidabile per le partite di calcio reali, creando una base dati solida per le funzionalità future come gli annunci partita e le statistiche.

### Task 1.1: Selezione & Setup Provider API
- **Obiettivo**: Scegliere e configurare il provider API Sportmonks.
- **Stato**: In corso.
- **Dettagli Tecnici**:
    - **Provider scelto**: Sportmonks.
    - **Piano**: Worldwide Plan (Trial 14 giorni). Copre tutte le leghe europee principali, Serie B, e competizioni internazionali.
    - **Chiave API**: Verrà salvata in `backend/.env` come `SPORTMONKS_API_TOKEN` per non esporla nel codice.
- **Criteri di Accettazione**: La chiave API è configurata correttamente nell'ambiente di sviluppo e le chiamate di test hanno successo.

### Task 1.2: Implementare Modello `GlobalMatch` e Logica Cache
- **Obiettivo**: Creare la struttura dati per le partite globali e una strategia di caching per ottimizzare le chiamate API, riducendo costi e latenza.
- **Dettagli Tecnici**:
    - **Modello DB**: Creare il file `backend/src/models/GlobalMatch.js`.
    - **Schema `GlobalMatch`**:
        ```javascript
        const globalMatchSchema = new mongoose.Schema({
            providerId: { type: String, required: true, unique: true, index: true }, // ID da Sportmonks
            league: { id: Number, name: String, image_path: String },
            season: { id: Number, name: String },
            date: { type: Date, required: true, index: true },
            status: { name: String },
            participants: {
                home: { id: Number, name: String, image_path: String },
                away: { id: Number, name: String, image_path: String }
            },
            scores: [{
                score: { goals: Number },
                description: String // Es. "CURRENT", "HT"
            }],
            venue: { id: Number, name: String, city_name: String },
            lastUpdatedFromProvider: { type: Date }
        });
        ```
    - **Caching**: Implementare una cache in-memory (es. `node-cache`) all'interno del `sportsApiService` per le risposte di Sportmonks. TTL (Time-To-Live) differenziato: 1-5 minuti per i livescores, 1 ora per i dati delle partite future.
- **Criteri di Accettazione**: Il modello `GlobalMatch` è creato e registrato in Mongoose. La logica di cache è implementata e i test dimostrano una riduzione delle chiamate API duplicate.

### Task 1.3: Creare `sportsApiService` Wrapper
- **Obiettivo**: Centralizzare e rendere resilienti tutte le interazioni con l'API di Sportmonks.
- **Dettagli Tecnici**:
    - **File**: Creare `backend/src/services/sportsApiService.js`.
    - **Metodi Principali**: `getLeagues()`, `getFixturesByDate(date)`, `getFixtureById(id)`.
    - **Resilienza**: Implementare **Retry Pattern** (es. con `axios-retry`) e **Circuit Breaker** (es. con `opossum`) per gestire errori di rete e downtime dell'API. Loggare tutte le operazioni.
- **Criteri di Accettazione**: Il service astrae completamente le chiamate a Sportmonks, gestisce gli errori in modo robusto e logga le operazioni.

### Task 1.4: Script Seed Iniziale
- **Obiettivo**: Popolare il database con un set di dati iniziale di partite reali.
- **Dettagli Tecnici**:
    - **File**: Creare lo script `backend/scripts/seedRealMatches.js`.
    - **Logica**: Utilizzare `sportsApiService` per recuperare le partite delle prossime due settimane per i campionati principali e usare `GlobalMatch.updateOne` con `{ upsert: true }` per evitare duplicati.
- **Criteri di Accettazione**: Lo script popola la collection `globalmatches` con almeno 50 partite reali senza errori.

---

## EPIC 2 – Admin Creatore Annunci

**Obiettivo**: Fornire agli admin un'interfaccia intuitiva per creare annunci di partite reali, arricchirli con offerte e pubblicarli.

### Task 2.1: UI Ricerca Match con Autocomplete e Filtri
- **Obiettivo**: Semplificare la selezione della partita da annunciare.
- **Dettagli Tecnici**:
    - **Componente**: Modificare `frontend/src/components/forms/CreateMatchAnnouncementForm.tsx`.
    - **UI**: Introdurre un campo `ComboBox` (shadcn/ui) per la ricerca, che interroghi un nuovo endpoint `/api/matches/search?q=...`. Aggiungere filtri per data e campionato.
- **Criteri di Accettazione**: L'admin può cercare e selezionare una partita dal DB `globalmatches` in modo rapido e intuitivo.

### Task 2.2: Form Annuncio con Sezione Offerte
- **Obiettivo**: Permettere l'associazione di offerte commerciali (es. "Birra + Panino a 10€") all'annuncio.
- **Dettagli Tecnici**:
    - **Modello DB**: Aggiornare `backend/src/models/MatchAnnouncement.js` aggiungendo: `offers: [{ title: String, description: String, price: String }]`.
    - **UI**: In `CreateMatchAnnouncementForm.tsx`, aggiungere una sezione per l'inserimento dinamico di `offers`.
- **Criteri di Accettazione**: L'admin può aggiungere, modificare e rimuovere dinamicamente una o più offerte collegate a un annuncio.

### Task 2.3: Endpoint Salvataggio & Pubblicazione
- **Obiettivo**: Salvare nel database l'annuncio completo, associandolo al locale e alla partita.
- **Dettagli Tecnici**:
    - **Route**: `POST /api/match-announcements` in `backend/src/routes/matchAnnouncements.js`.
    - **Controller**: La logica in `matchAnnouncementController.js` dovrà validare i dati, associare il `GlobalMatch._id`, il `tenantId`, e salvare il documento.
- **Criteri di Accettazione**: L'endpoint salva correttamente l'annuncio e le sue offerte, associandolo al locale corretto.

---

## EPIC 3 – Homepage "Match più caldi"

**Obiettivo**: Trasformare la homepage in una dashboard dinamica che mostra le partite più interessanti, aumentando l'engagement degli utenti.

### Task 3.1: Componenti UI Tabs per Homepage
- **Obiettivo**: Creare la struttura UI della nuova homepage.
- **Dettagli Tecnici**:
    - **Componente**: Creare la nuova pagina `frontend/src/pages/Home.tsx`.
    - **UI**: Utilizzare il componente `Tabs` di `shadcn/ui` per le sezioni "Match più caldi", "Oggi", "Domani". Popolare le tab interrogando i relativi endpoint.
- **Criteri di Accettazione**: La homepage mostra le tab e carica dinamicamente il contenuto per ciascuna.

### Task 3.2: Algoritmo Ranking "Hot Matches"
- **Obiettivo**: Definire una metrica per determinare quali partite sono "più calde".
- **Dettagli Tecnici**:
    - **Logica Backend**: Creare una funzione in un nuovo service `rankingService.js`.
    - **Algoritmo (v1)**: Il ranking sarà una combinazione ponderata di: `(numero di annunci creati per quella partita * 0.6) + (viewCount totale degli annunci per quella partita * 0.4)`. I dati verranno calcolati tramite una aggregation query su MongoDB.
- **Criteri di Accettazione**: L'algoritmo calcola e restituisce una lista ordinata di `GlobalMatch`.

### Task 3.3: API `/matches/hot`
- **Obiettivo**: Esporre i risultati dell'algoritmo di ranking tramite un'API.
- **Dettagli Tecnici**:
    - **Route**: `GET /api/matches/hot` in un nuovo file `backend/src/routes/matches.js`.
    - **Controller**: Un nuovo `matchController.js` utilizzerà il `rankingService` per ottenere la lista delle partite e restituirla.
- **Criteri di Accettazione**: L'API restituisce la lista ordinata dei match più caldi.

---

## EPIC 4 – Tema & Palette

**Obiettivo**: Rinnovare l'identità visiva dell'applicazione, implementando una nuova palette di colori e un selettore di tema (light/dark).

### Task 4.1: Definire Token Colore Nuova Palette
- **Obiettivo**: Tradurre la palette fornita in token CSS/Tailwind riutilizzabili.
- **Dettagli Tecnici**:
    - Modificare `frontend/tailwind.config.js` e `frontend/src/styles/design-system.css` per definire la palette `["#040f0f","#248232","#2ba84a","#2d3a3a","#fcfffc"]` con nomi semantici (es. `primary`, `dark-bg`) per temi light/dark.
- **Criteri di Accettazione**: I nuovi token di colore sono disponibili in Tailwind e come variabili CSS globali.

### Task 4.2: Implementare Toggle Manuale Light/Dark
- **Obiettivo**: Dare all'utente il controllo sul tema dell'applicazione.
- **Dettagli Tecnici**:
    - Utilizzare una soluzione basata su `localStorage` e `Context` per gestire e persistere lo stato del tema.
    - Aggiungere un componente `ThemeToggle.tsx` nell'header o nel sidebar.
- **Criteri di Accettazione**: Il toggle cambia tema (light/dark) e la scelta persiste tra le sessioni.

### Task 4.3: Refactor Tailwind/SCSS su Nuovi Token
- **Obiettivo**: Applicare la nuova palette in tutta l'applicazione in modo consistente.
- **Dettagli Tecnici**:
    - Sostituire i colori hard-coded (es. `bg-gray-200`) con i nuovi token semantici (es. `bg-background`). Partire dai componenti in `frontend/src/components/ui`.
- **Criteri di Accettazione**: L'interfaccia utente riflette la nuova palette di colori in modo omogeneo.

---

## EPIC 5 – Analytics & Insight

**Obiettivo**: Fornire agli admin dati utili sulle performance del loro profilo pubblico e degli annunci.

### Task 5.1: Middleware Tracking `viewCount`
- **Obiettivo**: Tracciare le visualizzazioni delle pagine pubbliche dei locali e degli annunci.
- **Dettagli Tecnici**:
    - Creare un middleware in `backend/src/middlewares/trackingMiddleware.js` che incrementa (`$inc`) un campo `viewCount` sui modelli `Venue` e `MatchAnnouncement` per ogni visita.
- **Criteri di Accettazione**: Ogni visita a una pagina pubblica di un locale o annuncio incrementa il rispettivo contatore.

### Task 5.2: Dashboard Admin Statistiche 7gg
- **Obiettivo**: Mostrare agli admin le statistiche di visualizzazione in un formato chiaro.
- **Dettagli Tecnici**:
    - Aggiungere una sezione "Statistiche" in `AdminDashboard.tsx`.
    - Creare un endpoint `GET /api/venues/my/stats` che restituisca i dati aggregati.
    - Usare `Recharts` per visualizzare i dati in un grafico.
- **Criteri di Accettazione**: La dashboard admin mostra un grafico con le visualizzazioni del profilo degli ultimi 7 giorni.

---

## EPIC 6 – Google Maps & Places

**Obiettivo**: Integrare mappe e geolocalizzazione per migliorare l'UX.

### Task 6.1: Guida Ottenimento Chiave Google Maps + Places
- **Obiettivo**: Documentare la procedura per ottenere le chiavi API necessarie.
- **Dettagli Tecnici**:
    - Creare `docs/GOOGLE_MAPS_SETUP.md` con istruzioni passo-passo per abilitare "Maps JavaScript API" e "Places API" su GCP e ottenere la chiave.
- **Criteri di Accettazione**: Il documento è chiaro e permette di ottenere la chiave API in autonomia.

### Task 6.2: Autocomplete Indirizzo nel Form
- **Obiettivo**: Semplificare l'inserimento dell'indirizzo e garantire dati geografici accurati.
- **Dettagli Tecnici**:
    - Integrare `@react-google-maps/api` nel form di onboarding (`StepLocation.tsx`) per l'autocomplete dell'indirizzo e il salvataggio automatico di lat/lng.
- **Criteri di Accettazione**: L'utente può cercare un indirizzo e il form viene compilato automaticamente con dati strutturati.

### Task 6.3: Embed Mappa nella Pagina Locale
- **Obiettivo**: Mostrare la posizione del locale su una mappa interattiva.
- **Dettagli Tecnici**:
    - In `VenueDetail.tsx`, usare il componente `GoogleMap` per visualizzare un marker usando le coordinate lat/lng del locale.
- **Criteri di Accettazione**: La pagina pubblica del locale mostra una mappa con un marker sulla posizione corretta.

---

## EPIC 7 – Routing Partite & Venues

**Obiettivo**: Creare una relazione navigabile tra le partite e i locali che le trasmettono.

### Task 7.1: Route `/matches/:matchId/venues`
- **Obiettivo**: Creare una pagina che elenchi tutti i locali per una specifica partita.
- **Dettagli Tecnici**:
    - **Backend**: Creare `GET /api/matches/:matchId/venues` che restituisce i locali che trasmettono una data partita.
    - **Frontend**: Creare la pagina `MatchVenues.tsx` che mostra la lista dei locali.
- **Criteri di Accettazione**: Navigando a `/matches/123` si vede la lista dei locali che trasmettono la partita 123.

### Task 7.2: Link Inverso da Homepage a Pagina Partita
- **Obiettivo**: Permettere agli utenti di navigare dalla homepage alla pagina di una partita specifica.
- **Dettagli Tecnici**:
    - Nel componente card della partita sulla homepage, il link deve puntare a `/matches/:matchId/venues`.
- **Criteri di Accettazione**: Cliccando su una partita nella homepage si viene reindirizzati alla pagina con l'elenco dei locali.

---

## EPIC 8 – Pulizia Dati Mock

**Obiettivo**: Rimuovere tutti i dati fittizi dal database per partire con un ambiente pulito.

### Task 8.1: Script Cleanup
- **Obiettivo**: Automatizzare la cancellazione di dati non reali.
- **Dettagli Tecnici**:
    - Creare lo script `backend/scripts/cleanupMockData.js`.
    - Lo script eseguirà `MatchAnnouncement.deleteMany({})` e `Fixture.deleteMany({})`. Va eseguito con cautela.
- **Criteri di Accettazione**: Lo script svuota le collection `matchannouncements` e `fixtures` dai dati di test.

---

## EPIC 9 – DevOps & Qualità

**Obiettivo**: Migliorare la qualità e la manutenibilità del codice e del servizio.

### Task 9.1: Test Unit & E2E
- **Obiettivo**: Aumentare la copertura di test per le nuove funzionalità critiche.
- **Dettagli Tecnici**:
    - **Backend**: Aggiungere test unitari per `sportsApiService` e `rankingService` usando Jest.
    - **Frontend**: Creare test e2e con Cypress per il flusso di creazione annuncio.
- **Criteri di Accettazione**: Almeno l'80% di copertura per i nuovi service e il flusso e2e di creazione annuncio passa senza errori.

### Task 9.2: Endpoint Health + Uptime Monitor
- **Obiettivo**: Avere un modo semplice per verificare lo stato di salute dell'applicazione.
- **Dettagli Tecnici**:
    - Creare un endpoint `GET /api/health` che controlla la connessione al DB.
    - Configurare un servizio di monitoraggio esterno (es. UptimeRobot) che chiami questo endpoint.
- **Criteri di Accettazione**: L'endpoint `health` è accessibile e risponde correttamente. 