### Flowchart (Mermaid)

```mermaid
flowchart TD
  A[Guest su Home `/`] --> B{Serve login?}
  B -- No --> C[Visita `/locali`]
  C --> D[Dettaglio `/locale/:id`]
  D --> E[Compila form prenotazione]
  E --> F[POST /api/bookings]
  F --> G{Booking confermata?}
  G -- Sì --> H[Conferma UI + (Se loggato) link a `/my-bookings`]
  G -- No --> I[Errore/Conflict → mostra messaggio + retry]
  B -- Sì --> L[Vai a `/client-login`]
  L --> M[POST /api/auth/login]
  M --> N{Successo?}
  N -- Sì --> C
  N -- No --> O[Errore credenziali]
```

```mermaid
flowchart TD
  A[Registrazione Cliente `/client-register`] --> B[POST /api/auth/register isVenueOwner=false]
  B --> C{Successo?}
  C -- Sì --> D[Salva token/user → redirect Home]
  C -- No --> E[Mostra errore]
```

```mermaid
flowchart TD
  A[Registrazione Venue Owner `/sports-register`] --> B[POST /api/auth/register isVenueOwner=true + businessInfo]
  B --> C[BE: crea Tenant + Venue]
  C --> D{Successo?}
  D -- Sì --> E[Salva token/user/venue]
  E --> F{Onboarding completo?}
  F -- No --> G[Redirect `/admin/onboarding`]
  F -- Sì --> H[Redirect `/admin`]
  D -- No --> I[Mostra errore]
```

```mermaid
flowchart TD
  A[Admin Login `/sports-login`] --> B[POST /api/auth/login]
  B --> C{Onboarding completo?}
  C -- No --> D[`/admin/onboarding`]
  C -- Sì --> E[`/admin` Dashboard]
  E --> F[`/admin/statistiche`]
  E --> G[`/admin/calendario`]
  E --> H[`/admin/offers`]
  E --> I[`/admin/bookings`]
  E --> J[`/admin/profilo`]
  E --> K[`/admin/account`]
  E --> L[`/admin/recensioni`]
```

```mermaid
flowchart TD
  A[Dettaglio Venue `/locale/:id`]
  A --> B[Seleziona data/ora/persone]
  B --> C[POST /api/bookings]
  C --> D{Conflitti?}
  D -- No --> E[Status confirmed (se auto-approve) + code]
  E --> F[UI conferma → (opz.) `/my-bookings`]
  D -- Sì --> G[Mostra errore e suggerisci altro slot]
```


