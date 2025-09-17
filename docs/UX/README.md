### UI/UX Flows — Documentazione di sezione

Questa cartella raccoglie la documentazione UI/UX dei flussi principali di SPOrTS. È il punto di riferimento per stakeholder, designer e dev quando si parla di percorsi utente e area admin.

#### Contenuti
- [USER_FLOWS.md](./USER_FLOWS.md): descrizione narrativa step-by-step dei flussi principali (Cliente e Admin)
- [FLOWCHARTS.md](./FLOWCHARTS.md): flowchart in Mermaid per ogni flusso
- [SCREENS.md](./SCREENS.md): tabella schermate (Route/ID, Obiettivo, Dati richiesti, Eventi/CTA, Errori/Empty)
- [NAVIGATION_MAP.md](./NAVIGATION_MAP.md): mappa di navigazione, deep-link e regole auth/ruoli
- [ACCESSIBILITY.md](./ACCESSIBILITY.md): linee guida minime di accessibilità
- [ASSETS_CHECKLIST.md](./ASSETS_CHECKLIST.md): checklist asset (icone, illustrazioni, testi legali, traduzioni)
 - [TESTING.md](./TESTING.md): scenari di test UX passo‑passo

#### Copertura (Acceptance)
- Schermate chiave coperte: landing, lista, dettaglio, prenotazione, login/register, dashboard e sotto-sezioni admin
- Flowchart coerenti con i flussi narrati e con i contratti API correnti
- Errori, empty states ed edge case elencati

#### Riferimenti codice (per allineamento)
- Routing FE: `frontend/src/App.jsx`
- Auth FE: `frontend/src/contexts/AuthContext.jsx`
- Auth BE: `backend/src/routes/auth.js`
- Prenotazioni BE: `backend/src/controllers/bookingController.js`, `backend/src/services/bookingsService.js`, `backend/src/routes/bookings.js`
- Workflow UX complessivo: `WorkflowUX.md`
- Multi-tenant: `docs/MULTI_TENANT.md`
- Architettura: `docs/ARCH/OVERVIEW.md`, `docs/ARCH/DIAGRAMS.md`

#### Aggiornamento dei documenti
- Se cambiano rotte/guard o i contratti API, aggiornare: `USER_FLOWS.md`, `FLOWCHARTS.md`, `SCREENS.md`, `NAVIGATION_MAP.md`
- Se cambiano pattern UI (component library, token, layout), aggiornare: `SCREENS.md`, `ACCESSIBILITY.md`, `ASSETS_CHECKLIST.md`

#### Note
- Formato Markdown semplice, pensato per essere letto su Git e in IDE
- Mermaid integrato per visualizzare i diagrammi rapidamente


