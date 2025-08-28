const axios = require('axios');
const path = require('path');
const NodeCache = require('node-cache');
const axiosRetry = require('axios-retry').default;
const CircuitBreaker = require('opossum');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mockFixtures = require('./mocks/sportmonks_fixtures.json');
const currentSeasonService = require('./currentSeasonService');

const USE_MOCK_API = process.env.USE_MOCK_API === 'true';

const API_TOKEN = process.env.SPORTMONKS_API_TOKEN;
const BASE_URL = 'https://api.sportmonks.com/v3/football';

// ❌ DEPRECATED: SEASON MAPPING HARDCODED (Sostituito da currentSeasonService)
// 
// Il vecchio mapping hardcoded è stato sostituito con auto-detection dinamica
// tramite currentSeasonService che usa l'API Sportmonks per trovare automaticamente
// la stagione corrente (is_current_season: true) per ogni lega.
// 
// Vantaggi del nuovo approccio:
// - ✅ Auto-detection current season (no più Season ID obsoleti)
// - ✅ Future-proof per cambi stagione
// - ✅ Cache intelligente 24h 
// - ✅ Fallback resiliente
// - ✅ Elimina incongruenze 2024/25 vs 2025/26
//
// const SEASON_MAPPING = { ... } // ← Rimosso, ora tutto automatico!

// Istanza della cache
const apiCache = new NodeCache({ stdTTL: 300 });

const apiClient = axios.create({
    baseURL: BASE_URL,
    params: {
        api_token: API_TOKEN,
    },
});

// Configurazione di axios-retry
axiosRetry(apiClient, { 
    retries: 3,
    retryDelay: (retryCount) => {
        console.log(`Tentativo di retry #${retryCount} per la chiamata API...`);
        return retryCount * 1000;
    },
    retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || (error.response && error.response.status >= 500);
    }
});

// Opzioni per il Circuit Breaker
const circuitBreakerOptions = {
    timeout: 10000, // 10 secondi
    errorThresholdPercentage: 50,
    resetTimeout: 30000 // 30 secondi
};

// Funzione generica per eseguire una chiamata API con circuit breaker
async function callApiWithCircuitBreaker(name, apiCall) {
    const breaker = new CircuitBreaker(apiCall, { ...circuitBreakerOptions, name });

    breaker.on('open', () => console.log(`[CircuitBreaker] Circuito '${name}' APERTO.`));
    breaker.on('halfOpen', () => console.log(`[CircuitBreaker] Circuito '${name}' SEMI-APERTO.`));
    breaker.on('close', () => console.log(`[CircuitBreaker] Circuito '${name}' CHIUSO.`));

    return breaker.fire();
}


/**
 * Recupera una lista di leghe, utilizzando cache e circuit breaker.
 */
async function getLeagues() {
    const cacheKey = 'leagues_all';
    const cachedData = apiCache.get(cacheKey);

    if (cachedData) {
        console.log(`[Cache] HIT per ${cacheKey}`);
        return cachedData;
    }
    
    const apiCall = async () => {
        console.log(`[API] MISS per ${cacheKey}. Chiamata a Sportmonks...`);
        const response = await apiClient.get('/leagues');
        apiCache.set(cacheKey, response.data.data, 3600);
        return response.data.data;
    };

    try {
        return await callApiWithCircuitBreaker('getLeagues', apiCall);
    } catch (error) {
        console.error('Errore durante il recupero delle leghe (post circuit-breaker):', error.message);
        throw error;
    }
}

/**
 * Recupera le partite per una stagione specifica, utilizzando cache e circuit breaker.
 * 🤖 USA AUTO-DETECTION del Current Season ID tramite currentSeasonService
 */
