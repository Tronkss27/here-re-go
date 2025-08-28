# SPOrTS

Questo repository contiene il progetto "SPOrTS" — backend e frontend per la gestione dei venue, onboarding e sincronizzazione dati.

## Struttura del progetto
- `backend/` - server Node.js (API, servizi, sync)
- `frontend/` - client React + Vite
- `scripts/` - script utili per sviluppo e testing
- `tasks/` - elenco dei task e stato

## Requisiti
- Node.js 18+ (o versione compatibile con le dipendenze)
- npm o yarn
- Postgres o database supportato (vedi `backend/.env.example` per variabili richieste)

## Setup locale
1. Clona il repository:

```bash
git clone https://github.com/Tronkss27/Spo-r-ts.git
cd Spo-r-ts
```

2. Crea file `.env` per `backend` e `frontend` basandoti sugli esempi (`backend/.env.example` se presente). **Non committare `.env`**.

3. Installa dipendenze:

```bash
# backend
cd backend && npm install

# frontend
cd ../frontend && npm install
```

4. Avvia i servizi in sviluppo (esempio):

```bash
# Dalla root progetto
# Avvia backend
cd backend && npm run dev

# In un altro terminale avvia frontend
cd frontend && npm run dev
```

## Database
- Configura la connessione nel file `.env` del `backend` (es. `DATABASE_URL`)
- Esegui eventuali migrazioni: `npm run migrate` (o comando specifico del progetto)

## Build e deploy
- Frontend: `cd frontend && npm run build` e servire `dist/` con un web server
- Backend: preparare build/immagine Docker come da `Dockerfile` e `docker-compose.dev.yml`

## Esempi di comandi utili
- Lint: `npm run lint` (se presente)
- Test: `npm test` o `npm run test`

## Note di sicurezza
- Assicurati che le chiavi API e `.env` non siano pubbliche.
- `node_modules/`, `.env` e altri file sensibili sono esclusi dal `.gitignore`.

## Contatti
Per assistenza contatta l'autore del progetto. 