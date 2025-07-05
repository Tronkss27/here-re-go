# PROMPT AVANZATO UI/UX - FORM CREAZIONE ANNUNCIO PARTITA

## 🎯 CONTESTO PROGETTO

**Progetto**: SPOrTS - Piattaforma di venue management per locali sportivi
**Componente**: Form creazione annuncio partita 
**Utente Target**: Proprietari/gestori di bar/pub sportivi
**Obiettivo**: Permettere ai venue di pubblicizzare partite per attrarre clienti

## 📋 BRIEFING DESIGN SYSTEM

### **Colori Brand (Fanzo)**:
- **Primary**: `fanzo-dark` (nero profondo)
- **Secondary**: `fanzo-yellow` (#FFD700 - giallo vivace)
- **Accent**: `fanzo-teal` (#20B2AA - teal)
- **Gray**: `fanzo-gray` (grigio neutro)

### **Typography**:
- **Headers**: `font-racing` (bold, maiuscolo, sportivo)
- **Body**: `font-kanit` (moderno, leggibile)

### **Componenti Esistenti**:
- Card, Button, Input, Badge (Shadcn/UI)
- Icone Lucide React
- Layout responsive con Tailwind CSS

## 🎨 PROMPT TECNICO AVANZATO

Tu sei un **Senior UX/UI Designer specializzato in applicazioni sportive** con 10+ anni di esperienza. Ti è stato assegnato il task di ottimizzare il form di creazione annuncio partita per SPOrTS.

### **ANALISI EURISTICA ATTUALE**

Il form esistente presenta questo workflow:
1. **Step Search**: Ricerca partite con filtri per competizione
2. **Step Details**: Configurazione evento (orari, prezzi, descrizione)  
3. **Step Preview**: Anteprima prima della pubblicazione

### **CHALLENGE DESIGN**

**Come possiamo trasformare questo form in un'esperienza fluida, intuitiva e coinvolgente che:**

1. **Riduci il cognitive load** del proprietario del locale?
2. **Massimizzi la completion rate** del processo di creazione?
3. **Aumenti la qualità degli annunci** pubblicati?
4. **Rifletta l'energia e l'emozione** del mondo sportivo?

### **TECNICHE AVANZATE DA APPLICARE**

#### 🧠 **Psicologia UX**
- **Progressive Disclosure**: Rivela informazioni gradualmente
- **Peak-End Rule**: Ottimizza momenti chiave e finale dell'esperienza
- **Von Restorff Effect**: Evidenzia elementi importanti con contrasto
- **Fitts' Law**: Ottimizza dimensioni e posizionamento elementi interattivi

#### 🎯 **Microinterazioni**
- **Hover States**: Feedback visivo immediato
- **Loading States**: Indicatori di progresso durante API calls
- **Success Animations**: Celebrazioni per completion
- **Transition Timing**: Easing naturale tra step

#### 🎨 **Visual Hierarchy**
- **Z-Pattern Layout**: Guida l'occhio nel flusso naturale
- **Color Psychology**: Usa giallo per azioni positive, teal per informazioni
- **Typography Scale**: Hierarchy chiara con dimensioni progressive
- **White Space**: Respiro visivo per ridurre overwhelm

#### 📱 **Responsive Excellence**
- **Mobile-First**: Ottimizza per touch e schermi piccoli
- **Progressive Enhancement**: Layer avanzati per desktop
- **Thumb-Friendly**: Zone di interazione ottimali su mobile

### **SPECIFICHE TECNICHE DETTAGLIATE**

#### **Step 1 - Search Experience**
```typescript
// OTTIMIZZAZIONI RICHIESTE:
interface SearchOptimizations {
  // Visual Performance
  searchDebounce: 300ms; // Evita spam requests
  resultsLimit: 6; // Cognitive load ottimale
  loadingStates: true; // Skeleton screens durante fetch
  
  // User Preferences Intelligence
  favoriteCompetitionsFirst: true; // Personalizzazione basata su onboarding
  recentSearches: true; // Memoria delle ricerche recenti
  suggestedMatches: true; // AI-powered suggestions
  
  // Interactive Elements
  competitionTabs: 'horizontal-scroll'; // Mobile-friendly navigation
  matchCards: 'hover-preview'; // Quick preview on hover
  emptyState: 'actionable'; // CTA chiari quando nessun risultato
}
```

#### **Step 2 - Details Configuration**
```typescript
interface DetailsOptimizations {
  // Smart Defaults
  pricePreFill: true; // Basato su venue profile + competition type
  timeAutoCalc: true; // Fine evento automatica (match duration + buffer)
  descriptionTemplates: true; // Suggested copy basato su match + venue
  
  // Input Enhancements
  priceSlider: true; // Visual price selection vs number input
  capacityVisualization: true; // Visual gauge della venue capacity
  promoBuilder: true; // Drag-drop builder per offerte speciali
  
  // Real-time Feedback
  livePreview: true; // Sidebar preview che si aggiorna in tempo reale
  characterCounters: true; // Per description + special offers
  saveProgress: true; // Auto-save draft per recovery
}
```

#### **Step 3 - Preview & Publication**
```typescript
interface PreviewOptimizations {
  // Social Proof Elements
  venueRating: true; // Mostra rating venue se disponibile
  pastEventSuccess: true; // "120 persone hanno partecipato ai tuoi eventi"
  competitionPopularity: true; // "Competizione molto seguita nella tua zona"
  
  // Publication Options
  schedulePublishing: true; // Pubblica a data/ora specifica
  crossPlatformSharing: true; // Share su social durante creation
  notificationSettings: true; // Configura notifications per l'evento
  
  // Confidence Building
  editablePreview: true; // Click-to-edit direttamente nella preview
  publishingChecklist: true; // Validation checklist prima di publish
  estimatedReach: true; // "Questo evento raggiungerà ~150 utenti"
}
```

### **MICROCOPY & MESSAGING**

**Principi di Voice & Tone**:
- **Energetico ma Professionale**: "Pronti a riempire il locale?" 
- **Inclusive**: "La tua community sportiva ti aspetta"
- **Actionable**: "Trasforma questa partita in un evento"
- **Celebrativo**: "🎉 Annuncio pubblicato! I tuoi fan stanno arrivando"

### **ACCESSIBILITÀ & INCLUSIVITÀ**

```typescript
interface A11yRequirements {
  // Keyboard Navigation
  tabOrder: 'logical'; // Tab flow naturale attraverso il form
  escapeToClose: true; // ESC key per chiudere modal
  focusManagement: true; // Focus trap nel modal
  
  // Screen Reader Support
  ariaLabels: 'descriptive'; // Labels contestuali
  liveRegions: true; // Announce dinamicamente gli updates
  roleAttributes: true; // Proper semantic markup
  
  // Visual Accessibility
  colorContrast: 'WCAG-AA'; // Minimum 4.5:1 ratio
  focusIndicators: 'high-contrast'; // Anelli di focus visibili
  textScaling: '200%'; // Supporto zoom fino al 200%
}
```

### **PERFORMANCE & TECHNICAL SPECS**

```typescript
interface PerformanceTargets {
  // Core Web Vitals
  LCP: '<2.5s'; // Largest Contentful Paint
  FID: '<100ms'; // First Input Delay
  CLS: '<0.1'; // Cumulative Layout Shift
  
  // Form-Specific Metrics
  stepTransition: '<200ms'; // Smooth step transitions
  searchResponse: '<500ms'; // Quick search results
  submitToConfirm: '<1s'; // Fast submission feedback
  
  // Bundle Optimization
  codesplitting: true; // Lazy load form components
  imageOptimization: true; // WebP team logos + lazy loading
  caching: 'aggressive'; // Cache competition data
}
```

### **DELIVERABLES RICHIESTI**

1. **Analisi Critica** dell'attuale form con identificazione di 5+ pain points
2. **Wireframes Dettagliati** per ogni step con annotations
3. **Prototype Interattivo** (Figma/code) che dimostra le microinterazioni
4. **Implementazione React** con tutti i miglioramenti UX specificati
5. **Testing Plan** con metriche di successo (completion rate, time-to-complete, user satisfaction)

### **SUCCESS METRICS**

```typescript
interface SuccessKPIs {
  completionRate: '>85%'; // Da current ~60%
  timeToComplete: '<3min'; // Da current ~5min
  returnUsage: '>70%'; // Venue che creano 2+ annunci
  userSatisfaction: '>4.5/5'; // Post-task satisfaction survey
  qualityScore: '>80%'; // Annunci con description + special offers completi
}
```

### **PROMPT FINALE**

Progetta e implementa una versione rivoluzionaria di questo form che non solo soddisfi tutti i requirements tecnici, ma che trasformi la creazione di un annuncio partita in un momento di **anticipazione ed eccitazione** per il proprietario del locale.

Il form deve far sentire l'utente come se stesse organizzando l'evento sportivo dell'anno, non semplicemente compilando un modulo.

**Ricorda**: Ogni pixel, ogni transizione, ogni parola deve servire l'obiettivo finale: **riempire il locale durante la partita**.

---

**Bonus Challenge**: Come incorporeresti elementi di **gamification** per incentivare la creazione di annunci di alta qualità? (badges, progressi, leaderboard venue, etc.) 