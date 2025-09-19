## Rischi, Costi, Alternative

### Vantaggi Supabase/Postgres
- **Consistenza e RLS native**: ottimo per multi-tenant sicuro lato DB.
- **Query potenti**: join, aggregazioni, indici evoluti.
- **Ecosistema**: Storage, Functions, Realtime.

### Sfide
- **Migrazione schemi/embedded**: richiede normalizzazione (più tabelle, join).
- **Mappatura ID**: ObjectId → UUID e riferimenti misti (venue in Booking) da normalizzare.
- **Import utenti**: serve pipeline per portare bcrypt su Supabase Auth; re-login necessario per le sessioni.
- **Costi**: piani Supabase in base a storage/row/throughput; valutare crescita.

### Vantaggi Firebase (Firestore)
- **Semplicità** per dati documentali e mobile-first.
- **Realtime/by design** e integrazione auth Google.

### Sfide Firebase
- **Query limitate**: join e aggregazioni complesse richiedono denormalizzazione e Cloud Functions.
- **Rules complesse** per multi-tenant; assenza di RLS SQL.
- **Costi per letture**: attenzione a pattern di accesso (analytics/filtri complessi possono costare molto).

### Alternative: restare in MongoDB
- **Pro**: schema flessibile, niente migrazione, indici composti/atlas search; sharding disponibile.
- **Contro**: niente RLS nativa; gestione auth/consistenza lato app; reporting/SQL richiedono layer aggiuntivi.

### Valutazione per il tuo caso
- Se priorità = sicurezza rigorosa multi-tenant + reporting solido → **Supabase/Postgres** consigliato.
- Se priorità = delivery rapidissimo mobile real‑time, modelli documentali semplici → **Firebase**.
- Se la pipeline attuale è stabile e le query sono soprattutto documentali → **rimanere su Mongo** può avere miglior rapporto costi/benefici.

### Costi/Performance (indicativo)
- **Supabase**: storage + richieste + egress; ottimo rapporto per carichi misti CRUD/analytics moderate.
- **Firebase**: costi per document read intensivi; ottimo per push realtime.
- **Mongo Atlas**: costo controllabile, ottimo per write heavy documentali, scalabilità orizzontale.



