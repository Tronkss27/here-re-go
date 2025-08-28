Perfetto. Di seguito trovi un PRD iper-specifico per integrare in modo coerente e scalabile la palette aggiornata ovunque nell’app, con gerarchie, HSL, stati, componenti chiave, gradienti e linee guida di accessibilità e dark mode.

Prodotto: Sistema di colori BARMATCH (HSL-first) per tutta l’app

1) Obiettivi
- Unificare l’uso dei colori su tutte le pagine e componenti, eliminando utilizzi diretti di grigi/bianco/nero di Tailwind non semantici.
- Esporre un set di token CSS (HSL) chiaro e gerarchico, mappato a Tailwind, con varianti light/dark, foreground e focus ring.
- Rendere il verde il colore di default per le azioni principali e la brand identity (primary) e il verde scuro come supporto (secondary).
- Fornire specifiche per bottoni, testi, superfici (surface), bordi, interazioni (hover/focus/disabled), gradienti, overlay, e grafici.
- Garantire contrasti AA/AAA.

2) Palette di riferimento (brand)
- Brand palette (hex):
  - #040f0f — “Ink” scurissimo (green-black)
  - #248232 — Verde scuro (secondary)
  - #2ba84a — Verde brillante (primary)
  - #2d3a3a — Verde grigio (muted)
  - #fcfffc — Bianco caldo (off white)
- HSL standardizzati (usati come singola fonte di verità):
  - #040f0f → hsl(180 58% 6%)
  - #248232 → hsl(134 56% 33%)
  - #2ba84a → hsl(134 59% 41%)
  - #2d3a3a → hsl(180 13% 20%)
  - #fcfffc → hsl(120 100% 99%)

3) Token CSS (HSL) e mappatura semantica
Definizione in :root (light) e .dark:

Base (light)
- --background: 120 100% 99%   (surface globale chiara)
- --foreground: 180 58% 6%     (testi principali)
- --card: 120 100% 99%
- --card-foreground: 180 58% 6%
- --popover: 120 100% 99%
- --popover-foreground: 180 58% 6%
- --primary: 134 59% 41%       (verde brillante, azioni principali)
- --primary-foreground: 120 100% 99% (testo su primary)
- --secondary: 134 56% 33%     (verde scuro, azioni secondarie/sfondi accent)
- --secondary-foreground: 120 100% 99%
- --muted: 180 13% 20%         (bordi, separatori, superfici “muted” in dark, testo attenuato in overlays)
- --muted-foreground: 120 100% 99% (solo su sfondi muted scuri)
- --accent: 134 59% 41%        (alias di primary per CTA/elementi decorativi)
- --accent-foreground: 120 100% 99%
- --destructive: 0 84% 60%     (errore/sistema, non brand)
- --destructive-foreground: 120 100% 99%
- --border: 180 13% 20%        (bordi light)
- --input: 180 13% 20%
- --ring: 134 59% 41%          (focus ring = primary)
- --radius: 0.5rem

Sidebar (light)
- --sidebar-background: 120 100% 99%
- --sidebar-foreground: 180 58% 6%
- --sidebar-primary: 134 59% 41%
- --sidebar-primary-foreground: 120 100% 99%
- --sidebar-accent: 180 13% 20%
- --sidebar-accent-foreground: 120 100% 99%
- --sidebar-border: 180 13% 20%
- --sidebar-ring: 134 59% 41%

Base (dark)
- --background: 180 58% 6%
- --foreground: 120 100% 99%
- --card: 180 13% 20%
- --card-foreground: 120 100% 99%
- --popover: 180 58% 6%
- --popover-foreground: 120 100% 99%
- --primary: 134 59% 41%       (stesso hue/sat, funziona anche in dark)
- --primary-foreground: 180 58% 6%
- --secondary: 134 56% 38%     (leggermente più chiaro in dark per contrasto)
- --secondary-foreground: 120 100% 99%
- --muted: 180 13% 15%
- --muted-foreground: 120 100% 80%
- --accent: 134 59% 45%
- --accent-foreground: 180 58% 6%
- --destructive: 0 62% 50%
- --destructive-foreground: 120 100% 99%
- --border: 180 13% 25%
- --input: 180 13% 20%
- --ring: 134 59% 41%

Sidebar (dark)
- --sidebar-background: 180 58% 6%
- --sidebar-foreground: 120 100% 99%
- --sidebar-primary: 134 59% 41%
- --sidebar-primary-foreground: 180 58% 6%
- --sidebar-accent: 180 13% 20%
- --sidebar-accent-foreground: 120 100% 99%
- --sidebar-border: 180 13% 25%
- --sidebar-ring: 134 59% 41%

Alpha e overlay (comuni)
- Overlay forti: usare hsl(var(--background) / 0.8) o hsl(var(--foreground) / 0.8) a seconda del contesto.
- Effetti hover con trasparenza: preferire hover:bg-primary/90, hover:bg-secondary/90.
- Pseudo-elevazioni: ombre leggere + bordi usando --border.

