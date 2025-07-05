# 🧹 SCRIPT PULIZIA DATI MOCK

## Per testare il sistema con dati freschi, esegui questo script in console browser:

```javascript
// Pulisci tutti i dati di test/mock dal localStorage
function cleanupMockData() {
  console.log('🧹 Pulizia dati mock in corso...');
  
  // Lista delle chiavi da rimuovere
  const keysToRemove = [];
  
  // Trova tutte le chiavi del localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      keysToRemove.push(key);
    }
  }
  
  // Rimuovi tutte le chiavi (reset completo)
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`❌ Rimossa chiave: ${key}`);
  });
  
  console.log('✅ Pulizia completata! Ricarica la pagina.');
  console.log('🚀 Ora puoi registrare un nuovo utente con dati freschi.');
}

// Esegui la pulizia
cleanupMockData();
```

## Come usare:

1. **Apri Console Browser** (F12 → Console)
2. **Copia e incolla** il codice sopra
3. **Premi INVIO**
4. **Ricarica la pagina** (F5)
5. **Registra nuovo utente** per testare il flusso completo

## Cosa rimuove:

- ✅ Tutti i dati utente nel localStorage
- ✅ Profili venue mock
- ✅ Statistiche hardcoded
- ✅ Flag di onboarding completato
- ✅ Account data mock
- ✅ Qualsiasi altro dato di test

## Risultato:

Dopo la pulizia avrai un ambiente completamente pulito per testare:

1. **Registrazione** → `/admin/onboarding` 
2. **Onboarding completo** → Dashboard con dati veri
3. **Nessun loop infinito** al refresh
4. **Header corretto** con nome venue dall'onboarding
5. **Statistiche reali** (0 inizialmente)
6. **Nessuna recensione mock** 