# CLEANUP REPORT

Obiettivo: repo pulito con solo codice funzionale e documentazione utile.

## Frontend: file rimossi
- `src/pages/admin/AdminMock.jsx`
- `src/pages/admin/StatisticheMock.jsx`
- `src/pages/admin/RecensioniMock.jsx`
- `src/pages/LayoutMock.tsx`
- `src/pages/ComponentDemo.jsx`
- `src/pages/SportsLogin_old.jsx`
- `src/pages/admin/AdminLayout_old.tsx`
- `src/pages/Register.jsx.bak`
- `src/pages/AuthTest.jsx`
- `src/pages/TestHome.tsx`

## Router aggiornato
- Rimosse rotte:
  - `/components`
  - `/layout-mock`
  - `/admin-mock`, `/admin/statistiche-mock`, `/admin/recensioni-mock`
- Confermate rotte funzionali: public, auth client/sports, profilo, area admin completa.

## Note
- Nessuna modifica ai contratti backend.
- Documentazione aggiornata in `DOCS/*`.

## Test e documenti rimossi (root/backend)
- Rimossi test legacy in root: `test_*.js`, `TESTING_PROTOCOL.md`, `test_manual.md`
- Rimossi test legacy backend: tutti i `backend/test*.js` e `backend/test/unit/*`
- Rimossi: `TESTS/` (spostato fuori dalla repo pulita); relativi script eliminati da package.json
  
- Documenti root legacy rimossi: AI_START_HERE.md, ANALISI_COMPLETA_SISTEMA.md, Gazzetta_palette.md, GPT5-report-sport-API.md, newpalette.md, PRD_sportmonks_*.md, SEASONID.md, RISOLUZIONE_ERRORI_FRONTEND.md, cursor_from_background_analisi_completa.md, WorkflowUX.md, TestSprite_TestCredentials.md
- Mantenuti: tutto in `docs/` e `DOCS/`

## Rimozioni aggiuntive
- Rimossa intera directory `testsprite_tests/` (piani/casi/artefatti temporanei). Nessuna referenza di codice attiva; rimangono solo citazioni testuali nei commenti CSS e nel file `scripts/prd.txt` che non influiscono sul runtime.
