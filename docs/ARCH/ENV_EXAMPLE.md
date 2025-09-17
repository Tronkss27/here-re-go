## Esempio .env (copia/incolla e rinomina in .env)

```bash
# Server
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5174

# Database
MONGODB_URI=mongodb://localhost:27017/sports-bar

# Auth (JWT)
JWT_SECRET=change-me-super-secret
JWT_EXPIRE=30d

# Providers & Integrations
PROVIDER=sportmonks
SPORTMONKS_API_TOKEN=your-sportmonks-token
USE_MOCK_API=false
```

### Note
- **FRONTEND_URL**: usato per CORS allowlist in `backend/src/app.js`
- **MONGODB_URI**: connessione; in dev default locale
- **JWT_SECRET/EXPIRE**: firma/verifica token in Auth
- **PROVIDER / SPORTMONKS_API_TOKEN / USE_MOCK_API**: servizi fixtures e sync


