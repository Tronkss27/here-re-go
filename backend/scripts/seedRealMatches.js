const mongoose = require('mongoose');
const path = require('path');

// Costruisce percorsi assoluti a partire dalla directory dello script
const backendRoot = path.resolve(__dirname, '..');

// ✅ IMPORTA: Imposta USE_MOCK_API prima di caricare i servizi se passato da command line
if (process.env.USE_MOCK_API === 'true') {
    console.log('[seedRealMatches] 🧪 Mock mode enabled via command line');
}

require('dotenv').config({ path: path.join(backendRoot, '.env') });

// ✅ Se USE_MOCK_API è passato da command line, preservalo dopo dotenv
const useMockFromCmdLine = process.argv.includes('--mock') || process.env.USE_MOCK_API === 'true';
if (useMockFromCmdLine) {
    process.env.USE_MOCK_API = 'true';
    console.log('[seedRealMatches] 🧪 Forcing mock mode: USE_MOCK_API=true');
}

const sportsApiService = require(path.join(backendRoot, 'src', 'services', 'sportsApiService'));
const standardFixturesService = require(path.join(backendRoot, 'src', 'services', 'standardFixturesService'));
const GlobalMatch = require(path.join(backendRoot, 'src', 'models', 'GlobalMatch'));
const { connectDB } = require(path.join(backendRoot, 'src', 'config', 'database'));

// ID delle leghe principali dell'European Plan a cui siamo interessati
// Serie A: 384, Premier League: 8, La Liga: 564, Bundesliga: 82, Ligue 1: 301, Champions League: 2
const TARGET_LEAGUE_IDS = [384, 8, 564, 82, 301, 2];

/**
 * Formatta la data in 'YYYY-MM-DD'.
 * @param {Date} date 
 * @returns {string}
 */
const formatDate = (date) => date.toISOString().slice(0, 10);

/**
 * Converte StandardFixture DTO al nostro schema GlobalMatch.
 * Usa l'adapter unificato invece del mapping diretto.
 * @param {object} standardFixture - StandardFixture DTO dall'adapter.
 * @returns {object} - Dati formattati per il nostro DB.
 */
const mapStandardFixtureToGlobalMatch = (standardFixture) => {
    console.log(`[seedRealMatches] Mapping StandardFixture ${standardFixture.fixtureId} to GlobalMatch format`);
    
    try {
        // Usa il converter helper del service
        const globalMatchData = standardFixturesService.convertToGlobalMatchFormat(standardFixture);
        
        console.log(`[seedRealMatches] Successfully mapped ${standardFixture.fixtureId}: ${globalMatchData.participants.home.name} vs ${globalMatchData.participants.away.name}`);
        
        return globalMatchData;
        
    } catch (error) {
        console.error(`[seedRealMatches] Error mapping StandardFixture ${standardFixture.fixtureId}:`, error.message);
        throw new Error(`Failed to map StandardFixture to GlobalMatch: ${error.message}`);
    }
};

/**
 * Esegue il seeding del database.
 */
async function seedRealMatches() {
    await connectDB();
    console.log('Connessione al database stabilita.');

    const USE_MOCK_API = process.env.USE_MOCK_API === 'true';
    let allFixtures = [];

    if (USE_MOCK_API) {
        console.log('[MOCK] Caricamento di tutte le partite dal file mock...');
        allFixtures = require('../src/services/mocks/sportmonks_fixtures.json');
    } else {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 14);

        console.log(`Recupero partite dal ${formatDate(startDate)} al ${formatDate(endDate)}...`);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateString = formatDate(new Date(d));
            console.log(`\nProcessing data per il ${dateString}...`);
            try {
                // ✅ USA STANDARDFIXTURES SERVICE CON ADAPTER
                const standardFixtures = await standardFixturesService.getStandardFixturesByDate(dateString);
                
                if (standardFixtures && standardFixtures.length > 0) {
                    // Filtra per leghe target usando ID string (adapter converte tutto a string)
                    const targetLeagueIdStrings = TARGET_LEAGUE_IDS.map(id => String(id));
                    const relevantFixtures = standardFixtures.filter(f => 
                        targetLeagueIdStrings.includes(f.league.id)
                    );
                    
                    if (relevantFixtures.length > 0) {
                        console.log(`[seedRealMatches] Trovate ${relevantFixtures.length} StandardFixtures rilevanti per ${dateString}.`);
                        allFixtures.push(...relevantFixtures);
                    } else {
                        console.log(`[seedRealMatches] Nessuna StandardFixture rilevante trovata per ${dateString}.`);
                    }
                } else {
                    console.log(`[seedRealMatches] Nessuna StandardFixture trovata per ${dateString}.`);
                }
            } catch (error) {
                console.error(`[seedRealMatches] Errore durante il recupero delle StandardFixtures per la data ${dateString}:`, error.message);
            }
        }
    }

    if (allFixtures.length === 0) {
        console.log('Nessuna partita da inserire nel DB.');
        await mongoose.connection.close();
        console.log('Connessione al database chiusa.');
        return;
    }

    // ✅ DEBUG: Verifica qualità dei dati prima del bulk update
    console.log(`[seedRealMatches] Verificando ${allFixtures.length} StandardFixtures prima del bulk update...`);
    const validFixtures = allFixtures.filter(fixture => {
        if (!fixture || !fixture.fixtureId || !fixture.externalId) {
            console.warn(`[seedRealMatches] ⚠️ Fixture invalida trovata:`, fixture);
            return false;
        }
        return true;
    });
    
    if (validFixtures.length !== allFixtures.length) {
        console.warn(`[seedRealMatches] ⚠️ Trovate ${allFixtures.length - validFixtures.length} fixtures invalide, procedo solo con ${validFixtures.length} valide`);
    }

    let updatedCount = 0;
    let insertedCount = 0;

    try {
        // Converti StandardFixtures valide in GlobalMatch format
        const bulkOps = validFixtures.map(standardFixture => {
            try {
                const matchData = mapStandardFixtureToGlobalMatch(standardFixture);
                return {
                    updateOne: {
                        filter: { providerId: matchData.providerId },
                        update: { $set: matchData },
                        upsert: true,
                    },
                };
            } catch (error) {
                console.error(`[seedRealMatches] ❌ Error mapping fixture ${standardFixture.fixtureId}:`, error.message);
                throw error; // Re-throw per fermare il bulk se c'è un errore critico
            }
        });

        const result = await GlobalMatch.bulkWrite(bulkOps);
        updatedCount = result.modifiedCount;
        insertedCount = result.upsertedCount;
        
        console.log('\n--- Seeding completato ---');
        console.log(`StandardFixtures totali trovate: ${allFixtures.length}`);
        console.log(`StandardFixtures valide processate: ${validFixtures.length}`);
        console.log(`- Inserite: ${insertedCount}`);
        console.log(`- Aggiornate: ${updatedCount}`);

    } catch (error) {
        console.error('Errore critico durante il processo di seeding:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Connessione al database chiusa.');
    }
}

seedRealMatches(); 