async function getFixturesBySeason(leagueKey, dateRange = null) {
    // ✅ AUTO-DETECTION Current Season invece di mapping hardcoded
    let seasonId;
    
    try {
        seasonId = await currentSeasonService.getCurrentSeasonId(leagueKey);
        console.log(`🤖 Auto-detected Season ID for ${leagueKey}: ${seasonId}`);
    } catch (error) {
        console.error(`❌ Failed to auto-detect season for ${leagueKey}:`, error.message);
        throw new Error(`Could not determine current season for ${leagueKey}: ${error.message}`);
    }

    if (USE_MOCK_API) {
        console.log(`[MOCK] Restituzione dati finti per la stagione: ${leagueKey} (${seasonId})`);
        // Filtra i mock per la lega richiesta
        return mockFixtures.filter(fixture => {
            const leagueName = fixture.league?.name?.toLowerCase() || '';
            return leagueName.includes(leagueKey.replace('-', ' '));
        });
    }

    const cacheKey = `fixtures_season_${seasonId}_${leagueKey}`;
    const cachedData = apiCache.get(cacheKey);

    if (cachedData) {
        console.log(`[Cache] HIT per ${cacheKey}`);
        
        // Se abbiamo un dateRange, filtriamo localmente
        if (dateRange && dateRange.startDate && dateRange.endDate) {
            const startDate = new Date(dateRange.startDate);
            const endDate = new Date(dateRange.endDate);
            
            return cachedData.filter(fixture => {
                const fixtureDate = new Date(fixture.starting_at);
                return fixtureDate >= startDate && fixtureDate <= endDate;
            });
        }
        
        return cachedData;
    }

    const apiCall = async () => {
        console.log(`[API] MISS per ${cacheKey}. Chiamata a Sportmonks con season filter...`);
        console.log(`🎯 Using season filter: fixtureSeasons:${seasonId} for league: ${leagueKey}`);
        
        const response = await apiClient.get('/fixtures', {
            params: {
                filters: `fixtureSeasons:${seasonId}`,
                include: 'participants;league',
                per_page: 200  // Massimo per ottenere quante più partite possibile
            }
        });
        
        const fixtures = response.data.data || [];
        console.log(`✅ Retrieved ${fixtures.length} fixtures for ${leagueKey} (season ${seasonId})`);
        
        // Cache per 30 minuti (season data cambia meno frequentemente)
        apiCache.set(cacheKey, fixtures, 1800);
        
        // Se abbiamo un dateRange, filtriamo localmente
        if (dateRange && dateRange.startDate && dateRange.endDate) {
            const startDate = new Date(dateRange.startDate);
            const endDate = new Date(dateRange.endDate);
            
            const filteredFixtures = fixtures.filter(fixture => {
                const fixtureDate = new Date(fixture.starting_at);
                return fixtureDate >= startDate && fixtureDate <= endDate;
            });
            
            console.log(`📅 Filtered to ${filteredFixtures.length} fixtures within date range ${dateRange.startDate} - ${dateRange.endDate}`);
            return filteredFixtures;
        }
        
        return fixtures;
    };
    
    try {
        return await callApiWithCircuitBreaker('getFixturesBySeason', apiCall);
    } catch (error) {
        console.error(`Errore durante il recupero delle partite per stagione ${leagueKey} (${seasonId}):`, error.message);
        throw error;
    }
}

/**
 * Recupera le partite per una data specifica, utilizzando cache e circuit breaker.
 * DEPRECATO: Ora usa getFixturesBySeason quando possibile per migliore coverage.
 */
