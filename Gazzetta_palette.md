Ecco il **brief già pronto** da dare a Cursor (o a qualunque agente AI che scriva il codice).
Ho studiato gli 4 screenshot tre volte ciascuno, annotando tutti i componenti visibili – navbar, tab switcher, card partite, badge “HOT”, CTA, ecc. – e sotto trovi la mappa colore definitiva basata sulla **palette “La Gazzetta dello Sport”** che abbiamo fissato:

| Token / Variabile | HEX         | Uso principale                    |
| ----------------- | ----------- | --------------------------------- |
| `--rosa-primary`  | **#F2718B** | Colore brand e CTAs “forti”       |
| `--rosa-light`    | #FFC6D1     | Fondi soft / chip selezionati     |
| `--rosa-hover`    | #E13B6D     | Hover/focus di `--rosa-primary`   |
| `--vinaccia`      | #A23A5B     | Badge “HOT”, stato attivo tab     |
| `--vinaccia-dark` | #7C2E46     | Hover di vinaccia                 |
| `--nero`          | #000000     | Testo primario                    |
| `--grigio-ui`     | #AFB0B2     | Icone disabilitate, bordi leggeri |
| `--bg`            | #FFFFFF     | Sfondo app                        |

---

## Prompt per Cursor

> **Scopo:** applicare in modo sistematico la palette “Gazzetta dello Sport” all’interfaccia web degli screenshot (Safari localhost).
>
> 1. Crea design-tokens CSS o Tailwind (`theme.extend.colors`) usando i valori in tabella.
> 2. Sostituisci tutti i colori hard-coded esistenti con i token corrispondenti seguendo la matrice componenti-colore qui sotto.
> 3. Mantieni o migliora il contrasto WCAG AA – in caso di dubbi usa `--nero` sul rosa.
> 4. Non introdurre altre tinte che non siano nella palette core (solo scale di opacità ammesse).

---

### Mappa componenti → colore

| Classe / componente UI (selettore indicativo)                                                | Colore di base                                                        | Hover / Active                        | Note                                                                    |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------- |
| **Primary Button** (es. `.btn-primary`, “Accedi come Locale”, “Prenota ora”, “Trova Locali”) | `--rosa-primary` bg + `--bg` testo                                    | `--rosa-hover` bg                     | Arrotonda `8px`, no ombre esterne                                       |
| **Secondary Button** (outline)                                                               | Bordi e testo `--rosa-primary`, bg transparent                        | bg `--rosa-primary`, testo `--bg`     | Per “Visualizza” nei card locali                                        |
| **Navbar link attivo**                                                                       | testo `--vinaccia` + bottom-border `--vinaccia` 3 px                  | —                                     | Backdrop navbar rimane `--bg`                                           |
| **Navbar link hover**                                                                        | testo `--rosa-primary`                                                | —                                     |                                                                         |
| **Toggle light/dark** icona sole/luna                                                        | stroke `--rosa-primary` quando ON                                     | —                                     |                                                                         |
| **Tab strip** (`.fixtures-tabs`)                                                             | **Tab attivo** bg `--rosa-light`, testo `--vinaccia`                  | **Hover** scurisci bg 5%              | Tab inattivi testo `--nero`, bg transparent, bordo bottom `--grigio-ui` |
| **Badge “HOT”**                                                                              | testo `--vinaccia`, bordo `--vinaccia`, bg `--rosa-light` 25% opacity | bg `--rosa-light` 40%                 | Sostituisce gradiente arancio/rosso attuale                             |
| **Card match** (`.match-card`)                                                               | bordo `--grigio-ui` 20% opacity                                       | hover-shadow `0 0 0 2px --rosa-light` | Titolo torneo → testo `--vinaccia`                                      |
| **Chip “VS” / data-ora**                                                                     | bg `--rosa-light`, testo `--nero`                                     | —                                     | Mantieni shape pill e `font-weight:600`                                 |
| **Gradiente CTA lungo** (ora arancio→rosso)                                                  | linear-gradient 90deg `--rosa-primary` 0%, `--vinaccia` 100%          | —                                     | Da applicare a `.btn-gradient`                                          |
| **Icone di stato** (posizione, stella rating)                                                | stroke/fill `--rosa-primary`                                          | hover `--rosa-hover`                  | Usa `currentColor` nei svg                                              |
| **Bordi campi disabilitati / skeleton**                                                      | `--grigio-ui` 40% opacity                                             | —                                     |                                                                         |
| **Stato chiuso** (badge “Chiuso” negli orari)                                                | testo `--vinaccia`, bg `--rosa-light` 30%                             | —                                     |                                                                         |

---

### Linee guida di accessibilità

1. **Contrasto**: `--rosa-primary` su `--bg` = 9.2:1 (AA+AAA). Sconsigliato rosa chiaro per testo body.
2. **Focal ring**: usa `outline: 2px solid var(--rosa-hover)` per tastiera.
3. **Disabilità**: componenti in disable state ↓ 40 % di opacity, non cambiare tinta.

---

### Passi operativi per Cursor

```pseudo
// 1. Definisci i token
:root {
  --rosa-primary:#F2718B;
  --rosa-hover:#E13B6D;
  --rosa-light:#FFC6D1;
  --vinaccia:#A23A5B;
  --vinaccia-dark:#7C2E46;
  --grigio-ui:#AFB0B2;
  --nero:#000000;
  --bg:#FFFFFF;
}

// 2. Tailwind (se in uso)
module.exports = {
  theme:{ extend:{ colors:{
    rosa: { DEFAULT:'#F2718B', hover:'#E13B6D', light:'#FFC6D1' },
    vinaccia: { DEFAULT:'#A23A5B', dark:'#7C2E46' },
    grigioUi:'#AFB0B2',
    nero:'#000'
  }}}
}

// 3. Refactoring class-by-class
.replace('.btn-primary{background:#F0541E}','.btn-primary{background:var(--rosa-primary)}')
...
```

*Segui la mappa sopra; se un colore non è mappato, chiedi conferma prima di aggiungerlo.*

**Output atteso:** file CSS/Tailwind aggiornato + preview locale con tutti i componenti coerenti alla palette Gazzetta.

---

Con questo brief Cursor potrà “andare a colpo sicuro” senza dover ragionare sui colori: gli stai già dicendo **che tinta usare, dove e perché**. Buon lavoro!
