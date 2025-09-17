# DOCS Index

- AI_START_HERE.md — punto di ingresso consigliato per AI/Agenti
- INVENTORY.md — inventario progetto
- CONTRACTS_FREEZE.md — contratti API congelati
- ARCH/OVERVIEW.md — panoramica architettura backend
- ARCH/API_CONTRACTS.md — matrice contratti API (estesa)
- ARCH/ENV_EXAMPLE.md — variabili d’ambiente esempio backend
- UX_MAP.md — mappa schermate e flussi
- MIGRATION.md — piano migrazione Flutter
- REPO_SETUP.md — inizializzazione repo Git

## Sezione INTEGRATIONS

- INTEGRATIONS/INTEGRATION_MATRIX.md — matrice feature ↔ endpoint ↔ schermate ↔ dipendenze (user+admin)
- INTEGRATIONS/CONFIG_GUIDE.md — guida a ENV/headers/tenant e setup HTTP client Flutter

## Sezione MOBILE

- MOBILE/FLUTTER_HANDOFF.md — handoff operativo per Flutter (struttura, state, generator OpenAPI)

## Sezione SECURITY

- SECURITY/THREAT_MODEL.md — threat model lato client (JWT, tenant, retry/caching)

## Sezione TESTS

- TESTS/INTEGRATION_PLAN.md — piano test integrazione con chiamate reali e scenari errore

## Sezione STORE

- STORE/READINESS_CHECKLIST.md — checklist pubblicazione App Store/Google Play

## Sezione UX

- UX/README.md — documentazione UX
- UX/USER_FLOWS.md — flussi principali
- UX/FLOWCHARTS.md — flowchart
- UX/SCREENS.md — schermate
- UX/NAVIGATION_MAP.md — mappa navigazione
- UX/ACCESSIBILITY.md — accessibilità
- UX/ASSETS_CHECKLIST.md — checklist asset
- UX/TESTING.md — testing
- UX/CLEANUP_REPORT.md — report pulizia
- UX/CLEANUP_MOCK_DATA.md — report pulizia mock data

---

Note:
- I contratti REST sono congelati in `openapi.json` (root) e `docs/ARCH/openapi.json` per riferimento. L’handoff Flutter usa esclusivamente questi contratti.
- Per integrare Flutter senza modificare il backend, seguire: `INTEGRATIONS/CONFIG_GUIDE.md` e `MOBILE/FLUTTER_HANDOFF.md`.