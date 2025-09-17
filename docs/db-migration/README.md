# Migrazione DB: MongoDB → Supabase/Firebase

Questa sezione documenta un piano pratico per valutare e migrare da MongoDB a:
- Supabase (Postgres + Auth + RLS)
- Firebase (Firestore + Rules)

## Indice documenti
- [DB/SCHEMA_CURRENT.json](mdc:SPOrTS/SPOrTS/docs/db-migration/DB/SCHEMA_CURRENT.json) — Schema dedotto da MongoDB (collezioni, tipi, esempi minimi)
- [DB/SCHEMA_TARGET.sql](mdc:SPOrTS/SPOrTS/docs/db-migration/DB/SCHEMA_TARGET.sql) — DDL Postgres proposto (tabelle normalizzate, PK/FK, indici)
- [DB/RLS_POLICIES.sql](mdc:SPOrTS/SPOrTS/docs/db-migration/DB/RLS_POLICIES.sql) — Esempi di RLS per multi-tenant e ruoli (utente/venue_owner/admin)
- [DB/MIGRATION_PLAN.md](mdc:SPOrTS/SPOrTS/docs/db-migration/DB/MIGRATION_PLAN.md) — Piano ETL (estrazione → trasformazione → caricamento), mapping campi, ID, timestamp, soft delete, media
- [DB/AUTH_MAPPING.md](mdc:SPOrTS/SPOrTS/docs/db-migration/DB/AUTH_MAPPING.md) — Passaggio auth attuale (JWT + bcrypt) → Supabase Auth
- [DB/TEST_PLAN.md](mdc:SPOrTS/SPOrTS/docs/db-migration/DB/TEST_PLAN.md) — Verifiche di consistenza, contatori prima/dopo, test RLS, rollback
- [DB/RISKS.md](mdc:SPOrTS/SPOrTS/docs/db-migration/DB/RISKS.md) — Rischi, costi, performance, alternative (restare in Mongo)

Note:
- Non applica alcuna migrazione: è solo una guida operativa/testabile in locale.
- Il target principale è Supabase (Postgres + Auth + RLS). In coda trovi considerazioni su Firebase.
