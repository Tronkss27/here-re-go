### Schermate principali

| Route/ID | Obiettivo | Dati richiesti | Eventi/CTA | Errori / Empty states |
|---|---|---|---|---|
| `/` (Home) | Far scoprire venue/eventi | Spotlight venue, promo, entry points | Vai a `/locali`, login/register | Nessun venue in evidenza → mostra consigli default |
| `/locali` | Ricerca/filtri e listing venue | GET `/api/venues` (filtri) | Applica filtri, apri venue, deep-link match | Nessun risultato → empty con suggerimenti filtri |
| `/locali/:date/:teamsSlug/:fixtureId` | Deep-link a listing contestuale a match | Stessa di `/locali` + parametri | Naviga al venue più vicino/pertinente | Fixture non valida → fallback a `/locali` |
| `/locale/:id` | Dettaglio venue, info e prenotazione | GET `/api/venues/:id`; partite e time slots | Seleziona slot, invia prenotazione | Conflitti/validazione → messaggi inline; venue non trovato → 404 |
| `/client-login` | Accesso cliente | email, password | Login, link a register | Credenziali errate, rete giù |
| `/client-register` | Registrazione cliente | name, email, password, consensi | Registra e login | Email già usata, password debole |
| `/sports-login` | Accesso venue owner | email, password | Login admin | Credenziali errate; se owner su client-login → suggerisci sports-login |
| `/sports-register` | Registrazione venue owner + business | name, email, password, businessInfo, consensi | Crea tenant+venue, login | Email esistente, businessInfo incompleta |
| `/my-bookings` | Gestione prenotazioni utente | Auth token; fetch prenotazioni utente | Vedi lista, nuova prenotazione | Non loggato → richiesta login; nessuna prenotazione → empty |
| `/admin` | Dashboard panoramica | Metriche sintetiche | Naviga sezioni | Nessun dato → placeholder |
| `/admin/statistiche` | Metriche (views/click/timeseries) | Endpoint analytics (no-store; tenant-aware) | Filtri data/scope, refresh | Nessun evento → empty; delay API → skeleton |
| `/admin/calendario` | Programmazione partite/eventi | Fixtures e strumenti di pianificazione | Filtra, pianifica, apri dettaglio | Nessuna partita programmata → empty |
| `/admin/offers` | Gestione offerte/annunci | Template offerte | Crea/edita/pubblica | Nessun template → empty con CTA Crea |
| `/admin/bookings` | Gestione prenotazioni venue | Elenco prenotazioni venue | Filtri, cerca, cambia stato | Nessuna prenotazione → empty; errori rete |
| `/admin/profilo` | Dati venue | Dati venue/Tenant | Modifica/salva | Campi mancanti/invalidi |
| `/admin/account` | Dati account owner | Dati utente | Modifica/salva | Errori validazione |
| `/admin/recensioni` | Moderazione feedback | Elenco recensioni | Filtri, azioni | Nessuna recensione → empty |
| `*` (NotFound) | 404 elegante | — | Torna a Home | — |

Edge case generali:
- Timeout/errore rete → retry, fallback e messaggi chiari
- Stato loading → skeleton/placeholder coerenti
- Autorizzazioni mancanti → redirect/login


