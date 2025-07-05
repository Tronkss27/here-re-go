# PROTOCOLLO DI TEST - Data Isolation & Onboarding Automatico

## 🎯 OBIETTIVO
Verificare che il sistema sia completamente isolato per tenant e che l'onboarding funzioni automaticamente dopo la registrazione.

## 📋 FLUSSO DI TEST COMPLETO

### STEP 1: Pulizia Iniziale
1. **Apri DevTools** (F12)
2. **Console** → Esegui: `localStorage.clear()`
3. **Chiudi e riapri il browser**

### STEP 2: Registrazione Nuovo Utente
1. **Vai a**: `http://localhost:5175/sports-register`
2. **Compila form**:
   - Nome: "Marco Bianchi"
   - Email: "marco.bianchi@test.com"
   - Password: "password123"
   - Nome Locale: "Test Sport Milano"
   - Indirizzo: "Via Milano 123"
   - Città: "Milano"
   - Telefono: "02-12345678"
   - Tipo: "Sport Bar"
3. **Clicca "Registrati"**

### STEP 3: Verifica Redirect Automatico
**RISULTATO ATTESO**: 
- ✅ Redirect automatico a `/admin/onboarding`
- ✅ **NESSUN redirect alla dashboard**
- ✅ Wizard di onboarding visibile

### STEP 4: Completa Onboarding
1. **Step 1**: Verifica dati pre-compilati
   - Nome: "Test Sport Milano" 
   - Indirizzo: "Via Milano 123"
   - Città: "Milano"
   - Telefono: "02-12345678"
2. **Step 2**: Orari apertura (lascia default o modifica)
3. **Step 3**: Numero schermi (es. 5)
4. **Step 4**: Sport preferiti (seleziona alcuni)
5. **Step 5**: Facilities (seleziona alcuni servizi)
6. **Step 6**: Foto (skip o carica)
7. **Clicca "Completa"**

### STEP 5: Verifica Dashboard
**RISULTATO ATTESO**:
- ✅ Redirect automatico a `/admin`
- ✅ Header: "BENVENUTO, TEST SPORT MILANO!"
- ✅ **NON** "BENVENUTO, !" vuoto

### STEP 6: Verifica Statistiche
**Vai a**: `/admin/statistiche`
**RISULTATO ATTESO**:
- ✅ Pagina si carica completamente (non resta su "Caricamento...")
- ✅ Visualizzazioni: 0
- ✅ Click: 0  
- ✅ Prenotazioni: 0
- ✅ Partite Future: 0
- ✅ Conversion Rate: 0.00%
- ✅ Sezione "Partite Programmate": "Nessuna partita programmata"

### STEP 7: Verifica Offerte
**Vai a**: `/admin/offers`
**RISULTATO ATTESO**:
- ✅ Totale Offerte: 0
- ✅ Offerte Attive: 0
- ✅ Offerte Scadute: 0
- ✅ Conversion Rate: 0.00%

### STEP 8: Verifica Profilo
**Vai a**: `/admin/profilo`
**RISULTATO ATTESO**:
- ✅ Nome: "Test Sport Milano"
- ✅ Indirizzo: "Via Milano 123"
- ✅ Città: "Milano"
- ✅ Telefono: "02-12345678"
- ✅ Schermi: 5 (o valore scelto)
- ✅ **NON** dati di altri utenti

### STEP 9: Verifica Account
**Vai a**: `/admin/account`
**RISULTATO ATTESO**:
- ✅ Email: "marco.bianchi@test.com"
- ✅ Nome: "Marco Bianchi"
- ✅ Telefono: "02-12345678"
- ✅ **NON** dati di altri utenti

### STEP 10: Test Isolamento (Fondamentale)
1. **Logout**
2. **Registra secondo utente**:
   - Nome: "Giulia Rossi"
   - Email: "giulia.rossi@test.com"
   - Password: "password123"
   - Nome Locale: "Bar Roma Centro"
   - Indirizzo: "Via Roma 456"
   - Città: "Roma"
3. **Completa onboarding** con dati diversi
4. **Verifica dashboard**: "BENVENUTO, BAR ROMA CENTRO!"
5. **Verifica TUTTI i dati** sono diversi e isolati

## 🐛 DEBUGGING IN CASO DI ERRORE

### Se Header è vuoto:
**Console Debug**:
```javascript
// Verifica utente
console.log('User:', JSON.parse(localStorage.getItem('user')));

// Verifica profilo
const userId = JSON.parse(localStorage.getItem('user')).id;
console.log('Profile:', localStorage.getItem(`venue_profile_${userId}`));
```

### Se Statistiche non si caricano:
**Console Debug**:
```javascript
// Verifica servizi
import { statisticsService } from '/src/services/venueService.js';
console.log('Stats:', statisticsService.calculateStatistics(userId));
```

### Se dati si mescolano tra utenti:
**Console Debug**:
```javascript
// Lista tutte le chiavi localStorage
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(key, localStorage.getItem(key));
}
```

## ✅ CRITERI DI SUCCESSO

**SUPERATO SE**:
1. ✅ Onboarding automatico dopo registrazione
2. ✅ Header mostra nome venue corretto
3. ✅ Statistiche si caricano con valori 0 per nuovo utente
4. ✅ Profilo e Account mostrano dati dell'utente corrente
5. ✅ **ZERO bleeding** di dati tra utenti diversi
6. ✅ Conversion rate 0.00% per nuovo utente
7. ✅ Tutti i componenti admin funzionano senza errori

**FALLITO SE**:
- ❌ Rimane su dashboard senza onboarding
- ❌ Header vuoto o con nome sbagliato
- ❌ Statistiche non si caricano
- ❌ Dati di un utente appaiono nell'account di un altro
- ❌ Conversion rate hardcoded (5.82%)
- ❌ Componenti si bloccano o crashano

## 🚀 PROSSIMI PASSI DOPO SUCCESSO

1. **Aggiungi alcune partite** nel calendario
2. **Verifica** che le statistiche si aggiornino
3. **Crea alcune offerte**
4. **Verifica** che il conversion rate si calcoli correttamente
5. **Test con più utenti** contemporaneamente

## 📝 NOTE

- Eseguire test su **browser pulito** per risultati affidabili
- Tenere **DevTools aperte** per debug in tempo reale  
- **Documentare errori** con screenshot per troubleshooting
- Test **ripetibile** - deve passare ogni volta 