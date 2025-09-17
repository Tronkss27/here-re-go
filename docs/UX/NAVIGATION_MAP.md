### Mappa Navigazione e Regole

#### Stack/Guardie
- **Public Stack**: `/`, `/locali`, `/locali/:date/:teamsSlug/:fixtureId`, `/locale/:id`, `/client-login`, `/client-register`, `/sports-login`, `/sports-register`
- **Protected (Cliente)**: `/my-bookings` → `ProtectedRoute`
- **Admin (Venue Owner)**: `/admin` e sottosezioni → `VenueProtectedRoute`
- **Onboarding**: `/admin/onboarding` → `OnboardingProtectedRoute`

#### Regole auth/ruoli
- `PublicRoute`: blocca accesso a login/register se già autenticato
- `ProtectedRoute`: richiede sessione valida (`AuthContext` + token in `localStorage`)
- `VenueProtectedRoute`: richiede `user.isVenueOwner === true` e onboarding completo
- `OnboardingProtectedRoute`: redirige i venue owner non completati su onboarding

#### Deep-link supportati
- `/locali/:date/:teamsSlug/:fixtureId` → listing contestuale a una partita
- `/locale/:id` → dettaglio venue
- `/locali/:id` → handler che reindirizza a `/locale/:id` se ObjectId, altrimenti mostra listing match
- Admin subsections deep-linkabili: `/admin/statistiche`, `/admin/calendario`, `/admin/offers`, `/admin/bookings`, `/admin/profilo`, `/admin/account`, `/admin/recensioni`

#### Pattern di navigazione
- Header/CTA dalla Home verso ricerca (`/locali`)
- Dalle liste al dettaglio (`/locale/:id`)
- Dal dettaglio alla prenotazione (azione inline)
- Cliente: dopo login, redirect alla pagina richiesta o a `/profile`/Home
- Admin: dopo login → `/admin` o `/admin/onboarding` se incompleto

#### Stati globali
- Sessione: `AuthContext` persiste `token` e `user` in `localStorage`
- Ruoli: `isVenueOwner` determina area Admin vs flusso Cliente


