# 🧪 TEST MANUALE WORKFLOW CLIENTE-VENUE

## ✅ PROBLEMI RISOLTI

1. **Errore di sintassi venueService.js** - RISOLTO ✅
   - Corretto sintassi arrow function in oggetti
   - Frontend admin ora si carica correttamente

2. **TenantQuery.populate() error** - RISOLTO ✅  
   - Modificato venueController.js per usare populate correttamente

## 🎯 WORKFLOW DA TESTARE

### STEP 1: Verifica Frontend
```bash
# Controlla che il frontend sia attivo
curl http://localhost:5173

# Controlla che l'admin si carichi
curl http://localhost:5173/admin
```

### STEP 2: Verifica Backend  
```bash
# Controlla salute backend
curl http://localhost:3001/api/health

# Testa endpoint venue search (pubblico)
curl "http://localhost:3001/api/venues/search?matchId=match-0"
```

### STEP 3: Test Admin Onboarding (Browser)
1. Vai su `http://localhost:5173/admin`
2. Fai login/registrazione come admin
3. Completa onboarding venue con dati reali:
   - Nome: "Nick Sports Bar Test"
   - Indirizzo: "Via Test 123, Milano"
   - Telefono: "3331234567" (formato semplice)
   - Email: valida
4. Verifica che il venue venga salvato

### STEP 4: Test Ricerca Cliente (Browser)
1. Vai su `http://localhost:5173`
2. Clicca "Trova locali" su una partita
3. Verifica che NON reindirizza al login
4. Controlla che appaia il venue creato

### STEP 5: Test Prenotazione Cliente (Browser)
1. Clicca su un venue dalla ricerca
2. Clicca "Prenota tavolo"
3. Compila form prenotazione:
   - Nome: "Mario Rossi"
   - Email: "mario@email.com"
   - Telefono: "3339876543"
   - Data futura: "2025-06-25"
   - Orario: "20:00-22:00"
   - Persone: 4
4. Invia prenotazione
5. Verifica conferma

### STEP 6: Verifica Admin (Browser)
1. Torna su `http://localhost:5173/admin`
2. Vai su sezione prenotazioni
3. Verifica che la prenotazione appaia

## 🚨 PROBLEMI NOTI DA RISOLVERE

1. **Venue creation API error 500**
   - Problema nel backend con validazione venue
   - Da debuggare guardando log backend

2. **Database venue sincronizzazione**
   - Onboarding salva in localStorage
   - API cerca nel database MongoDB
   - Serve collegare i due sistemi

## 📋 PROSSIMI PASSI

1. **Risolvi errore 500 venue creation**
2. **Implementa sincronizzazione localStorage → MongoDB**
3. **Testa workflow completo end-to-end**
4. **Verifica multi-tenancy funzioni correttamente**

## 🔧 COMANDI UTILI

```bash
# Restart servizi
cd backend && npm start
cd frontend && npm run dev

# Check logs backend
tail -f backend/logs/app.log

# Test API diretti
curl -X POST http://localhost:3001/api/venues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Test","contact":{"email":"test@test.com","phone":"3331234567"}}'
```

## ✨ RISULTATO ATTESO

Al completamento del test, dovresti avere:
- ✅ Admin può creare venue via onboarding
- ✅ Venue appare nella ricerca clienti  
- ✅ Cliente può prenotare senza registrazione
- ✅ Admin vede prenotazioni nel pannello
- ✅ Sistema multi-tenant funziona
- ✅ Nessun redirect indesiderato al login 