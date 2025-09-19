## Auth: Mongo (JWT+bcrypt) → Supabase Auth

### Stato attuale
- Login custom: email/password (bcrypt) con JWT firmato dal backend.
- Ruoli: `user`, `venue_owner`, `admin` (nel documento utente + in JWT).

### Target Supabase
- Supabase Auth (schema `auth`) gestisce utenti e sessioni.
- RLS su tabelle applicative basate su `auth.uid()` e custom claim (`tenant_id`, `role`).

### Import utenti
- Supabase supporta import utenti con hash bcrypt tramite Admin API.
- Strategia:
  1. Esporta utenti Mongo: `{ email, passwordHash(bcrypt), user_metadata: { name, role, tenant_id, venue_id } }`.
  2. Usa endpoint import (o script) per creare `auth.users` con `password_hash`.
  3. Popola tabella `app.users` con la stessa `id` (UUID) generata da Supabase per `auth.users`.

### Mappatura campi
- `users.email` → `auth.users.email`
- `users.password(bcrypt)` → `auth.users.encrypted_password` (import hash)
- `users.role` → `app.users.role` + claim `role` nelle JWT
- `users.tenantId` → claim `tenant_id` e colonna `app.users.tenant_id`
- `users.venueId` → colonna `app.users.venue_id`

### Sessioni/Refresh token
- Non migrabili in sicurezza.
- Richiedere re-login dopo cutover (notifica all’utente).

### Provider social (opz.)
- Possibile abilitare Google/Apple; le policy RLS restano valide perché basate su `auth.uid()` e claim aggiuntivi.

### JWT Claims
- Aggiungere `role` e `tenant_id` nelle JWT (via signUp metadata o Edge Function post-login):
  - `role`: `user|venue_owner|admin`
  - `tenant_id`: UUID del tenant
- Le policy RLS in `DB/RLS_POLICIES.sql` presuppongono questi claim.



