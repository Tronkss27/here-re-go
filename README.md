# SPOrTS

## Start veloce per AI/Agenti
- Leggi prima: [AI_START_HERE.md](AI_START_HERE.md)
- Flussi UI/UX e mappe: [docs/UX/README.md](docs/UX/README.md)

Questo repository contiene il progetto "SPOrTS" — backend e frontend per la gestione dei venue, onboarding e sincronizzazione dati.

## Struttura del progetto
- `backend/` - server Node.js (API, servizi, sync)
- `frontend/` - client React + Vite
- `scripts/` - script utili per sviluppo e testing
- `DOCS/` - documenti inventario, contratti, UX map, migrazione
- `openapi.json` - freeze dei contratti REST
- `flutter/` - (verrà popolata dallo scaffold Flutter)

## Requisiti
- Node.js 18+ (o versione compatibile con le dipendenze)
- npm o yarn
- MongoDB locale (default: `mongodb://localhost:27017/sports-bar`)

## Setup locale
1. Clona il repository:

```bash
git clone git@github.com:Tronkss27/here-re-go.git
cd here-re-go
```

2. Crea file `.env` per `backend` e `frontend` basandoti sugli esempi.

3. Installa dipendenze:

```bash
npm run install:all
```

4. Avvia i servizi in sviluppo:

```bash
npm run dev
```

## Build
- Frontend: `npm run frontend:build`
- Backend: `npm run backend:build`

## Test
Attualmente non sono inclusi test in questa repo pulita. I check contratti si basano su `openapi.json`.

## Migrazione Flutter
- Vedi `MIGRATION.md` e `DOCS/UX_MAP.md`
- Lo scaffold Flutter verrà creato in `flutter/` 