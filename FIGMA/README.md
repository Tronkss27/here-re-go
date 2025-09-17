# FIGMA — Hand‑off e Ricostruzione UI

- Fonte UI: "Here‑we‑go" (Figma)
- Link progetto: https://www.figma.com/design/3eI8xnwAkC3tlE4rbQPhdK/Here-we-go?node-id=0-1&t=9rXwVs8macKuPwno-1
- Dev Mode: https://www.figma.com/design/3eI8xnwAkC3tlE4rbQPhdK/Here-we-go?node-id=0-1&m=dev&t=9rXwVs8macKuPwno-1

Contenuti di questa cartella:
- `tokens.json` — elenco dei design token (colori, tipografia, spaziature, radius, ombre). Valori iniziali da validare con Figma Dev Mode.
- `components.md` — inventario dei componenti/varianti dedotti dagli screenshot e dal file Figma.
- `screens/` — scomposizione gerarchica delle schermate con blocchi/section e note di comportamento.

Note operative:
- I token sono normalizzati (nomi coerenti). I valori verranno "agganciati" ai valori reali estratti dal file Figma in Dev Mode.
- L'obiettivo è fedeltà visiva mobile‑first e riuso in Flutter (Material 3) e Web.
