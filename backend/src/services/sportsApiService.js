const axios = require('axios');
const path = require('path');
const NodeCache = require('node-cache');
const axiosRetry = require('axios-retry').default;
const CircuitBreaker = require('opossum');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mockFixtures = require('./mocks/sportmonks_fixtures.json');

const USE_MOCK_API = process.env.USE_MOCK_API === 'true';

const API_TOKEN = process.env.SPORTMONKS_API_TOKEN;
const BASE_URL = 'https://api.sportmonks.com/v3/football';

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
 * Recupera le partite per una data specifica, utilizzando cache e circuit breaker.
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
        const response = await apiClient.get(`/fixtures/date/${date}`, {
            params: { include: 'participants;league' }
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
            params: { include: 'participants;league' }
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


module.exports = {
    getLeagues,
    getFixturesByDate,
    getFixtureById,
}; 