4) Mappatura Tailwind
- Tailwind theme colors mappati a HSL vars:
  - bg-background → hsl(var(--background))
  - text-foreground → hsl(var(--foreground))
  - bg-card, text-card-foreground
  - bg-popover, text-popover-foreground
  - bg-primary, text-primary-foreground
  - bg-secondary, text-secondary-foreground
  - bg-accent, text-accent-foreground
  - border, ring, input, muted (se esistono utilities shadcn)
- Evitare classi grezze Tailwind come bg-white, text-black, text-gray-600, border-gray-200. Sostituirle con:
  - bg-white → bg-card o bg-background a seconda del layer
  - text-black/gray-900 → text-foreground
  - text-gray-600/700 → text-muted-foreground (se serve testo attenuato) o text-foreground con opacity
  - border-gray-100/200 → border-border
  - bg-gray-100 → bg-accent/10 o bg-card con border

5) Gerarchie di colore per UI
- Action hierarchy:
  - Primary action: bg-primary text-primary-foreground; hover:bg-primary/90; focus:ring-ring
  - Secondary action: bg-secondary text-secondary-foreground; hover:bg-secondary/90
  - Tertiary/ghost: hover:bg-accent hover:text-accent-foreground; testo neutro di base
  - Outline: border-input bg-background; hover:bg-accent hover:text-accent-foreground
- Informational hierarchy:
  - Titoli/heading: text-foreground
  - Testo secondario: text-foreground/80 o text-muted-foreground (in dark)
  - Metadati/didascalie: text-foreground/60
- Surface hierarchy:
  - Background di pagina: bg-background
  - Card/panel: bg-card border-border
  - Popover/dropdown: bg-popover border-border
  - Sidebar: usare i token sidebar-*
- Stato dei controlli:
  - Focus: focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
  - Disabled: disabled:opacity-50 disabled:pointer-events-none
  - Destructive: bg-destructive text-destructive-foreground hover:bg-destructive/90

6) Bottoni (componenti)
- Button default (già in codice shadcn): variant default usa primary; secondary → bg-secondary; outline → border-input bg-background, hover:bg-accent; ghost → hover:bg-accent; link → text-primary.
- Dimensioni: sm, default, lg, icon, invariato.
- Icone dentro bottoni: rispettare [&_svg]:size-4, non sovrascrivere con colori hardcoded; ereditano il colore del testo.

Esempi d’uso coerenti
- CTA principale: className="bg-primary text-primary-foreground hover:bg-primary/90"
- Bottone filtro neutro: className="border border-input bg-background hover:bg-accent hover:text-accent-foreground"
- Icon button: variant="ghost" con hover:bg-accent

7) Form, input e focus
- Input: border-input bg-background text-foreground placeholder:text-foreground/50 focus:ring-ring
- Checkbox/switch/radio: accent-color via primary; focus con ring-ring
- Errori form: border-destructive, text-destructive; helper text con text-foreground/70

8) Liste, tabelle, separatori
- Border: border-border
- Header tabelle: text-foreground, bg-card
- Righe alternate: usare bg-accent/5
- Separatori: bg-border

9) Testi e tipografia
- h1–h6: color: text-foreground
- Body copy: text-foreground
- Testo attenuato: text-foreground/80 o text-muted-foreground (in dark oppure su superfici scure)
- Link: text-primary underline-offset-4 hover:underline; su sfondi scuri usare text-primary/90 se necessario

10) Gradienti e overlay
- Gradiente brand (CTA/Hero):
  - from-[hsl(var(--secondary))] to-[hsl(var(--primary))] via Tailwind: bg-gradient-to-r from-[hsl(var(--secondary))] to-[hsl(var(--primary))]
- Overlay su immagini/hero:
  - bg-[linear-gradient(180deg,hsl(var(--background)/0)_0%,hsl(var(--background)/0.6)_60%,hsl(var(--background))_100%)]
- Premium highlights:
  - border con bg-card e ring-ring/40 o un leggero gradient brand 10–20% d’alpha

11) Stato “muted” e contenuti neutrali
- Box informativi neutri, badge “muted”, placeholder:
  - bg-accent/10 o bg-card con border-border
  - Testo: text-foreground/70

12) Dark mode
- Usa le variabili già definite in .dark (vedi sezione 3).
- Non usare text-white/black hardcoded; usa text-foreground.
- Superfici: bg-background, card e popover come definiti sopra.
- Interazioni: edge focus invariato (ring primario), hover con /90.

13) Grafici (Recharts)
- Serie principali: usare scale derivate dal primary in HSL variando la luminosità:
  - Serie A: hsl(var(--primary)) base
  - Serie A toni: hsl(134 59% 35%), hsl(134 59% 45%), hsl(134 59% 55%)
