## Piano ETL (MongoDB → Postgres/Supabase)

Obiettivo: migrazione incrementale e testabile in locale, senza downtime percepibile.

### 1) Estrazione (E)
- Esporta collezioni Mongo in JSON/NDJSON per blocchi (paginato):
  - users, tenants, venues, venue.images, fixtures, matchannouncements, offertemplates, offers, bookings, reviews, analyticsdaily, auditlogs
- Consigliato: script Node.js con Mongoose che produce file per tabella target (già trasformati in shape compatibile dove possibile).
- Salva anche mapping `_id` Mongo → chiave esterna Postgres (tabella `migration_id_map`).

### 2) Trasformazione (T)
- ID:
  - Genera nuovi UUID per PK Postgres.
  - Conserva `_id` Mongo in colonne `external_id` (se utile) o in tabella `migration_id_map(source_col, source_id, target_table, target_uuid)`.
- Timestamp:
  - Converte `createdAt/updatedAt` → `created_at/updated_at` (timestamptz). Default `now()` se mancanti.
- Soft delete:
  - Se in Mongo ci sono soft delete impliciti, aggiungere colonna `deleted_at` in target (se necessario). In schema proposto non è inclusa: opzionale.
- Venue location:
  - Denormalizza indirizzo in campi dedicati + mantiene `latitude/longitude`.
- Arrays embedded:
  - `venues.images` → tabella `venue_images`.
  - `bookings.statusHistory` → `booking_status_history`.
  - `bookings.offersSnapshot` → `booking_offers_snapshot`.
- Vincoli/enum:
  - Mappare gli enum testuali alle tipologie Postgres (con fallback a valori di default quando non validi).
- Dati incoerenti:
  - `bookings.venue` può essere `string` o `ObjectId`: normalizzare usando map `migration_id_map` per risalire al nuovo `venue_id`.
- Email/ciText:
  - Normalizza email in minuscolo, valida formati.

### 3) Caricamento (L)
- Ordine consigliato:
  1. tenants
  2. users (senza FK a venue_id nella prima passata → update successivo)
  3. venues (+ venue_images)
  4. fixtures
  5. offer_templates
  6. match_announcements
  7. offers
  8. bookings (+ booking_status_history + booking_offers_snapshot)
  9. reviews
  10. analytics_daily
  11. audit_logs
- Per ogni batch:
  - Disabilita temporaneamente trigger/constraint non critici (se necessari) o usa transazioni per batch.
  - Usa `COPY FROM STDIN` (psql) o Supabase client admin per bulk insert.

### 4) Reindicizzazione e RLS
- Crea indici dopo i bulk insert (già nel DDL): eventualmente `DROP/CREATE` per migliorare performance.
- Abilita RLS solo a fine migrazione e test.

### 5) Doppia scrittura (opzionale per cutover morbido)
- Introdurre un layer nel backend che scriva sia su Mongo sia su Postgres durante la fase di validazione (feature flag).
- Dopo la convalida, spegnere scrittura su Mongo, mantenere lettura duale per alcuni endpoint critici fino al cutover finale.

### 6) Cutover
- Finestra breve di manutenzione:
  - Mettere backend in modalità read-only.
  - Eseguire delta migration (prenotazioni/annunci creati durante validazione), poi switch dei DSN.

### Mapping campo-per-campo (estratto)
- tenants.slug → tenants.slug
- users._id(ObjectId) → users.id(UUID via Supabase Auth); salva `_id` in `migration_id_map`
- users.tenantId → users.tenant_id
- users.venueId → users.venue_id (dopo venues)
- users.role (string) → users.role (enum)
- venues.contact → venues.contact(jsonb)
- venues.location.address.* → venues.address_* columns; coordinates → latitude/longitude
- venues.features[] → features text[]
- venues.images[] → venue_images rows
- fixtures.fixtureId → fixtures.external_fixture_id
- fixtures.date → fixtures.match_date
- bookings.venue → bookings.venue_id (via map); bookings.user → bookings.user_id; fixture → fixture_id
- bookings.statusHistory[] → booking_status_history
- bookings.offersSnapshot[] → booking_offers_snapshot
- reviews.(venue, user, rating, text, status) → reviews target equivalenti
- analyticsdaily → analytics_daily (metric, day, count)

### Allegati/Media
- Le URL immagini restano tali (stesso storage). In Supabase si può migrare su Storage buckets:
  - Copia file e riscrivi URL se necessario.
  - `venue_images.url` punta al nuovo bucket (`public/venues/...`).

### Strumenti script
- Node.js con `pg` e `mongodb`/`mongoose` per pipeline.
- Genera file CSV/NDJSON + `COPY` per velocità.

### Rollback
- Rollback = puntare di nuovo il backend a Mongo, lasciare dati Postgres in quarantena.
- Conservare dump Mongo e snapshot Postgres (pg_dump) prima del cutover.


