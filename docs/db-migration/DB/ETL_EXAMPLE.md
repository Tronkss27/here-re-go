## ETL Example (SOLO un’idea guida; il programmatore ha piena libertà)

Questo file fornisce uno scheletro di esempio per un flusso ETL MongoDB → Postgres/Supabase. Non è vincolante: adattare liberamente strumenti, librerie, struttura cartelle e strategie (CSV/NDJSON vs inserimenti diretti, batching, parallelismo, ecc.).

### Requisiti (indicativi)
- Node.js 18+
- Librerie a scelta (esempi): `mongodb`, `pg`, opzionale `fast-csv`/`jsonstream` per streaming
- Connessioni: variabili d’ambiente `MONGODB_URI`, `PG_CONNECTION_STRING`

### Strategia high‑level
- Estrai a pagine (batch) dalle collezioni Mongo
- Trasforma gli oggetti nel formato target (UUID, timestamp, mapping campi)
- Carica in Postgres via `COPY` (consigliato per bulk) o `INSERT` batch
- Mantieni una `migration_id_map` per riconciliare riferimenti tra entità

```javascript
// etl_example.js — SOLO ESEMPIO. Adattare liberamente.
// npm i mongodb pg
import { MongoClient } from 'mongodb'
import pg from 'pg'

const { Client: PgClient } = pg

// Config (usare .env / secrets manager)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sports-bar'
const PG_CONNECTION_STRING = process.env.PG_CONNECTION_STRING || 'postgres://postgres:password@localhost:5432/sports'

// Batch size per estrazione
const BATCH = 1000

// Esempio minimal di mapping ID Mongo(ObjectId) → UUID (qui placeholder)
function toUUIDPlaceholder(mongoId) {
  // In produzione: generare UUID v4 e salvare una riga in migration_id_map
  // qui ritorniamo un finto UUID deterministico per dimostrazione
  const hex = String(mongoId).replace(/[^0-9a-f]/gi, '').padEnd(32, '0').slice(0, 32)
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`
}

function toTimestamp(date) {
  return date ? new Date(date).toISOString() : new Date().toISOString()
}

// Normalizzazioni esempio (venues)
function transformVenue(doc) {
  return {
    id: toUUIDPlaceholder(doc._id),
    tenant_id: doc.tenantId ? toUUIDPlaceholder(doc.tenantId) : null,
    owner_user_id: doc.owner ? toUUIDPlaceholder(doc.owner) : null,
    name: doc.name,
    description: doc.description || null,
    contact: JSON.stringify(doc.contact || {}),
    address_city: doc?.location?.address?.city || '',
    address_street: doc?.location?.address?.street || '',
    address_state: doc?.location?.address?.state || null,
    address_postal_code: doc?.location?.address?.postalCode || '',
    address_country: doc?.location?.address?.country || 'Italy',
    latitude: doc?.location?.coordinates?.latitude ?? null,
    longitude: doc?.location?.coordinates?.longitude ?? null,
    hours: JSON.stringify(doc.hours || {}),
    capacity: JSON.stringify(doc.capacity || {}),
    features: JSON.stringify(doc.features || []),
    sports_offerings: JSON.stringify(doc.sportsOfferings || []),
    booking_settings: JSON.stringify(doc.bookingSettings || {}),
    pricing: JSON.stringify(doc.pricing || {}),
    status: doc.status || 'pending',
    is_verified: !!doc.isVerified,
    is_active: doc.isActive !== false,
    analytics: JSON.stringify(doc.analytics || {}),
    slug: doc.slug || null,
    admin_notes: doc.adminNotes || null,
    created_at: toTimestamp(doc.createdAt),
    updated_at: toTimestamp(doc.updatedAt)
  }
}

async function main() {
  const mongo = new MongoClient(MONGODB_URI)
  const pg = new PgClient({ connectionString: PG_CONNECTION_STRING })

  await mongo.connect()
  await pg.connect()

  try {
    const db = mongo.db() // default DB dalla stringa di connessione
    const venues = db.collection('venues')

    let skip = 0
    while (true) {
      const docs = await venues.find({}).skip(skip).limit(BATCH).toArray()
      if (docs.length === 0) break

      const rows = docs.map(transformVenue)

      // Esempio: insert batch semplice (per demo). In produzione: preferire COPY.
      const text = `
        insert into app.venues (
          id, tenant_id, owner_user_id, name, description, contact,
          address_city, address_street, address_state, address_postal_code, address_country,
          latitude, longitude, hours, capacity, features, sports_offerings,
          booking_settings, pricing, status, is_verified, is_active, analytics, slug, admin_notes,
          created_at, updated_at
        ) values ${rows.map((_, i) => `(
          $${i*27+1}, $${i*27+2}, $${i*27+3}, $${i*27+4}, $${i*27+5}, $${i*27+6},
          $${i*27+7}, $${i*27+8}, $${i*27+9}, $${i*27+10}, $${i*27+11},
          $${i*27+12}, $${i*27+13}, $${i*27+14}, $${i*27+15}, $${i*27+16}, $${i*27+17},
          $${i*27+18}, $${i*27+19}, $${i*27+20}, $${i*27+21}, $${i*27+22}, $${i*27+23}, $${i*27+24}, $${i*27+25},
          $${i*27+26}, $${i*27+27}
        )`).join(',')}
        on conflict (id) do nothing;
      `
      const values = rows.flatMap(r => [
        r.id, r.tenant_id, r.owner_user_id, r.name, r.description, r.contact,
        r.address_city, r.address_street, r.address_state, r.address_postal_code, r.address_country,
        r.latitude, r.longitude, r.hours, r.capacity, r.features, r.sports_offerings,
        r.booking_settings, r.pricing, r.status, r.is_verified, r.is_active, r.analytics, r.slug, r.admin_notes,
        r.created_at, r.updated_at
      ])

      await pg.query('begin')
      await pg.query(text, values)
      await pg.query('commit')

      skip += docs.length
      console.log(`✔ Inseriti venues: ${skip}`)
    }

    // TODO (libero):
    // - Implementare COPY FROM STDIN per performance
    // - Gestire migration_id_map
    // - Estrarre/trasformare bookings, fixtures, templates, ecc.
    // - Controllare/temporizzare RLS e permessi (service role) durante il load

  } catch (err) {
    console.error('ETL error:', err)
    try { await pg.query('rollback') } catch {}
  } finally {
    await pg.end()
    await mongo.close()
  }
}

main().catch(console.error)
```

### Note
- Questo è SOLO un esempio illustrativo. L’implementazione reale può (e dovrebbe) differire dove opportuno.
- Il programmatore ha piena libertà su scelte tecnologiche (streaming, CSV/NDJSON, librerie, orchestrazione) e struttura dei moduli.



