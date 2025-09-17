## Test Plan Migrazione

### Obiettivi
- Verificare integrità, conteggi e coerenza referenziale post-migrazione.
- Validare performance di query principali.

### Dati di controllo (pre)
- Conta per collezione in Mongo.
- Campioni random per utenti/venue/booking.

### Query di verifica (Postgres)
- Conteggi:
  - `select count(*) from app.tenants;`
  - `select count(*) from app.users;`
  - `select count(*) from app.venues;`
  - `select count(*) from app.venue_images;`
  - `select count(*) from app.fixtures;`
  - `select count(*) from app.offer_templates;`
  - `select count(*) from app.match_announcements;`
  - `select count(*) from app.offers;`
  - `select count(*) from app.bookings;`
  - `select count(*) from app.booking_status_history;`
  - `select count(*) from app.booking_offers_snapshot;`
  - `select count(*) from app.reviews;`
  - `select count(*) from app.analytics_daily;`

- Coerenza FK:
  - `select * from app.users u where u.tenant_id is not null and not exists (select 1 from app.tenants t where t.id = u.tenant_id);`
  - `select * from app.venues v where not exists (select 1 from app.tenants t where t.id = v.tenant_id);`
  - `select * from app.bookings b where not exists (select 1 from app.venues v where v.id = b.venue_id);`

- Campioni random:
  - Confrontare 20 prenotazioni tra Mongo e Postgres (campi chiave: data, orari, party_size, venue, user, stato, total_price).

- Performance (indicativa):
  - `explain analyze select * from app.venues where tenant_id = $1 and address_city = 'Milano' and is_active = true;`
  - `explain analyze select * from app.bookings where tenant_id = $1 and venue_id = $2 and booking_date between $from and $to;`

### Test RLS
- Con utente venue_owner del tenant A:
  - SELECT venues del tenant A → OK; tenant B → denied.
  - INSERT/UPDATE venues del tenant A → OK.
- Con utente user:
  - SELECT bookings proprie (`user_id = auth.uid()`) → OK.
  - UPDATE bookings altrui → denied.
- Con admin:
  - Accesso globale → OK.

### Rollback Test
- Simula cutover, crea 5 nuove prenotazioni su Mongo durante validazione.
- Esegui delta ETL e verifica che compaiano in Postgres.
- In caso di rollback, conferma che il backend rilegga da Mongo senza perdita.