async function getFixturesByDate(date) {
    if (USE_MOCK_API) {
        console.log(`[MOCK] Restituzione dati finti per le partite del giorno: ${date}`);
        // Filtra i mock per la data richiesta (ignorando l'ora)
        const requestedDate = new Date(date);
        const startOfDay = new Date(requestedDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(requestedDate.setHours(23, 59, 59, 999));

        return mockFixtures.filter(fixture => {
            const fixtureDate = new Date(fixture.starting_at);
            return fixtureDate >= startOfDay && fixtureDate <= endOfDay;
        });
    }

    const cacheKey = `fixtures_date_${date}_no_venue`;
    const cachedData = apiCache.get(cacheKey);

    if (cachedData) {
        console.log(`[Cache] HIT per ${cacheKey}`);
        return cachedData;
    }

    const apiCall = async () => {
        console.log(`[API] MISS per ${cacheKey}. Chiamata a Sportmonks (senza venue)...`);
        
        // ✅ FIX: Usa endpoint diretto per data per ottenere TUTTE le leghe
        console.log(`🌍 Using direct date endpoint for all leagues coverage...`);
        const response = await apiClient.get(`/fixtures/date/${date}`, {
            params: {
                include: 'participants;league'  // ✅ Include participants e league data
            }
        });
        
        apiCache.set(cacheKey, response.data.data, 60);
        return response.data.data;
    };
    
    try {
        return await callApiWithCircuitBreaker('getFixturesByDate', apiCall);
    } catch (error) {
        console.error(`Errore durante il recupero delle partite per la data ${date} (post circuit-breaker):`, error.message);
        throw error;
    }
}

/**
 * Recupera i dettagli di una singola partita, utilizzando cache e circuit breaker.
 */
async function getFixtureById(fixtureId) {
    if (USE_MOCK_API) {
        console.log(`[MOCK] Restituzione dati finti per la partita ID: ${fixtureId}`);
        return mockFixtures.find(fixture => fixture.id === parseInt(fixtureId, 10));
    }
    
    const cacheKey = `fixture_${fixtureId}_no_venue`;
    const cachedData = apiCache.get(cacheKey);

    if (cachedData) {
        console.log(`[Cache] HIT per ${cacheKey}`);
        return cachedData;
    }

    const apiCall = async () => {
        console.log(`[API] MISS per ${cacheKey}. Chiamata a Sportmonks (senza venue)...`);
        const response = await apiClient.get(`/fixtures/${fixtureId}`, {
            params: {
                include: 'participants;league'  // ✅ FIX: Include anche per fixture singola
            }
        });
        apiCache.set(cacheKey, response.data.data, 60);
        return response.data.data;
    };

    try {
        return await callApiWithCircuitBreaker('getFixtureById', apiCall);
    } catch (error) {
        console.error(`Errore durante il recupero della partita con ID ${fixtureId} (post circuit-breaker):`, error.message);
        throw error;
    }
}


/**
 * Cerca partite per query, usato per creare annunci
 */
async function searchMatches(query, options = {}) {
    if (USE_MOCK_API) {
        console.log(`[MOCK] Ricerca partite per query: "${query}"`);
        // Filtra i mock fixtures in base alla query
        const filtered = mockFixtures.filter(fixture => {
            const homeTeam = fixture.participants?.find(p => p.meta?.location === 'home')?.name || '';
            const awayTeam = fixture.participants?.find(p => p.meta?.location === 'away')?.name || '';
            const league = fixture.league?.name || '';
            const searchString = `${homeTeam} ${awayTeam} ${league}`.toLowerCase();
            return searchString.includes(query.toLowerCase());
        });
        
        return {
            success: true,
            data: filtered.slice(0, options.limit || 10),
            count: filtered.length
        };
    }

    const cacheKey = `search_matches_${query}_${JSON.stringify(options)}`;
    const cachedData = apiCache.get(cacheKey);

    if (cachedData) {
        console.log(`[Cache] HIT per ${cacheKey}`);
        return cachedData;
    }

    const apiCall = async () => {
        console.log(`[API] MISS per ${cacheKey}. Chiamata a Sportmonks per ricerca...`);
        
        // Per ora restituiamo fixtures dei prossimi giorni filtrate per query
        const today = new Date().toISOString().split('T')[0];
        const fixtures = await getFixturesByDate(today);
        
        const filtered = fixtures.filter(fixture => {
            const homeTeam = fixture.participants?.find(p => p.meta?.location === 'home')?.name || '';
            const awayTeam = fixture.participants?.find(p => p.meta?.location === 'away')?.name || '';
            const league = fixture.league?.name || '';
            const searchString = `${homeTeam} ${awayTeam} ${league}`.toLowerCase();
            return searchString.includes(query.toLowerCase());
        });
        
        const result = {
            success: true,
            data: filtered.slice(0, options.limit || 10),
            count: filtered.length
        };
        
        apiCache.set(cacheKey, result, 60); // Cache per 1 minuto
        return result;
    };

    try {
        return await callApiWithCircuitBreaker('searchMatches', apiCall);
    } catch (error) {
        console.error(`Errore durante la ricerca partite per "${query}":`, error.message);
        throw error;
    }
}

module.exports = {
    getLeagues,
    getFixturesByDate,
    getFixturesBySeason,  // ✅ Ora con auto-detection current season
    getFixtureById,
    searchMatches,
    currentSeasonService, // ✅ Export del service per uso esterno
}; 