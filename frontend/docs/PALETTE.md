# 🎨 SPOrTS Design System - Palette Guide

## Overview

La nuova palette SPOrTS utilizza un sistema di token semantici basato su HSL, con supporto completo per light/dark mode e integrazione Tailwind CSS.

### Principi Chiave
- **Semantica**: colori definiti per funzione, non per aspetto
- **Accessibilità**: contrasto WCAG 2.1 AA verificato automaticamente  
- **Consistenza**: un unico source of truth per tutti i colori
- **Manutenibilità**: modifiche centralized in `design-tokens.css`

---

## 🎯 Token Principali

### Primary Colors (Brand Green)
```css
--primary: 142 76% 36%;           /* #2ba84a - Verde principale */
--primary-foreground: 210 40% 98%; /* Testo su primary */
--primary-dark: 142 69% 28%;      /* #248232 - Verde scuro */
--primary-light: 142 84% 44%;     /* #34c759 - Verde chiaro */
```

### Background & Foreground
```css
--background: 0 0% 100%;          /* Bianco */
--foreground: 222.2 84% 4.9%;     /* Testo scuro principale */
--card: 0 0% 100%;                /* Sfondo card */
--card-foreground: 222.2 84% 4.9%; /* Testo su card */
```

### Secondary & Muted
```css
--secondary: 210 40% 96%;         /* Grigio chiaro */
--secondary-foreground: 222.2 84% 4.9%; /* Testo su secondary */
--muted: 210 40% 96%;             /* Sfondo sottile */
--muted-foreground: 215.4 16.3% 46.9%; /* Testo secondario */
```

### Interactive Elements
```css
--border: 214.3 31.8% 91.4%;     /* Bordi */
--input: 214.3 31.8% 91.4%;      /* Input fields */
--ring: 142 76% 36%;              /* Focus ring */
--destructive: 0 84% 60%;         /* Errori */
```

---

## 🌙 Dark Mode

Dark mode automatico quando la classe `.dark` è presente sul `<html>`:

```css
.dark {
  --background: 222.2 84% 4.9%;     /* Sfondo scuro */
  --foreground: 210 40% 98%;        /* Testo chiaro */
  --secondary: 217.2 32.6% 17.5%;   /* Grigio scuro */
  /* ... altri token override */
}
```

---

## 🎨 Utilizzo in Tailwind

### Colori Base
```jsx
// Background e testo
<div className="bg-background text-foreground">
<div className="bg-card text-card-foreground">

// Primary brand colors  
<button className="bg-primary text-primary-foreground">
<span className="text-primary">
<div className="border-primary">

// States e varianti
<div className="bg-secondary text-secondary-foreground">
<p className="text-muted-foreground">
<button className="bg-destructive text-destructive-foreground">
```

### Opacità (RGB Support)
```jsx
// Background con trasparenza
<div className="bg-primary/20">        {/* 20% opacity */}
<div className="bg-destructive/10">    {/* 10% opacity */}
<div className="border-primary/50">    {/* 50% opacity */}

// Variabili RGB custom
<div style={{backgroundColor: 'rgb(var(--primary-rgb) / 0.3)'}}>
```

### Focus States
```jsx
// Focus ring automatico
<input className="focus:ring-2 focus:ring-ring focus:ring-offset-2">

// Custom focus con classe
<button className="focus-primary">  {/* usa --ring color */}
```

---

## 🛠️ CSS Custom Classes

### Gradient Backgrounds
```jsx
<div className="bg-gradient-primary">      {/* Primary → Primary Dark */}
<div className="bg-gradient-primary-soft"> {/* Secondary → Muted */}
```

### Shadows
```jsx
<div className="shadow-sports">        {/* Primary colored shadow */}
<div className="shadow-soft-primary">  {/* Subtle primary shadow */}
```

### Text Effects
```jsx
<h1 className="text-gradient-primary">  {/* Gradient text */}
<span className="score-display">        {/* Sports score styling */}
```

### Scrollbars
```jsx
<div className="scrollbar-primary">     {/* Primary colored scrollbar */}
```

