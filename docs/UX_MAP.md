# UX MAP — Schermate e Flussi (Web → Flutter)

Obiettivo: fotografia delle schermate attuali e come verranno mappate in Flutter 1:1, senza cambiare comportamento.

## Utente (Pubblico/Autenticato)
- Home (`/` → `Index`)
  - Cosa mostra: partite/hub iniziale
  - Azioni: naviga verso lista locali o dettagli
  - Flutter: `features/home/home_page.dart`

- Lista locali per partita (`/locali` e varianti con parametri)
  - Cosa mostra: locali disponibili per un match, filtri
  - Azioni: apri scheda locale, avvia prenotazione
  - Flutter: `features/venues/venues_list_page.dart`

- Dettaglio locale (`/locale/:id`)
  - Cosa mostra: foto, servizi, orari, offerte
  - Azioni: prenota, visualizza annunci partita
  - Flutter: `features/venues/venue_detail_page.dart`

- Prenotazioni utente (`/my-bookings`, `/bookings`)
  - Cosa mostra: elenco prenotazioni proprie
  - Azioni: visualizza, modifica (se previsto), cancella
  - Flutter: `features/bookings/my_bookings_page.dart`

- Squadre e Preferiti (`/teams`, `/favorites`)
  - Cosa mostra: squadre seguite, locali preferiti
  - Azioni: aggiungi/rimuovi
  - Flutter: `features/profile/teams_page.dart`, `features/profile/favorites_page.dart`

- Profilo utente (`/profile`)
  - Cosa mostra: dati profilo, preferenze
  - Azioni: aggiorna dati, password, preferenze
  - Flutter: `features/profile/profile_page.dart`

- Login/Registrazione client (`/client-login`, `/client-register`)
  - Cosa mostra: form di autenticazione/registrazione
  - Flutter: `features/auth/client_login_page.dart`, `client_register_page.dart`

## Admin (Venue Owner)
- Onboarding (`/admin/onboarding`)
  - Cosa mostra: wizard in passi (dati locale, orari, servizi)
  - Azioni: avanti/indietro, salva bozza
  - Flutter: `features/onboarding/onboarding_wizard_page.dart`

- Layout Admin (`/admin`)
  - Contiene: sidebar/tab e contenuto
  - Flutter: `features/admin/admin_shell.dart` con routing figlio

- Dashboard (`/admin` index)
  - Cosa mostra: riepilogo rapido (annunci, prenotazioni, metriche)
  - Flutter: `features/admin/dashboard/dashboard_page.dart`

- Calendario partite (`/admin/calendario`)
  - Cosa mostra: partite, annunci per data, stato (pubblicato/bozza)
  - Azioni: crea/edita/archivia annuncio, filtro per lega/data
  - Flutter: `features/admin/calendar/calendar_page.dart`

- Statistiche (`/admin/statistiche`)
  - Cosa mostra: overview, top, timeseries, trend globali
  - Azioni: cambia range, metriche (views/clicks)
  - Flutter: `features/admin/analytics/analytics_page.dart`

- Recensioni (`/admin/recensioni`)
  - Cosa mostra: lista recensioni, riepilogo
  - Azioni: rispondi
  - Flutter: `features/admin/reviews/reviews_page.dart`

- Profilo locale (`/admin/profilo`)
  - Cosa mostra: anagrafica, indirizzo, servizi, schermi, orari
  - Azioni: modifica, salva
  - Flutter: `features/admin/venue/profile_page.dart`

- Account (`/admin/account`)
  - Cosa mostra: account, notifiche, preferenze
  - Azioni: update campi, logout
  - Flutter: `features/admin/account/account_page.dart`

- Prenotazioni (`/admin/bookings`)
  - Cosa mostra: prenotazioni del locale, filtri
  - Azioni: conferma/stato, esporta
  - Flutter: `features/admin/bookings/bookings_admin_page.dart`

- Offerte/Template (`/admin/offers`)
  - Cosa mostra: template offerte
  - Azioni: crea/edita/elimina
  - Flutter: `features/admin/offers/offer_templates_page.dart`

## Edge case e stati
- Offline/timeout: banner e retry sui dati lista/dettaglio
- 401/403: redirect a login o pagina permessi
- Vuoti: schermate empty state su liste/analytics
- Filtri persistenti: ricordare selezione utente (es. calendario)

## Navigazione Flutter (proposta)
- Shell con bottom/tab per area utente; stack separato per admin
- Routing nominato (GoRouter suggerito)
- Stato: Riverpod per semplicità + testabilità

## Note UI
- Mobile-first: header sticky dove già presenti
- Componenti neutri (shadcn-style) → Material 3 tema neutro in Flutter
- Grafici: Recharts → `syncfusion_flutter_charts` (stabile, mantenuto)
