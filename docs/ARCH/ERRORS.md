## Tassonomia Errori Backend

### Struttura Risposte d'Errore (tipica)
- `{ success: false, message: string }`
- `{ success: false, error: string, message?: string }`
- In dev, alcuni endpoint includono `stack`/dettagli condizionati a `NODE_ENV === 'development'`

### Codici HTTP ricorrenti
- **400 Bad Request**: validazioni input (express-validator), tenant non valido/assente, parametri range/date errati
- **401 Unauthorized**: token mancante o non valido
- **403 Forbidden**: ruolo insufficiente, feature/tenant non abilitata, accesso negato a risorsa di altro tenant
- **404 Not Found**: risorsa inesistente (venue/booking/fixture/annuncio), route non trovata
- **409 Conflict**: duplicati (es. annuncio già esistente per stessa partita/data/venue)
- **429 Too Many Requests**: rate limit per tenant (finestra 15m, quote basate su piano)
- **500 Internal Server Error**: errori inattesi; messaggio generico in prod, dettagli in dev

### Cause tipiche per dominio
- Auth: credenziali errate (401), token scaduto/alterato (401)
- Tenant: `Invalid tenant` (400), `Tenant context required` (400), `Tenant access denied` (403)
- Venues: `Valid venue ID is required` (400), `Venue non trovato` (404)
- Bookings: date passate, timeSlot non valido (400), booking non trovato (404)
- Annunci: duplicato venue/globale (409), validazioni match/eventDetails (400)
- Analytics: metric non valida (400), `Tenant context not resolved` nei tracking (400)

### Envelope 404 route
```json
{ "success": false, "error": "Route not found", "path": "/api/.." }
```


