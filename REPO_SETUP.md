# REPO SETUP

## Inizializzazione nuovo repository GitHub

```bash
# dentro la root del progetto migrato
git init
git add .
git commit -m "chore: initial migration scaffold (flutter + docs + tests)"
git branch -M main
git remote add origin git@github.com:<org>/<repo>.git
git push -u origin main
git tag v0.1-flutter-scaffold
git push origin v0.1-flutter-scaffold
```

## Protezioni branch (suggerite)
- Proteggi `main` (review obbligatoria, CI verde, status checks)
- Richiedi PR con almeno 1 review
- Blocca push forzati su `main`

## Azioni locali utili
- Verifica contratto e test rapidi:
  - `npm run contracts:validate`
  - `npm run tests:api-parity`
- Lint/format check: `npm run check`
