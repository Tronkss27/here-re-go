const mongoose = require('mongoose');
const PopularMatch = require('../src/models/PopularMatch');
const MatchAnnouncement = require('../src/models/MatchAnnouncement');
const Venue = require('../src/models/Venue');
const GlobalMatch = require('../src/models/GlobalMatch');
const User = require('../src/models/User');

async function cleanupEverything() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sports-bar');
    console.log('✅ Connesso al database');

    // 1. RIMUOVI TUTTI I POPULAR MATCH
    const popularResult = await PopularMatch.deleteMany({});
    console.log(`🗑️ Rimossi ${popularResult.deletedCount} PopularMatch`);

    // 2. RIMUOVI TUTTI I MATCH ANNOUNCEMENT
    const announcementResult = await MatchAnnouncement.deleteMany({});
    console.log(`🗑️ Rimossi ${announcementResult.deletedCount} MatchAnnouncement`);

    // 3. RIMUOVI TUTTI I VENUE (incluso Demo Sports Bar)
    const venueResult = await Venue.deleteMany({});
    console.log(`🗑️ Rimossi ${venueResult.deletedCount} Venue`);

    // 4. RIMUOVI TUTTI I GLOBAL MATCH (per rigenerarli con ID nuovi)
    const globalResult = await GlobalMatch.deleteMany({});
    console.log(`🗑️ Rimossi ${globalResult.deletedCount} GlobalMatch`);

    // 5. RIMUOVI TUTTI GLI USER (solo per test - opzionale)
    const userResult = await User.deleteMany({});
    console.log(`🗑️ Rimossi ${userResult.deletedCount} User`);

    console.log('🧹 PULIZIA TOTALE COMPLETATA');
    console.log('✨ Database completamente vuoto - pronto per fresh start');
    
  } catch (error) {
    console.error('❌ Errore durante la pulizia:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connessione database chiusa');
  }
}

if (require.main === module) {
  cleanupEverything().then(() => process.exit(0));
}

module.exports = cleanupEverything; 