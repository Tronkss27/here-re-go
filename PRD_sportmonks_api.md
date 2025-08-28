Integrazione con l’API Football di Sportmonks – ricerca documentazione e PRD
1. Documentazione ufficiale dell’API Football di Sportmonks
Autenticazione
Tutte le API Sportmonks richiedono un API token. Il token si ottiene dall’area MySportmonks (si crea una chiave API tramite il proprio account). I token non scadono fino a quando non vengono eliminati manualmente
docs.sportmonks.com
.
Modalità di autenticazione: il token può essere passato come parametro di query api_token=YOUR_TOKEN oppure come intestazione HTTP Authorization: YOUR_TOKEN
docs.sportmonks.com
. Entrambe le modalità consumano lo stesso limite di richieste.
La documentazione consiglia di non utilizzare il token direttamente in un frontend per evitare l’esposizione; è preferibile un middleware/backend che gestisca tutte le richieste all’API
docs.sportmonks.com
.
End‑point per le partite (fixtures)
Sportmonks definisce le partite come fixtures. I principali end‑point REST (metodo GET) della versione 3 dell’API sono:
End‑point	Descrizione	URL base
Get all fixtures	Restituisce tutte le partite disponibili per il proprio piano. Richiede api_token e supporta filtri, ordinamento, paginazione e parametri include per arricchire la risposta
docs.sportmonks.com
.	https://api.sportmonks.com/v3/football/fixtures 
docs.sportmonks.com
Get fixture by ID	Restituisce i dati completi per una singola partita identificata da ID. Richiede api_token. Possibilità di utilizzare include e filters
docs.sportmonks.com
.	https://api.sportmonks.com/v3/football/fixtures/{ID} 
docs.sportmonks.com
Get fixtures by date	Restituisce tutte le partite di una data specifica (formato YYYY-MM-DD)
docs.sportmonks.com
.	https://api.sportmonks.com/v3/football/fixtures/date/{date} 
docs.sportmonks.com
Get fixtures by date range	Restituisce le partite comprese tra due date (range massimo 100 giorni). Richiede start_date ed end_date nel formato YYYY-MM-DD
docs.sportmonks.com
.	https://api.sportmonks.com/v3/football/fixtures/between/{start_date}/{end_date}
docs.sportmonks.com
Get fixtures by date range for team	Come sopra, ma restituisce le partite di un team specifico. Richiede anche team_id
docs.sportmonks.com
.	https://api.sportmonks.com/v3/football/fixtures/between/{start_date}/{end_date}/{team_id}
docs.sportmonks.com
Altri end‑point disponibili (non necessari per il minimo prodotto) includono: get fixtures by multiple IDs, search by name, head‑to‑head, upcoming/past fixtures, live scores e stati della partita.
Parametri comuni
api_token (obbligatorio) – chiave per l’autenticazione
docs.sportmonks.com
.
include – elenco di risorse correlate da includere (ad esempio participants, lineups, events, statistics, scores, odds, ecc.). Gli include possono essere annidati fino a tre livelli
docs.sportmonks.com
; la documentazione elenca tutte le opzioni disponibili
docs.sportmonks.com
.
filters – filtri per ridurre il set di risultati. Esistono filtri statici come todayDate, participantSearch, venues, Deleted, IdAfter e filtri dinamici basati su entità (es. fixtureStates, fixtureLeagues, fixtureGroups)
docs.sportmonks.com
docs.sportmonks.com
. Per esempio &filters=todayDate restituisce solo le partite odierne
docs.sportmonks.com
.
select – consente di scegliere i campi da restituire (ottimizza la risposta)
docs.sportmonks.com
.
sortBy – ordina i risultati per campi specifici
docs.sportmonks.com
.
order, per_page, page – parametri di paginazione; per_page massimo 50, page indica la pagina da recuperare
docs.sportmonks.com
.
locale – consente di tradurre i nomi nella lingua selezionata
docs.sportmonks.com
.
Esempio di richiesta
Una chiamata di esempio per ottenere tutte le partite di oggi includendo i partecipanti e gli eventi, in italiano, potrebbe essere:
GET https://api.sportmonks.com/v3/football/fixtures/date/2024-08-04
    ?api_token=YOUR_TOKEN
    &filters=todayDate
    &include=participants;events
    &locale=it
