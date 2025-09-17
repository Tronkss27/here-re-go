## Osservabilità (Locale)

### Log
- **HTTP access**: `morgan('combined')`
- **Sicurezza**: middleware `security` + `auditMiddleware` (error logger, audit logger)
- **DB**: `config/database.js` logga `connected/disconnected/reconnected/error`

Suggerimento locale: esportare `DEBUG=express:*` o usare `NODE_ENV=development` per header `X-Tenant-Debug`.

### Healthcheck
- `GET /api/health` → 200 OK
  - Risposta: `{ status: 'OK', message, timestamp, tenant }`

Esempio:
```bash
curl -s http://localhost:3001/api/health | jq
```

### Metriche minime utili (manuali)
- Contatori `analyticsdaily` (views, clicks, match_clicks) per venue e match nel range
- Numero annunci attivi per tenant
- Prenotazioni per stato nel periodo

Esempi (API esistenti):
```bash
# Overview venue (richiede Bearer + X-Tenant-ID via middleware)
curl -H "Authorization: Bearer <JWT>" \
  "http://localhost:3001/api/venues/<venueId>/analytics/overview?from=2025-08-01&to=2025-08-31"

# Timeseries views/clicks
curl -H "Authorization: Bearer <JWT>" \
  "http://localhost:3001/api/venues/<venueId>/analytics/timeseries?metric=views&from=2025-08-01&to=2025-08-31"

# Top matches globali
curl "http://localhost:3001/api/analytics/matches/top?global=true&from=2025-08-01&to=2025-08-31"
```

### Tracing (futuro)
- Inserire correlation-id (es. `X-Request-ID`) e propagarlo nei log
- Integrare un logger strutturato (p.es. pino/winston) con sink esterno in produzione


