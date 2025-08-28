# StandardFixture DTO Specification

## Overview
DTO unificato per normalizzare le risposte di tutti i provider (Sportmonks, API-Football, etc.) in un formato standard interno.

## Schema
```javascript
{
  // Identificativi
  fixtureId: string,           // ID univoco della partita
  externalId: string,          // ID nel sistema del provider
  provider: string,            // 'sportmonks' | 'api-football'
  
  // League info
  league: {
    id: string,                // ID lega nel sistema provider
    name: string,              // Nome lega es. "Serie A"
    logo: string|null,         // URL logo lega
    country: string|null       // Paese es. "Italy"
  },
  
  // Timing
  date: string,                // ISO date YYYY-MM-DD
  time: string,                // HH:mm format
  datetime: string,            // Full ISO datetime
  timezone: string|null,       // Timezone info
  
  // Teams/Participants
  participants: [{
    id: string,                // ID team nel sistema provider
    name: string,              // Nome team
    role: 'home'|'away',       // Ruolo
    image_path: string|null,   // URL logo team
    shortName: string|null     // Nome abbreviato
  }],
  
  // Venue
  venue: {
    id: string|null,           // ID venue
    name: string|null,         // Nome stadio
    city: string|null,         // Città
    capacity: number|null      // Capienza
  }|null,
  
  // Match status
  status: {
    code: string,              // Codice status normalizzato: 'NS'|'LIVE'|'FT'|'CANC'|'POSTP'
    description: string,       // Descrizione human-readable
    minutes: number|null       // Minuti giocati (se live)
  },
  
  // Scores
  scores: {
    home: number|null,         // Gol squadra casa
    away: number|null,         // Gol squadra trasferta
    halftime: {                // Risultato primo tempo
      home: number|null,
      away: number|null
    }|null
  }|null,
  
  // Metadata
  meta: {
    hasOdds: boolean,          // Se ha quote disponibili
    isLive: boolean,           // Se è in diretta
    round: string|null,        // Giornata/Round
    season: string|null,       // Stagione
    createdAt: Date,           // Quando mappato nel nostro sistema
    updatedAt: Date            // Ultimo update
  }
}
```

## Status Codes Normalizzati
- `NS` - Not Started (scheduled)
- `LIVE` - In corso
- `FT` - Full Time (finita)
- `HT` - Half Time (intervallo)
- `CANC` - Cancelled
- `POSTP` - Postponed
- `SUSP` - Suspended

## Mapping Requirements
- Tutti i campi obbligatori devono essere presente
- `fixtureId` deve essere univoco nel nostro sistema
- `participants` deve contenere esattamente 2 elementi (home/away)
- `date` e `time` devono essere validi e parseable
- `status.code` deve essere uno dei codici normalizzati

## Validation Rules
- `fixtureId`: required, string, non-empty
- `league.id`: required, string, non-empty  
- `league.name`: required, string, non-empty
- `date`: required, string, formato YYYY-MM-DD
- `time`: required, string, formato HH:mm
- `participants`: required, array, length === 2
- `participants[].role`: required, enum ['home', 'away']
- `status.code`: required, enum del status normalizzato