---

## ⚙️ Strumenti di Sviluppo

### Contrast Checker
```bash
# Verifica automatica contrasto WCAG 2.1
node frontend/scripts/contrast-check.js

# Output: 7/12 test superati
# Evidenzia problemi di accessibilità
```

### Build & Test
```bash
# Build CSS con nuovi token
npm run build:css

# Test in development
npm run dev

# Lighthouse accessibility audit
npm run lighthouse:a11y
```

---

## 📋 Best Practices

### ✅ DO: Usa Token Semantici
```jsx
// ✅ Corretto - semantico
<button className="bg-primary text-primary-foreground">
<div className="border-border bg-card">

// ✅ Corretto - con opacità
<div className="bg-primary/10 border-primary/20">
```

### ❌ DON'T: Hardcode Colors
```jsx
// ❌ Evita - hardcoded
<div className="bg-green-500 text-white">
<button style={{backgroundColor: '#2ba84a'}}>

// ❌ Evita - colori specifici di framework
<div className="bg-emerald-600 text-emerald-50">
```

### 🎯 Patterns Raccomandati

#### Card Components
```jsx
<div className="bg-card text-card-foreground border border-border rounded-lg shadow-sm">
  <h3 className="text-foreground">Titolo</h3>
  <p className="text-muted-foreground">Descrizione</p>
  <button className="bg-primary text-primary-foreground">Azione</button>
</div>
```

#### Form Elements
```jsx
<input 
  className="bg-background border-input text-foreground 
             focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2" 
/>
<label className="text-foreground text-sm font-medium">
<span className="text-destructive text-xs">Errore</span>
```

#### Navigation
```jsx
<nav className="bg-background border-b border-border">
  <a className="text-foreground hover:text-primary">Link</a>
  <a className="text-muted-foreground hover:text-foreground">Link Secondario</a>
</nav>
```

---

## 🚨 Accessibilità & Compliance

### Contrasto Verificato
- ✅ `foreground/background`: 17.85:1 (excellent)
- ✅ `primary-dark/background`: 4.87:1 (pass)
- ❌ `primary/background`: 3.09:1 (fail - fix needed)

### Raccomandazioni
1. **Per testi su sfondo bianco**: usa `primary-dark` invece di `primary`
2. **Per sfondi primary**: garantire testo bianco o `primary-foreground`
3. **Per elementi decorativi**: ok usare `primary` o `primary-light`

### WCAG 2.1 Targets
- **AA Normal Text**: 4.5:1 minimum
- **AA Large Text**: 3:1 minimum  
- **Focus Indicators**: 3:1 minimum

---

## 🔄 Migration da Vecchia Palette

### Step 1: Sostituzioni Dirette
```bash
# Cerca e sostituisci gradualmente
grep -r "#f97316" src/        # Old orange → --primary
grep -r "bg-orange-" src/     # bg-orange-500 → bg-primary
grep -r "text-pink-" src/     # text-pink-600 → text-primary
```

### Step 2: Componenti Critici
1. **Button components**: verifica variant mappings
2. **Form controls**: aggiorna focus states  
3. **Cards**: usa `bg-card` invece di `bg-white`
4. **Navigation**: applica semantic tokens

### Step 3: Testing
1. Run contrast checker dopo ogni modifica
2. Test dark/light mode switching
3. Verify responsive behavior mantiene colori
4. Cross-browser testing specialmente Safari/iOS

---

## 📞 Support

### Issues Comuni

**Q: I colori non cambiano dopo modifica dei token**  
A: Rebuild CSS con `npm run build:css` e refresh browser

**Q: Dark mode non funziona**  
A: Verifica che `<html>` abbia classe `.dark` e token CSS siano caricati

**Q: Contrasto insufficiente**  
A: Run `node frontend/scripts/contrast-check.js` e usa varianti scure/chiare

**Q: Tailwind non riconosce i colori custom**  
A: Verifica che `tailwind.config.js` mappi correttamente i CSS variables

---

*Per domande o suggerimenti sulla palette, consulta il team design o apri una issue.*

