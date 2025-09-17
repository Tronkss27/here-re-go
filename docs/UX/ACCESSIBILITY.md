### Accessibilità — Linee guida minime

- Etichette e associamenti
  - Labels esplicite per tutti i campi; usare `aria-label` solo quando necessario
  - Descrizioni/Helper text per campi complessi (es. form prenotazione)
- Focus e tastiera
  - Stati di focus visibili su link, bottoni, input (non rimuovere outline senza alternativa)
  - Ordine di tabulazione logico; evitare trappole di focus (modali)
  - Supporto Esc/Enter/Space dove appropriato
- Colori e contrasto
  - Contrasto minimo WCAG AA per testo e elementi interattivi
  - Non basare lo stato solo sul colore (aggiungere icone/testo)
- Touch target e spazio
  - Aree interattive ≥ 44x44 px, padding coerente (mobile‑first)
  - Evitare elementi troppo ravvicinati; margini per prevenire tocchi involontari
- Semantica e ARIA
  - Struttura con semantic HTML (nav/main/header/footer)
  - Ruoli ARIA solo come integrazione; evitare over-ARIA
- Messaggi di errore e stato
  - Errori vicini al campo e riepilogo dove utile; annunciare con `aria-live`
  - Skeleton/loading con annunci ARIA dove serve
- Media e immagini
  - Alt text significativo; decorativi con alt=""
  - Evitare auto-play audio; per video fornire controlli e sottotitoli
- Performance e preferenze
  - Rispetto `prefers-reduced-motion`; evitare animazioni eccessive
- Test
  - Verifica tastiera, screen reader principali, controlli contrasto e zoom 200%