La risposta è in formato JSON e include i campi della partita (id, sport_id, league_id, season_id, stage_id, round_id, state_id, venue_id, nome, data/ora di inizio, info risultato, durata, etc.)
docs.sportmonks.com
.
2. PRD – Sistema per l’estrazione e la gestione delle partite
Obiettivo del prodotto
Realizzare un modulo software (“Cursor”) che interagisca con l’API Football di Sportmonks per estrarre le partite, filtrarle in base a date/teams/lighe e arricchirle con dati correlati (es. partecipanti, eventi, statistiche), conservando le informazioni in un database interno. Il sistema deve essere sicuro, scalabile e adatto a integrarsi con applicazioni per ristoranti o altre soluzioni digitali dell’utente.
Stakeholder
Nicolò (Product Owner/Developer) – gestisce e sviluppa la soluzione; vuole automatizzare processi e fornire dati calcistici per funzionalità future (ad es. raccomandazioni di vino associate a partite, generazione di contenuti per app o schermi in ristorante, ecc.).
Utenti finali – clienti o staff che visualizzeranno le partite o utilizzeranno le funzionalità basate sui dati.
Sportmonks – fornitore dei dati; vincola l’utilizzo secondo il piano sottoscritto e i limiti di chiamate.
Funzionalità principali
Acquisizione del token e gestione sicura
Il sistema deve consentire la configurazione del token API ottenuto da MySportmonks.
Il token sarà memorizzato in variabili d’ambiente o in un vault; mai incluso nel frontend
docs.sportmonks.com
.
Interfaccia di chiamata all’API (Client)
Implementare un client HTTP (es. in Python, Node.js o altra tecnologia) che costruisce le richieste verso https://api.sportmonks.com/v3/football utilizzando i parametri indicati.
Il client dovrà gestire l’autenticazione sia via query (?api_token=) sia via header Authorization.
Gestire i parametri comuni: include, filters, select, sortBy, paginazione (per_page, page) e locale
docs.sportmonks.com
.
Fornire funzioni per i diversi end‑point: get_all_fixtures(), get_fixture_by_id(id), get_fixtures_by_date(date), get_fixtures_by_range(start, end), get_fixtures_by_range_for_team(start, end, team_id), ecc.
Gestione dei filtri e degli include
Il client deve consentire di applicare filtri statici come todayDate, participantSearch (per cercare partite di una squadra), venues, ecc.
Supportare filtri dinamici per stati (fixtureStates), leghe (fixtureLeagues), gruppi (fixtureGroups), ecc., combinabili con gli include
docs.sportmonks.com
docs.sportmonks.com
.
Permettere la scelta di includere entità correlate (partecipanti, lineup, eventi, statistiche, odds, venue, stato, ecc.) fino a tre livelli di annidamento
docs.sportmonks.com
.
Paginazione e ordinamento
Quando il numero di partite è elevato, gestire la paginazione tramite per_page (max 50) e page.
Fornire un’opzione di ordinamento (order=asc|desc) per ID o starting_at
docs.sportmonks.com
.
Salvataggio e caching dei dati
Dopo aver estratto le partite, salvare la risposta JSON in un database (relazionale o NoSQL) per uso interno; includere timestamp di aggiornamento per verificare l’obsolescenza.
Implementare un sistema di caching per evitare chiamate ripetute e rispettare il limite orario di richieste; ad esempio memorizzare i dati per un certo periodo e aggiornarli solo quando necessario.
Gestione degli errori e dei limiti
Gestire i codici di risposta HTTP: 200 OK (successo), 400 Bad Request (richiesta malformata), 401 Unauthorized (token non valido), 403 Forbidden (endpoint non incluso nel piano), 429 Too Many Requests (limite di chiamate superato), 500 Internal Server Error
docs.sportmonks.com
.
Implementare retry con back‑off in caso di 429 o errori di rete; loggare gli errori per analisi.
Internazionalizzazione
Utilizzare il parametro locale per restituire nomi e testi nella lingua desiderata (es. italiano locale=it)
docs.sportmonks.com
.
Sicurezza e buone pratiche
Tenere il token fuori dal codice sorgente.
Utilizzare connessioni HTTPS (già richiesto dall’API).
Implementare un livello di middleware/proxy che esponga solo i dati necessari al frontend, proteggendo la chiave API
docs.sportmonks.com
.
Casi d’uso
Visualizzare le partite odierne
Il ristorante vuole mostrare le partite in programma oggi su uno schermo.
Il sistema chiama get_fixtures_by_date(todayDate) con filters=todayDate e include participants e venue per mostrare nomi delle squadre e stadio
docs.sportmonks.com
.
I dati ottenuti vengono salvati e visualizzati nella UI.
Ottenere il calendario di una squadra per il prossimo mese
L’amministratore seleziona una squadra (team_id) e un intervallo di date (es. dal 1° al 30° giorno del mese).
Il sistema chiama get_fixtures_by_range_for_team(start_date, end_date, team_id)
docs.sportmonks.com
.
I dati vengono filtrati per tipo di evento o stato se necessario, salvati in DB e presentati all’utente.
Aggiornare i dati di una partita specifica
Quando l’utente apre il dettaglio di una partita, il sistema chiama get_fixture_by_id(id)
docs.sportmonks.com
 con include participants;events;lineups;statistics per avere informazioni complete.
I dati vengono confrontati con quelli salvati e aggiornati se ci sono variazioni.
Requisiti non funzionali
Affidabilità – Il sistema deve essere resiliente agli errori e garantire l’aggiornamento periodico dei dati.
Performance – Tempi di risposta rapidi; caching locale per ridurre la latenza.
Scalabilità – Supportare l’espansione a più sport (Sportmonks fornisce anche API per cricket, NBA, ecc.) e a funzionalità addizionali (quote, classifiche, giocatori).
Manutenibilità – Codice modulare che separa il client API, la logica di business e il livello di persistenza.
Sicurezza – Protezione del token API e dei dati degli utenti.
Considerazioni finali
L’API Football di Sportmonks offre un set ricco di dati: partite, squadre, giocatori, statistiche, quote e altro. Seguendo la documentazione ufficiale e rispettando le regole di autenticazione e filtraggio, Cursor potrà costruire un sistema robusto per estrarre e gestire le partite. È fondamentale gestire correttamente la paginazione, i limiti di richieste e la sicurezza del token. In fase di sviluppo si suggerisce di consultare anche la collezione Postman fornita da Sportmonks per esempi di richieste e di testare con un account gratuito prima di passare a un piano superiore.