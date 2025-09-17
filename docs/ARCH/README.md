## Cartella ARCH – Documentazione Architettura SPOrTS

Questa cartella raccoglie tutta la documentazione tecnica dell'architettura backend (e interazioni con il frontend) in un unico luogo.

### Contenuti
- `OVERVIEW.md` – Panoramica dell'architettura: componenti, responsabilità, dipendenze, ambienti
- `DIAGRAMS.md` – Diagrammi Mermaid (C4 Container + sequence: Login, Ricerca Locali, Prenotazione, CRUD Admin)
- `API_CONTRACTS.md` – Matrice Endpoint | Metodo | Path | Auth | Schemi | Errori (incluse estensioni admin)
- `openapi.json` – Contratti OpenAPI coerenti con l'implementazione attuale (freeze)
- `ERRORS.md` – Tassonomia errori (codici HTTP, messaggi tipici, cause)
- `OBSERVABILITY.md` – Healthcheck, log minimi e metriche utili per test locali
- `CLEANUP_PLAN.md` – Candidati alla rimozione/archiviazione con motivazioni e impatto
- `ENV_EXAMPLE.md` – Variabili d'ambiente con descrizioni e valori di esempio

### Come usare
1. Apri `OVERVIEW.md` per un tour rapido dell'architettura.
2. Consulta `DIAGRAMS.md` per comprendere i flussi principali.
3. Usa `API_CONTRACTS.md` e `openapi.json` per integrare il frontend o strumenti di test.
4. Verifica errori e comportamenti attesi in `ERRORS.md`.
5. Per diagnosi e test rapidi, vedi `OBSERVABILITY.md`.
6. Se devi pulire il repo o ridurre superficie API, parti da `CLEANUP_PLAN.md`.
7. Copia le variabili da `ENV_EXAMPLE.md` nel tuo `.env` (non commitare `.env`).

### Note
- I contratti sono allineati al codice esistente e non introducono nuova logica.
- In ambiente di sviluppo, alcune rotte di debug sono esposte: valutarne la disattivazione in produzione.