- Linee e griglie: stroke-[hsl(var(--border))] al 40–60%
- Tooltip: bg-popover text-popover-foreground border-border

14) Accessibilità e contrasto
- Testo normale su sfondi: contrasto minimo 4.5:1; grandi 3:1
- Primary/secondary foreground: fissato su bianco caldo in light e su scuro in dark per massimizzare il contrasto
- Contenuti inattivi/disabled: opacità e non solo colore
- Focus visibile sempre: ring-ring al 2px + offset

15) Regole di “Don’t”
- NON usare bg-white, text-black, text-gray-*, border-gray-* direttamente
- NON introdurre nuovi colori brand fuori dalla palette
- NON usare hex/rgba diretti nei componenti; usare sempre token o HSL con var()
- NON cambiare saturazione/luminosità su componenti a mano: usare /90 o i token previsti

16) Linee guida di refactoring
- Sostituzioni tipiche:
  - text-gray-900 → text-foreground
  - text-gray-700/600/500 → text-foreground/80, /70, /60 (oppure text-muted-foreground se su superfici scure)
  - bg-white → bg-card o bg-background in base al livello
  - bg-gray-100 → bg-accent/10 oppure bg-card con border
  - border-gray-100/200 → border-border
  - text-white/black → text-primary-foreground o text-foreground secondo il contesto
- Componenti prioritari da allineare (dove compaiono ancora grigi/bianco):
  - Header, AdminSidebar
  - MatchCard, UpcomingMatches
  - VenueCard, VenueList/Locali, VenueDetail
  - NotFound
  - Hero layouts (input “trasparenti”: uniformare borders e focus)
  - BigMatchLayout4 (rimuovere gradienti grigi hardcoded a favore di brand gradient)
- Verifica dei componenti shadcn (Button, Badge, Input, ecc.) che già leggono i token: allineare i consumer.

17) Esempi di snippet corretti

Card informativa

  Titolo
  Testo descrittivo.

    Azione

Input con focus

Hero con overlay brand-safe

    Trova i big match
    Cerca

Badge “muted”

  Muted

18) QA checklist
- Nessuna occorrenza residua di:
  - bg-white, text-black, text-gray-*, bg-gray-*, border-gray-*
- Contrasto:
  - Primary/secondary foreground ≥ 4.5:1
  - Testo su card/popover ≥ 7:1 quando possibile
- Stati:
  - Tutti i controlli hanno focus ring visibile (ring-ring)
  - Hover coerenti con /90
- Dark mode:
  - Nessun testo scuro su sfondo scuro o viceversa
  - Input/placeholder leggibili
- Pagine chiave:
  - / (home), /locali, /venues (incluse query del tipo ?match=…&date=…&time=…)
  - Dettaglio venue, dashboard utente/admin
- Regressioni:
  - Nessun layout “bianco e nero”
  - Nessun componente con colori incoerenti

19) Accettazione
- Tutte le pagine e componenti usano esclusivamente token HSL via CSS variables/Tailwind (no hardcoded grigi/bianchi/neri).
- Verde brillante (#2ba84a) è il colore primario per CTA, highlight e focus ring.
- Verde scuro (#248232) è secondario per azioni secondarie, chip e accenti di superficie.
- Muted (#2d3a3a) è usato per bordi/separatori/sfondi neutri in dark; in light è principalmente usato per border/input.
- Foreground e background rispettano gli HSL definiti per light/dark.

20) Note per performance e mantenibilità
- Preferire CSS variables + classi Tailwind; evitare inline style per i colori.
- Unica fonte di verità in index.css; Tailwind legge hsl(var(--…)).
- Aggiungere un ESLint rule di progetto (opzionale) per vietare l’uso di text-gray-*, bg-white, ecc., fuori da test/sandbox.

lov-plan
1) Allineare i token in src/index.css confermando i valori HSL riportati (light/dark + sidebar). 
2) Verificare tailwind.config.ts per usare hsl(var(--token)) su tutti i colori semantic shadcn (background, foreground, primary, secondary, accent, muted, border, input, ring, ecc.). 
3) Refactoring sistematico: sostituire in tutto src/ ogni bg-white, text-black, text-gray-*, bg-gray-*, border-gray-* con i token equivalenti descritti in “Sostituzioni tipiche”, partendo da:
   - Header, AdminSidebar
   - MatchCard, UpcomingMatches
   - VenueCard, Locali, VenueDetail
   - NotFound, Hero layouts, BigMatchLayout4
4) Aggiornare eventuali gradienti “grigi” con il brand gradient (secondary → primary) o overlay brand-safe.
5) QA completo su light/dark e percorso /venues?match=… per vedere VenueCard/filters, con checklist accessibilità e regressioni.
6) Documentare brevemente in README le linee guida sopra (estratto essenziale del PRD).

Implement the plan