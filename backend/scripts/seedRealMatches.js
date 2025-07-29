const mongoose = require('mongoose');
const path = require('path');

// Costruisce percorsi assoluti a partire dalla directory dello script
const backendRoot = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(backendRoot, '.env') });

const sportsApiService = require(path.join(backendRoot, 'src', 'services', 'sportsApiService'));
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
 * Mappa i dati dalla risposta dell'API al nostro schema GlobalMatch.
 * @param {object} fixtureData - Dati della partita dall'API.
 * @returns {object} - Dati formattati per il nostro DB.
 */
const mapFixtureToGlobalMatch = (fixtureData) => {
    const homeParticipant = fixtureData.participants.find(p => p.meta.location === 'home');
    const awayParticipant = fixtureData.participants.find(p => p.meta.location === 'away');

    return {
        providerId: fixtureData.id,
        league: {
            id: fixtureData.league.id,
            name: fixtureData.league.name,
            image_path: fixtureData.league.image_path,
        },
        date: new Date(fixtureData.starting_at),
        status: {
            name: fixtureData.state.name,
        },
        participants: {
            home: {
                id: homeParticipant.id,
                name: homeParticipant.name,
                image_path: homeParticipant.image_path,
            },
            away: {
                id: awayParticipant.id,
                name: awayParticipant.name,
                image_path: awayParticipant.image_path,
            },
        },
        scores: fixtureData.scores.map(s => ({
            score: { goals: s.score.goals },
            description: s.description,
        })),
        // Gestisce il caso in cui venue non sia presente
        venue: fixtureData.venue ? {
            id: fixtureData.venue.id,
            name: fixtureData.venue.name,
            city_name: fixtureData.venue.city_name,
        } : null, 
        lastUpdatedFromProvider: new Date(),
    };
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
                const fixtures = await sportsApiService.getFixturesByDate(dateString);
                if (fixtures && fixtures.length > 0) {
                    const relevantFixtures = fixtures.filter(f => TARGET_LEAGUE_IDS.includes(f.league_id));
                    if (relevantFixtures.length > 0) {
                        console.log(`Trovate ${relevantFixtures.length} partite rilevanti.`);
                        allFixtures.push(...relevantFixtures);
                    } else {
                        console.log(`Nessuna partita rilevante trovata.`);
                    }
                } else {
                    console.log(`Nessuna partita trovata.`);
                }
            } catch (error) {
                console.error(`Errore durante il recupero delle partite per la data ${dateString}:`, error.message);
            }
        }
    }

    if (allFixtures.length === 0) {
        console.log('Nessuna partita da inserire nel DB.');
        await mongoose.connection.close();
        console.log('Connessione al database chiusa.');
        return;
    }

    let updatedCount = 0;
    let insertedCount = 0;

    try {
        const bulkOps = allFixtures.map(fixture => {
            const matchData = mapFixtureToGlobalMatch(fixture);
            return {
                updateOne: {
                    filter: { providerId: matchData.providerId },
                    update: { $set: matchData },
                    upsert: true,
                },
            };
        });

        const result = await GlobalMatch.bulkWrite(bulkOps);
        updatedCount = result.modifiedCount;
        insertedCount = result.upsertedCount;
        
        console.log('\n--- Seeding completato ---');
        console.log(`Partite totali processate: ${allFixtures.length}`);
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