# INVENTORY — SPOrTS (Fase 0)

## Panoramica repo
- Root: Node monorepo semplice (non workspaces) con script per orchestrare frontend e backend.
- Progetti:
  - `frontend/` (Vite + React 18 + Tailwind + shadcn/radix + React Router + React Query)
  - `backend/` (Express 5, Mongoose 8, JWT, middlewares multi-tenant, scheduler/Agenda)

## Entrypoint & Dev flow
- Frontend:
  - Entrypoint HTML: `frontend/index.html` → `<script type="module" src="/src/main.jsx">`
  - Dev server: Vite su porta 5174 (`vite.config.js`), proxy `/api` → `http://localhost:3001`
  - Build: `vite build`
- Backend:
  - Entrypoint: `backend/server.js` → monta `backend/src/app.js`
  - Dev: `nodemon server.js` (porta `PORT` env, default 3001)
- Root scripts:
  - `dev`: avvia in parallelo backend e frontend
  - `build`: build backend + frontend
  - `docker:dev`: `docker-compose.dev.yml` (presente); `docker-compose.prod.yml` referenziato ma non in repo

## Script
- Root `package.json`
  - `install:all`, `dev`, `frontend:dev`, `backend:dev`, `build`, `frontend:build`, `backend:build`, `docker:*`, `seed`, `test`, `lint`, `format`, `prepare`
- Frontend `package.json`
  - `dev`, `build`, `lint`, `preview`
- Backend `package.json`
  - `start`, `dev`, `seed`, `test*`

## Dipendenze principali
- Frontend
  - UI/UX: `@radix-ui/*`, `lucide-react`, `tailwindcss`, `shadcn`, `react-day-picker`, `react-big-calendar`, `recharts`
  - Stato/Dati: `@tanstack/react-query`, `react-hook-form`, `zod`
  - Util: `clsx`, `class-variance-authority`, `date-fns`, `moment`
  - Build: `vite`, `@vitejs/plugin-react`, ESLint 9
- Backend
  - Server: `express@^5`, `cors`, `helmet`, `morgan`, `express-rate-limit`
  - DB: `mongoose@^8`, `mongoose-paginate-v2`
  - Auth: `jsonwebtoken`, `bcryptjs`
  - Jobs: `agenda`, `node-cron`
  - Uploads: `multer`
  - Utils: `uuid`, `dotenv`

## Variabili d’ambiente (rilevate nel codice)
- Comuni
  - `NODE_ENV`
- Backend
  - `PORT` (default 3001)
  - `FRONTEND_URL` (CORS allowlist)
  - `JWT_SECRET` (fallback "your-secret-key")
  - `JWT_EXPIRE` (default 30d)
  - `MONGODB_URI` (default `mongodb://localhost:27017/sports-bar` o `sports_db` in script)
  - `USE_MOCK_API` (controlla mock per Sportmonks e seed)
  - `SPORTMONKS_API_TOKEN` (token provider esterno)
  - `PROVIDER` (default `sportmonks`)
- Frontend
  - Usa `process.env.NODE_ENV` in `vite.config.js` e componenti per gating dev/prod
  - Nessun `manifest.json`/`service worker` rilevato

## PWA/Manifest/Service Worker
- Nessun file manifest o service worker presente in `frontend/public/` o altrove.
- Favicon: `vite.svg`.

## Feature flag / build-time define
- `vite.config.js`
  - `define.__DEV__` e `define.__PERFORMANCE_MONITORING__` derivati da `NODE_ENV`
  - Minify con `terser`, chunking rollup avanzato, alias `@ → ./src`
  - Proxy `/api → :3001`
- Frontend componenti:
  - Render condizionale su `process.env.NODE_ENV` (es. `UpcomingMatches.tsx` debug blocchi)

## Networking
- Frontend → Backend: tutte le chiamate passano via `/api` (proxy Vite in dev)
- Backend CORS: consente `FRONTEND_URL` o `http://localhost:5173` e `:5174`

## Testing
- Root: `test_*` script orchestrati ma non configurati in dettaglio
- Backend: `jest` presente
- Frontend: nessun test runner configurato esplicitamente oltre a `eslint`

## Docker
- `docker-compose.dev.yml` presente (dettagli non analizzati in questa fase)
- Script per prod referenzia `docker-compose.prod.yml` non presente

## Requisiti runtime
- Node >= 18, npm >= 9 (enforced a root)
- MongoDB locale default se `MONGODB_URI` non impostata

## Note per migrazione
- Contratti REST su `/api/*` (Express 5) con multi-tenant middleware; Sportmonks come provider esterno.
- Vincolo HARD: non alterare URL/shape.
- Assenza PWA semplifica migrazione: nessuna logica SW da mappare.


