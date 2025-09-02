# 🎨 SPOrTS Palette QA Checklist

## Controlli Automatici Completati ✅

### 1. Token Integration
- [x] CSS variables HSL aggiunte in `design-tokens.css`
- [x] Tailwind config aggiornato con token semantici  
- [x] Variabili RGB per supporto opacità create
- [x] Colori hardcoded sostituiti nei file CSS globali

### 2. Contrast Check
- [x] Script di verifica contrasto creato (`frontend/scripts/contrast-check.js`)
- [x] Test WCAG 2.1 AA implementati
- [x] Risultati: 7/12 test superati

#### ⚠️ Problemi di Contrasto Rilevati:
1. **Primary su sfondo bianco**: 3.09:1 (richiesto: 4.5:1)
2. **Testo bianco su primary**: 3.09:1 (richiesto: 4.5:1)  
3. **Errori su sfondo**: 3.76:1 (richiesto: 4.5:1)
4. **Testo su errore**: 3.76:1 (richiesto: 4.5:1)
5. **Primary light su bianco**: 2.22:1 (richiesto: 4.5:1)

---

## Controlli Manuali da Eseguire 📋

### 3. Test Visuale Frontend

#### 3.1 Avvio Applicazione
```bash
cd frontend
npm run dev
# Verifica che l'applicazione si avvii senza errori di build
```

#### 3.2 Verifica Pagine Principali
- [ ] **Homepage**: colori applicati correttamente
- [ ] **Login/Register**: form e bottoni usano nuovi token
- [ ] **Dashboard Admin**: layout coerente con palette
- [ ] **Calendario Partite**: elementi visivi aggiornati
- [ ] **Profilo Locale**: card e componenti conformi

#### 3.3 Test Componenti UI
- [ ] **Bottoni**: primary, secondary, destructive
- [ ] **Form Controls**: input, select, checkbox
- [ ] **Cards**: background, border, shadow
- [ ] **Navigation**: header, sidebar, breadcrumb
- [ ] **Modali**: overlay, contenuto, controlli

#### 3.4 Test Dark/Light Mode
- [ ] **Toggle tema**: transizione fluida
- [ ] **Consistenza**: tutti gli elementi rispettano il tema
- [ ] **Leggibilità**: testo visibile in entrambi i temi

### 4. Test Accessibilità

#### 4.1 Navigazione Keyboard
- [ ] **Tab Order**: logico e visibile
- [ ] **Focus Rings**: ring color funzionante (--ring)
- [ ] **Skip Links**: se presenti, funzionanti

#### 4.2 Screen Reader
- [ ] **Contrasto**: colori distinguibili
- [ ] **Semantics**: heading structure mantenuta
- [ ] **ARIA**: label e ruoli preservati

### 5. Test Cross-Browser

#### 5.1 Desktop
- [ ] **Chrome**: tutte le funzionalità
- [ ] **Firefox**: CSS custom properties
- [ ] **Safari**: HSL support corretto
- [ ] **Edge**: compatibilità completa

#### 5.2 Mobile
- [ ] **iOS Safari**: rendering colori
- [ ] **Android Chrome**: performance CSS
- [ ] **Responsive**: layout adattivo

---

## Azioni Correttive Suggerite 🔧

### Per Problemi di Contrasto
1. **Opzione A - Scurire Primary**: 
   - Cambiare `--primary` da `142 76% 36%` a `142 76% 30%`
   - Impatto: verde più scuro, migliore contrasto

2. **Opzione B - Usare Primary Dark per Testi**:
   - Utilizzare `--primary-dark` (142 69% 28%) per testi su bianco
   - Mantenere `--primary` per sfondi con testo bianco

3. **Opzione C - Varianti Semantiche**:
   - Creare `--primary-text` e `--primary-bg` con contrasti ottimali
   - Aggiornare componenti per usare le varianti appropriate

### Per Debugging Rapido
```bash
# Verificare build CSS
npm run build:css

# Test contrasto aggiornato  
node scripts/contrast-check.js

# Lighthouse accessibility audit
npm run lighthouse:a11y
```

---

## Approvazione QA ✍️

### Checklist Completamento
- [ ] Tutti i test visuale superati
- [ ] Problemi di contrasto risolti o documentati
- [ ] Cross-browser testing completato
- [ ] Performance CSS accettabile
- [ ] Accessibilità verificata

### Note QA
```
Data: ___________
Tester: ___________
Browser: ___________
Risoluzione: ___________

Problemi riscontrati:
- 
- 

Raccomandazioni:
- 
- 
```

**Firma QA**: _____________________ **Data**: _____/_____/_____

